# Aplikasi KenMap

Aplikasi manajemen jaringan fiber optik (FTTH) berbasis peta, mencakup pengelolaan perangkat (ODC, ODP), pelanggan, dan jalur kabel — dilengkapi tampilan peta satelit offline khusus wilayah Kabupaten Ponorogo.

## Fitur

- **Peta satelit offline** — citra Esri World Imagery, area Kabupaten Ponorogo, dapat diunduh untuk dipakai tanpa koneksi internet.
- **Batas wilayah** — tampilan batas kota/kabupaten, kecamatan, dan desa/kelurahan.
- **Manajemen perangkat** — pencatatan lokasi dan kapasitas ODC (Optical Distribution Cabinet) dan ODP (Optical Distribution Point).
- **Manajemen kabel** — jalur kabel feeder, distribusi, dan drop digambarkan sebagai garis di peta (titik A–B–C dan seterusnya), lengkap dengan panjang dan jumlah core.
- **Manajemen pelanggan** — data klien terhubung ke ODP dan nomor port tertentu.
- **Login admin** — autentikasi sebelum bisa menambah/mengubah data.

## Teknologi

| Komponen        | Teknologi                                         |
| --------------- | ------------------------------------------------- |
| Backend         | Node.js + Express                                 |
| Database        | SQLite (`better-sqlite3`), mode WAL               |
| Autentikasi     | `express-session` + `bcrypt`                      |
| Peta (frontend) | Leaflet.js + Esri World Imagery                   |
| Data spasial    | GeoJSON (disimpan sebagai teks di kolom database) |

## Struktur Proyek

```
KenMap/
├── server.js
├── db.js                  
├── seed-admin.js
├── package.json
├── ftth.db                 (dibuat otomatis saat server pertama dijalankan)
├── routes/
│   ├── auth.js
│   ├── odc.js
│   ├── odp.js
│   ├── kabel.js
│   └── klien.js
├── middleware/
│   └── requireAuth.js
└── public/
    ├── index.html          (file peta Anda, di-rename dari peta-ponorogo.html)
    ├── data-kota.geojson
    ├── data-kecamatan.geojson
    ├── data-desa.geojson
    ├── data-jalan.geojson
    └── icons/
```

## Instalasi

Pastikan sudah menginstal [Node.js](https://nodejs.org/) versi 18 ke atas.

```bash
npm install
```

## Menjalankan Aplikasi

```bash
# Mode development (auto-restart saat file diedit)
npm run dev

# Mode biasa
npm start
```

Setelah berjalan, buka `http://localhost:3000` di browser.

## Skema Database (ringkasan)

- **admins** — akun login untuk pengelola aplikasi.
- **odc** — titik distribusi utama (lat, lng, kapasitas port).
- **odp** — titik distribusi ke pelanggan, terhubung ke satu ODC.
- **kabel** — jalur kabel (feeder/distribusi/drop), geometri disimpan sebagai GeoJSON `LineString`.
- **klien** — data pelanggan, terhubung ke ODP dan nomor port tertentu.

Detail lengkap kolom setiap tabel ada di `server.js` / skrip inisialisasi database.

## Data Peta

Data batas wilayah dan jalan diperoleh dari sumber berikut:

- **Batas kota/kecamatan/desa** — data resmi BPS/BIG (bukan OpenStreetMap, karena kelengkapan batas desa OSM di Ponorogo belum memadai).
- **Data jalan** — diekstrak dari [Geofabrik](https://download.geofabrik.de/asia/indonesia.html) (ekstrak Jawa), difilter menggunakan `ogr2ogr` untuk jalan bertag `highway` dan `name`, dipotong sesuai batas Kabupaten Ponorogo.

Catatan: kelengkapan nama jalan mengikuti kelengkapan data OpenStreetMap di wilayah tersebut, yang kemungkinan tidak selengkap Google Maps terutama untuk jalan-jalan kecil di desa.

## Lisensi

Internal / belum ditentukan.
