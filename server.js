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

// Kết nối Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Cấu hình Cloudinary
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

// --- API 1: ĐĂNG KÝ (Tạo user với status = pending) ---
app.post('/api/register', async (req, res) => {
  const { name, phone, password } = req.body;
  try {
    const check = await pool.query('SELECT * FROM workers WHERE phone = $1', [phone]);
    if (check.rows.length > 0) return res.status(400).json({ error: "Số điện thoại đã tồn tại!" });

    // Insert mặc định status là 'pending' (do database set default)
    await pool.query(
      "INSERT INTO workers (name, phone, password, role) VALUES ($1, $2, $3, 'tho')", 
      [name, phone, password]
    );
    res.json({ message: "Đăng ký thành công! Vui lòng chờ Admin duyệt." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- API 2: ĐĂNG NHẬP (Có kiểm tra Status) ---
app.post('/api/login', async (req, res) => {
  const { phone, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM workers WHERE phone = $1', [phone]);
    if (result.rows.length === 0) return res.status(401).json({ error: "SĐT không tồn tại" });

    const user = result.rows[0];
    if (user.password !== password) return res.status(401).json({ error: "Sai mật khẩu" });

    // CHECK TRẠNG THÁI
    if (user.status === 'pending') return res.status(403).json({ error: "Tài khoản đang chờ duyệt!" });
    if (user.status === 'blocked') return res.status(403).json({ error: "Tài khoản đã bị khóa!" });

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, role: user.role, name: user.name });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- API 3: ADMIN DUYỆT/KHÓA USER ---
app.put('/api/workers/:id/status', async (req, res) => {
  const { status } = req.body; 
  const { id } = req.params;
  try {
    await pool.query('UPDATE workers SET status = $1 WHERE id = $2', [status, id]);
    res.json({ message: "Success" });
  } catch (err) { res.status(500).send(err.message); }
});

// --- API 4: LẤY DANH SÁCH THỢ ---
app.get('/api/workers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM workers ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).send(err.message); }
});

// --- API 5: UPLOAD ẢNH & LƯU BÁO CÁO ---
app.post('/api/upload', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Thiếu ảnh' });
  res.json({ url: req.file.path });
});

app.post('/api/reports', async (req, res) => {
  try {
    const { worker_id, location, image_url, note } = req.body;
    await pool.query("INSERT INTO reports (worker_id, location, image_url, note) VALUES ($1, $2, $3, $4)", [worker_id, location, image_url, note]);
    res.json({ message: "Success" });
  } catch (err) { res.status(500).send(err.message); }
});

app.get('/api/reports', async (req, res) => {
  try {
    const query = `SELECT reports.*, workers.name as worker_name, workers.phone FROM reports JOIN workers ON reports.worker_id = workers.id ORDER BY reports.created_at DESC`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) { res.status(500).send(err.message); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});