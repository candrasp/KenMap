// routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const { pool } = require("../db");

const router = express.Router();

// POST /api/login
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username dan password wajib diisi." });
    }

    const { rows } = await pool.query("SELECT * FROM admins WHERE username = $1", [username]);
    const admin = rows[0];
    if (!admin) {
      return res.status(401).json({ error: "Username atau password salah." });
    }

    const cocok = await bcrypt.compare(password, admin.password_hash);
    if (!cocok) {
      return res.status(401).json({ error: "Username atau password salah." });
    }

    req.session.adminId = admin.id;
    req.session.username = admin.username;
    res.json({ message: "Login berhasil.", username: admin.username });
  } catch (err) {
    next(err);
  }
});

// POST /api/logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logout berhasil." });
  });
});

// GET /api/me  (cek status login saat ini, dipakai frontend untuk tahu sudah login atau belum)
router.get("/me", (req, res) => {
  if (req.session && req.session.adminId) {
    return res.json({ loggedIn: true, username: req.session.username });
  }
  res.json({ loggedIn: false });
});

module.exports = router;
