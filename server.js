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
import fetch from "node-fetch";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pkg;
const app = express();

// Ensure correct proto/host behind Railway proxy (so req.protocol === 'https')
app.set("trust proxy", 1);

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("📁 Created uploads folder");
}

// 🧩 PostgreSQL connection
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
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error("❌ PostgreSQL connection failed:", err));

// --- Health Check ---
app.get("/db-check", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ success: true, message: "Database connected successfully" });
  } catch (err) {
    console.error("❌ DB Check Error:", err);
    res.json({ success: false, message: "Database connection failed" });
  }
});

// --- File Upload ---
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});
const fileFilter = (_req, file, cb) => {
  if (/^image\//i.test(file.mimetype)) return cb(null, true);
  return cb(new Error("Only image uploads are allowed"));
};
const upload = multer({ storage, fileFilter });

// --- Auth Routes ---
app.post("/signup", async (req, res) => {
  const { user_name, user_email, user_pass } = req.body;
  if (!user_name || !user_email || !user_pass)
    return res.json({ success: false, message: "All fields required" });

  try {
    const { rows } = await pool.query("SELECT 1 FROM users WHERE user_email=$1", [
      user_email,
    ]);
    if (rows.length > 0)
      return res.json({ success: false, message: "Email already exists" });

    const hashed = await bcrypt.hash(user_pass, 10);
    await pool.query(
      "INSERT INTO users (user_name, user_email, user_pass, user_role) VALUES ($1, $2, $3, $4)",
      [user_name, user_email, hashed, "user"]
    );
    res.json({ success: true, message: "Signup successful" });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.json({ success: false, message: err.message });
  }
});

app.post("/login", async (req, res) => {
  const { user_email, user_pass } = req.body;
  if (!user_email || !user_pass)
    return res.json({ success: false, message: "All fields required" });

  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE user_email=$1", [
      user_email,
    ]);
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

// --- Pet Routes ---
app.get("/pets", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM pets ORDER BY created_at DESC NULLS LAST, pet_id DESC"
    );
    res.json({ success: true, pets: rows });
  } catch (err) {
    console.error("❌ Fetch pets error:", err);
    res.json({ success: false, message: err.message });
  }
});

// ✅ Add new pet
app.post("/add-pet", upload.single("pet_image"), async (req, res) => {
  const { pet_name, pet_desc, pet_breed, pet_price } = req.body;
  const imagePath = req.file
    ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
    : null;

  if (!pet_name) return res.json({ success: false, message: "Pet name required" });

  try {
    const priceNum = Number.isFinite(parseFloat(pet_price))
      ? parseFloat(pet_price)
      : 0;

    await pool.query(
      "INSERT INTO pets (pet_name, pet_desc, pet_breed, pet_image, pet_price, created_at) VALUES ($1, $2, $3, $4, $5, NOW())",
      [pet_name, pet_desc ?? null, pet_breed ?? null, imagePath, priceNum]
    );
    res.json({ success: true, message: "Pet added successfully" });
  } catch (err) {
    console.error("❌ Add pet error:", err);
    res.json({ success: false, message: err.message });
  }
});

// ✅ Update pet info (including price)
app.put("/pets/:id", upload.single("pet_image"), async (req, res) => {
  try {
    const { pet_name, pet_desc, pet_breed, pet_price } = req.body;
    const id = req.params.id;
    const updates = [];
    const values = [];
    let i = 1;

    if (typeof pet_name !== "undefined" && pet_name !== "") {
      updates.push(`pet_name=$${i++}`);
      values.push(pet_name);
    }
    if (typeof pet_desc !== "undefined") {
      updates.push(`pet_desc=$${i++}`);
      values.push(pet_desc);
    }
    if (typeof pet_breed !== "undefined") {
      updates.push(`pet_breed=$${i++}`);
      values.push(pet_breed);
    }
    if (typeof pet_price !== "undefined") {
      const priceNum = Number.isFinite(parseFloat(pet_price))
        ? parseFloat(pet_price)
        : 0;
      updates.push(`pet_price=$${i++}`);
      values.push(priceNum);
    }
    if (req.file) {
      updates.push(`pet_image=$${i++}`);
      values.push(`${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`);
    }

    if (updates.length === 0)
      return res.json({ success: false, message: "No fields to update" });

    values.push(id);
    const sql = `UPDATE pets SET ${updates.join(", ")} WHERE pet_id=$${i}`;
    await pool.query(sql, values);

    res.json({ success: true, message: "Pet updated successfully" });
  } catch (err) {
    console.error("❌ Update pet error:", err);
    res.json({ success: false, message: err.message });
  }
});

