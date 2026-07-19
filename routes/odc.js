// routes/odc.js
const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { getDesaFromCoordinates } = require('../utils/geocodeLocal');

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

const TIPE_PEMASANGAN_VALID = ['tiang', 'tanam', 'dinding'];
const STATUS_VALID = ['aktif', 'planning', 'maintenance', 'nonaktif'];

// POST /api/odc - tambah ODC baru (wajib login)
router.post('/', requireAuth, (req, res) => {
  const {
    nama, alamat, lat, lng, kapasitas_port, catatan,
    kode, olt_id, tipe_pemasangan, nomor_tiang,
    jumlah_slot_splitter, rasio_splitter, jumlah_core_feeder,
    status, foto_url
  } = req.body;

  if (!nama || lat == null || lng == null) {
    return res.status(400).json({ error: 'nama, lat, dan lng wajib diisi.' });
  }
  if (tipe_pemasangan && !TIPE_PEMASANGAN_VALID.includes(tipe_pemasangan)) {
    return res.status(400).json({ error: `tipe_pemasangan harus salah satu dari: ${TIPE_PEMASANGAN_VALID.join(', ')}.` });
  }
  if (status && !STATUS_VALID.includes(status)) {
    return res.status(400).json({ error: `status harus salah satu dari: ${STATUS_VALID.join(', ')}.` });
  }
  if (olt_id) {
    const oltExists = db.prepare('SELECT id FROM olt WHERE id = ?').get(olt_id);
    if (!oltExists) return res.status(400).json({ error: 'olt_id tidak ditemukan.' });
  }

  const stmt = db.prepare(`
    INSERT INTO odc (
      nama, alamat, lat, lng, kapasitas_port, catatan,
      kode, olt_id, tipe_pemasangan, nomor_tiang,
      jumlah_slot_splitter, rasio_splitter, jumlah_core_feeder,
      status, foto_url
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let info;
  try {
    info = stmt.run(
      nama, alamat || null, lat, lng, kapasitas_port || 0, catatan || null,
      kode || null, olt_id || null, tipe_pemasangan || 'tiang', nomor_tiang || null,
      jumlah_slot_splitter || 0, rasio_splitter || null, jumlah_core_feeder ?? null,
      status || 'planning', foto_url || null
    );
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || /UNIQUE constraint/.test(err.message)) {
      return res.status(409).json({ error: `Kode ODC '${kode}' sudah dipakai.` });
    }
    throw err;
  }

  const newId = info.lastInsertRowid;

  // Auto-fill alamat dari koordinat menggunakan data lokal (data-desa.geojson)
  if (!alamat && lat != null && lng != null) {
    const desaName = getDesaFromCoordinates(parseFloat(lat), parseFloat(lng));
    if (desaName) {
      db.prepare('UPDATE odc SET alamat = ? WHERE id = ?').run(desaName, newId);
      console.log(`[geocodeLocal] Alamat ODC #${newId}: ${desaName}`);
    }
  }

  res.status(201).json({ id: newId });
});

// Helper: bedakan field yang memang tidak dikirim (biarkan nilai lama)
// dari field yang sengaja dikirim null (harus benar-benar dikosongkan).
// Kalau pakai `??` biasa, field yang di-set null tidak akan pernah tersimpan
// karena null dianggap sama dengan "tidak dikirim" - itu bug.
function pick(body, key, existing) {
  return Object.prototype.hasOwnProperty.call(body, key) ? body[key] : existing[key];
}

// PUT /api/odc/:id - update ODC (wajib login)
router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM odc WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'ODC tidak ditemukan.' });

  const tipe_pemasangan = pick(req.body, 'tipe_pemasangan', existing);
  const status = pick(req.body, 'status', existing);
  const olt_id = pick(req.body, 'olt_id', existing);

  if (tipe_pemasangan && !TIPE_PEMASANGAN_VALID.includes(tipe_pemasangan)) {
    return res.status(400).json({ error: `tipe_pemasangan harus salah satu dari: ${TIPE_PEMASANGAN_VALID.join(', ')}.` });
  }
  if (status && !STATUS_VALID.includes(status)) {
    return res.status(400).json({ error: `status harus salah satu dari: ${STATUS_VALID.join(', ')}.` });
  }
  if (olt_id) {
    const oltExists = db.prepare('SELECT id FROM olt WHERE id = ?').get(olt_id);
    if (!oltExists) return res.status(400).json({ error: 'olt_id tidak ditemukan.' });
  }

  try {
    db.prepare(`
      UPDATE odc SET
        nama = ?, alamat = ?, lat = ?, lng = ?, kapasitas_port = ?, catatan = ?,
        kode = ?, olt_id = ?, tipe_pemasangan = ?, nomor_tiang = ?,
        jumlah_slot_splitter = ?, rasio_splitter = ?, jumlah_core_feeder = ?,
        status = ?, foto_url = ?, updated_pada = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      pick(req.body, 'nama', existing),
      pick(req.body, 'alamat', existing),
      pick(req.body, 'lat', existing),
      pick(req.body, 'lng', existing),
      pick(req.body, 'kapasitas_port', existing),
      pick(req.body, 'catatan', existing),
      pick(req.body, 'kode', existing),
      olt_id,
      tipe_pemasangan,
      pick(req.body, 'nomor_tiang', existing),
      pick(req.body, 'jumlah_slot_splitter', existing),
      pick(req.body, 'rasio_splitter', existing),
      pick(req.body, 'jumlah_core_feeder', existing),
      status,
      pick(req.body, 'foto_url', existing),
      req.params.id
    );
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || /UNIQUE constraint/.test(err.message)) {
      return res.status(409).json({ error: `Kode ODC '${pick(req.body, 'kode', existing)}' sudah dipakai.` });
    }
    throw err;
  }

  res.json({ message: 'ODC berhasil diperbarui.' });
});

// DELETE /api/odc/:id (wajib login)
router.delete('/:id', requireAuth, (req, res) => {
  // Check if there are ODP connected to this ODC
  const connectedOdp = db.prepare('SELECT COUNT(*) as count FROM odp WHERE odc_id = ?').get(req.params.id);
  if (connectedOdp.count > 0) {
    return res.status(409).json({ error: `Tidak dapat menghapus ODC ini. Ada ${connectedOdp.count} ODP yang masih terhubung.` });
  }

  const info = db.prepare('DELETE FROM odc WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'ODC tidak ditemukan.' });
  res.json({ message: 'ODC berhasil dihapus.' });
});

module.exports = router;
