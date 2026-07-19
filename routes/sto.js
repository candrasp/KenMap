// routes/sto.js
// STO (Sentral Telepon Otomat) - gedung/lokasi induk yang bisa menaungi
// lebih dari satu OLT di dalamnya. Relasi: sto (1) -> olt (banyak).

const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { getDesaFromCoordinates } = require('../utils/geocodeLocal');

const router = express.Router();

const STATUS_VALID = ['aktif', 'planning', 'maintenance', 'nonaktif'];

// Helper: bedakan field yang memang tidak dikirim (biarkan nilai lama)
// dari field yang sengaja dikirim null (harus benar-benar dikosongkan).
function pick(body, key, existing) {
  return Object.prototype.hasOwnProperty.call(body, key) ? body[key] : existing[key];
}

// GET /api/sto - ambil semua STO (publik, dipakai buat tampil di peta)
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM sto ORDER BY nama ASC').all();
  res.json(rows);
});

// GET /api/sto/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM sto WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'STO tidak ditemukan.' });
  res.json(row);
});

// POST /api/sto - tambah STO baru (wajib login)
router.post('/', requireAuth, (req, res) => {
  const { kode, nama, lat, lng, alamat, status, foto_url, catatan } = req.body;

  if (!kode || !nama || lat == null || lng == null) {
    return res.status(400).json({ error: 'kode, nama, lat, dan lng wajib diisi.' });
  }
  if (status && !STATUS_VALID.includes(status)) {
    return res.status(400).json({ error: `status harus salah satu dari: ${STATUS_VALID.join(', ')}.` });
  }

  const stmt = db.prepare(`
    INSERT INTO sto (kode, nama, lat, lng, alamat, status, foto_url, catatan)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let info;
  try {
    info = stmt.run(
      kode.trim(), nama.trim(), lat, lng,
      alamat || null, status || 'aktif', foto_url || null, catatan || null
    );
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || /UNIQUE constraint/.test(err.message)) {
      return res.status(409).json({ error: `Kode STO '${kode}' sudah dipakai.` });
    }
    throw err;
  }

  const newId = info.lastInsertRowid;

  // Auto-fill alamat dari koordinat kalau belum diisi manual
  if (!alamat && lat != null && lng != null) {
    const desaName = getDesaFromCoordinates(parseFloat(lat), parseFloat(lng));
    if (desaName) {
      db.prepare('UPDATE sto SET alamat = ? WHERE id = ?').run(desaName, newId);
      console.log(`[geocodeLocal] Alamat STO #${newId}: ${desaName}`);
    }
  }

  const created = db.prepare('SELECT * FROM sto WHERE id = ?').get(newId);
  res.status(201).json(created);
});

// PUT /api/sto/:id - update STO (wajib login)
router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM sto WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'STO tidak ditemukan.' });

  const kode = pick(req.body, 'kode', existing);
  const nama = pick(req.body, 'nama', existing);
  const status = pick(req.body, 'status', existing);

  if (!kode || !nama) {
    return res.status(400).json({ error: 'kode dan nama wajib diisi.' });
  }
  if (status && !STATUS_VALID.includes(status)) {
    return res.status(400).json({ error: `status harus salah satu dari: ${STATUS_VALID.join(', ')}.` });
  }

  try {
    db.prepare(`
      UPDATE sto SET
        kode = ?, nama = ?, lat = ?, lng = ?, alamat = ?,
        status = ?, foto_url = ?, catatan = ?, updated_pada = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      kode, nama,
      pick(req.body, 'lat', existing),
      pick(req.body, 'lng', existing),
      pick(req.body, 'alamat', existing),
      status,
      pick(req.body, 'foto_url', existing),
      pick(req.body, 'catatan', existing),
      req.params.id
    );
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || /UNIQUE constraint/.test(err.message)) {
      return res.status(409).json({ error: `Kode STO '${kode}' sudah dipakai.` });
    }
    throw err;
  }

  res.json({ message: 'STO berhasil diperbarui.' });
});

// DELETE /api/sto/:id (wajib login) - blokir kalau masih ada OLT yang terhubung
router.delete('/:id', requireAuth, (req, res) => {
  const connectedOlt = db.prepare('SELECT COUNT(*) as count FROM olt WHERE sto_id = ?').get(req.params.id);
  if (connectedOlt.count > 0) {
    return res.status(409).json({ error: `Tidak dapat menghapus STO ini. Ada ${connectedOlt.count} OLT yang masih terhubung.` });
  }

  const info = db.prepare('DELETE FROM sto WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'STO tidak ditemukan.' });
  res.json({ message: 'STO berhasil dihapus.' });
});

module.exports = router;
