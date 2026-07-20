// routes/sto.js
// STO (Sentral Telepon Otomat) - gedung/lokasi induk yang bisa menaungi
// lebih dari satu OLT di dalamnya. Relasi: sto (1) -> olt (banyak).

const express = require("express");
const { pool } = require("../db");
const requireAuth = require("../middleware/requireAuth");
const { getDesaFromCoordinates } = require("../utils/geocodeLocal");

const router = express.Router();

const STATUS_VALID = ["aktif", "planning", "maintenance", "nonaktif"];

function pick(body, key, existing) {
  return Object.prototype.hasOwnProperty.call(body, key) ? body[key] : existing[key];
}

function isUniqueViolation(err) {
  return err && err.code === "23505";
}

// GET /api/sto - ambil semua STO (publik, dipakai buat tampil di peta)
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM sto ORDER BY nama ASC");
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/sto/:id
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM sto WHERE id = $1", [req.params.id]);
    const row = rows[0];
    if (!row) return res.status(404).json({ error: "STO tidak ditemukan." });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// POST /api/sto - tambah STO baru (wajib login)
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { kode, nama, lat, lng, alamat, status, foto_url, catatan } = req.body;

    if (!kode || !nama || lat == null || lng == null) {
      return res.status(400).json({ error: "kode, nama, lat, dan lng wajib diisi." });
    }
    if (status && !STATUS_VALID.includes(status)) {
      return res
        .status(400)
        .json({ error: `status harus salah satu dari: ${STATUS_VALID.join(", ")}.` });
    }

    let newId;
    try {
      const { rows } = await pool.query(
        `INSERT INTO sto (kode, nama, lat, lng, alamat, status, foto_url, catatan)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [
          kode.trim(),
          nama.trim(),
          lat,
          lng,
          alamat || null,
          status || "aktif",
          foto_url || null,
          catatan || null,
        ],
      );
      newId = rows[0].id;
    } catch (err) {
      if (isUniqueViolation(err)) {
        return res.status(409).json({ error: `Kode STO '${kode}' sudah dipakai.` });
      }
      throw err;
    }

    // Auto-fill alamat dari koordinat kalau belum diisi manual
    if (!alamat && lat != null && lng != null) {
      const desaName = getDesaFromCoordinates(parseFloat(lat), parseFloat(lng));
      if (desaName) {
        await pool.query("UPDATE sto SET alamat = $1 WHERE id = $2", [desaName, newId]);
        console.log(`[geocodeLocal] Alamat STO #${newId}: ${desaName}`);
      }
    }

    const { rows: createdRows } = await pool.query("SELECT * FROM sto WHERE id = $1", [newId]);
    res.status(201).json(createdRows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/sto/:id - update STO (wajib login)
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const { rows: existingRows } = await pool.query("SELECT * FROM sto WHERE id = $1", [
      req.params.id,
    ]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: "STO tidak ditemukan." });

    const kode = pick(req.body, "kode", existing);
    const nama = pick(req.body, "nama", existing);
    const status = pick(req.body, "status", existing);

    if (!kode || !nama) {
      return res.status(400).json({ error: "kode dan nama wajib diisi." });
    }
    if (status && !STATUS_VALID.includes(status)) {
      return res
        .status(400)
        .json({ error: `status harus salah satu dari: ${STATUS_VALID.join(", ")}.` });
    }

    try {
      await pool.query(
        `UPDATE sto SET
          kode = $1, nama = $2, lat = $3, lng = $4, alamat = $5,
          status = $6, foto_url = $7, catatan = $8, updated_pada = NOW()
        WHERE id = $9`,
        [
          kode,
          nama,
          pick(req.body, "lat", existing),
          pick(req.body, "lng", existing),
          pick(req.body, "alamat", existing),
          status,
          pick(req.body, "foto_url", existing),
          pick(req.body, "catatan", existing),
          req.params.id,
        ],
      );
    } catch (err) {
      if (isUniqueViolation(err)) {
        return res.status(409).json({ error: `Kode STO '${kode}' sudah dipakai.` });
      }
      throw err;
    }

    res.json({ message: "STO berhasil diperbarui." });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/sto/:id (wajib login) - blokir kalau masih ada OLT yang terhubung
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const { rows: countRows } = await pool.query(
      "SELECT COUNT(*) AS count FROM olt WHERE sto_id = $1",
      [req.params.id],
    );
    const count = parseInt(countRows[0].count, 10);
    if (count > 0) {
      return res
        .status(409)
        .json({ error: `Tidak dapat menghapus STO ini. Ada ${count} OLT yang masih terhubung.` });
    }

    const { rowCount } = await pool.query("DELETE FROM sto WHERE id = $1", [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: "STO tidak ditemukan." });
    res.json({ message: "STO berhasil dihapus." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
