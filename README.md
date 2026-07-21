# Aplikasi KenMap

Aplikasi manajemen jaringan fiber optik (FTTH) berbasis peta, mencakup pengelolaan perangkat (STO, ODC, ODP), pelanggan, dan jalur kabel — dilengkapi tampilan peta satelit dan jalan offline khusus wilayah Kabupaten Ponorogo.

## Fitur

- **Peta satelit dan jalan offline** — citra Esri World Imagery, area Kabupaten Ponorogo, dapat diunduh untuk dipakai tanpa koneksi internet.
- **Batas wilayah** — tampilan batas kota/kabupaten, kecamatan, dan desa/kelurahan.
- **Manajemen perangkat** — pencatatan lokasi dan kapasitas ODC (Optical Distribution Cabinet) dan ODP (Optical Distribution Point).
- **Manajemen kabel** — jalur kabel feeder, distribusi, dan drop digambarkan sebagai garis di peta (titik A–B–C dan seterusnya), lengkap dengan panjang dan jumlah core.
- **Manajemen pelanggan** — data klien terhubung ke ODP dan nomor port tertentu.
- **Login admin** — autentikasi sebelum bisa menambah/mengubah data.

## Teknologi

| Komponen        | Teknologi                                         |
| --------------- | ------------------------------------------------- |
| Backend         | Node.js + Express                                 |
| Database        | PostgreSQL                                        |
| Autentikasi     | `express-session` + `bcrypt`                      |
| Peta (frontend) | Leaflet.js + Esri World Imagery                   |
| Data spasial    | GeoJSON (disimpan sebagai teks di kolom database) |

---

## Menjalankan Aplikasi

Ada dua cara: **Docker** (direkomendasikan, tidak perlu install Node.js/Postgres manual) atau **manual/lokal** (kalau kamu sudah punya Node.js & PostgreSQL sendiri).

### Opsi A — Dengan Docker (Direkomendasikan)

