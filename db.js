// db.js
// Inisialisasi koneksi SQLite + pembuatan tabel (kalau belum ada)
// + migrasi additive-only untuk field baru (aman untuk DB yang sudah berjalan).

const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "ftth.db"));

// WAL mode: read tetap lancar walau ada proses write berjalan.
// Penting untuk skenario 5 admin mengakses bersamaan.
db.pragma("journal_mode = WAL");

// ============================================
// 1. TABEL DASAR (tidak berubah dari versi lama)
//    CREATE TABLE IF NOT EXISTS tidak akan menyentuh
//    tabel yang sudah ada, jadi baris tetap 100% aman.
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    dibuat_pada TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_pada TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS odc (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    alamat TEXT,
    kapasitas_port INTEGER DEFAULT 0,
    catatan TEXT,
    dibuat_pada TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_pada TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS odp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    odc_id INTEGER,
    nama TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    alamat TEXT,
    kapasitas_port INTEGER DEFAULT 8,
    tipe_pemasangan TEXT DEFAULT 'tiang',
    catatan TEXT,
    dibuat_pada TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_pada TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (odc_id) REFERENCES odc(id)
  );

  CREATE TABLE IF NOT EXISTS kabel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jenis TEXT CHECK(jenis IN ('feeder','distribusi','drop')) NOT NULL,
    dari_tipe TEXT NOT NULL,
    dari_id INTEGER NOT NULL,
    ke_tipe TEXT NOT NULL,
    ke_id INTEGER NOT NULL,
    geometry TEXT NOT NULL,
    panjang_meter REAL,
    jumlah_core INTEGER,
    dibuat_pada TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_pada TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS klien (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    alamat TEXT,
    lat REAL,
    lng REAL,
    odp_id INTEGER,
    nomor_port INTEGER,
    ip TEXT,
    nomor_hp TEXT,
    onu_id TEXT,
    catatan TEXT,
    status TEXT CHECK(status IN ('aktif','nonaktif','pending')) DEFAULT 'pending',
    dibuat_pada TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_pada TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (odp_id) REFERENCES odp(id)
  );
`);

// ============================================
// 2. TABEL BARU: sto & olt
//    sto = Sentral Telepon Otomat, gedung/lokasi induk yang
//    bisa menaungi lebih dari satu OLT di dalamnya.
//    (aman - hanya dibuat kalau belum ada)
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS sto (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kode TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    alamat TEXT,
    status TEXT CHECK(status IN ('aktif','planning','maintenance','nonaktif')) DEFAULT 'aktif',
    foto_url TEXT,
    catatan TEXT,
    dibuat_pada TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_pada TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS olt (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kode TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    nama_sto TEXT,
    lat REAL,
    lng REAL,
    alamat TEXT,
    jumlah_port_pon INTEGER,
    vendor TEXT,
    catatan TEXT,
    dibuat_pada TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_pada TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// ============================================
// 2b. TABEL BARU: pengaturan
//     Key-value untuk pengaturan aplikasi yang berlaku GLOBAL
//     (sama untuk semua admin & pengunjung publik) - misal toggle
//     tampil/sembunyi layer batas desa, nama kecamatan, dll.
//     Pakai key-value (bukan 1 kolom per pengaturan) supaya nambah
//     pengaturan baru nanti cukup INSERT baris, tanpa migrasi lagi.
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS pengaturan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kunci TEXT UNIQUE NOT NULL,       -- misal: 'tampilkan_batas_desa'
    nilai TEXT NOT NULL,              -- disimpan sbg TEXT: 'true'/'false' utk boolean, atau JSON utk nilai kompleks
    tipe TEXT DEFAULT 'boolean',      -- 'boolean' | 'text' | 'number' | 'json' - biar app tau cara parse
    deskripsi TEXT,                   -- keterangan buat ditampilkan di panel admin
    updated_pada TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed nilai default - hanya insert kalau kunci belum ada,
// supaya tidak menimpa perubahan yang sudah dibuat admin sebelumnya.
const seedPengaturan = db.prepare(`
  INSERT OR IGNORE INTO pengaturan (kunci, nilai, tipe, deskripsi) VALUES (?, ?, 'boolean', ?)
