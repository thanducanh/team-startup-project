require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // Bắt buộc có dòng này để đọc dữ liệu gửi lên
app.use(express.static('public')); // Chạy giao diện web

// Cấu hình Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// --- API 1: Lấy danh sách thợ (GET) ---
app.get('/api/workers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM workers ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).send(err.message); }
});

// --- API 2: Thêm thợ mới (POST) - CÁI MỚI THÊM ---
app.post('/api/workers', async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    
    // Câu lệnh SQL để chèn dữ liệu
    const query = `
      INSERT INTO workers (name, phone, password, role) 
      VALUES ($1, $2, $3, 'tho') 
      RETURNING *
    `;
    
    const result = await pool.query(query, [name, phone, password]);
    res.json(result.rows[0]); // Trả về thông tin thợ vừa tạo
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi: ' + err.message);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});