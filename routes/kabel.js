// routes/kabel.js
const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// GET /api/kabel - ambil semua kabel, geometry langsung di-parse jadi object
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM kabel ORDER BY id DESC').all();
  const hasil = rows.map(row => ({ ...row, geometry: JSON.parse(row.geometry) }));
  res.json(hasil);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM kabel WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Kabel tidak ditemukan.' });
  res.json({ ...row, geometry: JSON.parse(row.geometry) });
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
router.post('/', requireAuth, (req, res) => {
  const { jenis, dari_tipe, dari_id, ke_tipe, ke_id, koordinat, panjang_meter, jumlah_core } = req.body;

  if (!jenis || !dari_tipe || !dari_id || !ke_tipe || !ke_id || !koordinat) {
    return res.status(400).json({ error: 'jenis, dari_tipe, dari_id, ke_tipe, ke_id, dan koordinat wajib diisi.' });
  }

  const geometry = JSON.stringify({ type: 'LineString', coordinates: koordinat });

  const stmt = db.prepare(`
    INSERT INTO kabel (jenis, dari_tipe, dari_id, ke_tipe, ke_id, geometry, panjang_meter, jumlah_core)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(jenis, dari_tipe, dari_id, ke_tipe, ke_id, geometry, panjang_meter || null, jumlah_core || null);
  res.status(201).json({ id: info.lastInsertRowid });
});

router.delete('/:id', requireAuth, (req, res) => {
  const info = db.prepare('DELETE FROM kabel WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Kabel tidak ditemukan.' });
  res.json({ message: 'Kabel berhasil dihapus.' });
});

module.exports = router;
