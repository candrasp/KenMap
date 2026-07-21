# Arsitektur Sistem & Spesifikasi API KenMap

Dokumen ini menjelaskan gambaran umum arsitektur, aliran data, struktur komponen, keputusan desain teknis, serta seluruh **Spesifikasi REST API** yang tersedia pada aplikasi **KenMap** (Aplikasi Manajemen Jaringan FTTH berbasis Peta).

---

## 1. Tinjauan Tingkat Tinggi (High-Level Overview)

KenMap dibangun menggunakan arsitektur **Monolitik Terpisah (Single-Repository Web Application)** dengan alur kerja Monolit Modern:

- **Frontend:** Single Page Application (SPA) berbasis **Vue 3** dan **Leaflet.js** dipaketkan menggunakan **Vite**.
- **Backend:** REST API server berbasis **Node.js** dan **Express.js**.
- **Database:** **PostgreSQL** relasional untuk menyimpan data master infrastruktur, pelanggan, serta geometri spasial.
- **Authentication & Session:** **express-session** yang disimpan di dalam cookie/session store dengan hash kata sandi **bcrypt**.

```
┌───────────────────────────────────────────────────────────┐
│                      Client Browser                       │
│  ┌───────────────────────────────────────────────────┐    │
│  │      Vue 3 SPA (Pinia, Leaflet.js, Router, UI)     │    │
│  └───────────────────────────┬───────────────────────┘    │
└────────────────────────────┬─┴────────────────────────────┘
                              │  HTTP / REST API (JSON)
                              ▼
┌───────────────────────────────────────────────────────────┐
│                     Node.js + Express                     │
│  ┌───────────────────────────────────────────────────┐    │
│  │  - Session & Auth Middleware (requireAuth.js)      │    │
│  │  - REST Routes (sto, olt, odc, odp, kabel, dll)    │    │
│  │  - Geocoding Local Utility (GeoJSON reader)        │    │
│  └───────────────────────────┬───────────────────────┘    │
└────────────────────────────┬─┴────────────────────────────┘
                              │  SQL Query (pg)
                              ▼
┌───────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                     │
│      (admins, sto, olt, odc, odp, kabel, klien, dll)      │
└─────────────────────────────────────────────────────────--┘
```

---

## 2. Hirarki Data & Pemodelan Jaringan

Jaringan FTTH dalam KenMap dimodelkan secara terstruktur bertingkat (_parent-child relationship_) dari pusat sentral hingga ke pelanggan akhir:

```
[STO] Sentral Telepon Otomat
 └── (1:N) [OLT] Optical Line Terminal
      └── (1:N) [ODC] Optical Distribution Cabinet
           └── (1:N) [ODP] Optical Distribution Point
                └── (1:N) [Klien] Pelanggan FTTH (Port unik per ODP)
```

### Jalur Kabel (Kabel Vectoring Model)

Jalur kabel (`feeder`, `distribusi`, `drop`) disatukan menggunakan pendekatan **Generic Association** pada tabel `kabel`:

- `dari_tipe` & `dari_id` (misal: `odc`, `1`)
- `ke_tipe` & `ke_id` (misal: `odp`, `5`)
- `geometry`: Menyimpan GeoJSON `LineString` (koordinat array `[lng, lat]`) untuk penggambaran garis di peta.

---

## 3. Komponen Utama Backend & Frontend

- **Autentikasi & Otorisasi:** Menggunakan session berbasis cookie (`express-session`). Middleware `middleware/requireAuth.js` memproteksi endpoint yang membutuhkan hak akses write/edit data (POST, PUT, DELETE). Kata sandi disimpan dengan enkripsi `bcrypt`.
- **Offline Reverse Geocoding:** Fitur reverse geocoding dilakukan secara luring memanfaatkan dataset GeoJSON lokal (`utils/geocodeLocal.js`) untuk mendeteksi nama wilayah (Kabupaten, Kecamatan, Desa) berdasarkan koordinat `lat, lng`.
- **State Management & Map Rendering:** Frontend Vue 3 menggunakan Pinia (`infrastruktur.js`, `auth.js`) dan Leaflet.js (`useLeaflet.js`) untuk merender layer tile (Esri World Imagery / jalan offline), penanda marker custom (STO, ODC, ODP), dan polyline kabel.

