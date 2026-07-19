// routes/odp.js
const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { getDesaFromCoordinates } = require('../utils/geocodeLocal');

const router = express.Router();

const STATUS_VALID = ['aktif', 'planning', 'maintenance', 'nonaktif'];


// GET /api/odp - ambil semua ODP, sertakan info slot port terpakai
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT odp.*,
      (SELECT COUNT(*) FROM klien WHERE klien.odp_id = odp.id) AS port_terpakai
    FROM odp
    ORDER BY odp.id DESC
  `).all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM odp WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'ODP tidak ditemukan.' });
  res.json(row);
});

router.post('/', requireAuth, (req, res) => {
  const { odc_id, nama, alamat, lat, lng, kapasitas_port, tipe_pemasangan, status, catatan } = req.body;
  if (!nama || lat == null || lng == null) {
    return res.status(400).json({ error: 'nama, lat, dan lng wajib diisi.' });
  }
  if (status && !STATUS_VALID.includes(status)) {
    return res.status(400).json({ error: `status harus salah satu dari: ${STATUS_VALID.join(', ')}.` });
  }
  const stmt = db.prepare(`
    INSERT INTO odp (odc_id, nama, alamat, lat, lng, kapasitas_port, tipe_pemasangan, status, catatan)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    odc_id || null, nama, alamat || null, lat, lng,
    kapasitas_port || 8, tipe_pemasangan || 'tiang', status || 'aktif', catatan || null
  );
  const newId = info.lastInsertRowid;

  // Auto-fill alamat dari koordinat menggunakan data lokal (data-desa.geojson)
  if (!alamat && lat != null && lng != null) {
    const desaName = getDesaFromCoordinates(parseFloat(lat), parseFloat(lng));
    if (desaName) {
      db.prepare('UPDATE odp SET alamat = ? WHERE id = ?').run(desaName, newId);
      console.log(`[geocodeLocal] Alamat ODP #${newId}: ${desaName}`);
    }
  }

  res.status(201).json({ id: newId });
});

router.put('/:id', requireAuth, (req, res) => {
  const { odc_id, nama, alamat, lat, lng, kapasitas_port, tipe_pemasangan, status, catatan } = req.body;
  const existing = db.prepare('SELECT * FROM odp WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'ODP tidak ditemukan.' });

  if (status && !STATUS_VALID.includes(status)) {
    return res.status(400).json({ error: `status harus salah satu dari: ${STATUS_VALID.join(', ')}.` });
  }

  db.prepare(`
    UPDATE odp SET odc_id = ?, nama = ?, alamat = ?, lat = ?, lng = ?, kapasitas_port = ?, tipe_pemasangan = ?, status = ?, catatan = ?, updated_pada = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    odc_id ?? existing.odc_id,
    nama ?? existing.nama,
    alamat ?? existing.alamat,
    lat ?? existing.lat,
    lng ?? existing.lng,
    kapasitas_port ?? existing.kapasitas_port,
    tipe_pemasangan ?? existing.tipe_pemasangan,
    status ?? existing.status,
    catatan ?? existing.catatan,
    req.params.id
  );
  res.json({ message: 'ODP berhasil diperbarui.' });
});

router.delete('/:id', requireAuth, (req, res) => {
  // Check if there are klien connected to this ODP
  const connectedKlien = db.prepare('SELECT COUNT(*) as count FROM klien WHERE odp_id = ?').get(req.params.id);
  if (connectedKlien.count > 0) {
    return res.status(409).json({ error: `Tidak dapat menghapus ODP ini. Ada ${connectedKlien.count} klien yang masih terhubung.` });
  }

  const info = db.prepare('DELETE FROM odp WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'ODP tidak ditemukan.' });
  res.json({ message: 'ODP berhasil dihapus.' });
});

module.exports = router;
