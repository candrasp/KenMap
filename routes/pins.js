// routes/pins.js
// Unified endpoint POST /api/pins
// Menerima pin dari modal "Tambahkan Pin" di frontend dan
// menyimpan ke tabel yang tepat berdasarkan field `type`.
//
// type → tabel target:
//   odc          → odc
//   odp-tanam    → odp (tipe_pemasangan = 'tanam')
//   odp-tiang    → odp (tipe_pemasangan = 'tiang')
//   klien-aktif  → klien (status = 'aktif')
//   klien-nonaktif → klien (status = 'nonaktif')
//   klien-pending  → klien (status = 'pending')

const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// POST /api/pins — wajib login
router.post('/', requireAuth, (req, res) => {
  const { type, name, keterangan, lat, lng } = req.body;

  // Validasi minimal
  if (!type || !name || lat == null || lng == null) {
    return res.status(400).json({ error: 'type, name, lat, dan lng wajib diisi.' });
  }
  if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
    return res.status(400).json({ error: 'lat dan lng harus berupa angka valid.' });
  }

  try {
    let insertedId;

    if (type === 'odc') {
      const info = db.prepare(`
        INSERT INTO odc (nama, lat, lng, kapasitas_port, catatan)
        VALUES (?, ?, ?, ?, ?)
      `).run(name, parseFloat(lat), parseFloat(lng), 0, keterangan || null);
      insertedId = info.lastInsertRowid;

    } else if (type === 'odp-tanam' || type === 'odp-tiang') {
      const tipePemasangan = type === 'odp-tanam' ? 'tanam' : 'tiang';
      const info = db.prepare(`
        INSERT INTO odp (nama, lat, lng, kapasitas_port, tipe_pemasangan, catatan)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(name, parseFloat(lat), parseFloat(lng), 8, tipePemasangan, keterangan || null);
      insertedId = info.lastInsertRowid;

    } else if (type === 'klien-aktif' || type === 'klien-nonaktif' || type === 'klien-pending') {
      const statusMap = {
        'klien-aktif': 'aktif',
        'klien-nonaktif': 'nonaktif',
        'klien-pending': 'pending',
      };
      const status = statusMap[type];
      const info = db.prepare(`
        INSERT INTO klien (nama, alamat, lat, lng, status)
        VALUES (?, ?, ?, ?, ?)
      `).run(name, keterangan || null, parseFloat(lat), parseFloat(lng), status);
      insertedId = info.lastInsertRowid;

    } else {
      return res.status(400).json({ error: `Tipe pin tidak dikenal: ${type}` });
    }

    return res.status(201).json({ id: insertedId, type, name });

  } catch (err) {
    console.error('[/api/pins] Error:', err.message);
    return res.status(500).json({ error: 'Gagal menyimpan pin ke database.' });
  }
});

// GET /api/pins — kembalikan semua pin dari semua tabel (tanpa login)
// Berguna untuk menampilkan marker di peta nanti.
router.get('/', (req, res) => {
  const odcRows = db.prepare('SELECT id, nama, lat, lng, catatan, dibuat_pada FROM odc').all()
    .map(r => ({ ...r, type: 'odc' }));

  const odpRows = db.prepare('SELECT id, nama, lat, lng, tipe_pemasangan, catatan, dibuat_pada FROM odp').all()
    .map(r => ({ ...r, type: r.tipe_pemasangan === 'tanam' ? 'odp-tanam' : 'odp-tiang' }));

  const klienRows = db.prepare('SELECT id, nama, alamat, lat, lng, status, dibuat_pada FROM klien WHERE lat IS NOT NULL AND lng IS NOT NULL').all()
    .map(r => ({ ...r, type: `klien-${r.status}` }));

  res.json([...odcRows, ...odpRows, ...klienRows]);
});

module.exports = router;
