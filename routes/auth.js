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

// POST /api/change-password - Ganti Password Admin
router.post("/change-password", async (req, res, next) => {
  try {
    if (!req.session || !req.session.adminId) {
      return res.status(401).json({ error: "Unauthorized. Silakan login sebagai admin." });
    }
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Password lama dan password baru wajib diisi." });
    }

    const { rows } = await pool.query("SELECT * FROM admins WHERE id = $1", [req.session.adminId]);
    const admin = rows[0];
    if (!admin) {
      return res.status(404).json({ error: "Admin tidak ditemukan." });
    }

    const cocok = await bcrypt.compare(oldPassword, admin.password_hash);
    if (!cocok) {
      return res.status(400).json({ error: "Password lama salah." });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE admins SET password_hash = $1, updated_pada = NOW() WHERE id = $2", [
      hash,
      req.session.adminId,
    ]);

    res.json({ message: "Password berhasil diubah." });
  } catch (err) {
    next(err);
  }
});

// GET /api/admins - List Admin
router.get("/admins", async (req, res, next) => {
  try {
    if (!req.session || !req.session.adminId) {
      return res.status(401).json({ error: "Unauthorized. Silakan login sebagai admin." });
    }
    const { rows } = await pool.query("SELECT id, username, dibuat_pada FROM admins ORDER BY id ASC");
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/admins - Tambah Admin Baru
router.post("/admins", async (req, res, next) => {
  try {
    if (!req.session || !req.session.adminId) {
      return res.status(401).json({ error: "Unauthorized. Silakan login sebagai admin." });
    }
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username dan password wajib diisi." });
    }

    // Cek apakah username sudah dipakai
    const { rows: cek } = await pool.query("SELECT id FROM admins WHERE username = $1", [username]);
    if (cek.length > 0) {
      return res.status(400).json({ error: "Username sudah digunakan." });
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      "INSERT INTO admins (username, password_hash) VALUES ($1, $2) RETURNING id, username, dibuat_pada",
      [username, hash]
    );

    res.json({ message: "Admin berhasil ditambahkan.", admin: rows[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admins/change-username - Ganti Username Admin
router.put("/admins/change-username", async (req, res, next) => {
  try {
    if (!req.session || !req.session.adminId) {
      return res.status(401).json({ error: "Unauthorized. Silakan login sebagai admin." });
    }
    const { newUsername } = req.body;
    if (!newUsername) {
      return res.status(400).json({ error: "Username baru wajib diisi." });
    }

    const currentId = req.session.adminId;

    // Cek keunikan username di database (exclude current user)
    const { rows: cek } = await pool.query(
      "SELECT id FROM admins WHERE username = $1 AND id != $2",
      [newUsername, currentId]
    );
    if (cek.length > 0) {
      return res.status(400).json({ error: "Username sudah digunakan." });
    }

    await pool.query(
      "UPDATE admins SET username = $1, updated_pada = NOW() WHERE id = $2",
      [newUsername, currentId]
    );

    req.session.username = newUsername;
    res.json({ message: "Username berhasil diperbarui.", username: newUsername });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admins/:id - Hapus Admin
router.delete("/admins/:id", async (req, res, next) => {
  try {
    if (!req.session || !req.session.adminId) {
      return res.status(401).json({ error: "Unauthorized. Silakan login sebagai admin." });
    }
    const { id } = req.params;
    const adminIdToDelete = parseInt(id, 10);

    if (adminIdToDelete === req.session.adminId) {
      return res.status(400).json({ error: "Anda tidak dapat menghapus akun Anda sendiri." });
    }

    const { rowCount } = await pool.query("DELETE FROM admins WHERE id = $1", [adminIdToDelete]);
    if (rowCount === 0) {
      return res.status(404).json({ error: "Admin tidak ditemukan." });
    }

    res.json({ message: "Admin berhasil dihapus." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