// ✅ Delete pet
app.delete("/pets/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM pets WHERE pet_id=$1", [req.params.id]);
    res.json({ success: true, message: "Pet deleted successfully" });
  } catch (err) {
    console.error("❌ Delete pet error:", err);
    res.json({ success: false, message: err.message });
  }
});

// --- Adoption Routes ---
app.post("/adopt", async (req, res) => {
  const { user_id, pet_id, adopt_type } = req.body;
  try {
    const { rows } = await pool.query("SELECT * FROM pets WHERE pet_id=$1", [pet_id]);
    if (rows.length === 0) return res.json({ success: false, message: "Pet not found" });
    const pet = rows[0];

    await pool.query(
      "INSERT INTO adopted_pets (user_id, pet_id, pet_name, pet_desc, pet_breed, pet_image, pet_price, adopt_type, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())",
      [
        user_id,
        pet.pet_id,
        pet.pet_name,
        pet.pet_desc,
        pet.pet_breed,
        pet.pet_image,
        pet.pet_price,
        adopt_type,
      ]
    );

    res.json({ success: true, message: "Pet adopted successfully!" });
  } catch (err) {
    console.error("❌ Adopt error:", err);
    res.json({ success: false, message: err.message });
  }
});

// ✅ Fetch user's adopted pets
app.get("/my-adopted/:user_id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM adopted_pets WHERE user_id=$1 ORDER BY created_at DESC",
      [req.params.user_id]
    );
    res.json({ success: true, pets: rows });
  } catch (err) {
    console.error("❌ My adopted pets error:", err);
    res.json({ success: false, message: err.message });
  }
});

// --- PayPal (OAuth helper) ---
const PAYPAL_API_BASE = process.env.PAYPAL_API || "https://api-m.sandbox.paypal.com";
console.log(
  `🪙 PayPal API base: ${PAYPAL_API_BASE.includes("sandbox") ? "SANDBOX" : "LIVE"} (${PAYPAL_API_BASE})`
);
console.log("🪙 PayPal env:", {
  API: process.env.PAYPAL_API,
  RETURN_URL: process.env.PAYPAL_RETURN_URL,
  CANCEL_URL: process.env.PAYPAL_CANCEL_URL,
});

async function getPayPalAccessToken() {
  const basic = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString("base64");

  const resp = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await resp.json();
  if (!resp.ok) {
    console.error("❌ PayPal token error", resp.status, data);
    throw new Error(`PayPal token failed: ${resp.status}`);
  }
  return data.access_token;
}

