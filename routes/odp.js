// routes/odp.js
const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

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
  const { odc_id, nama, lat, lng, kapasitas_port, tipe_pemasangan, catatan } = req.body;
  if (!nama || lat == null || lng == null) {
    return res.status(400).json({ error: 'nama, lat, dan lng wajib diisi.' });
  }
  const stmt = db.prepare(`
    INSERT INTO odp (odc_id, nama, lat, lng, kapasitas_port, tipe_pemasangan, catatan)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    odc_id || null, nama, lat, lng,
    kapasitas_port || 8, tipe_pemasangan || 'tiang', catatan || null
  );
  res.status(201).json({ id: info.lastInsertRowid });
});

router.put('/:id', requireAuth, (req, res) => {
  const { odc_id, nama, lat, lng, kapasitas_port, tipe_pemasangan, catatan } = req.body;
  const existing = db.prepare('SELECT * FROM odp WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'ODP tidak ditemukan.' });

  db.prepare(`
    UPDATE odp SET odc_id = ?, nama = ?, lat = ?, lng = ?, kapasitas_port = ?, tipe_pemasangan = ?, catatan = ?
    WHERE id = ?
  `).run(
    odc_id ?? existing.odc_id,
    nama ?? existing.nama,
    lat ?? existing.lat,
    lng ?? existing.lng,
    kapasitas_port ?? existing.kapasitas_port,
    tipe_pemasangan ?? existing.tipe_pemasangan,
    catatan ?? existing.catatan,
    req.params.id
  );
  res.json({ message: 'ODP berhasil diperbarui.' });
});

router.delete('/:id', requireAuth, (req, res) => {
  const info = db.prepare('DELETE FROM odp WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'ODP tidak ditemukan.' });
  res.json({ message: 'ODP berhasil dihapus.' });
});

module.exports = router;
