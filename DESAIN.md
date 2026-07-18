Ikon-ikon ini sengaja saya buat sebagai SVG (bukan gambar/foto), supaya ringan, gampang diubah warnanya, dan tidak bermasalah dari sisi hak cipta karena dibuat dari nol dengan bentuk sederhana.6 ikon dibuat, ditaruh di `public/icons/` — persis lokasi yang sudah dirujuk di kode `ICON_MAP` sebelumnya:

| File | Untuk apa |
|---|---|
| `odc.svg` | Perangkat ODC (merah, ikon kabinet) |
| `odp-tiang.svg` | ODP terpasang di tiang (oranye, ada gambar tiang) |
| `odp-tanam.svg` | ODP tanam/pit (oranye gelap, ada simbol tanah) |
| `klien-aktif.svg` | Pelanggan status aktif (hijau) |
| `klien-nonaktif.svg` | Pelanggan status nonaktif (abu-abu, tanda silang) |
| `klien-pending.svg` | Pelanggan status pending (kuning, tanda jam) |

Semua pakai skema warna yang sama dengan status di database (`aktif`/`nonaktif`/`pending`), jadi tinggal dipetakan langsung ke kode Leaflet yang sebelumnya sudah dicontohkan:

```javascript
const ICON_MAP = {
  odc: L.icon({ iconUrl: '/icons/odc.svg', iconSize: [32, 32] }),
  odp_tiang: L.icon({ iconUrl: '/icons/odp-tiang.svg', iconSize: [28, 28] }),
  odp_tanam: L.icon({ iconUrl: '/icons/odp-tanam.svg', iconSize: [28, 28] }),
  klien_aktif: L.icon({ iconUrl: '/icons/klien-aktif.svg', iconSize: [24, 24] }),
  klien_nonaktif: L.icon({ iconUrl: '/icons/klien-nonaktif.svg', iconSize: [24, 24] }),
  klien_pending: L.icon({ iconUrl: '/icons/klien-pending.svg', iconSize: [24, 24] })
};
```

Karena format SVG, ikon ini bisa diperbesar/perkecil di kode (`iconSize`) tanpa jadi pecah/blur — beda dengan PNG.

Kalau warnanya kurang pas, atau butuh ikon tambahan (misalnya untuk tiang tanpa ODP, atau simbol khusus untuk kerusakan/gangguan), kasih tahu saya dan saya sesuaikan.