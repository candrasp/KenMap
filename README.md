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

## Struktur Proyek

```
KenMap/
├── server.js                 (Express backend server)
├── db.js                     (PostgreSQL database initialization)
├── seed-admin.js             (script untuk membuat akun admin pertama)
├── vite.config.js            (Vite frontend bundler config)
├── package.json
├── routes/
│   ├── auth.js               (autentikasi login/logout)
│   ├── odc.js                (CRUD Optical Distribution Cabinet)
│   ├── odp.js                (CRUD Optical Distribution Point)
│   ├── olt.js                (CRUD Optical Line Terminal)
│   ├── kabel.js              (CRUD jalur kabel/feeder/drop)
│   ├── klien.js              (CRUD pelanggan FTTH)
│   ├── sto.js                (CRUD Splice/Terminal Office)
│   ├── pins.js               (unified endpoint untuk ODC/ODP/klien pins)
│   └── pengaturan.js         (settings/configuration endpoints)
├── middleware/
│   └── requireAuth.js        (middleware proteksi route yang wajib login)
├── utils/
│   └── geocodeLocal.js       (reverse geocoding menggunakan GeoJSON lokal)
├── src/
│   ├── main.js               (entry point Vue)
│   ├── App.vue               (root component)
│   ├── components/
│   │   ├── MapView.vue       (main map container)
│   │   ├── DetailPanel.vue   (sliding panel untuk detail device)
│   │   ├── SidePanel.vue     (sidebar untuk filter/legend)
│   │   ├── MeasureTool.vue   (measurement tool on map)
│   │   ├── CoordinateSearch.vue (coordinate search bar)
│   │   ├── NotificationContainer.vue (notification toast system)
│   │   ├── auth/
│   │   │   ├── LoginModal.vue
│   │   │   └── LoginButton.vue
│   │   ├── pins/
│   │   │   └── PinModal.vue  (modal untuk tambah pin/catatan)
│   │   └── modals/
│   │       ├── EditOdcModal.vue
│   │       ├── EditOdpModal.vue
│   │       ├── EditStoModal.vue
│   │       └── EditKlienModal.vue
│   ├── stores/
│   │   ├── infrastruktur.js  (Pinia store untuk data perangkat)
│   │   └── auth.js           (Pinia store untuk session login)
│   ├── composables/
│   │   ├── useLeaflet.js     (Leaflet map initialization & control)
│   │   └── useNotification.js (notification toast management)
│   ├── router/
│   │   └── index.js          (Vue Router configuration)
│   ├── views/
│   │   └── MapPage.vue       (main page view)
│   └── assets/               (CSS global, icons, dll)
├── public/
│   ├── data-kota.geojson     (boundary kota/kabupaten)
│   ├── data-kecamatan.geojson (boundary kecamatan)
│   ├── data-desa.geojson     (boundary desa/kelurahan)
│   ├── data-jalan.geojson    (jalan raya & sekunder)
│   ├── style.css             (dark theme CSS Supabase style)
│   ├── icons/
│   │   ├── odc.svg, odp-tiang.svg, odp-tanam.svg, klien-*.svg
│   │   ├── sto.svg           (Splice/Terminal Office icon)
│   │   ├── basemap-satelit.png (thumbnail untuk toggle basemap)
│   │   ├── basemap-jalan.png   (thumbnail untuk toggle basemap)
│   │   ├── locate-fixed.svg    (map reset/center icon)
│   │   ├── chevron-down.svg, log-in.svg, log-out.svg
│   │   └── (ikon lainnya)
│   └── fonts/
│       └── InterVariable.woff2 (font Inter variable)
```

## Instalasi

Pastikan sudah menginstal [Node.js](https://nodejs.org/) versi 20 ke atas.

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

Setelah berjalan, buka `http://localhost:port` di browser.

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
