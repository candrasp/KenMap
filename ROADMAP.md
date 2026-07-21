# Roadmap KenMap

Dokumen ini mencatat rencana pengembangan fitur KenMap ke depannya. Fitur yang belum tercantum di sini masih bisa diusulkan dan ditambahkan kapan saja.

## Status Saat Ini

Fitur berikut sudah berjalan di versi sekarang:

- Manajemen perangkat STO, OLT, ODC, ODP (tambah/edit/hapus)
- Manajemen pelanggan (Klien) terhubung ke ODP
- Pencarian berdasarkan koordinat, ODC, ODP, dan Klien
- Alat ukur jarak di peta
- Peta satelit dan jalan offline khusus wilayah Kabupaten Ponorogo
- Login admin dengan session tersimpan di Postgres

## Rencana Pengembangan

### Prioritas Tinggi

- [ ] **Manajemen Kabel**
      Kemampuan menggambar jalur kabel (feeder, distribusi, drop) langsung di peta, mengikuti titik A–B–C dan seterusnya, lengkap dengan input panjang, jumlah core, dan redaman. Tabel `kabel` di database sudah siap (`dari_tipe`/`dari_id` → `ke_tipe`/`ke_id`), tinggal dibangun UI untuk menggambar dan mengedit garisnya di peta.

- [ ] **Upload Foto**
      Melampirkan foto dokumentasi ke data STO, ODC, dan ODP (kolom `foto_url` sudah ada di skema database, tinggal dibangun alur upload-nya — form input, penyimpanan file, dan tampilan di panel detail).

### Prioritas Menengah

- [ ] _(kosong — isi sesuai kebutuhan berikutnya)_

### Prioritas Rendah / Ide Masa Depan

- [ ] _(kosong — isi sesuai kebutuhan berikutnya)_

## Catatan

- Setiap fitur baru yang selesai dibangun sebaiknya juga diupdate di `PanduanModal.vue` (panduan penggunaan in-app) dan `README.md`.
- Urutan prioritas bisa berubah sesuai kebutuhan lapangan.
