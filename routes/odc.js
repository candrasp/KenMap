// routes/odc.js
const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// GET /api/odc - ambil semua ODC (boleh diakses tanpa login, untuk ditampilkan di peta)
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM odc ORDER BY id DESC').all();
  res.json(rows);
});

// GET /api/odc/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM odc WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'ODC tidak ditemukan.' });
  res.json(row);
});

// POST /api/odc - tambah ODC baru (wajib login)
router.post('/', requireAuth, (req, res) => {
  const { nama, lat, lng, kapasitas_port, catatan } = req.body;
  if (!nama || lat == null || lng == null) {
    return res.status(400).json({ error: 'nama, lat, dan lng wajib diisi.' });
  }
  const stmt = db.prepare(`
    INSERT INTO odc (nama, lat, lng, kapasitas_port, catatan)
    VALUES (?, ?, ?, ?, ?)
  `);
  const info = stmt.run(nama, lat, lng, kapasitas_port || 0, catatan || null);
  res.status(201).json({ id: info.lastInsertRowid });
});

// PUT /api/odc/:id - update ODC (wajib login)
router.put('/:id', requireAuth, (req, res) => {
  const { nama, lat, lng, kapasitas_port, catatan } = req.body;
  const existing = db.prepare('SELECT * FROM odc WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'ODC tidak ditemukan.' });

  db.prepare(`
    UPDATE odc SET nama = ?, lat = ?, lng = ?, kapasitas_port = ?, catatan = ?
    WHERE id = ?
  `).run(
    nama ?? existing.nama,
    lat ?? existing.lat,
    lng ?? existing.lng,
    kapasitas_port ?? existing.kapasitas_port,
    catatan ?? existing.catatan,
    req.params.id
  );
  res.json({ message: 'ODC berhasil diperbarui.' });
});

// DELETE /api/odc/:id (wajib login)
router.delete('/:id', requireAuth, (req, res) => {
  const info = db.prepare('DELETE FROM odc WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'ODC tidak ditemukan.' });
  res.json({ message: 'ODC berhasil dihapus.' });
});

module.exports = router;