`);
const defaultPengaturan = [
  ["tampilkan_batas_kota", "true", "Tampilkan garis batas kota/kabupaten"],
  ["tampilkan_batas_kecamatan", "true", "Tampilkan garis batas kecamatan"],
  ["tampilkan_batas_desa", "true", "Tampilkan garis batas desa"],
  ["tampilkan_nama_kecamatan", "true", "Tampilkan label nama kecamatan"],
  ["tampilkan_nama_desa", "true", "Tampilkan label nama desa"],
  ["tampilkan_odc", "true", "Tampilkan marker ODC"],
  ["tampilkan_odp", "true", "Tampilkan marker ODP"],
  ["tampilkan_kabel", "true", "Tampilkan jalur kabel"],
  [
    "tampilkan_klien",
    "false",
    "Tampilkan marker pelanggan (biasanya hanya utk admin, default off utk publik)",
  ],
];
for (const [kunci, nilai, deskripsi] of defaultPengaturan) {
  seedPengaturan.run(kunci, nilai, deskripsi);
}

// ============================================
// 3. MIGRASI ADDITIVE: tambah kolom baru ke tabel lama
//    tanpa mengubah/menghapus data yang sudah ada.
// ============================================

/** Cek apakah kolom sudah ada di tabel tertentu */
function columnExists(table, column) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  return cols.some((c) => c.name === column);
}

/**
 * Tambahkan kolom kalau belum ada.
 * definitionSql = bagian setelah nama kolom, misal: "TEXT DEFAULT 'planning'"
 * (Tidak boleh mengandung UNIQUE atau constraint kompleks lain -
 *  SQLite tidak mengizinkan itu lewat ALTER TABLE ADD COLUMN)
 */
function addColumnIfNotExists(table, column, definitionSql) {
  if (!columnExists(table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definitionSql}`);
    console.log(`[migrasi] Kolom '${column}' ditambahkan ke tabel '${table}'`);
  }
}

// --- olt: field baru ---
// sto_id = relasi ke gedung/lokasi STO induknya (satu STO bisa menaungi
// beberapa OLT). Kolom lama 'nama_sto' (teks bebas) dibiarkan apa adanya
// untuk data lama yang belum di-assign ke sto_id, tidak dihapus.
addColumnIfNotExists("olt", "sto_id", "INTEGER REFERENCES sto(id)");

// --- odc: field baru ---
addColumnIfNotExists("odc", "kode", "TEXT");
addColumnIfNotExists("odc", "olt_id", "INTEGER REFERENCES olt(id)");
addColumnIfNotExists("odc", "tipe_pemasangan", "TEXT DEFAULT 'tiang'");
addColumnIfNotExists("odc", "nomor_tiang", "TEXT");
addColumnIfNotExists("odc", "jumlah_slot_splitter", "INTEGER DEFAULT 0");
addColumnIfNotExists("odc", "rasio_splitter", "TEXT");
addColumnIfNotExists("odc", "jumlah_core_feeder", "INTEGER");
addColumnIfNotExists("odc", "status", "TEXT DEFAULT 'planning'"); // validasi nilai di level aplikasi
addColumnIfNotExists("odc", "foto_url", "TEXT");

// --- odp: field baru ---
addColumnIfNotExists("odp", "kode", "TEXT");
addColumnIfNotExists("odp", "rasio_splitter", "TEXT DEFAULT '1:8'");
addColumnIfNotExists("odp", "status", "TEXT DEFAULT 'planning'"); // validasi nilai di level aplikasi
addColumnIfNotExists("odp", "foto_url", "TEXT");

// --- kabel: field baru ---
addColumnIfNotExists("kabel", "redaman_db", "REAL");
addColumnIfNotExists("kabel", "status", "TEXT DEFAULT 'aktif'"); // validasi nilai di level aplikasi

// --- klien: field baru ---
addColumnIfNotExists("klien", "redaman_db", "REAL");

// ============================================
// 4. INDEX (aman - IF NOT EXISTS, tidak mengubah data)
// ============================================
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_odc_latlng ON odc(lat, lng);
  CREATE INDEX IF NOT EXISTS idx_odp_latlng ON odp(lat, lng);
  CREATE INDEX IF NOT EXISTS idx_klien_latlng ON klien(lat, lng);
  CREATE INDEX IF NOT EXISTS idx_odp_odc_id ON odp(odc_id);
  CREATE INDEX IF NOT EXISTS idx_klien_odp_id ON klien(odp_id);
  CREATE INDEX IF NOT EXISTS idx_odc_olt_id ON odc(olt_id);
  CREATE INDEX IF NOT EXISTS idx_olt_sto_id ON olt(sto_id);
  CREATE INDEX IF NOT EXISTS idx_sto_latlng ON sto(lat, lng);
  CREATE INDEX IF NOT EXISTS idx_kabel_dari ON kabel(dari_tipe, dari_id);
  CREATE INDEX IF NOT EXISTS idx_kabel_ke ON kabel(ke_tipe, ke_id);

  -- kode ODC/ODP unik, tapi partial index -> baris lama yang kode-nya
  -- masih NULL tidak akan dianggap bentrok satu sama lain.
  CREATE UNIQUE INDEX IF NOT EXISTS idx_odc_kode_unique
    ON odc(kode) WHERE kode IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_odp_kode_unique
    ON odp(kode) WHERE kode IS NOT NULL;
`);

module.exports = db;
