// =====================
//  IMPORTS
// =====================
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

// =====================
//  APP CONFIG
// =====================
const app = express();
app.use(cors());
app.use(bodyParser.json());

// =====================
//  STATIC FILES (uploads)
// =====================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =====================
//  DATABASE CONNECTION
// =====================
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "psdb",
  port: process.env.DB_PORT || 3306,
});

db.connect((err) => {
  if (err) {
    console.error("❌ DB connection failed:", err);
  } else {
    console.log("✅ MySQL Connected!");
  }
});

// =====================
//  AUTH ROUTES
// =====================

// SIGNUP
app.post("/signup", async (req, res) => {
  const { user_name, user_email, user_pass } = req.body;
  if (!user_name || !user_email || !user_pass) {
    return res.json({ success: false, message: "All fields required" });
  }

  db.query("SELECT * FROM users WHERE user_email = ?", [user_email], async (err, results) => {
    if (err) return res.json({ success: false, message: "DB error" });
    if (results.length > 0)
      return res.json({ success: false, message: "Email already exists" });

    const hashed = await bcrypt.hash(user_pass, 10);
    const role = user_email === "admin@petscoop.com" ? "admin" : "user";

    db.query(
      "INSERT INTO users (user_name, user_email, user_pass, user_role) VALUES (?, ?, ?, ?)",
      [user_name, user_email, hashed, role],
      (err2) => {
        if (err2) return res.json({ success: false, message: "Insert error" });
        return res.json({ success: true, message: "User created successfully!" });
      }
    );
  });
});

// LOGIN
app.post("/login", (req, res) => {
  const { user_email, user_pass } = req.body;
  if (!user_email || !user_pass)
    return res.json({ success: false, message: "All fields required" });

  db.query("SELECT * FROM users WHERE user_email = ?", [user_email], async (err, results) => {
    if (err) return res.json({ success: false, message: "DB error" });
    if (results.length === 0)
      return res.json({ success: false, message: "User not found" });

    const user = results[0];
    const isMatch = await bcrypt.compare(user_pass, user.user_pass);
    if (!isMatch)
      return res.json({ success: false, message: "Invalid password" });

    return res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.user_id,
        username: user.user_name,
        email: user.user_email,
        role: user.user_role,
      },
    });
  });
});

// =====================
//  ADMIN ROUTES
// =====================
app.get("/users", (req, res) => {
  db.query("SELECT user_id, user_name, user_email, user_role FROM users", (err, results) => {
    if (err) return res.json({ success: false, message: "DB error" });
    return res.json({ success: true, users: results });
  });
});

app.delete("/users/:id", (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM users WHERE user_id = ?", [id], (err, result) => {
    if (err) return res.json({ success: false, message: "DB error" });
    if (result.affectedRows === 0)
      return res.json({ success: false, message: "User not found" });
    return res.json({ success: true, message: "User deleted successfully" });
  });
});

// =====================
//  PET ROUTES
// =====================
app.get("/pets", (req, res) => {
  db.query("SELECT * FROM pets ORDER BY pet_id DESC", (err, results) => {
    if (err) return res.json({ success: false, message: "DB error" });
    return res.json({ success: true, pets: results });
  });
});

app.post("/add-pet", (req, res) => {
  const { pet_name, pet_desc, pet_image } = req.body;
  if (!pet_name || !pet_desc || !pet_image)
    return res.json({ success: false, message: "All fields required" });

  db.query(
    "INSERT INTO pets (pet_name, pet_desc, pet_image) VALUES (?, ?, ?)",
    [pet_name, pet_desc, pet_image],
    (err) => {
      if (err) return res.json({ success: false, message: "DB insert error" });
      return res.json({ success: true, message: "Pet added successfully" });
    }
  );
});

// =====================
//  UPLOAD ROUTE (multer)
// =====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file)
    return res.json({ success: false, message: "No file uploaded" });

  // On Railway, dynamically get the domain from environment variable
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

  return res.json({ success: true, imageUrl });
});

// =====================
//  SERVER LISTEN
// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