---

## 4. Konsep Umum API

- **Base URL:** Seluruh endpoint diasumsikan diprefix `/api` (misal: router untuk `sto.js` di-mount sebagai `/api/sto`).
- **Autentikasi:** Berbasis session (cookie). Setelah login lewat `/api/login`, session cookie otomatis dikirim browser pada request berikutnya. Endpoint terproteksi dikawal middleware (`requireAuth` / `requireAdmin`) dan mengembalikan status `401`:

  ```json
  { "error": "Unauthorized. Silakan login sebagai admin." }
  ```

- **Format request/response:** JSON (`Content-Type: application/json`).
- **Pola akses:**
  - `GET`: Hampir semua publik (tanpa login), digunakan untuk render peta ke pengunjung.
  - `POST`, `PUT`, `DELETE`: Wajib login admin (`requireAuth`), kecuali disebutkan lain.
- **Konvensi Field:** Field menggunakan Bahasa Indonesia (`nama`, `alamat`, `kode`, `catatan`, `dibuat_pada`, `updated_pada`, dsb.). Kolom `alamat` otomatis diisi dari koordinat (`lat`, `lng`) memakai data desa lokal (`getDesaFromCoordinates`) jika tidak dikirim manual saat pembuatan.

---

## 5. Dokumentasi Endpoint REST API

### 5.1. Autentikasi (`/api`)

Mengelola login admin, ganti password, dan manajemen akun admin. (🔒 = Wajib login admin)

- **`POST /api/login`**
  Login admin, membuat session.
  Body: `{ "username": "admin1", "password": "rahasia123" }`
  Response 200: `{ "message": "Login berhasil.", "username": "admin1" }`
  Error: `400` (field kosong), `401` (kredensial salah).

- **`POST /api/logout`**
  Menghancurkan session. Response 200: `{ "message": "Logout berhasil." }`

- **`GET /api/me`**
  Cek status login saat ini. Dipakai frontend untuk toggle tombol edit/hapus.
  Response 200: `{ "loggedIn": true, "username": "admin1" }` atau `{ "loggedIn": false }`

- **`POST /api/change-password`** 🔒
  Body: `{ "oldPassword": "lama123", "newPassword": "baru456" }`

- **`GET /api/admins`** 🔒 — List semua admin (tanpa password hash), diurutkan `id ASC`.
- **`POST /api/admins`** 🔒 — Tambah admin baru. Body: `{ "username": "admin2", "password": "rahasia456" }`
- **`PUT /api/admins/change-username`** 🔒 — Ganti username admin yang sedang login. Body: `{ "newUsername": "admin_baru" }`
- **`DELETE /api/admins/:id`** 🔒 — Hapus admin lain. Tidak bisa menghapus akun sendiri (dicek via `req.session.adminId`).

---

### 5.2. STO — Sentral Telepon Otomat (`/api/sto`)

Lokasi induk yang menaungi OLT. Relasi: STO (1) → OLT (banyak).

| Method   | Path           | Auth   | Keterangan                                      |
| -------- | -------------- | ------ | ----------------------------------------------- |
| `GET`    | `/api/sto`     | Publik | Semua STO, urut nama ASC                        |
| `GET`    | `/api/sto/:id` | Publik | Detail satu STO                                 |
| `POST`   | `/api/sto`     | 🔒     | Tambah STO                                      |
| `PUT`    | `/api/sto/:id` | 🔒     | Update STO (partial update)                     |
| `DELETE` | `/api/sto/:id` | 🔒     | Hapus STO (diblokir jika masih ada OLT terkait) |

**Body POST/PUT:**

```json
{
  "kode": "STO-PONOROGO",
  "nama": "STO Ponorogo Kota",
  "lat": -7.871,
  "lng": 111.452,
  "alamat": "opsional, auto-fill dari koordinat jika kosong",
  "status": "aktif",
  "foto_url": "opsional",
  "catatan": "opsional"
}
```

**Validasi & Proteksi:**

- `kode`, `nama`, `lat`, `lng` wajib saat create.
- `status` harus: `aktif`, `planning`, `maintenance`, `nonaktif`.
- `kode` harus unik → Bentrok: `409` (`{ "error": "Kode STO 'STO-XXX' sudah dipakai." }`).
- `DELETE`: Proteksi relasi. Jika masih ada OLT terkait, return `409` (`{ "error": "Tidak dapat menghapus STO ini. Ada 3 OLT yang masih terhubung." }`).

