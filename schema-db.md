-- ============================================
-- SCHEMA FTTH MAPS (v3 - sinkron dengan db.js)
-- ============================================

-- Admin
CREATE TABLE admins (
id INTEGER PRIMARY KEY AUTOINCREMENT,
username TEXT UNIQUE NOT NULL,
password_hash TEXT NOT NULL,
dibuat_pada TEXT DEFAULT CURRENT_TIMESTAMP,
updated_pada TEXT DEFAULT CURRENT_TIMESTAMP
);

-- STO (Sentral Telepon Otomat) - gedung/lokasi induk, bisa menaungi
-- lebih dari satu OLT di dalamnya. Ditampilkan sebagai pin di peta.
CREATE TABLE sto (
id INTEGER PRIMARY KEY AUTOINCREMENT,
kode TEXT UNIQUE NOT NULL, -- kode STO, misal: STO-PNR
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

-- OLT / Sentral (sumber utama feeder ke ODC)
CREATE TABLE olt (
id INTEGER PRIMARY KEY AUTOINCREMENT,
kode TEXT UNIQUE NOT NULL, -- kode OLT, misal: OLT-STO-JKT01
nama TEXT NOT NULL,
nama_sto TEXT, -- (lama) nama sentral/STO induk sbg teks bebas, dipertahankan utk data lama
sto_id INTEGER, -- (baru) relasi resmi ke tabel sto - satu STO bisa punya banyak OLT
lat REAL,
lng REAL,
alamat TEXT,
jumlah_port_pon INTEGER, -- jumlah port PON tersedia di OLT
vendor TEXT, -- Huawei, ZTE, Fiberhome, dll
catatan TEXT,
dibuat_pada TEXT DEFAULT CURRENT_TIMESTAMP,
updated_pada TEXT DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (sto_id) REFERENCES sto(id)
);

-- Perangkat: ODC (titik distribusi utama)
CREATE TABLE odc (
id INTEGER PRIMARY KEY AUTOINCREMENT,
kode TEXT UNIQUE, -- kode unik ODC, misal: ODC-PNR-01
nama TEXT NOT NULL,
olt_id INTEGER, -- ODC ini disuplai dari OLT mana
lat REAL NOT NULL,
lng REAL NOT NULL,
alamat TEXT,
tipe_pemasangan TEXT DEFAULT 'tiang', -- 'tiang' | 'tanam' | 'dinding'
nomor_tiang TEXT, -- jika tipe_pemasangan = tiang
kapasitas_port INTEGER DEFAULT 0, -- total port/core kapasitas ODC
jumlah_slot_splitter INTEGER DEFAULT 0, -- jumlah slot splitter tier-1
rasio_splitter TEXT, -- '1:4' | '1:8' | '1:16' dst
jumlah_core_feeder INTEGER, -- jumlah core kabel feeder masuk
status TEXT CHECK(status IN ('aktif','planning','maintenance','nonaktif'))
DEFAULT 'planning',
foto_url TEXT, -- dokumentasi foto lokasi
catatan TEXT,
dibuat_pada TEXT DEFAULT CURRENT_TIMESTAMP,
updated_pada TEXT DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (olt_id) REFERENCES olt(id)
);

-- Perangkat: ODP (titik distribusi ke pelanggan)
CREATE TABLE odp (
id INTEGER PRIMARY KEY AUTOINCREMENT,
odc_id INTEGER, -- ODP ini disuplai dari ODC mana
kode TEXT UNIQUE, -- kode unik ODP, misal: ODP-PNR-01-A
nama TEXT NOT NULL,
lat REAL NOT NULL,
lng REAL NOT NULL,
alamat TEXT,
kapasitas_port INTEGER DEFAULT 8, -- biasanya 8 atau 16
rasio_splitter TEXT DEFAULT '1:8', -- rasio splitter tier-2 di ODP
tipe_pemasangan TEXT DEFAULT 'tiang', -- 'tiang' atau 'tanam'
status TEXT CHECK(status IN ('aktif','planning','maintenance','nonaktif'))
DEFAULT 'planning',
foto_url TEXT,
catatan TEXT,
dibuat_pada TEXT DEFAULT CURRENT_TIMESTAMP,
updated_pada TEXT DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (odc_id) REFERENCES odc(id)
);

-- Kabel (feeder: OLT-ODC, distribusi: ODC-ODP, drop: ODP-klien)
CREATE TABLE kabel (
id INTEGER PRIMARY KEY AUTOINCREMENT,
jenis TEXT CHECK(jenis IN ('feeder','distribusi','drop')) NOT NULL,
dari_tipe TEXT NOT NULL, -- 'olt' | 'odc' | 'odp' | 'klien'
dari_id INTEGER NOT NULL,
ke_tipe TEXT NOT NULL,
ke_id INTEGER NOT NULL,
geometry TEXT NOT NULL, -- GeoJSON LineString (titik A-B-C-dst)
panjang_meter REAL,
jumlah_core INTEGER, -- jumlah core kabel fiber
redaman_db REAL, -- loss/redaman kabel (dB), penting utk link budget
status TEXT CHECK(status IN ('aktif','planning','putus','maintenance'))
DEFAULT 'aktif',
dibuat_pada TEXT DEFAULT CURRENT_TIMESTAMP,
updated_pada TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Pelanggan
CREATE TABLE klien (
id INTEGER PRIMARY KEY AUTOINCREMENT,
nama TEXT NOT NULL,
alamat TEXT,
lat REAL,
lng REAL,
odp_id INTEGER,
nomor_port INTEGER, -- port ke berapa di ODP itu yang dipakai
ip TEXT, -- IP address pelanggan
nomor_hp TEXT, -- nomor telepon pelanggan
onu_id TEXT, -- ONU (Optical Network Unit) ID
redaman_db REAL, -- redaman terukur di sisi ONU pelanggan
catatan TEXT, -- catatan/notes tentang pelanggan
status TEXT CHECK(status IN ('aktif','nonaktif','pending')) DEFAULT 'pending',
dibuat_pada TEXT DEFAULT CURRENT_TIMESTAMP,
updated_pada TEXT DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (odp_id) REFERENCES odp(id)
);

-- Pengaturan aplikasi (key-value, berlaku global - termasuk untuk publik)
-- Contoh: toggle tampil/sembunyi layer batas desa, nama kecamatan, dll.
-- Pakai key-value supaya nambah pengaturan baru nanti cukup INSERT baris,
-- tanpa perlu migrasi ubah struktur tabel lagi.
CREATE TABLE pengaturan (
id INTEGER PRIMARY KEY AUTOINCREMENT,
kunci TEXT UNIQUE NOT NULL, -- misal: 'tampilkan_batas_desa'
nilai TEXT NOT NULL, -- disimpan sbg TEXT: 'true'/'false' utk boolean, atau JSON utk nilai kompleks
tipe TEXT DEFAULT 'boolean', -- 'boolean' | 'text' | 'number' | 'json'
deskripsi TEXT, -- keterangan buat ditampilkan di panel admin
updated_pada TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEX
-- ============================================
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

-- kode ODC/ODP unik, tapi partial index -> baris yang kode-nya
-- masih NULL tidak akan dianggap bentrok satu sama lain.
CREATE UNIQUE INDEX idx_odc_kode_unique ON odc(kode) WHERE kode IS NOT NULL;
CREATE UNIQUE INDEX idx_odp_kode_unique ON odp(kode) WHERE kode IS NOT NULL;

-- ============================================
-- SEED DATA: pengaturan default
-- ============================================
INSERT OR IGNORE INTO pengaturan (kunci, nilai, tipe, deskripsi) VALUES
('tampilkan_batas_kota', 'true', 'boolean', 'Tampilkan garis batas kota/kabupaten'),
('tampilkan_batas_kecamatan', 'true', 'boolean', 'Tampilkan garis batas kecamatan'),
('tampilkan_batas_desa', 'true', 'boolean', 'Tampilkan garis batas desa'),
('tampilkan_nama_kecamatan', 'true', 'boolean', 'Tampilkan label nama kecamatan'),
('tampilkan_nama_desa', 'true', 'boolean', 'Tampilkan label nama desa'),
('tampilkan_odc', 'true', 'boolean', 'Tampilkan marker ODC'),
('tampilkan_odp', 'true', 'boolean', 'Tampilkan marker ODP'),
('tampilkan_kabel', 'true', 'boolean', 'Tampilkan jalur kabel'),
('tampilkan_klien', 'false', 'boolean', 'Tampilkan marker pelanggan (default off - data sensitif utk publik)');
