require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000 
});

// --- AUTH API ---
app.post('/api/login', async (req, res) => {
    const { phone, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM workers WHERE phone = $1', [phone]);
        if (result.rows.length === 0) return res.status(401).json({ error: "SĐT không đúng" });
        const user = result.rows[0];
        if (user.password !== password) return res.status(401).json({ error: "Sai mật khẩu" });
        
        res.json({ id: user.id, name: user.name, role: user.role });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/register', async (req, res) => {
    const { name, phone, password } = req.body;
    try {
        await pool.query("INSERT INTO workers (name, phone, password, role) VALUES ($1, $2, $3, 'user')", [name, phone, password]);
        res.json({ message: "Đăng ký thành công!" });
    } catch (err) { res.status(500).json({ error: "SĐT đã tồn tại" }); }
});

// --- NEWSFEED API ---
app.get('/api/posts', async (req, res) => {
    try {
        const query = `SELECT p.*, w.name as author_name, w.role as author_role FROM posts p JOIN workers w ON p.author_id = w.id ORDER BY p.created_at DESC`;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/api/posts', async (req, res) => {
    const { author_id, content, image_url } = req.body;
    try {
        const userCheck = await pool.query('SELECT role FROM workers WHERE id = $1', [author_id]);
        if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'admin') {
            return res.status(403).json({ error: "Chỉ Admin mới được đăng bài!" });
        }
        await pool.query("INSERT INTO posts (author_id, content, image_url) VALUES ($1, $2, $3)", [author_id, content, image_url]);
        res.json({ message: "Đăng thành công!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- CHAT API (CẬP NHẬT MỚI) ---

// 1. Lấy danh sách TẤT CẢ User (Trừ bản thân mình)
app.get('/api/users', async (req, res) => {
    const { current_user_id } = req.query;
    try {
        const result = await pool.query(
            "SELECT id, name, role FROM workers WHERE id != $1 ORDER BY id DESC", 
            [current_user_id]
        );
        res.json(result.rows);
    } catch (err) { res.status(500).send(err.message); }
});

// 2. Tìm hoặc Tạo phòng chat (Kiểm tra xem 2 người đã từng chat chưa)
app.post('/api/conversation/start', async (req, res) => {
    const { user1_id, user2_id } = req.body;
    try {
        // Tìm phòng cũ
        const findQuery = `
            SELECT c.id FROM conversations c
            JOIN participants p1 ON c.id = p1.conversation_id
            JOIN participants p2 ON c.id = p2.conversation_id
            WHERE p1.worker_id = $1 AND p2.worker_id = $2
        `;
        const existing = await pool.query(findQuery, [user1_id, user2_id]);

        if (existing.rows.length > 0) {
            return res.json({ conversation_id: existing.rows[0].id });
        } else {
            // Tạo phòng mới
            const newConv = await pool.query("INSERT INTO conversations (is_group) VALUES (false) RETURNING id");
            const convId = newConv.rows[0].id;
            await pool.query("INSERT INTO participants (conversation_id, worker_id) VALUES ($1, $2), ($1, $3)", [convId, user1_id, user2_id]);
            return res.json({ conversation_id: convId });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/messages/:conversation_id', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC", [req.params.conversation_id]);
        res.json(result.rows);
    } catch (err) { res.status(500).send(err.message); }
});

// --- SOCKET.IO ---
io.on("connection", (socket) => {
    socket.on("join_room", (id) => socket.join(id));
    socket.on("send_message", async (data) => {
        const { conversation_id, sender_id, content } = data;
        try {
            const saved = await pool.query("INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *", [conversation_id, sender_id, content]);
            io.to(conversation_id).emit("receive_message", saved.rows[0]);
        } catch (e) { console.error(e); }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));