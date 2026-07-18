-- Admin
CREATE TABLE admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  dibuat_pada TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Perangkat: ODC (titik distribusi utama)
CREATE TABLE odc (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  kapasitas_port INTEGER DEFAULT 0,
  catatan TEXT
);

-- Perangkat: ODP (titik distribusi ke pelanggan)
CREATE TABLE odp (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  odc_id INTEGER,               -- ODP ini disuplai dari ODC mana
  nama TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  kapasitas_port INTEGER DEFAULT 8,   -- biasanya 8 atau 16
  catatan TEXT,
  FOREIGN KEY (odc_id) REFERENCES odc(id)
);

-- Kabel (feeder: ODC-ODC, distribusi: ODC-ODP, drop: ODP-klien)
CREATE TABLE kabel (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jenis TEXT CHECK(jenis IN ('feeder','distribusi','drop')) NOT NULL,
  dari_tipe TEXT NOT NULL,       -- 'odc' | 'odp' | 'client'
  dari_id INTEGER NOT NULL,
  ke_tipe TEXT NOT NULL,
  ke_id INTEGER NOT NULL,
  geometry TEXT NOT NULL,        -- GeoJSON LineString (titik A-B-C-dst)
  panjang_meter REAL,
  jumlah_core INTEGER,           -- jumlah core kabel fiber
  dibuat_pada TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Pelanggan
CREATE TABLE klien (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  alamat TEXT,
  lat REAL,
  lng REAL,
  odp_id INTEGER,
  nomor_port INTEGER,            -- port ke berapa di ODP itu yang dipakai
  status TEXT CHECK(status IN ('aktif','nonaktif','pending')) DEFAULT 'pending',
  dibuat_pada TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (odp_id) REFERENCES odp(id)
);