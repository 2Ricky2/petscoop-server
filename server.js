// server.js
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'psdb',
});

db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Connected to MySQL Database (psdb)');
  }
});

// Health check
app.get('/db-check', (req, res) => {
  db.query('SELECT 1', (err) => {
    if (err) return res.json({ success: false });
    res.json({ success: true, message: 'Database connected successfully' });
  });
});

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// --- AUTHENTICATION ROUTES ---

// Signup
app.post('/signup', async (req, res) => {
  const { user_name, user_email, user_pass } = req.body;
  if (!user_name || !user_email || !user_pass)
    return res.json({ success: false, message: 'All fields required' });

  db.query('SELECT * FROM users WHERE user_email = ?', [user_email], async (err, results) => {
    if (err) return res.json({ success: false, message: 'DB error' });
    if (results.length > 0)
      return res.json({ success: false, message: 'Email already exists' });

    const hashedPass = await bcrypt.hash(user_pass, 10);
    db.query(
      'INSERT INTO users (user_name, user_email, user_pass, user_role) VALUES (?, ?, ?, ?)',
      [user_name, user_email, hashedPass, 'user'],
      (err) => {
        if (err) return res.json({ success: false, message: 'Insert failed' });
        res.json({ success: true, message: 'Signup successful' });
      }
    );
  });
});

// Login
app.post('/login', (req, res) => {
  const { user_email, user_pass } = req.body;
  if (!user_email || !user_pass)
    return res.json({ success: false, message: 'All fields required' });

  db.query('SELECT * FROM users WHERE user_email = ?', [user_email], async (err, results) => {
    if (err) return res.json({ success: false, message: 'DB error' });
    if (results.length === 0)
      return res.json({ success: false, message: 'User not found' });

    const user = results[0];
    const isMatch = await bcrypt.compare(user_pass, user.user_pass);
    if (!isMatch) return res.json({ success: false, message: 'Invalid password' });

    res.json({
      success: true,
      message: 'Login successful',
      user: { id: user.user_id, name: user.user_name, role: user.user_role },
    });
  });
});

// --- PET ROUTES ---

// Get all pets
app.get('/pets', (req, res) => {
  db.query('SELECT * FROM pets ORDER BY created_at DESC', (err, results) => {
    if (err) return res.json({ success: false, message: 'DB error' });
    res.json({ success: true, pets: results });
  });
});

// Add new pet (with image upload)
app.post('/add-pet', upload.single('pet_image'), (req, res) => {
  const { pet_name, pet_desc } = req.body;
  const imagePath = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : null;

  if (!pet_name)
    return res.json({ success: false, message: 'Pet name required' });

  db.query(
    'INSERT INTO pets (pet_name, pet_desc, pet_image) VALUES (?, ?, ?)',
    [pet_name, pet_desc, imagePath],
    (err) => {
      if (err) return res.json({ success: false, message: 'Insert failed' });
      res.json({ success: true, message: 'Pet added successfully' });
    }
  );
});

// Delete pet
app.delete('/pets/:id', (req, res) => {
  const id = req.params.id;
  db.query('DELETE FROM pets WHERE pet_id = ?', [id], (err, result) => {
    if (err) return res.json({ success: false, message: 'Delete failed' });
    res.json({ success: true, message: 'Pet deleted successfully' });
  });
});

// --- ADMIN ROUTES ---

// Get all users
app.get('/users', (req, res) => {
  db.query('SELECT user_id, user_name, user_email, user_role, created_at FROM users', (err, results) => {
    if (err) return res.json({ success: false, message: 'DB error' });
    res.json({ success: true, users: results });
  });
});

// Delete user
app.delete('/users/:id', (req, res) => {
  const id = req.params.id;
  db.query('DELETE FROM users WHERE user_id = ?', [id], (err, result) => {
    if (err) return res.json({ success: false, message: 'Delete failed' });
    res.json({ success: true, message: 'User deleted successfully' });
  });
});

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