---

### 5.3. OLT — Optical Line Terminal (`/api/olt`)

Terhubung ke STO (opsional) via `sto_id`. Induk dari ODC.

| Method   | Path           | Auth   | Keterangan                                      |
| -------- | -------------- | ------ | ----------------------------------------------- |
| `GET`    | `/api/olt`     | Publik | Semua OLT, urut nama ASC                        |
| `GET`    | `/api/olt/:id` | Publik | Detail satu OLT                                 |
| `POST`   | `/api/olt`     | 🔒     | Tambah OLT (support quick-add dari form ODC)    |
| `PUT`    | `/api/olt/:id` | 🔒     | Update OLT (partial update)                     |
| `DELETE` | `/api/olt/:id` | 🔒     | Hapus OLT (diblokir jika masih ada ODC terkait) |

**Body POST/PUT:** (Wajib: `kode`, `nama`)

```json
{
  "kode": "OLT-01",
  "nama": "OLT Ponorogo 1",
  "nama_sto": "opsional",
  "sto_id": 1,
  "lat": -7.87,
  "lng": 111.45,
  "alamat": "opsional",
  "jumlah_port_pon": 16,
  "vendor": "opsional",
  "catatan": "opsional"
}
```

**Validasi & Proteksi:**

- Jika `sto_id` dikirim, harus valid → `400` (`{ "error": "sto_id tidak ditemukan." }`).
- `kode` unik → Bentrok: `409`.
- `DELETE`: Diblokir jika masih ada ODC dengan `olt_id` tersebut (`409`).

---

### 5.4. ODC — Optical Distribution Cabinet (`/api/odc`)

Terhubung ke OLT via `olt_id`. Induk dari ODP.

| Method   | Path           | Auth   | Keterangan                                      |
| -------- | -------------- | ------ | ----------------------------------------------- |
| `GET`    | `/api/odc`     | Publik | Semua ODC, urut id DESC                         |
| `GET`    | `/api/odc/:id` | Publik | Detail satu ODC                                 |
| `POST`   | `/api/odc`     | 🔒     | Tambah ODC                                      |
| `PUT`    | `/api/odc/:id` | 🔒     | Update ODC (partial update)                     |
| `DELETE` | `/api/odc/:id` | 🔒     | Hapus ODC (diblokir jika masih ada ODP terkait) |

**Body POST/PUT:**

```json
{
  "nama": "ODC-01",
  "alamat": "opsional",
  "lat": -7.871,
  "lng": 111.452,
  "kapasitas_port": 144,
  "catatan": "opsional",
  "kode": "opsional, unik jika diisi",
  "olt_id": 1,
  "tipe_pemasangan": "tiang",
  "nomor_tiang": "opsional",
  "jumlah_slot_splitter": 4,
  "rasio_splitter": "1:8",
  "jumlah_core_feeder": 12,
  "status": "planning",
  "foto_url": "opsional"
}
```

**Validasi:** `nama`, `lat`, `lng` wajib. Enum `tipe_pemasangan` (`tiang`, `tanam`, `dinding`), `status` (`aktif`, `planning`, `maintenance`, `nonaktif`). `olt_id` harus valid. `kode` unik. `DELETE` terproteksi jika ada ODP terkait (`409`).

---

### 5.5. ODP — Optical Distribution Point (`/api/odp`)

Terhubung ke ODC via `odc_id`. Tempat port disewa oleh Klien (`odp_id` + `nomor_port`).

| Method   | Path           | Auth   | Keterangan                                        |
| -------- | -------------- | ------ | ------------------------------------------------- |
| `GET`    | `/api/odp`     | Publik | Semua ODP + kolom tambahan `port_terpakai`        |
| `GET`    | `/api/odp/:id` | Publik | Detail satu ODP                                   |
| `POST`   | `/api/odp`     | 🔒     | Tambah ODP                                        |
| `PUT`    | `/api/odp/:id` | 🔒     | Update ODP                                        |
| `DELETE` | `/api/odp/:id` | 🔒     | Hapus ODP (diblokir jika masih ada Klien terkait) |

