// routes/pengaturan.js
// Endpoint untuk pengaturan global aplikasi (layer visibility, dll).
// GET  -> bisa diakses publik (tanpa login), dipakai untuk render peta.
// PUT  -> WAJIB login admin, karena mengubah tampilan yang dilihat semua orang.

const express = require("express");
const router = express.Router();
const { pool } = require("../db");

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.adminId) {
    return res.status(401).json({ error: "Unauthorized. Silakan login sebagai admin." });
  }
  next();
}

const BOOLEAN_KEYS = new Set([
  "tampilkan_batas_kota",
  "tampilkan_batas_kecamatan",
  "tampilkan_batas_desa",
  "tampilkan_nama_kecamatan",
  "tampilkan_nama_desa",
  "tampilkan_odc",
  "tampilkan_odp",
  "tampilkan_kabel",
  "tampilkan_klien",
]);

function parseNilai(row) {
  if (row.tipe === "boolean") return row.nilai === "true";
  if (row.tipe === "number") return Number(row.nilai);
  if (row.tipe === "json") {
    try {
      return JSON.parse(row.nilai);
    } catch {
      return null;
    }
  }
  return row.nilai; // 'text'
}

// GET /api/pengaturan - publik
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT kunci, nilai, tipe FROM pengaturan");
    const hasil = {};
    for (const row of rows) hasil[row.kunci] = parseNilai(row);
    res.json(hasil);
  } catch (err) {
    next(err);
  }
});

// PUT /api/pengaturan/:kunci - khusus admin, body: { nilai: true/false }
router.put("/:kunci", requireAdmin, async (req, res, next) => {
  try {
    const { kunci } = req.params;
    const { nilai } = req.body;

    if (!BOOLEAN_KEYS.has(kunci)) {
      return res.status(400).json({ error: `Kunci pengaturan '${kunci}' tidak dikenal.` });
    }
    if (typeof nilai !== "boolean") {
      return res.status(400).json({ error: "Nilai harus boolean (true/false)." });
    }

    const { rowCount } = await pool.query(
      "UPDATE pengaturan SET nilai = $1, updated_pada = NOW() WHERE kunci = $2",
      [nilai ? "true" : "false", kunci],
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: "Kunci pengaturan tidak ditemukan." });
    }
    res.json({ kunci, nilai });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