Prasyarat: [Docker](https://docs.docker.com/get-docker/) & Docker Compose terinstal. Tidak perlu install Node.js atau PostgreSQL secara terpisah.

```bash
git clone https://github.com/candrasp/KenMap.git
cd KenMap
cp env.example .env
nano .env   # sesuaikan DB_PASSWORD, SESSION_SECRET, dll
docker compose up -d --build
```

Docker otomatis menyalakan PostgreSQL, install dependency, build frontend (Vue), dan menjalankan backend — semuanya terisolasi di dalam container.

Cek status:

```bash
docker compose ps
```

Buka aplikasi di `http://localhost:3000` (atau sesuai `PORT` di `.env`).

📄 Panduan lengkap (update, backup, reset database, troubleshooting) ada di [`panduan.md`](./panduan.md).

### Opsi B — Manual/Lokal (Tanpa Docker)

Prasyarat:

- [Node.js](https://nodejs.org/) versi 20 ke atas
- [PostgreSQL](https://www.postgresql.org/download/) versi 14 ke atas, sudah terinstal dan berjalan
- Database & user Postgres sudah dibuat (contoh di bawah)

**1. Clone & install dependency:**

```bash
git clone https://github.com/candrasp/KenMap.git
cd KenMap
npm install
```

**2. Buat database & user di PostgreSQL:**

```sql
CREATE USER kenmap WITH PASSWORD 'password_kamu';
CREATE DATABASE kenmap OWNER kenmap;
```

**3. Konfigurasi environment:**

```bash
cp env.example .env
```

Buka `.env` dan tambahkan/sesuaikan `DATABASE_URL` mengarah ke Postgres lokal kamu:

```env
DATABASE_URL=postgres://kenmap:password_kamu@localhost:5432/kenmap
SESSION_SECRET=ganti_dengan_string_acak_panjang
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin
PORT=3000
```

**4. Jalankan aplikasi:**

```bash
# Mode development (frontend + backend, auto-restart saat file diedit)
npm run dev

# Mode produksi (build dulu, lalu jalankan)
npm run build
npm start
```

Tabel, index, dan akun admin default akan otomatis dibuat saat aplikasi pertama kali start (lihat `db.js`).

Buka aplikasi di `http://localhost:3000` (atau sesuai `PORT` di `.env`).

---

## Login Admin

Gunakan `DEFAULT_ADMIN_USERNAME` / `DEFAULT_ADMIN_PASSWORD` yang diatur di `.env` (default: `admin`/`admin`). **Segera ganti password setelah login pertama kali.**

---

## Skema Database (Ringkasan)

### Tabel & Relasi Utama

```
admins
├── Tabel: username, password_hash, dibuat_pada, updated_pada
└── Autentikasi pengguna admin

sto (Sentral Telepon Otomat)
├── Tabel: kode, nama, lat, lng, alamat, status, foto_url, catatan
└── Pusat sentral (bisa menaungi banyak OLT)

olt (Optical Line Terminal)
├── Tabel: kode, nama, sto_id (FK), lat, lng, alamat, jumlah_port_pon, vendor
└── Sumber feeder utama (terhubung ke STO)

odc (Optical Distribution Cabinet)
├── Tabel: kode, nama, olt_id (FK), lat, lng, alamat, tipe_pemasangan,
│          jumlah_slot_splitter, rasio_splitter, status, foto_url
└── Titik distribusi optik (terhubung ke OLT)

odp (Optical Distribution Point)
├── Tabel: kode, nama, odc_id (FK), lat, lng, alamat, tipe_pemasangan,
│          rasio_splitter, status, foto_url
└── Titik distribusi akhir (terhubung ke ODC)

klien (Pelanggan)
├── Tabel: nama, alamat, lat, lng, odp_id (FK), nomor_port, status,
│          ip, nomor_hp, onu_id, redaman_db
└── Data pelanggan FTTH (terhubung ke ODP)

kabel (Jalur Kabel)
├── Tabel: jenis (feeder|distribusi|drop), dari_tipe, dari_id, ke_tipe, ke_id,
│          geometry (GeoJSON), panjang_meter, jumlah_core, redaman_db, status
└── Koneksi antar perangkat (generic dari tipe/id ke tipe/id)

pengaturan (Konfigurasi Global)
├── Tabel: kunci (UNIQUE), nilai, tipe, deskripsi
└── Key-value store untuk toggle layer, display settings, dll
```

### Hirarki Jaringan

```
sto (1)
 └── olt (banyak)
      └── odc (banyak)
           └── odp (banyak)
                └── klien (banyak)

kabel: koneksi generic (dari_tipe/dari_id → ke_tipe/ke_id)
```

---

## Struktur Proyek

```
KenMap/
├── index.html                (entry point HTML untuk Vite)
├── vite.config.js            (Vite bundler configuration)
├── server.js                 (Express backend server)
├── db.js                     (PostgreSQL database initialization)
├── seed-admin.js             (script untuk membuat akun admin pertama)
├── Dockerfile                (Docker container definition)
├── docker-compose.yml        (Docker Compose configuration)
├── panduan.md                (panduan detail setup, update, troubleshooting)
├── package.json
│
├── middleware/
│   └── requireAuth.js        (middleware proteksi route yang wajib login)
│
├── routes/                   (REST API — satu file per entitas)
│   ├── auth.js, sto.js, olt.js, odc.js, odp.js
│   ├── klien.js, kabel.js, pins.js, pengaturan.js
│
├── utils/
│   └── geocodeLocal.js       (reverse geocoding menggunakan GeoJSON lokal)
│
├── public/                   (asset statis: CSS, font, ikon, data GeoJSON)
│   ├── data-*.geojson        (boundary kota/kecamatan/desa, data jalan)
│   ├── icons/                (ikon device & UI)
│   └── fonts/
│
└── src/                      (frontend Vue 3 + Pinia + Leaflet)
    ├── main.js, App.vue
    ├── components/            (MapView, DetailPanel, SidePanel, modal edit, dll)
    ├── stores/                (Pinia: infrastruktur.js, auth.js)
    ├── composables/           (useLeaflet.js, useNotification.js)
    ├── router/
    └── views/
```

## Data Peta

Data batas wilayah dan jalan diperoleh dari sumber berikut:

- **Batas kota/kecamatan/desa** — data resmi BPS/BIG (bukan OpenStreetMap, karena kelengkapan batas desa OSM di Ponorogo belum memadai).
- **Data jalan** — diekstrak dari [Geofabrik](https://download.geofabrik.de/asia/indonesia.html) (ekstrak Jawa), difilter menggunakan `ogr2ogr` untuk jalan bertag `highway` dan `name`, dipotong sesuai batas Kabupaten Ponorogo.

Catatan: kelengkapan nama jalan mengikuti kelengkapan data OpenStreetMap di wilayah tersebut, yang kemungkinan tidak selengkap Google Maps terutama untuk jalan-jalan kecil di desa.

## Data Peta & Atribusi

Data batas wilayah dan peta dasar diperoleh dari sumber berikut:

- **Batas Kota/Kecamatan/Desa:** Data resmi BPS / BIG.
- **Data Jalan:** Diekstrak dari [Geofabrik](https://download.geofabrik.de/) / [OpenStreetMap](https://www.openstreetmap.org/) di bawah lisensi [ODbL](https://opendatacommons.org/licenses/odbl/). © Kontributor OpenStreetMap.
- **Citra Satelit:** Esri World Imagery (Esri, Maxar, Earthstar Geographics, dan Komunitas GIS).

## Lisensi

Aplikasi ini dilisensikan di bawah **GNU General Public License v3.0 (GPLv3)**. Lihat berkas [LICENSE.md](./LICENSE.md) untuk rincian lengkap.
