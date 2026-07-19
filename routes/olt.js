// routes/olt.js
const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// Helper: bedakan field yang memang tidak dikirim (biarkan nilai lama)
// dari field yang sengaja dikirim null (harus benar-benar dikosongkan).
function pick(body, key, existing) {
  return Object.prototype.hasOwnProperty.call(body, key) ? body[key] : existing[key];
}

// GET /api/olt - ambil semua OLT (publik - dipakai buat isi dropdown di form ODC)
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM olt ORDER BY nama ASC').all();
  res.json(rows);
});

// GET /api/olt/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM olt WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'OLT tidak ditemukan.' });
  res.json(row);
});

// POST /api/olt - tambah OLT baru (wajib login)
// Dipakai juga oleh fitur "quick-add" di form ODC, jadi cuma kode+nama yang wajib.
router.post('/', requireAuth, (req, res) => {
  const { kode, nama, nama_sto, sto_id, lat, lng, alamat, jumlah_port_pon, vendor, catatan } = req.body;

  if (!kode || !nama) {
    return res.status(400).json({ error: 'kode dan nama wajib diisi.' });
  }
  if (sto_id) {
    const stoExists = db.prepare('SELECT id FROM sto WHERE id = ?').get(sto_id);
    if (!stoExists) return res.status(400).json({ error: 'sto_id tidak ditemukan.' });
  }

  const stmt = db.prepare(`
    INSERT INTO olt (kode, nama, nama_sto, sto_id, lat, lng, alamat, jumlah_port_pon, vendor, catatan)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let info;
  try {
    info = stmt.run(
      kode.trim(), nama.trim(), nama_sto || null, sto_id || null,
      lat ?? null, lng ?? null, alamat || null,
      jumlah_port_pon ?? null, vendor || null, catatan || null
    );
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || /UNIQUE constraint/.test(err.message)) {
      return res.status(409).json({ error: `Kode OLT '${kode}' sudah dipakai.` });
    }
    throw err;
  }

  const newId = info.lastInsertRowid;
  const created = db.prepare('SELECT * FROM olt WHERE id = ?').get(newId);
  res.status(201).json(created);
});

// PUT /api/olt/:id - update OLT (wajib login)
router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM olt WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'OLT tidak ditemukan.' });

  const kode = pick(req.body, 'kode', existing);
  const nama = pick(req.body, 'nama', existing);
  const sto_id = pick(req.body, 'sto_id', existing);
  if (!kode || !nama) {
    return res.status(400).json({ error: 'kode dan nama wajib diisi.' });
  }
  if (sto_id) {
    const stoExists = db.prepare('SELECT id FROM sto WHERE id = ?').get(sto_id);
    if (!stoExists) return res.status(400).json({ error: 'sto_id tidak ditemukan.' });
  }

  try {
    db.prepare(`
      UPDATE olt SET
        kode = ?, nama = ?, nama_sto = ?, sto_id = ?, lat = ?, lng = ?,
        alamat = ?, jumlah_port_pon = ?, vendor = ?, catatan = ?,
        updated_pada = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      kode, nama,
      pick(req.body, 'nama_sto', existing),
      sto_id,
      pick(req.body, 'lat', existing),
      pick(req.body, 'lng', existing),
      pick(req.body, 'alamat', existing),
      pick(req.body, 'jumlah_port_pon', existing),
      pick(req.body, 'vendor', existing),
      pick(req.body, 'catatan', existing),
      req.params.id
    );
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || /UNIQUE constraint/.test(err.message)) {
      return res.status(409).json({ error: `Kode OLT '${kode}' sudah dipakai.` });
    }
    throw err;
  }

  res.json({ message: 'OLT berhasil diperbarui.' });
});

// DELETE /api/olt/:id (wajib login) - blokir kalau masih ada ODC yang terhubung
router.delete('/:id', requireAuth, (req, res) => {
  const connectedOdc = db.prepare('SELECT COUNT(*) as count FROM odc WHERE olt_id = ?').get(req.params.id);
  if (connectedOdc.count > 0) {
    return res.status(409).json({ error: `Tidak dapat menghapus OLT ini. Ada ${connectedOdc.count} ODC yang masih terhubung.` });
  }

  const info = db.prepare('DELETE FROM olt WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'OLT tidak ditemukan.' });
  res.json({ message: 'OLT berhasil dihapus.' });
});

module.exports = router;
