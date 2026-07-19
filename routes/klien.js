// routes/klien.js
const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { getDesaFromCoordinates } = require('../utils/geocodeLocal');

const router = express.Router();



router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT klien.*, odp.nama AS nama_odp
    FROM klien
    LEFT JOIN odp ON klien.odp_id = odp.id
    ORDER BY klien.id DESC
  `).all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM klien WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Klien tidak ditemukan.' });
  res.json(row);
});

router.post('/', requireAuth, async (req, res) => {
  const { nama, alamat, lat, lng, odp_id, nomor_port, status, ip, nomor_hp, onu_id, catatan } = req.body;
  if (!nama) return res.status(400).json({ error: 'nama wajib diisi.' });

  // Validasi: pastikan port di ODP itu belum dipakai klien lain
  if (odp_id && nomor_port) {
    const bentrok = db.prepare(`
      SELECT id FROM klien WHERE odp_id = ? AND nomor_port = ?
    `).get(odp_id, nomor_port);
    if (bentrok) {
      return res.status(409).json({ error: `Port ${nomor_port} di ODP ini sudah dipakai klien lain.` });
    }
  }

  // Insert klien dahulu dengan alamat yang sudah ada (bisa null)
  const stmt = db.prepare(`
    INSERT INTO klien (nama, alamat, lat, lng, odp_id, nomor_port, status, ip, nomor_hp, onu_id, catatan)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    nama, alamat || null, lat || null, lng || null,
    odp_id || null, nomor_port || null, status || 'pending',
    ip || null, nomor_hp || null, onu_id || null, catatan || null
  );
  const newId = info.lastInsertRowid;

  // Auto-fill alamat dari koordinat menggunakan data lokal (data-desa.geojson)
  // Ini sinkron, instan, tanpa network — langsung masuk ke insert di atas
  if (!alamat && lat != null && lng != null) {
    const desaName = getDesaFromCoordinates(parseFloat(lat), parseFloat(lng));
    if (desaName) {
      db.prepare('UPDATE klien SET alamat = ? WHERE id = ?').run(desaName, newId);
      console.log(`[geocodeLocal] Alamat klien #${newId}: ${desaName}`);
    }
  }

  res.status(201).json({ id: newId });
});

router.put('/:id', requireAuth, (req, res) => {
  const { nama, alamat, lat, lng, odp_id, nomor_port, status, ip, nomor_hp, onu_id, catatan } = req.body;
  const existing = db.prepare('SELECT * FROM klien WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Klien tidak ditemukan.' });

  const targetOdp = odp_id ?? existing.odp_id;
  const targetPort = nomor_port ?? existing.nomor_port;
  if (targetOdp && targetPort) {
    const bentrok = db.prepare(`
      SELECT id FROM klien WHERE odp_id = ? AND nomor_port = ? AND id != ?
    `).get(targetOdp, targetPort, req.params.id);
    if (bentrok) {
      return res.status(409).json({ error: `Port ${targetPort} di ODP ini sudah dipakai klien lain.` });
    }
  }

  db.prepare(`
    UPDATE klien SET nama = ?, alamat = ?, lat = ?, lng = ?, odp_id = ?, nomor_port = ?, status = ?, ip = ?, nomor_hp = ?, onu_id = ?, catatan = ?, updated_pada = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
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
    req.params.id
  );
  res.json({ message: 'Klien berhasil diperbarui.' });
});

router.delete('/:id', requireAuth, (req, res) => {
  const info = db.prepare('DELETE FROM klien WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Klien tidak ditemukan.' });
  res.json({ message: 'Klien berhasil dihapus.' });
});

module.exports = router;
