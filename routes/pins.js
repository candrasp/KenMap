// routes/pins.js
// Unified endpoint POST /api/pins
// Menerima pin dari modal "Tambahkan Pin" di frontend dan
// menyimpan ke tabel yang tepat berdasarkan field `type`.
//
// type → tabel target:
//   sto          → sto
//   odc          → odc   (opsional body.tipe_pemasangan: 'tiang'|'tanam'|'dinding', default 'tiang')
//   odp          → odp   (opsional body.tipe_pemasangan: 'tiang'|'tanam', default 'tiang')
//   odp-tanam    → odp (tipe_pemasangan = 'tanam')  -- bentuk lama, tetap didukung
//   odp-tiang    → odp (tipe_pemasangan = 'tiang')  -- bentuk lama, tetap didukung
//   klien-aktif  → klien (status = 'aktif')
//   klien-nonaktif → klien (status = 'nonaktif')
//   klien-pending  → klien (status = 'pending')

const express = require("express");
const db = require("../db");
const requireAuth = require("../middleware/requireAuth");
const { getDesaFromCoordinates } = require("../utils/geocodeLocal");

const router = express.Router();

const TIPE_PEMASANGAN_ODC_VALID = ["tiang", "tanam", "dinding"];
const TIPE_PEMASANGAN_ODP_VALID = ["tiang", "tanam"];

// Generate kode STO otomatis dari nama, misal "STO Ponorogo Kota" -> "STO-PONOROGOKOTA".
// Kalau bentrok (sudah dipakai), tambahkan angka urut di belakang sampai unik.
function generateUniqueStoKode(nama) {
  const slug =
    (nama || "STO")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "")
      .slice(0, 20) || "STO";
  let kode = `STO-${slug}`;
  let suffix = 1;
  const exists = db.prepare("SELECT id FROM sto WHERE kode = ?");
  while (exists.get(kode)) {
    suffix += 1;
    kode = `STO-${slug}-${suffix}`;
  }
  return kode;
}

