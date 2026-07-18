// db.js
// Inisialisasi koneksi SQLite + pembuatan tabel (kalau belum ada).

const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'ftth.db'));

// WAL mode: read tetap lancar walau ada proses write berjalan.
// Penting untuk skenario 5 admin mengakses bersamaan.
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    dibuat_pada TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS odc (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    kapasitas_port INTEGER DEFAULT 0,
    catatan TEXT,
    dibuat_pada TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS odp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    odc_id INTEGER,
    nama TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    kapasitas_port INTEGER DEFAULT 8,
    tipe_pemasangan TEXT DEFAULT 'tiang',
    catatan TEXT,
    dibuat_pada TEXT DEFAULT CURRENT_TIMESTAMP,
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
    dibuat_pada TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS klien (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    alamat TEXT,
    lat REAL,
    lng REAL,
    odp_id INTEGER,
    nomor_port INTEGER,
    status TEXT CHECK(status IN ('aktif','nonaktif','pending')) DEFAULT 'pending',
    dibuat_pada TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (odp_id) REFERENCES odp(id)
  );
`);

module.exports = db;
