require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Keamanan
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const app = express();

// =======================================================
// 0. KONFIGURASI CORS (KEAMANAN DOMAIN)
// =======================================================
const allowedOrigins = [
    'http://localhost:5500',       // Live Server VS Code
    'http://127.0.0.1:5500',       // Live Server VS Code alternatif
    'https://pastanova.vercel.app' // GANTI INI DENGAN LINK VERCEL ASLI KAMU NANTI
];

app.use(cors({
    origin: function (origin, callback) {
        // Izinkan jika tidak ada origin (seperti Postman) atau jika origin ada di daftar
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Akses diblokir oleh CORS Policy! Domain tidak diizinkan.'));
        }
    }
}));

app.use(express.json());

// Konfigurasi Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: { folder: 'pastanova_products', allowed_formats: ['jpg', 'png', 'jpeg'] }
});
const upload = multer({ storage });

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error(err));

const Menu = require('./models/Menu');
const Category = require('./models/Category');

// =======================================================
// 1. SISTEM KEAMANAN (RATE LIMITER & MIDDLEWARE)
// =======================================================
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 Menit
    max: 5, // Maksimal 5 kali coba
    message: { error: "Terlalu banyak percobaan login gagal. Coba lagi dalam 15 menit." }
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 
    if (token == null) return res.status(401).json({ error: "Akses Ditolak. Belum Login!" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Sesi Login Habis. Silakan login ulang." });
        req.user = user;
        next();
    });
};

// =======================================================
// 2. API ENDPOINTS
// =======================================================

// --- API LOGIN ---
app.post('/api/admin/login', loginLimiter, (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ id: username }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, message: "Login Berhasil" });
    } else {
        res.status(401).json({ error: "Username atau Password salah!" });
    }
});

// --- API KATEGORI ---
app.get('/api/categories', async (req, res) => {
    const cats = await Category.find();
    res.json(cats);
});
app.post('/api/categories', authenticateToken, async (req, res) => {
    try { const newCat = new Category(req.body); await newCat.save(); res.status(201).json(newCat); } 
    catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
    await Category.findByIdAndDelete(req.params.id); res.json({ message: "Kategori dihapus" });
});

// --- API MENU ---
app.get('/api/menus', async (req, res) => {
    try {
        const { search, category, page = 1, limit = 6 } = req.query;
        let query = {};
        if (search) query.name = { $regex: search, $options: 'i' };
        if (category && category !== 'semua') query.category = category;

        const menus = await Menu.find(query).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 });
        const count = await Menu.countDocuments(query);
        res.json({ menus, totalPages: Math.ceil(count / limit), currentPage: Number(page) });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/menus', authenticateToken, upload.array('images', 5), async (req, res) => {
    try {
        const imageUrls = req.files.map(file => file.path);
        const newMenu = new Menu({ ...req.body, images: imageUrls });
        await newMenu.save();
        res.status(201).json(newMenu);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/menus/:id', authenticateToken, async (req, res) => {
    await Menu.findByIdAndDelete(req.params.id); res.json({ message: "Menu dihapus" });
});

module.exports = app;