**Body POST/PUT:**

```json
{
  "odc_id": 1,
  "nama": "ODP-01-A",
  "alamat": "opsional",
  "lat": -7.87,
  "lng": 111.45,
  "kapasitas_port": 8,
  "tipe_pemasangan": "tiang",
  "status": "aktif",
  "catatan": "opsional"
}
```

**Catatan:** Respon `GET /api/odp` menyertakan `port_terpakai` (jumlah klien aktif/terhubung) untuk kalkulasi sisa slot (`kapasitas_port - port_terpakai`). `DELETE` diblokir jika ada klien (`409`).

---

### 5.6. Kabel — Jalur Fiber Optik (`/api/kabel`)

Merepresentasikan jalur kabel (garis polyline di peta) antar 2 entitas, disimpan sebagai GeoJSON `LineString`.

| Method   | Path             | Auth   | Keterangan                                 |
| -------- | ---------------- | ------ | ------------------------------------------ |
| `GET`    | `/api/kabel`     | Publik | Semua kabel, `geometry` di-parse ke Object |
| `GET`    | `/api/kabel/:id` | Publik | Detail satu kabel                          |
| `POST`   | `/api/kabel`     | 🔒     | Tambah kabel                               |
| `PUT`    | `/api/kabel/:id` | 🔒     | Update kabel (partial)                     |
| `DELETE` | `/api/kabel/:id` | 🔒     | Hapus kabel                                |

**Body POST:**

```json
{
  "jenis": "distribusi",
  "dari_tipe": "odc",
  "dari_id": 1,
  "ke_tipe": "odp",
  "ke_id": 5,
  "koordinat": [
    [111.452, -7.871],
    [111.453, -7.869],
    [111.456, -7.869]
  ],
  "panjang_meter": 651,
  "jumlah_core": 12
}
```

**Catatan:** `koordinat` adalah array `[lng, lat]` (GeoJSON standar) dan disimpan ke kolom `geometry` sebagai string JSON. `dari_tipe`/`ke_tipe` adalah label bebas (contoh: `"sto"`, `"odc"`, `"odp"`).

---

### 5.7. Klien — Pelanggan (`/api/klien`)

Data pelanggan FTTH, terhubung ke ODP (`odp_id` + `nomor_port`).

| Method   | Path             | Auth   | Keterangan                                  |
| -------- | ---------------- | ------ | ------------------------------------------- |
| `GET`    | `/api/klien`     | Publik | Semua klien + `nama_odp` (JOIN tabel `odp`) |
| `GET`    | `/api/klien/:id` | Publik | Detail satu klien                           |
| `POST`   | `/api/klien`     | 🔒     | Tambah klien                                |
| `PUT`    | `/api/klien/:id` | 🔒     | Update klien                                |
| `DELETE` | `/api/klien/:id` | 🔒     | Hapus klien                                 |

**Body POST/PUT:**

```json
{
  "nama": "Budi Santoso",
  "alamat": "opsional",
  "lat": -7.87,
  "lng": 111.45,
  "odp_id": 5,
  "nomor_port": 3,
  "status": "pending",
  "ip": "opsional",
  "nomor_hp": "opsional",
  "onu_id": "opsional",
  "catatan": "opsional"
}
```

**Proteksi Bentrok Port:** Jika `odp_id` + `nomor_port` dikirim bersamaan, backend mengecek apakah port sudah terpakai. Jika bentrok, mengembalikan `409` (`{ "error": "Port 3 di ODP ini sudah dipakai klien lain." }`). Saat `PUT`, ID klien saat ini dikecualikan (`id != :id`).

---

### 5.8. Pin Terpadu (`/api/pins`)

Endpoint agregasi untuk fitur "Tambahkan Pin" cepat di peta.

- **`POST /api/pins`** 🔒
  - **Body Umum:** `{ "type": "odc", "name": "ODC Baru", "keterangan": "opsional", "lat": -7.87, "lng": 111.45 }`
  - **Mapping `type` → Tabel:**
    - `sto` → Tabel `sto` (kode auto-generated: `STO-<SLUG_NAMA>`).
    - `odc` → Tabel `odc` (default `kapasitas_port`: 0).
    - `odp` / `odp-tanam` / `odp-tiang` → Tabel `odp` (default `kapasitas_port`: 8).
    - `klien-aktif` / `klien-nonaktif` / `klien-pending` → Tabel `klien` (status disesuaikan).
  - Response 201: `{ "id": 42, "type": "odc", "name": "ODC Baru" }`

