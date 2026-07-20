// routes/klien.js
const express = require("express");
const { pool } = require("../db");
const requireAuth = require("../middleware/requireAuth");
const { getDesaFromCoordinates } = require("../utils/geocodeLocal");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT klien.*, odp.nama AS nama_odp
      FROM klien
      LEFT JOIN odp ON klien.odp_id = odp.id
      ORDER BY klien.id DESC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM klien WHERE id = $1", [req.params.id]);
    const row = rows[0];
    if (!row) return res.status(404).json({ error: "Klien tidak ditemukan." });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { nama, alamat, lat, lng, odp_id, nomor_port, status, ip, nomor_hp, onu_id, catatan } =
      req.body;
    if (!nama) return res.status(400).json({ error: "nama wajib diisi." });

    // Validasi: pastikan port di ODP itu belum dipakai klien lain
    if (odp_id && nomor_port) {
      const { rows: bentrokRows } = await pool.query(
        "SELECT id FROM klien WHERE odp_id = $1 AND nomor_port = $2",
        [odp_id, nomor_port],
      );
      if (bentrokRows[0]) {
        return res
          .status(409)
          .json({ error: `Port ${nomor_port} di ODP ini sudah dipakai klien lain.` });
      }
    }

    // Insert klien dahulu dengan alamat yang sudah ada (bisa null)
    const { rows } = await pool.query(
      `INSERT INTO klien (nama, alamat, lat, lng, odp_id, nomor_port, status, ip, nomor_hp, onu_id, catatan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [
        nama,
        alamat || null,
        lat || null,
        lng || null,
        odp_id || null,
        nomor_port || null,
        status || "pending",
        ip || null,
        nomor_hp || null,
        onu_id || null,
        catatan || null,
      ],
    );
    const newId = rows[0].id;

    // Auto-fill alamat dari koordinat menggunakan data lokal (data-desa.geojson)
    if (!alamat && lat != null && lng != null) {
      const desaName = getDesaFromCoordinates(parseFloat(lat), parseFloat(lng));
      if (desaName) {
        await pool.query("UPDATE klien SET alamat = $1 WHERE id = $2", [desaName, newId]);
        console.log(`[geocodeLocal] Alamat klien #${newId}: ${desaName}`);
      }
    }

    res.status(201).json({ id: newId });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const { nama, alamat, lat, lng, odp_id, nomor_port, status, ip, nomor_hp, onu_id, catatan } =
      req.body;
    const { rows: existingRows } = await pool.query("SELECT * FROM klien WHERE id = $1", [
      req.params.id,
    ]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: "Klien tidak ditemukan." });

    const targetOdp = odp_id ?? existing.odp_id;
    const targetPort = nomor_port ?? existing.nomor_port;
    if (targetOdp && targetPort) {
      const { rows: bentrokRows } = await pool.query(
        "SELECT id FROM klien WHERE odp_id = $1 AND nomor_port = $2 AND id != $3",
        [targetOdp, targetPort, req.params.id],
      );
      if (bentrokRows[0]) {
        return res
          .status(409)
          .json({ error: `Port ${targetPort} di ODP ini sudah dipakai klien lain.` });
      }
    }

    await pool.query(
      `UPDATE klien SET nama = $1, alamat = $2, lat = $3, lng = $4, odp_id = $5, nomor_port = $6, status = $7, ip = $8, nomor_hp = $9, onu_id = $10, catatan = $11, updated_pada = NOW()
       WHERE id = $12`,
      [
        nama ?? existing.nama,
        alamat ?? existing.alamat,
        lat ?? existing.lat,
        lng ?? existing.lng,
        targetOdp,
        targetPort,
        status ?? existing.status,
        ip ?? existing.ip,
        nomor_hp ?? existing.nomor_hp,
        onu_id ?? existing.onu_id,
        catatan ?? existing.catatan,
        req.params.id,
      ],
    );
    res.json({ message: "Klien berhasil diperbarui." });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const { rowCount } = await pool.query("DELETE FROM klien WHERE id = $1", [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: "Klien tidak ditemukan." });
    res.json({ message: "Klien berhasil dihapus." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
