// routes/odp.js
const express = require("express");
const { pool } = require("../db");
const requireAuth = require("../middleware/requireAuth");
const { getDesaFromCoordinates } = require("../utils/geocodeLocal");

const router = express.Router();

const STATUS_VALID = ["aktif", "planning", "maintenance", "nonaktif"];

// GET /api/odp - ambil semua ODP, sertakan info slot port terpakai
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT odp.*,
        (SELECT COUNT(*) FROM klien WHERE klien.odp_id = odp.id) AS port_terpakai
      FROM odp
      ORDER BY odp.id DESC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM odp WHERE id = $1", [req.params.id]);
    const row = rows[0];
    if (!row) return res.status(404).json({ error: "ODP tidak ditemukan." });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { odc_id, nama, alamat, lat, lng, kapasitas_port, tipe_pemasangan, status, catatan } =
      req.body;
    if (!nama || lat == null || lng == null) {
      return res.status(400).json({ error: "nama, lat, dan lng wajib diisi." });
    }
    if (status && !STATUS_VALID.includes(status)) {
      return res
        .status(400)
        .json({ error: `status harus salah satu dari: ${STATUS_VALID.join(", ")}.` });
    }

    const { rows } = await pool.query(
      `INSERT INTO odp (odc_id, nama, alamat, lat, lng, kapasitas_port, tipe_pemasangan, status, catatan)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [
        odc_id || null,
        nama,
        alamat || null,
        lat,
        lng,
        kapasitas_port || 8,
        tipe_pemasangan || "tiang",
        status || "aktif",
        catatan || null,
      ],
    );
    const newId = rows[0].id;

    // Auto-fill alamat dari koordinat menggunakan data lokal (data-desa.geojson)
    if (!alamat && lat != null && lng != null) {
      const desaName = getDesaFromCoordinates(parseFloat(lat), parseFloat(lng));
      if (desaName) {
        await pool.query("UPDATE odp SET alamat = $1 WHERE id = $2", [desaName, newId]);
        console.log(`[geocodeLocal] Alamat ODP #${newId}: ${desaName}`);
      }
    }

    res.status(201).json({ id: newId });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const { odc_id, nama, alamat, lat, lng, kapasitas_port, tipe_pemasangan, status, catatan } =
      req.body;
    const { rows: existingRows } = await pool.query("SELECT * FROM odp WHERE id = $1", [
      req.params.id,
    ]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: "ODP tidak ditemukan." });

    if (status && !STATUS_VALID.includes(status)) {
      return res
        .status(400)
        .json({ error: `status harus salah satu dari: ${STATUS_VALID.join(", ")}.` });
    }

    await pool.query(
      `UPDATE odp SET odc_id = $1, nama = $2, alamat = $3, lat = $4, lng = $5, kapasitas_port = $6, tipe_pemasangan = $7, status = $8, catatan = $9, updated_pada = NOW()
       WHERE id = $10`,
      [
        odc_id ?? existing.odc_id,
        nama ?? existing.nama,
        alamat ?? existing.alamat,
        lat ?? existing.lat,
        lng ?? existing.lng,
        kapasitas_port ?? existing.kapasitas_port,
        tipe_pemasangan ?? existing.tipe_pemasangan,
        status ?? existing.status,
        catatan ?? existing.catatan,
        req.params.id,
      ],
    );
    res.json({ message: "ODP berhasil diperbarui." });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const { rows: countRows } = await pool.query(
      "SELECT COUNT(*) AS count FROM klien WHERE odp_id = $1",
      [req.params.id],
    );
    const count = parseInt(countRows[0].count, 10);
    if (count > 0) {
      return res
        .status(409)
        .json({ error: `Tidak dapat menghapus ODP ini. Ada ${count} klien yang masih terhubung.` });
    }

    const { rowCount } = await pool.query("DELETE FROM odp WHERE id = $1", [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: "ODP tidak ditemukan." });
    res.json({ message: "ODP berhasil dihapus." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
