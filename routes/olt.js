// routes/olt.js
const express = require("express");
const { pool } = require("../db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

function pick(body, key, existing) {
  return Object.prototype.hasOwnProperty.call(body, key) ? body[key] : existing[key];
}

function isUniqueViolation(err) {
  return err && err.code === "23505";
}

// GET /api/olt - ambil semua OLT (publik - dipakai buat isi dropdown di form ODC)
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM olt ORDER BY nama ASC");
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/olt/:id
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM olt WHERE id = $1", [req.params.id]);
    const row = rows[0];
    if (!row) return res.status(404).json({ error: "OLT tidak ditemukan." });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// POST /api/olt - tambah OLT baru (wajib login)
// Dipakai juga oleh fitur "quick-add" di form ODC, jadi cuma kode+nama yang wajib.
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { kode, nama, nama_sto, sto_id, lat, lng, alamat, jumlah_port_pon, vendor, catatan } =
      req.body;

    if (!kode || !nama) {
      return res.status(400).json({ error: "kode dan nama wajib diisi." });
    }
    if (sto_id) {
      const { rows: stoRows } = await pool.query("SELECT id FROM sto WHERE id = $1", [sto_id]);
      if (!stoRows[0]) return res.status(400).json({ error: "sto_id tidak ditemukan." });
    }

    let newId;
    try {
      const { rows } = await pool.query(
        `INSERT INTO olt (kode, nama, nama_sto, sto_id, lat, lng, alamat, jumlah_port_pon, vendor, catatan)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [
          kode.trim(),
          nama.trim(),
          nama_sto || null,
          sto_id || null,
          lat ?? null,
          lng ?? null,
          alamat || null,
          jumlah_port_pon ?? null,
          vendor || null,
          catatan || null,
        ],
      );
      newId = rows[0].id;
    } catch (err) {
      if (isUniqueViolation(err)) {
        return res.status(409).json({ error: `Kode OLT '${kode}' sudah dipakai.` });
      }
      throw err;
    }

    const { rows: createdRows } = await pool.query("SELECT * FROM olt WHERE id = $1", [newId]);
    res.status(201).json(createdRows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/olt/:id - update OLT (wajib login)
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const { rows: existingRows } = await pool.query("SELECT * FROM olt WHERE id = $1", [
      req.params.id,
    ]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: "OLT tidak ditemukan." });

    const kode = pick(req.body, "kode", existing);
    const nama = pick(req.body, "nama", existing);
    const sto_id = pick(req.body, "sto_id", existing);
    if (!kode || !nama) {
      return res.status(400).json({ error: "kode dan nama wajib diisi." });
    }
    if (sto_id) {
      const { rows: stoRows } = await pool.query("SELECT id FROM sto WHERE id = $1", [sto_id]);
      if (!stoRows[0]) return res.status(400).json({ error: "sto_id tidak ditemukan." });
    }

    try {
      await pool.query(
        `UPDATE olt SET
          kode = $1, nama = $2, nama_sto = $3, sto_id = $4, lat = $5, lng = $6,
          alamat = $7, jumlah_port_pon = $8, vendor = $9, catatan = $10,
          updated_pada = NOW()
        WHERE id = $11`,
        [
          kode,
          nama,
          pick(req.body, "nama_sto", existing),
          sto_id,
          pick(req.body, "lat", existing),
          pick(req.body, "lng", existing),
          pick(req.body, "alamat", existing),
          pick(req.body, "jumlah_port_pon", existing),
          pick(req.body, "vendor", existing),
          pick(req.body, "catatan", existing),
          req.params.id,
        ],
      );
    } catch (err) {
      if (isUniqueViolation(err)) {
        return res.status(409).json({ error: `Kode OLT '${kode}' sudah dipakai.` });
      }
      throw err;
    }

    res.json({ message: "OLT berhasil diperbarui." });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/olt/:id (wajib login) - blokir kalau masih ada ODC yang terhubung
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const { rows: countRows } = await pool.query(
      "SELECT COUNT(*) AS count FROM odc WHERE olt_id = $1",
      [req.params.id],
    );
    const count = parseInt(countRows[0].count, 10);
    if (count > 0) {
      return res
        .status(409)
        .json({ error: `Tidak dapat menghapus OLT ini. Ada ${count} ODC yang masih terhubung.` });
    }

    const { rowCount } = await pool.query("DELETE FROM olt WHERE id = $1", [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: "OLT tidak ditemukan." });
    res.json({ message: "OLT berhasil dihapus." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
