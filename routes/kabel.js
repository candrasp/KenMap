// routes/kabel.js
const express = require("express");
const { pool } = require("../db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

// GET /api/kabel - ambil semua kabel, geometry langsung di-parse jadi object
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM kabel ORDER BY id DESC");
    const hasil = rows.map((row) => ({ ...row, geometry: JSON.parse(row.geometry) }));
    res.json(hasil);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM kabel WHERE id = $1", [req.params.id]);
    const row = rows[0];
    if (!row) return res.status(404).json({ error: "Kabel tidak ditemukan." });
    res.json({ ...row, geometry: JSON.parse(row.geometry) });
  } catch (err) {
    next(err);
  }
});

// POST /api/kabel
// Body contoh:
// {
//   "jenis": "distribusi",
//   "dari_tipe": "odc", "dari_id": 1,
//   "ke_tipe": "odp", "ke_id": 5,
//   "koordinat": [[111.452,-7.871],[111.453,-7.869],[111.456,-7.869]],
//   "panjang_meter": 651,
//   "jumlah_core": 12
// }
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { jenis, dari_tipe, dari_id, ke_tipe, ke_id, koordinat, panjang_meter, jumlah_core } =
      req.body;

    if (!jenis || !dari_tipe || !dari_id || !ke_tipe || !ke_id || !koordinat) {
      return res
        .status(400)
        .json({ error: "jenis, dari_tipe, dari_id, ke_tipe, ke_id, dan koordinat wajib diisi." });
    }

    const geometry = JSON.stringify({ type: "LineString", coordinates: koordinat });

    const { rows } = await pool.query(
      `INSERT INTO kabel (jenis, dari_tipe, dari_id, ke_tipe, ke_id, geometry, panjang_meter, jumlah_core)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        jenis,
        dari_tipe,
        dari_id,
        ke_tipe,
        ke_id,
        geometry,
        panjang_meter || null,
        jumlah_core || null,
      ],
    );
    res.status(201).json({ id: rows[0].id });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const { rowCount } = await pool.query("DELETE FROM kabel WHERE id = $1", [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: "Kabel tidak ditemukan." });
    res.json({ message: "Kabel berhasil dihapus." });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const { jenis, dari_tipe, dari_id, ke_tipe, ke_id, koordinat, panjang_meter, jumlah_core } =
      req.body;
    const { rows: existingRows } = await pool.query("SELECT * FROM kabel WHERE id = $1", [
      req.params.id,
    ]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: "Kabel tidak ditemukan." });

    const geometry = koordinat
      ? JSON.stringify({ type: "LineString", coordinates: koordinat })
      : existing.geometry;

    await pool.query(
      `UPDATE kabel SET jenis = $1, dari_tipe = $2, dari_id = $3, ke_tipe = $4, ke_id = $5, geometry = $6, panjang_meter = $7, jumlah_core = $8, updated_pada = NOW()
       WHERE id = $9`,
      [
        jenis ?? existing.jenis,
        dari_tipe ?? existing.dari_tipe,
        dari_id ?? existing.dari_id,
        ke_tipe ?? existing.ke_tipe,
        ke_id ?? existing.ke_id,
        geometry,
        panjang_meter ?? existing.panjang_meter,
        jumlah_core ?? existing.jumlah_core,
        req.params.id,
      ],
    );
    res.json({ message: "Kabel berhasil diperbarui." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
