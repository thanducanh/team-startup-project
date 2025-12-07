require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const jwt = require('jsonwebtoken'); 

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { folder: 'quan_ly_tho_reports', allowed_formats: ['jpg', 'png'] },
});
const upload = multer({ storage: storage });

// ============================================
// 👇 QUAN TRỌNG: API ĐĂNG NHẬP NẰM Ở ĐÂY 👇
// ============================================
app.post('/api/login', async (req, res) => {
  const { phone, password } = req.body;
  console.log("👉 Đang thử đăng nhập:", phone, password); 

  try {
    const result = await pool.query('SELECT * FROM workers WHERE phone = $1', [phone]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "SĐT không tồn tại" });
    }

    const user = result.rows[0];
    if (user.password !== password) {
      return res.status(401).json({ error: "Sai mật khẩu" });
    }

    // Cấp vé
    const token = jwt.sign(
        { id: user.id, role: user.role, name: user.name }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1d' }
    );
    res.json({ token, role: user.role, name: user.name });

  } catch (err) { 
    console.error("Lỗi Server:", err);
    res.status(500).json({ error: "Lỗi nội bộ Server: " + err.message }); 
  }
});
// ============================================

// Các API khác
app.get('/api/workers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM workers ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).send(err.message); }
});

app.post('/api/workers', async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    const result = await pool.query("INSERT INTO workers (name, phone, password, role) VALUES ($1, $2, $3, 'tho') RETURNING *", [name, phone, password]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).send(err.message); }
});

app.post('/api/upload', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Chưa chọn ảnh' });
  res.json({ url: req.file.path });
});

app.post('/api/reports', async (req, res) => {
  try {
    const { worker_id, location, image_url, note } = req.body;
    const result = await pool.query("INSERT INTO reports (worker_id, location, image_url, note) VALUES ($1, $2, $3, $4) RETURNING *", [worker_id, location, image_url, note]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).send(err.message); }
});

app.get('/api/reports', async (req, res) => {
  try {
    const result = await pool.query("SELECT reports.*, workers.name as worker_name, workers.phone FROM reports JOIN workers ON reports.worker_id = workers.id ORDER BY reports.created_at DESC");
    res.json(result.rows);
  } catch (err) { res.status(500).send(err.message); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});