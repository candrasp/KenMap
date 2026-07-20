-- ============================================
-- SCHEMA FTTH MAPS (PostgreSQL)
-- ============================================

-- Admin
CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  dibuat_pada TIMESTAMPTZ DEFAULT NOW(),
  updated_pada TIMESTAMPTZ DEFAULT NOW()
);

-- STO (Sentral Telepon Otomat)
CREATE TABLE sto (
  id SERIAL PRIMARY KEY,
  kode TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  alamat TEXT,
  status TEXT CHECK(status IN ('aktif','planning','maintenance','nonaktif')) DEFAULT 'aktif',
  foto_url TEXT,
  catatan TEXT,
  dibuat_pada TIMESTAMPTZ DEFAULT NOW(),
  updated_pada TIMESTAMPTZ DEFAULT NOW()
);

-- OLT / Sentral
CREATE TABLE olt (
  id SERIAL PRIMARY KEY,
  kode TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  nama_sto TEXT,
  sto_id INTEGER REFERENCES sto(id),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  alamat TEXT,
  jumlah_port_pon INTEGER,
  vendor TEXT,
  catatan TEXT,
  dibuat_pada TIMESTAMPTZ DEFAULT NOW(),
  updated_pada TIMESTAMPTZ DEFAULT NOW()
);

-- Perangkat: ODC
CREATE TABLE odc (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  alamat TEXT,
  kapasitas_port INTEGER DEFAULT 0,
  catatan TEXT,
  dibuat_pada TIMESTAMPTZ DEFAULT NOW(),
  updated_pada TIMESTAMPTZ DEFAULT NOW(),
  -- Kolom migrasi/tambahan
  kode TEXT,
  olt_id INTEGER REFERENCES olt(id),
  tipe_pemasangan TEXT DEFAULT 'tiang',
  nomor_tiang TEXT,
  jumlah_slot_splitter INTEGER DEFAULT 0,
  rasio_splitter TEXT,
  jumlah_core_feeder INTEGER,
  status TEXT DEFAULT 'planning',
  foto_url TEXT
);

-- Perangkat: ODP
CREATE TABLE odp (
  id SERIAL PRIMARY KEY,
  odc_id INTEGER REFERENCES odc(id),
  nama TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  alamat TEXT,
  kapasitas_port INTEGER DEFAULT 8,
  tipe_pemasangan TEXT DEFAULT 'tiang',
  catatan TEXT,
  dibuat_pada TIMESTAMPTZ DEFAULT NOW(),
  updated_pada TIMESTAMPTZ DEFAULT NOW(),
  -- Kolom migrasi/tambahan
  kode TEXT,
  rasio_splitter TEXT DEFAULT '1:8',
  status TEXT DEFAULT 'planning',
  foto_url TEXT
);

-- Kabel
CREATE TABLE kabel (
  id SERIAL PRIMARY KEY,
  jenis TEXT CHECK(jenis IN ('feeder','distribusi','drop')) NOT NULL,
  dari_tipe TEXT NOT NULL,
  dari_id INTEGER NOT NULL,
  ke_tipe TEXT NOT NULL,
  ke_id INTEGER NOT NULL,
  geometry TEXT NOT NULL,
  panjang_meter DOUBLE PRECISION,
  jumlah_core INTEGER,
  dibuat_pada TIMESTAMPTZ DEFAULT NOW(),
  updated_pada TIMESTAMPTZ DEFAULT NOW(),
  -- Kolom migrasi/tambahan
  redaman_db DOUBLE PRECISION,
  status TEXT DEFAULT 'aktif'
);

-- Pelanggan
CREATE TABLE klien (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  alamat TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  odp_id INTEGER REFERENCES odp(id),
  nomor_port INTEGER,
  ip TEXT,
  nomor_hp TEXT,
  onu_id TEXT,
  catatan TEXT,
  status TEXT CHECK(status IN ('aktif','nonaktif','pending')) DEFAULT 'pending',
  dibuat_pada TIMESTAMPTZ DEFAULT NOW(),
  updated_pada TIMESTAMPTZ DEFAULT NOW(),
  -- Kolom migrasi/tambahan
  redaman_db DOUBLE PRECISION
);

-- Pengaturan
CREATE TABLE pengaturan (
  id SERIAL PRIMARY KEY,
  kunci TEXT UNIQUE NOT NULL,
  nilai TEXT NOT NULL,
  tipe TEXT DEFAULT 'boolean',
  deskripsi TEXT,
  updated_pada TIMESTAMPTZ DEFAULT NOW()
);

-- INDEX
CREATE INDEX idx_odc_latlng ON odc(lat, lng);
CREATE INDEX idx_odp_latlng ON odp(lat, lng);
CREATE INDEX idx_klien_latlng ON klien(lat, lng);
CREATE INDEX idx_odp_odc_id ON odp(odc_id);
CREATE INDEX idx_klien_odp_id ON klien(odp_id);
CREATE INDEX idx_odc_olt_id ON odc(olt_id);
CREATE INDEX idx_olt_sto_id ON olt(sto_id);
CREATE INDEX idx_sto_latlng ON sto(lat, lng);
CREATE INDEX idx_kabel_dari ON kabel(dari_tipe, dari_id);
CREATE INDEX idx_kabel_ke ON kabel(ke_tipe, ke_id);

CREATE UNIQUE INDEX idx_odc_kode_unique ON odc(kode) WHERE kode IS NOT NULL;
CREATE UNIQUE INDEX idx_odp_kode_unique ON odp(kode) WHERE kode IS NOT NULL;
