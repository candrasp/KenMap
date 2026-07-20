// db.js
// Koneksi Postgres (pg Pool) + inisialisasi tabel (kalau belum ada)
// + migrasi additive-only untuk field baru (aman untuk DB yang sudah berjalan).
//
// PERBEDAAN PENTING vs versi better-sqlite3 sebelumnya:
// - Semua query sekarang ASYNC (pool.query mengembalikan Promise).
// - Tidak ada `lastInsertRowid` -> pakai `RETURNING id` di setiap INSERT.
// - Placeholder `?` -> `$1, $2, ...`.
// - Unique violation error code SQLite 'SQLITE_CONSTRAINT_UNIQUE' -> Postgres '23505'.

const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Kalau connect ke Postgres managed yang wajib SSL (mis. beberapa provider cloud),
  // set DB_SSL=true di env dan uncomment baris di bawah.
  // ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("[pg] Unexpected error pada idle client", err);
});

/** Cek apakah kolom sudah ada di tabel tertentu (Postgres information_schema) */
async function columnExists(table, column) {
  const { rows } = await pool.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
    [table, column],
  );
  return rows.length > 0;
}

/**
 * Tambahkan kolom kalau belum ada.
 * Postgres modern (9.6+) sebenarnya sudah support
 * `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` secara native,
 * tapi kita tetap pakai helper ini biar konsisten & ada log migrasi.
 */
async function addColumnIfNotExists(table, column, definitionSql) {
  const exists = await columnExists(table, column);
  if (!exists) {
    await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definitionSql}`);
    console.log(`[migrasi] Kolom '${column}' ditambahkan ke tabel '${table}'`);
  }
}

async function initSchema() {
  // ============================================
  // 1. TABEL DASAR
  // ============================================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      dibuat_pada TIMESTAMPTZ DEFAULT NOW(),
      updated_pada TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS odc (
      id SERIAL PRIMARY KEY,
      nama TEXT NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      alamat TEXT,
      kapasitas_port INTEGER DEFAULT 0,
      catatan TEXT,
      dibuat_pada TIMESTAMPTZ DEFAULT NOW(),
      updated_pada TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS odp (
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
      updated_pada TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS kabel (
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
      updated_pada TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS klien (
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
      updated_pada TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // ============================================
  // 2. TABEL: sto & olt
  // ============================================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sto (
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

    CREATE TABLE IF NOT EXISTS olt (
      id SERIAL PRIMARY KEY,
      kode TEXT UNIQUE NOT NULL,
      nama TEXT NOT NULL,
      nama_sto TEXT,
      lat DOUBLE PRECISION,
      lng DOUBLE PRECISION,
      alamat TEXT,
      jumlah_port_pon INTEGER,
      vendor TEXT,
      catatan TEXT,
      dibuat_pada TIMESTAMPTZ DEFAULT NOW(),
      updated_pada TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // ============================================
  // 2b. TABEL: pengaturan
  // ============================================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pengaturan (
      id SERIAL PRIMARY KEY,
      kunci TEXT UNIQUE NOT NULL,
      nilai TEXT NOT NULL,
      tipe TEXT DEFAULT 'boolean',
      deskripsi TEXT,
      updated_pada TIMESTAMPTZ DEFAULT NOW()
    );
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
    await pool.query(
      `INSERT INTO pengaturan (kunci, nilai, tipe, deskripsi) VALUES ($1, $2, 'boolean', $3)
       ON CONFLICT (kunci) DO NOTHING`,
      [kunci, nilai, deskripsi],
    );
  }

  // ============================================
  // 3. MIGRASI ADDITIVE: tambah kolom baru ke tabel lama
  // ============================================
  await addColumnIfNotExists("olt", "sto_id", "INTEGER REFERENCES sto(id)");

  await addColumnIfNotExists("odc", "kode", "TEXT");
  await addColumnIfNotExists("odc", "olt_id", "INTEGER REFERENCES olt(id)");
  await addColumnIfNotExists("odc", "tipe_pemasangan", "TEXT DEFAULT 'tiang'");
  await addColumnIfNotExists("odc", "nomor_tiang", "TEXT");
  await addColumnIfNotExists("odc", "jumlah_slot_splitter", "INTEGER DEFAULT 0");
  await addColumnIfNotExists("odc", "rasio_splitter", "TEXT");
  await addColumnIfNotExists("odc", "jumlah_core_feeder", "INTEGER");
  await addColumnIfNotExists("odc", "status", "TEXT DEFAULT 'planning'");
  await addColumnIfNotExists("odc", "foto_url", "TEXT");

  await addColumnIfNotExists("odp", "kode", "TEXT");
  await addColumnIfNotExists("odp", "rasio_splitter", "TEXT DEFAULT '1:8'");
  await addColumnIfNotExists("odp", "status", "TEXT DEFAULT 'planning'");
  await addColumnIfNotExists("odp", "foto_url", "TEXT");

  await addColumnIfNotExists("kabel", "redaman_db", "DOUBLE PRECISION");
  await addColumnIfNotExists("kabel", "status", "TEXT DEFAULT 'aktif'");

  await addColumnIfNotExists("klien", "redaman_db", "DOUBLE PRECISION");

  // ============================================
  // 4. INDEX
  // ============================================
  await pool.query(`
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

    CREATE UNIQUE INDEX IF NOT EXISTS idx_odc_kode_unique
      ON odc(kode) WHERE kode IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_odp_kode_unique
      ON odp(kode) WHERE kode IS NOT NULL;
  `);

  // ============================================
  // 5. SEED ADMIN DEFAULT
  //    Hanya dibuat kalau tabel admins masih kosong sama sekali,
  //    supaya tidak menimpa admin yang sudah dibuat/diganti sebelumnya.
  //    Username & password default: admin / admin
  //    -> WAJIB diganti setelah login pertama kali di lingkungan produksi.
  // ============================================
  const { rows: adminCountRows } = await pool.query("SELECT COUNT(*) AS count FROM admins");
  const adminCount = parseInt(adminCountRows[0].count, 10);
  if (adminCount === 0) {
    const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || "admin";
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || "admin";
    const hash = await bcrypt.hash(defaultPassword, 10);
    await pool.query("INSERT INTO admins (username, password_hash) VALUES ($1, $2)", [
      defaultUsername,
      hash,
    ]);
    console.log("==========================================");
    console.log(
      `[seed] Admin default dibuat -> username: '${defaultUsername}', password: '${defaultPassword}'`,
    );
    console.log("[seed] SEGERA ganti password ini setelah login pertama kali!");
    console.log("==========================================");
  }
}

module.exports = { pool, initSchema };
