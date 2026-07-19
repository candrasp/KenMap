// routes/pengaturan.js
// Endpoint untuk pengaturan global aplikasi (layer visibility, dll).
// GET  -> bisa diakses publik (tanpa login), dipakai untuk render peta.
// PUT  -> WAJIB login admin, karena mengubah tampilan yang dilihat semua orang.
//
// Sesuaikan `requireAdmin` dengan middleware auth yang sudah kamu pakai
// di route lain (misal middleware JWT/session yang mengecek authStore/token).

const express = require("express");
const router = express.Router();
const db = require("../db");

// --- Ganti/hubungkan dengan middleware auth yang sudah ada di project kamu ---
function requireAdmin(req, res, next) {
  // Contoh placeholder - sesuaikan dengan cara autentikasi yang sudah kamu pakai
  if (!req.session || !req.session.adminId) {
    return res.status(401).json({ error: "Unauthorized. Silakan login sebagai admin." });
  }
  next();
}

// Kunci yang boleh diubah + validasi tipe nilainya (whitelist - jaga-jaga
// supaya endpoint tidak bisa dipakai untuk insert kunci sembarangan)
const BOOLEAN_KEYS = new Set([
  "tampilkan_batas_kota",
  "tampilkan_batas_kecamatan",
  "tampilkan_batas_desa",
  "tampilkan_nama_kecamatan",
  "tampilkan_nama_desa",
  "tampilkan_odc",
  "tampilkan_odp",
  "tampilkan_kabel",
  "tampilkan_klien",
]);

function parseNilai(row) {
  if (row.tipe === "boolean") return row.nilai === "true";
  if (row.tipe === "number") return Number(row.nilai);
  if (row.tipe === "json") {
    try { return JSON.parse(row.nilai); } catch { return null; }
  }
  return row.nilai; // 'text'
}

// GET /api/pengaturan - publik, dipakai frontend untuk tahu layer apa yang harus ditampilkan
router.get("/", (req, res) => {
  const rows = db.prepare("SELECT kunci, nilai, tipe FROM pengaturan").all();
  const hasil = {};
  for (const row of rows) hasil[row.kunci] = parseNilai(row);
  res.json(hasil);
});

// PUT /api/pengaturan/:kunci - khusus admin, body: { nilai: true/false }
router.put("/:kunci", requireAdmin, (req, res) => {
  const { kunci } = req.params;
  const { nilai } = req.body;

  if (!BOOLEAN_KEYS.has(kunci)) {
    return res.status(400).json({ error: `Kunci pengaturan '${kunci}' tidak dikenal.` });
  }
  if (typeof nilai !== "boolean") {
    return res.status(400).json({ error: "Nilai harus boolean (true/false)." });
  }

  const result = db
    .prepare("UPDATE pengaturan SET nilai = ?, updated_pada = CURRENT_TIMESTAMP WHERE kunci = ?")
    .run(nilai ? "true" : "false", kunci);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Kunci pengaturan tidak ditemukan." });
  }
  res.json({ kunci, nilai });
});

module.exports = router;
