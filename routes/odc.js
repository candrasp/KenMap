// routes/odc.js
const express = require("express");
const { pool } = require("../db");
const requireAuth = require("../middleware/requireAuth");
const { getDesaFromCoordinates } = require("../utils/geocodeLocal");

const router = express.Router();

// GET /api/odc - ambil semua ODC (boleh diakses tanpa login, untuk ditampilkan di peta)
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM odc ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/odc/:id
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM odc WHERE id = $1", [req.params.id]);
    const row = rows[0];
    if (!row) return res.status(404).json({ error: "ODC tidak ditemukan." });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

const TIPE_PEMASANGAN_VALID = ["tiang", "tanam", "dinding"];
const STATUS_VALID = ["aktif", "planning", "maintenance", "nonaktif"];

// Helper: unique violation Postgres = code '23505' (setara SQLITE_CONSTRAINT_UNIQUE)
function isUniqueViolation(err) {
  return err && err.code === "23505";
}

// POST /api/odc - tambah ODC baru (wajib login)
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const {
      nama,
      alamat,
      lat,
      lng,
      kapasitas_port,
      catatan,
      kode,
      olt_id,
      tipe_pemasangan,
      nomor_tiang,
      jumlah_slot_splitter,
      rasio_splitter,
      jumlah_core_feeder,
      status,
      foto_url,
    } = req.body;

    if (!nama || lat == null || lng == null) {
      return res.status(400).json({ error: "nama, lat, dan lng wajib diisi." });
    }
    if (tipe_pemasangan && !TIPE_PEMASANGAN_VALID.includes(tipe_pemasangan)) {
      return res
        .status(400)
        .json({
          error: `tipe_pemasangan harus salah satu dari: ${TIPE_PEMASANGAN_VALID.join(", ")}.`,
        });
    }
    if (status && !STATUS_VALID.includes(status)) {
      return res
        .status(400)
        .json({ error: `status harus salah satu dari: ${STATUS_VALID.join(", ")}.` });
    }
    if (olt_id) {
      const { rows: oltRows } = await pool.query("SELECT id FROM olt WHERE id = $1", [olt_id]);
      if (!oltRows[0]) return res.status(400).json({ error: "olt_id tidak ditemukan." });
    }

    let newId;
    try {
      const { rows } = await pool.query(
        `INSERT INTO odc (
          nama, alamat, lat, lng, kapasitas_port, catatan,
          kode, olt_id, tipe_pemasangan, nomor_tiang,
          jumlah_slot_splitter, rasio_splitter, jumlah_core_feeder,
          status, foto_url
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        RETURNING id`,
        [
          nama,
          alamat || null,
          lat,
          lng,
          kapasitas_port || 0,
          catatan || null,
          kode || null,
          olt_id || null,
          tipe_pemasangan || "tiang",
          nomor_tiang || null,
          jumlah_slot_splitter || 0,
          rasio_splitter || null,
          jumlah_core_feeder ?? null,
          status || "planning",
          foto_url || null,
        ],
      );
      newId = rows[0].id;
    } catch (err) {
      if (isUniqueViolation(err)) {
        return res.status(409).json({ error: `Kode ODC '${kode}' sudah dipakai.` });
      }
      throw err;
    }

    // Auto-fill alamat dari koordinat menggunakan data lokal (data-desa.geojson)
    if (!alamat && lat != null && lng != null) {
      const desaName = getDesaFromCoordinates(parseFloat(lat), parseFloat(lng));
      if (desaName) {
        await pool.query("UPDATE odc SET alamat = $1 WHERE id = $2", [desaName, newId]);
        console.log(`[geocodeLocal] Alamat ODC #${newId}: ${desaName}`);
      }
    }

    res.status(201).json({ id: newId });
  } catch (err) {
    next(err);
  }
});

// Helper: bedakan field yang memang tidak dikirim (biarkan nilai lama)
// dari field yang sengaja dikirim null (harus benar-benar dikosongkan).
function pick(body, key, existing) {
  return Object.prototype.hasOwnProperty.call(body, key) ? body[key] : existing[key];
}

// PUT /api/odc/:id - update ODC (wajib login)
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const { rows: existingRows } = await pool.query("SELECT * FROM odc WHERE id = $1", [
      req.params.id,
    ]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: "ODC tidak ditemukan." });

    const tipe_pemasangan = pick(req.body, "tipe_pemasangan", existing);
    const status = pick(req.body, "status", existing);
    const olt_id = pick(req.body, "olt_id", existing);

    if (tipe_pemasangan && !TIPE_PEMASANGAN_VALID.includes(tipe_pemasangan)) {
      return res
        .status(400)
        .json({
          error: `tipe_pemasangan harus salah satu dari: ${TIPE_PEMASANGAN_VALID.join(", ")}.`,
        });
    }
    if (status && !STATUS_VALID.includes(status)) {
      return res
        .status(400)
        .json({ error: `status harus salah satu dari: ${STATUS_VALID.join(", ")}.` });
    }
    if (olt_id) {
      const { rows: oltRows } = await pool.query("SELECT id FROM olt WHERE id = $1", [olt_id]);
      if (!oltRows[0]) return res.status(400).json({ error: "olt_id tidak ditemukan." });
    }

    try {
      await pool.query(
        `UPDATE odc SET
          nama = $1, alamat = $2, lat = $3, lng = $4, kapasitas_port = $5, catatan = $6,
          kode = $7, olt_id = $8, tipe_pemasangan = $9, nomor_tiang = $10,
          jumlah_slot_splitter = $11, rasio_splitter = $12, jumlah_core_feeder = $13,
          status = $14, foto_url = $15, updated_pada = NOW()
        WHERE id = $16`,
        [
          pick(req.body, "nama", existing),
          pick(req.body, "alamat", existing),
          pick(req.body, "lat", existing),
          pick(req.body, "lng", existing),
          pick(req.body, "kapasitas_port", existing),
          pick(req.body, "catatan", existing),
          pick(req.body, "kode", existing),
          olt_id,
          tipe_pemasangan,
          pick(req.body, "nomor_tiang", existing),
          pick(req.body, "jumlah_slot_splitter", existing),
          pick(req.body, "rasio_splitter", existing),
          pick(req.body, "jumlah_core_feeder", existing),
          status,
          pick(req.body, "foto_url", existing),
          req.params.id,
        ],
      );
    } catch (err) {
      if (isUniqueViolation(err)) {
        return res
          .status(409)
          .json({ error: `Kode ODC '${pick(req.body, "kode", existing)}' sudah dipakai.` });
      }
      throw err;
    }

    res.json({ message: "ODC berhasil diperbarui." });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/odc/:id (wajib login)
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const { rows: countRows } = await pool.query(
      "SELECT COUNT(*) AS count FROM odp WHERE odc_id = $1",
      [req.params.id],
    );
    const count = parseInt(countRows[0].count, 10);
    if (count > 0) {
      return res
        .status(409)
        .json({ error: `Tidak dapat menghapus ODC ini. Ada ${count} ODP yang masih terhubung.` });
    }

    const { rowCount } = await pool.query("DELETE FROM odc WHERE id = $1", [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: "ODC tidak ditemukan." });
    res.json({ message: "ODC berhasil dihapus." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
