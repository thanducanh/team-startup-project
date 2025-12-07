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

// --- 1. QUẢN LÝ TIN TỨC (NEWS) ---
app.post('/api/news', async (req, res) => { // Đăng tin
  const { title, content, image_url } = req.body;
  try {
    await pool.query("INSERT INTO news (title, content, image_url) VALUES ($1, $2, $3)", [title, content, image_url]);
    res.json({ message: "Đã đăng tin thành công!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/news/:id', async (req, res) => { // Xóa tin
  try {
    await pool.query("DELETE FROM news WHERE id = $1", [req.params.id]);
    res.json({ message: "Đã xóa tin!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/news', async (req, res) => { // Xem tin
  try { const result = await pool.query('SELECT * FROM news ORDER BY id DESC'); res.json(result.rows); } 
  catch (err) { res.status(500).send(err.message); }
});

// --- 2. QUẢN LÝ VIỆC LÀM (JOBS) ---
app.post('/api/jobs', async (req, res) => { // Đăng việc
  const { title, location, salary, date, description } = req.body;
  try {
    await pool.query(
      "INSERT INTO jobs (title, location, salary, date, description) VALUES ($1, $2, $3, $4, $5)", 
      [title, location, salary, date, description]
    );
    res.json({ message: "Đã đăng tuyển dụng mới!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/jobs/:id', async (req, res) => { // Xóa việc
  try {
    await pool.query("DELETE FROM job_applications WHERE job_id = $1", [req.params.id]); // Xóa đơn ứng tuyển trước
    await pool.query("DELETE FROM jobs WHERE id = $1", [req.params.id]); // Xóa job sau
    res.json({ message: "Đã xóa công việc!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/jobs', async (req, res) => { // Xem việc
  const workerId = req.query.worker_id || 0;
  try {
    const query = `SELECT jobs.*, (SELECT COUNT(*) FROM job_applications WHERE job_id = jobs.id AND worker_id = $1) as applied FROM jobs ORDER BY id DESC`;
    const result = await pool.query(query, [workerId]);
    res.json(result.rows);
  } catch (err) { res.status(500).send(err.message); }
});

app.post('/api/apply', async (req, res) => { // Ứng tuyển
  const { worker_id, job_id } = req.body;
  try {
    await pool.query("INSERT INTO job_applications (job_id, worker_id) VALUES ($1, $2)", [job_id, worker_id]);
    res.json({ message: "Đăng ký thành công!" });
  } catch (err) { 
    if (err.code === '23505') return res.status(400).json({ error: "Đã đăng ký rồi!" });
    res.status(500).json({ error: err.message }); 
  }
});

// --- 3. QUẢN LÝ NHÂN SỰ & BÁO CÁO (Cũ) ---
app.post('/api/login', async (req, res) => {
  const { phone, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM workers WHERE phone = $1', [phone]);
    if (result.rows.length === 0) return res.status(401).json({ error: "SĐT không đúng" });
    const user = result.rows[0];
    if (user.password !== password) return res.status(401).json({ error: "Sai mật khẩu" });
    if (user.status === 'pending') return res.status(403).json({ error: "Tài khoản đang chờ duyệt!" });
    if (user.status === 'blocked') return res.status(403).json({ error: "Tài khoản đã bị khóa!" });
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, role: user.role, name: user.name });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/register', async (req, res) => {
  const { name, phone, password } = req.body;
  try {
    const check = await pool.query('SELECT * FROM workers WHERE phone = $1', [phone]);
    if (check.rows.length > 0) return res.status(400).json({ error: "SĐT đã tồn tại!" });
    await pool.query("INSERT INTO workers (name, phone, password, role) VALUES ($1, $2, $3, 'tho')", [name, phone, password]);
    res.json({ message: "Đăng ký thành công! Chờ duyệt." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/workers', async (req, res) => {
  try { const result = await pool.query('SELECT * FROM workers ORDER BY id DESC'); res.json(result.rows); } 
  catch (err) { res.status(500).send(err.message); }
});

app.put('/api/workers/:id/status', async (req, res) => {
  try { await pool.query('UPDATE workers SET status = $1 WHERE id = $2', [req.body.status, req.params.id]); res.json({ message: "Success" }); } catch (err) { res.status(500).send(err.message); }
});

app.delete('/api/workers/:id', async (req, res) => {
  try { await pool.query('DELETE FROM reports WHERE worker_id = $1', [req.params.id]); await pool.query('DELETE FROM workers WHERE id = $1', [req.params.id]); res.json({ message: "Deleted" }); } catch (err) { res.status(500).json({ error: err.message }); }
});

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
  try { const result = await pool.query("SELECT reports.*, workers.name as worker_name, workers.phone FROM reports JOIN workers ON reports.worker_id = workers.id ORDER BY reports.created_at DESC"); res.json(result.rows); } catch (err) { res.status(500).send(err.message); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { console.log(`🚀 Server running...`); });