// POST /api/pins — wajib login
router.post("/", requireAuth, (req, res) => {
  const { type, name, keterangan, lat, lng } = req.body;

  // Validasi minimal
  if (!type || !name || lat == null || lng == null) {
    return res.status(400).json({ error: "type, name, lat, dan lng wajib diisi." });
  }
  if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
    return res.status(400).json({ error: "lat dan lng harus berupa angka valid." });
  }

  try {
    let insertedId;

    if (type === "sto") {
      // Tabel sto mewajibkan kode unik, sedangkan modal "Tambah Pin" cuma
      // mengirim nama - jadi kode di-generate otomatis dari nama.
      const kode = generateUniqueStoKode(name);
      const info = db
        .prepare(
          `
        INSERT INTO sto (kode, nama, alamat, lat, lng, catatan)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        )
        .run(kode, name, null, parseFloat(lat), parseFloat(lng), keterangan || null);
      insertedId = info.lastInsertRowid;

      const desaName = getDesaFromCoordinates(parseFloat(lat), parseFloat(lng));
      if (desaName) {
        db.prepare("UPDATE sto SET alamat = ? WHERE id = ?").run(desaName, insertedId);
        console.log(`[geocodeLocal] Alamat STO #${insertedId}: ${desaName}`);
      }
    } else if (type === "odc") {
      const tipePemasangan = req.body.tipe_pemasangan || "tiang";
      if (!TIPE_PEMASANGAN_ODC_VALID.includes(tipePemasangan)) {
        return res
          .status(400)
          .json({
            error: `tipe_pemasangan ODC harus salah satu dari: ${TIPE_PEMASANGAN_ODC_VALID.join(", ")}.`,
          });
      }
      const info = db
        .prepare(
          `
        INSERT INTO odc (nama, alamat, lat, lng, kapasitas_port, tipe_pemasangan, catatan)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .run(name, null, parseFloat(lat), parseFloat(lng), 0, tipePemasangan, keterangan || null);
      insertedId = info.lastInsertRowid;

      // Auto-fill alamat dari koordinat menggunakan data lokal (data-desa.geojson)
      const desaName = getDesaFromCoordinates(parseFloat(lat), parseFloat(lng));
      if (desaName) {
        db.prepare("UPDATE odc SET alamat = ? WHERE id = ?").run(desaName, insertedId);
        console.log(`[geocodeLocal] Alamat ODC #${insertedId}: ${desaName}`);
      }
    } else if (type === "odp" || type === "odp-tanam" || type === "odp-tiang") {
      // 'odp-tanam'/'odp-tiang' dipertahankan untuk kompatibilitas pemanggil lama;
      // bentuk baru cukup type: 'odp' + body.tipe_pemasangan.
      let tipePemasangan;
      if (type === "odp-tanam") tipePemasangan = "tanam";
      else if (type === "odp-tiang") tipePemasangan = "tiang";
      else {
        tipePemasangan = req.body.tipe_pemasangan || "tiang";
        if (!TIPE_PEMASANGAN_ODP_VALID.includes(tipePemasangan)) {
          return res
            .status(400)
            .json({
              error: `tipe_pemasangan ODP harus salah satu dari: ${TIPE_PEMASANGAN_ODP_VALID.join(", ")}.`,
            });
        }
      }
      const info = db
        .prepare(
          `
        INSERT INTO odp (nama, alamat, lat, lng, kapasitas_port, tipe_pemasangan, catatan)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .run(name, null, parseFloat(lat), parseFloat(lng), 8, tipePemasangan, keterangan || null);
      insertedId = info.lastInsertRowid;

      // Auto-fill alamat dari koordinat menggunakan data lokal (data-desa.geojson)
      const desaName = getDesaFromCoordinates(parseFloat(lat), parseFloat(lng));
      if (desaName) {
        db.prepare("UPDATE odp SET alamat = ? WHERE id = ?").run(desaName, insertedId);
        console.log(`[geocodeLocal] Alamat ODP #${insertedId}: ${desaName}`);
      }
    } else if (type === "klien-aktif" || type === "klien-nonaktif" || type === "klien-pending") {
      const statusMap = {
        "klien-aktif": "aktif",
        "klien-nonaktif": "nonaktif",
        "klien-pending": "pending",
      };
      const status = statusMap[type];
      const computedAlamat = getDesaFromCoordinates(parseFloat(lat), parseFloat(lng));
      const info = db
        .prepare(
          `
        INSERT INTO klien (nama, alamat, lat, lng, status, catatan)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        )
        .run(
          name,
          computedAlamat || null,
          parseFloat(lat),
          parseFloat(lng),
          status,
          keterangan || null,
        );
      insertedId = info.lastInsertRowid;
    } else {
      return res.status(400).json({ error: `Tipe pin tidak dikenal: ${type}` });
    }

    return res.status(201).json({ id: insertedId, type, name });
  } catch (err) {
    console.error("[/api/pins] Error:", err.message);
    return res.status(500).json({ error: "Gagal menyimpan pin ke database." });
  }
});

// GET /api/pins — kembalikan semua pin dari semua tabel (tanpa login)
// Berguna untuk menampilkan marker di peta nanti.
router.get("/", (req, res) => {
  const stoRows = db
    .prepare("SELECT id, nama, alamat, lat, lng, status, catatan, dibuat_pada FROM sto")
    .all()
    .map((r) => ({ ...r, type: "sto" }));

  const odcRows = db
    .prepare("SELECT id, nama, alamat, lat, lng, catatan, dibuat_pada FROM odc")
    .all()
    .map((r) => ({ ...r, type: "odc" }));

  const odpRows = db
    .prepare("SELECT id, nama, alamat, lat, lng, tipe_pemasangan, catatan, dibuat_pada FROM odp")
    .all()
    .map((r) => ({ ...r, type: r.tipe_pemasangan === "tanam" ? "odp-tanam" : "odp-tiang" }));

  const klienRows = db
    .prepare(
      "SELECT id, nama, alamat, lat, lng, status, dibuat_pada FROM klien WHERE lat IS NOT NULL AND lng IS NOT NULL",
    )
    .all()
    .map((r) => ({ ...r, type: `klien-${r.status}` }));

  res.json([...stoRows, ...odcRows, ...odpRows, ...klienRows]);
});

module.exports = router;