// ✅ Create PayPal order (returns {success, id, approveUrl, data})
app.post("/create-paypal-order", async (req, res) => {
  try {
    const { amount } = req.body;

    const value = parseFloat(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount." });
    }
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_SECRET || !process.env.PAYPAL_API) {
      return res.status(500).json({ success: false, message: "PayPal env vars not configured." });
    }

    const accessToken = await getPayPalAccessToken();

    // Build absolute return/cancel URLs from the real request host
    const baseReturn = `${req.protocol}://${req.get("host")}`;
    const return_url = `${baseReturn}/paypal-return`;
    const cancel_url = `${baseReturn}/paypal-cancel`;

    const resp = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: "PHP", value: value.toFixed(2) },
          },
        ],
        application_context: {
          return_url,
          cancel_url,
          user_action: "PAY_NOW",
          shipping_preference: "NO_SHIPPING",
          brand_name: "Petscoop",
        },
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error("❌ PayPal create order failed:", resp.status, data);
      return res.status(400).json({ success: false, data });
    }

    const approveUrl = Array.isArray(data.links)
      ? data.links.find((l) => l.rel === "approve")?.href
      : null;

    console.log(`🪙 PayPal order created: ${data.id}`);
    if (approveUrl) console.log(`🪪 Approve URL: ${approveUrl}`);

    return res.json({ success: true, id: data.id, approveUrl, data });
  } catch (err) {
    console.error("❌ PayPal order error:", err);
    return res.status(500).json({ success: false, message: "Failed to create PayPal order" });
  }
});

// ✅ Capture + record adoption
app.post("/capture-paypal-order", async (req, res) => {
  try {
    const { orderID, user_id, pet_id, adopt_type } = req.body;

    if (!orderID) {
      return res.status(400).json({ success: false, message: "orderID is required." });
    }
    if (!user_id || !pet_id) {
      return res.status(400).json({ success: false, message: "user_id and pet_id are required." });
    }
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_SECRET) {
      return res.status(500).json({ success: false, message: "PayPal env vars not configured." });
    }

    const accessToken = await getPayPalAccessToken();

    const resp = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      }
    );

    const data = await resp.json();

    if (!resp.ok || data.status !== "COMPLETED") {
      console.error("❌ PayPal capture failed:", resp.status, data);
      return res.status(400).json({ success: false, data });
    }

    const paidAmount =
      data?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ?? null;

    const petRes = await pool.query("SELECT * FROM pets WHERE pet_id = $1", [pet_id]);
    if (petRes.rows.length === 0) {
      console.warn("⚠️ Pet not found, but capture succeeded. orderID:", orderID);
      return res.json({
        success: true,
        message: "Payment captured, but pet not found. No adoption recorded.",
        data,
      });
    }

    const pet = petRes.rows[0];

    await pool.query(
      `INSERT INTO adopted_pets 
        (user_id, pet_id, pet_name, pet_desc, pet_breed, pet_image, pet_price, adopt_type, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        user_id,
        pet.pet_id,
        pet.pet_name,
        pet.pet_desc,
        pet.pet_breed ?? null,
        pet.pet_image ?? null,
        pet.pet_price ?? 0,
        adopt_type ?? "full",
      ]
    );

    console.log(
      `🐾 Adoption logged (order ${orderID}) pet_id=${pet_id} user_id=${user_id}, type=${adopt_type}, paid=${paidAmount}`
    );

    return res.json({ success: true, data });
  } catch (err) {
    console.error("❌ PayPal capture error:", err);
    return res.status(500).json({ success: false, message: "Failed to capture PayPal order" });
  }
});

// --- PayPal return/cancel pages (for WebView redirect) ---
app.get("/paypal-return", (req, res) => {
  // PayPal will include ?token=<orderID>
  res.type("html").send(`<!doctype html>
<html><head><meta charset="utf-8"><title>PayPal Approved</title></head>
<body style="font-family: sans-serif; padding:24px">
  <h3>Payment approved</h3>
  <p>You can close this window and return to the app.</p>
  <script>/* noop: WebView will intercept this URL */</script>
</body></html>`);
});

app.get("/paypal-cancel", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Payment Cancelled</title></head>
<body style="font-family: sans-serif; padding:24px">
  <h3>Payment cancelled</h3>
  <p>You can close this window and return to the app.</p>
</body></html>`);
});

// --- Root ---
app.get("/", (_req, res) => {
  res.send("🐾 Petscoop PostgreSQL Server is running successfully!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
