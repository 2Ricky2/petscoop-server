// server.js
import express from "express";
import pkg from "pg";
import bcrypt from "bcryptjs";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pkg;
const app = express();

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("📁 Created uploads folder");
}

// 🧩 PostgreSQL connection for Railway
const pool = new Pool({
  host: process.env.DB_HOST || "caboose.proxy.rlwy.net",
  port: process.env.DB_PORT || 11190,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "railway",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

pool
  .connect()
  .then(() =>
    console.log("✅ Connected to PostgreSQL:", process.env.DB_HOST || "caboose.proxy.rlwy.net")
  )
  .catch((err) => console.error("❌ PostgreSQL connection failed:", err));

// --- HEALTH CHECK ---
app.get("/db-check", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ success: true, message: "Database connected successfully" });
  } catch (err) {
    console.error("❌ DB Check Error:", err);
    res.json({ success: false, message: "Database connection failed" });
  }
});

// --- MULTER FILE UPLOAD CONFIG ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ✅ Generic upload endpoint for React Native
app.post("/upload", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    console.log("📤 Uploaded:", fileUrl);

    res.json({ success: true, imageUrl: fileUrl });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- AUTH ROUTES ---

// ✅ Signup
app.post("/signup", async (req, res) => {
  const { user_name, user_email, user_pass } = req.body;
  if (!user_name || !user_email || !user_pass)
    return res.json({ success: false, message: "All fields required" });

  try {
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE user_email = $1",
      [user_email]
    );
    if (rows.length > 0)
      return res.json({ success: false, message: "Email already exists" });

    const hashed = await bcrypt.hash(user_pass, 10);
    await pool.query(
      "INSERT INTO users (user_name, user_email, user_pass, user_role) VALUES ($1, $2, $3, $4)",
      [user_name, user_email, hashed, "user"]
    );

    res.json({ success: true, message: "Signup successful" });
  } catch (err) {
    console.error("❌ Signup insert error:", err);
    res.json({ success: false, message: err.message });
  }
});

// ✅ Login
app.post("/login", async (req, res) => {
  const { user_email, user_pass } = req.body;
  if (!user_email || !user_pass)
    return res.json({ success: false, message: "All fields required" });

  try {
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE user_email = $1",
      [user_email]
    );
    if (rows.length === 0)
      return res.json({ success: false, message: "User not found" });

    const user = rows[0];
    const isMatch = await bcrypt.compare(user_pass, user.user_pass);
    if (!isMatch)
      return res.json({ success: false, message: "Invalid password" });

    res.json({
      success: true,
      message: "Login successful",
      user: { id: user.user_id, name: user.user_name, role: user.user_role },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.json({ success: false, message: err.message });
  }
});

// --- PET ROUTES ---

// ✅ Get all pets
app.get("/pets", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM pets ORDER BY created_at DESC");
    res.json({ success: true, pets: rows });
  } catch (err) {
    console.error("❌ Fetch pets error:", err);
    res.json({ success: false, message: err.message });
  }
});

// ✅ Add a new pet (with image)
app.post("/add-pet", upload.single("pet_image"), async (req, res) => {
  const { pet_name, pet_desc } = req.body;
  const imagePath = req.file
    ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
    : null;

  if (!pet_name)
    return res.json({ success: false, message: "Pet name required" });

  try {
    await pool.query(
      "INSERT INTO pets (pet_name, pet_desc, pet_image) VALUES ($1, $2, $3)",
      [pet_name, pet_desc, imagePath]
    );
    res.json({ success: true, message: "Pet added successfully" });
  } catch (err) {
    console.error("❌ Add pet error:", err);
    res.json({ success: false, message: err.message });
  }
});

// ✅ Delete pet
app.delete("/pets/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM pets WHERE pet_id = $1", [req.params.id]);
    res.json({ success: true, message: "Pet deleted successfully" });
  } catch (err) {
    console.error("❌ Delete pet error:", err);
    res.json({ success: false, message: err.message });
  }
});

// --- ADMIN ROUTES ---

// ✅ Get all users
app.get("/users", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT user_id, user_name, user_email, user_role, created_at FROM users ORDER BY created_at DESC"
    );
    res.json({ success: true, users: rows });
  } catch (err) {
    console.error("❌ Fetch users error:", err);
    res.json({ success: false, message: err.message });
  }
});

// ✅ Delete user
app.delete("/users/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE user_id = $1", [req.params.id]);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("❌ Delete user error:", err);
    res.json({ success: false, message: err.message });
  }
});

// --- ROOT + TEST ROUTES ---
app.get("/", (req, res) => {
  res.send("🐾 Petscoop PostgreSQL Server is running successfully!");
});

app.get("/test-db", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT NOW() AS time");
    res.json({ success: true, time: rows[0].time });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