- **`GET /api/pins`**
  Publik. Mengembalikan gabungan semua pin dari 4 tabel (`sto`, `odc`, `odp`, `klien`) dalam satu array ringkas. Klien tanpa koordinat (`lat`/`lng` null) diabaikan.

---

### 5.9. Pengaturan Aplikasi (`/api/pengaturan`)

Menyimpan konfigurasi layer tampilan peta global (key-value store).

- **`GET /api/pengaturan`** (Publik) — Mengembalikan objek pengaturan dengan tipe data yang disesuaikan:

  ```json
  {
    "tampilkan_batas_kota": true,
    "tampilkan_odc": true,
    "tampilkan_klien": false
  }
  ```

- **`PUT /api/pengaturan/:kunci`** 🔒 — Update nilai boolean. Body: `{ "nilai": false }`.
  Kunci yang diizinkan: `tampilkan_batas_kota`, `tampilkan_batas_kecamatan`, `tampilkan_batas_desa`, `tampilkan_nama_kecamatan`, `tampilkan_nama_desa`, `tampilkan_odc`, `tampilkan_odp`, `tampilkan_kabel`, `tampilkan_klien`.

---

## 6. Model Relasi & Urutan Penghapusan Data

```
STO (1) ──── (N) OLT (1) ──── (N) ODC (1) ──── (N) ODP (1) ──── (N) Klien
                                                          │
                                                          └── nomor_port (unik per ODP)

Kabel: Entitas independen yang menghubungkan (dari_tipe/dari_id → ke_tipe/ke_id)
```

Untuk menjaga integritas referensial database, **Urutan Penghapusan Hirarki (dari paling dalam ke luar)**:

1. `Klien`
2. `ODP` (Dapat dihapus jika Klien di dalamnya sudah kosong)
3. `ODC` (Dapat dihapus jika ODP di dalamnya sudah kosong)
4. `OLT` (Dapat dihapus jika ODC di dalamnya sudah kosong)
5. `STO` (Dapat dihapus jika OLT di dalamnya sudah kosong)

---

## 7. Penanganan Kode Error REST API

Semua format error dikembalikan secara konsisten dalam bentuk JSON: `{ "error": "Pesan error..." }`.

| Status Code          | Deskripsi                  | Skenario Penggunaan                                                             |
| -------------------- | -------------------------- | ------------------------------------------------------------------------------- |
| `400 Bad Request`    | Form/Payload Tidak Valid   | Field wajib kosong, format koordinat salah, atau enum tidak dikenal             |
| `401 Unauthorized`   | Belum Autentikasi          | Sesi belum terautentikasi (belum login / session expired)                       |
| `404 Not Found`      | Resource Tidak Ada         | Record dengan `:id` atau `:kunci` tidak ditemukan                               |
| `409 Conflict`       | Bentrok Data / Proteksi FK | Kode/username duplikat, port terpakai, atau masih ada anak terhubung saat hapus |
| `500 Internal Error` | Server/Database Error      | Kegagalan kueri PostgreSQL atau error aplikasi internal                         |

---

## 8. Catatan untuk Pengembang Frontend

1. **Autentikasi State:** Selalu panggil `GET /api/me` saat awal inisialisasi aplikasi untuk menentukan visibilitas tombol edit/hapus/tambah.
2. **Efisiensi Render Peta:** Gunakan `GET /api/pins` untuk me-render marker peta awal secara ringkas. Panggil endpoint spesifik (`GET /api/odc/:id`, dll.) hanya ketika pengguna membuka panel detail/edit entitas.
3. **Pesan Error Inline:** Tangkap respon `409 Conflict` saat submit form (seperti ODC/ODP/STO) untuk menampilkan pesan "Kode sudah digunakan" langsung di bawah field form terkait.
4. **Auto-fill Alamat:** Kosongkan field `alamat` saat submit form baru jika ingin sistem mengisinya secara otomatis via reverse geocoding koordinat lokal. Jangan mengirim string kosong `""` jika tidak ingin dianggap diisi manual.
