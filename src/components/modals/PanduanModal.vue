<template>
  <Teleport to="body">
    <div v-if="visible" class="panduan-overlay" @click.self="onClose">
      <div class="panduan-modal">
        <div class="panduan-header">
          <h2>Panduan Penggunaan KenMap</h2>
          <button class="btn-close" @click="onClose" title="Tutup">✕</button>
        </div>

        <div class="panduan-content">
          <!-- Bagian Login -->
          <div class="panduan-section">
            <h3>🔐 Login</h3>
            <p>
              Sebelum menambahkan atau mengedit data, Anda perlu login terlebih dahulu. Klik tombol
              <strong>Login</strong> di sudut kanan atas dan masukkan kredensial Anda.
            </p>
          </div>

          <!-- Bagian Desktop/Komputer -->
          <div class="panduan-section">
            <h3>💻 Cara Menambah Pin (Komputer)</h3>
            <div class="tutorial-item">
              <h4>Metode 1: Double-Click</h4>
              <ol>
                <li>Login terlebih dahulu</li>
                <li>Buka peta dan arahkan ke lokasi yang diinginkan</li>
                <li><strong>Double-click (klik 2 kali)</strong> pada lokasi di peta</li>
                <li>Modal akan muncul dengan pilihan tipe pin (STO, ODC, ODP, Klien)</li>
                <li>Pilih tipe pin yang sesuai dengan kebutuhan Anda</li>
                <li>Isi informasi yang diperlukan</li>
                <li>Klik <strong>Simpan</strong></li>
              </ol>
            </div>

            <div class="tutorial-item">
              <h4>Metode 2: Klik Kanan (Right-Click)</h4>
              <ol>
                <li>Login terlebih dahulu</li>
                <li>Buka peta dan arahkan ke lokasi yang diinginkan</li>
                <li><strong>Klik kanan (right-click)</strong> pada lokasi di peta</li>
                <li>Pilih <strong>"Tambah Pin"</strong> dari menu konteks</li>
                <li>Pilih tipe pin yang sesuai</li>
                <li>Isi informasi yang diperlukan</li>
                <li>Klik <strong>Simpan</strong></li>
              </ol>
            </div>

            <div class="tutorial-item">
              <h4>Metode 3: Tombol Tambah Pin di Header</h4>
              <ol>
                <li>Login terlebih dahulu</li>
                <li>Klik tombol <strong>"+ Tambah Pin"</strong> di bagian atas peta</li>
                <li>Klik lokasi di peta untuk menentukan posisi</li>
                <li>Pilih tipe pin</li>
                <li>Isi informasi lengkap</li>
                <li>Klik <strong>Simpan</strong></li>
              </ol>
            </div>
          </div>

          <!-- Bagian Mobile -->
          <div class="panduan-section">
            <h3>📱 Cara Menambah Pin (Mobile/HP)</h3>
            <div class="tutorial-item">
              <h4>Metode 1: Double-Tap</h4>
              <ol>
                <li>Login terlebih dahulu</li>
                <li>Buka peta di perangkat mobile Anda</li>
                <li><strong>Tap 2 kali (double-tap)</strong> pada lokasi di peta</li>
                <li>Modal akan muncul dengan pilihan tipe pin</li>
                <li>Pilih tipe pin yang sesuai</li>
                <li>Isi informasi yang diperlukan</li>
                <li>Tap <strong>Simpan</strong></li>
              </ol>
            </div>

            <div class="tutorial-item">
              <h4>Metode 2: Long-Press (Tekan Tahan)</h4>
              <ol>
                <li>Login terlebih dahulu</li>
                <li>Buka peta di perangkat mobile Anda</li>
                <li><strong>Tekan dan tahan (long-press)</strong> pada lokasi di peta</li>
                <li>Modal untuk tambah pin akan muncul</li>
                <li>Pilih tipe pin (STO, ODC, ODP, Klien)</li>
                <li>Isi semua informasi yang diperlukan</li>
                <li>Tap <strong>Simpan</strong></li>
              </ol>
            </div>
          </div>

          <!-- Bagian Tipe Pin -->
          <div class="panduan-section">
            <h3>📍 Jenis-Jenis Pin</h3>
            <div class="pin-types">
              <div class="pin-type-item">
                <strong>STO</strong> - Splice/Terminal Office (gedung sentral)
              </div>
              <div class="pin-type-item pin-type-note">
                <strong>OLT</strong> - Optical Line Terminal (sumber feeder).
                <em
                  >Bukan pin peta — ditambahkan lewat form edit STO, lihat penjelasan di bawah.</em
                >
              </div>
              <div class="pin-type-item">
                <strong>ODC</strong> - Optical Distribution Cabinet (lemari distribusi)
              </div>
              <div class="pin-type-item">
                <strong>ODP</strong> - Optical Distribution Point (titik distribusi)
              </div>
              <div class="pin-type-item"><strong>Klien</strong> - Pelanggan FTTH</div>
            </div>
          </div>

          <!-- Bagian Struktur Jaringan (Hierarki) -->
          <div class="panduan-section">
            <h3>🌳 Struktur Jaringan</h3>
            <p>
              Setiap perangkat terhubung dalam hierarki berjenjang — satu perangkat di level atas
              bisa menaungi banyak perangkat di level bawahnya:
            </p>
            <svg class="hierarki-svg" viewBox="0 0 680 160" role="img">
              <title>Hierarki struktur jaringan KenMap</title>
              <desc>
                Diagram alur STO ke OLT ke ODC ke ODP ke Klien menunjukkan hierarki satu ke banyak
              </desc>
              <defs>
                <marker
                  id="panduan-arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path
                    d="M2 1L8 5L2 9"
                    fill="none"
                    stroke="#3ecf8e"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </marker>
              </defs>

              <rect x="40" y="60" width="100" height="56" rx="8" class="node-infra" />
              <text
                x="90"
                y="78"
                text-anchor="middle"
                dominant-baseline="central"
                class="node-title"
              >
                STO
              </text>
              <text x="90" y="96" text-anchor="middle" dominant-baseline="central" class="node-sub">
                Sentral
              </text>

              <line
                x1="140"
                y1="88"
                x2="158"
                y2="88"
                class="node-arrow"
                marker-end="url(#panduan-arrow)"
              />

              <rect x="160" y="60" width="100" height="56" rx="8" class="node-infra" />
              <text
                x="210"
                y="78"
                text-anchor="middle"
                dominant-baseline="central"
                class="node-title"
              >
                OLT
              </text>
              <text
                x="210"
                y="96"
                text-anchor="middle"
                dominant-baseline="central"
                class="node-sub"
              >
                Feeder utama
              </text>

              <line
                x1="260"
                y1="88"
                x2="278"
                y2="88"
                class="node-arrow"
                marker-end="url(#panduan-arrow)"
              />

              <rect x="280" y="60" width="100" height="56" rx="8" class="node-infra" />
              <text
                x="330"
                y="78"
                text-anchor="middle"
                dominant-baseline="central"
                class="node-title"
              >
                ODC
              </text>
              <text
                x="330"
                y="96"
                text-anchor="middle"
                dominant-baseline="central"
                class="node-sub"
              >
                Distribusi
              </text>

              <line
                x1="380"
                y1="88"
                x2="398"
                y2="88"
                class="node-arrow"
                marker-end="url(#panduan-arrow)"
              />

              <rect x="400" y="60" width="100" height="56" rx="8" class="node-infra" />
              <text
                x="450"
                y="78"
                text-anchor="middle"
                dominant-baseline="central"
                class="node-title"
              >
                ODP
              </text>
              <text
                x="450"
                y="96"
                text-anchor="middle"
                dominant-baseline="central"
                class="node-sub"
              >
                Titik akhir
              </text>

              <line
                x1="500"
                y1="88"
                x2="518"
                y2="88"
                class="node-arrow"
                marker-end="url(#panduan-arrow)"
              />

              <rect x="520" y="60" width="100" height="56" rx="8" class="node-klien" />
              <text
                x="570"
                y="78"
                text-anchor="middle"
                dominant-baseline="central"
                class="node-title"
              >
                Klien
              </text>
              <text
                x="570"
                y="96"
                text-anchor="middle"
                dominant-baseline="central"
                class="node-sub node-sub-klien"
              >
                Pelanggan
              </text>
            </svg>
            <p class="hierarki-caption">
              Satu STO bisa menaungi banyak OLT, satu OLT banyak ODC, dan seterusnya sampai ke
              Klien. Saat menambah perangkat baru, pastikan Anda menghubungkannya ke perangkat induk
              yang tepat di level atasnya.
            </p>
          </div>

          <!-- Bagian Cara Menambah OLT -->
          <div class="panduan-section">
            <h3>➕ Cara Menambahkan OLT</h3>
            <p>
              Berbeda dari STO, ODC, ODP, dan Klien,
              <strong>OLT tidak bisa ditambahkan langsung lewat klik di peta</strong>. OLT
              ditambahkan dari dalam form edit STO, dan STO-nya harus sudah ada terlebih dahulu:
            </p>
            <div class="tutorial-item">
              <ol>
                <li>Tambahkan pin <strong>STO</strong> terlebih dahulu (kalau belum ada)</li>
                <li>Klik pin STO tersebut di peta, lalu klik <strong>Edit</strong></li>
                <li>
                  Di dalam form edit STO, cari bagian <strong>"OLT Terhubung"</strong>, lalu klik
                  tombol <strong>"+ Tambah OLT"</strong>
                </li>
                <li>Isi <strong>Kode OLT</strong> dan <strong>Nama OLT</strong></li>
                <li>Klik <strong>"Buat OLT"</strong></li>
              </ol>
            </div>
            <p class="hierarki-caption">
              Karena OLT selalu terhubung ke satu STO, sebuah STO tidak bisa dihapus selama masih
              ada OLT yang terhubung ke dalamnya — hapus atau pindahkan dulu OLT-nya sebelum
              menghapus STO.
            </p>
          </div>

          <!-- Bagian Fitur yang Akan Datang -->
          <div class="panduan-section">
            <h3>🚧 Segera Hadir</h3>
            <p class="coming-soon-note">
              <strong>Manajemen Kabel</strong> — menggambar dan mengelola jalur kabel (feeder,
              distribusi, drop) langsung di peta.
            </p>
            <p class="coming-soon-note">
              <strong>Upload Foto</strong> — melampirkan foto dokumentasi ke data STO, ODC, dan ODP.
            </p>
            <p>Kedua fitur ini sedang dalam pengembangan dan akan tersedia di versi selanjutnya.</p>
          </div>

          <!-- Bagian Edit & Lihat Detail -->
          <div class="panduan-section">
            <h3>✏️ Melihat dan Mengedit Data</h3>
            <p>
              <strong>Klik pada pin di peta</strong> untuk melihat detail dan informasi lengkapnya.
              Panel detail akan muncul di sisi kanan dengan informasi perangkat.
            </p>
            <p>
              Untuk <strong>mengedit data</strong>, klik tombol <strong>"Edit"</strong> di panel
              detail. Ubah informasi yang diinginkan dan klik <strong>Simpan</strong>.
            </p>
          </div>

          <!-- Bagian Fitur Tambahan -->
          <div class="panduan-section">
            <h3>🛠️ Fitur Tambahan</h3>
            <ul>
              <li>
                <strong>Pencarian:</strong> Gunakan search bar untuk mencari lokasi berdasarkan
                koordinat, atau cari langsung berdasarkan nama/kode <strong>ODC</strong>,
                <strong>ODP</strong>, atau <strong>Klien</strong>. Peta akan otomatis berpindah ke
                lokasi hasil pencarian.
              </li>
              <li>
                <strong>Ukur Jarak:</strong>
                <ol>
                  <li>Klik ikon pengukur, lalu klik pada peta untuk menentukan titik awal (A)</li>
                  <li>
                    Klik titik berikutnya (B, C, dan seterusnya) untuk membentuk garis — jarak total
                    akan otomatis dihitung dan ditampilkan
                  </li>
                  <li>
                    Salah klik titik? Tekan <strong>Ctrl+Z</strong> (atau tombol undo) untuk
                    menghapus titik terakhir yang ditambahkan
                  </li>
                </ol>
              </li>
              <li>
                <strong>Filter Layer:</strong> Gunakan sidebar untuk menampilkan/menyembunyikan
                layer tertentu
              </li>
              <li>
                <strong>Ganti Basemap:</strong> Klik ikon basemap untuk memilih tampilan peta
                (jalan/satelit)
              </li>
              <li>
                <strong>Lokasi Saat Ini:</strong> Klik ikon lokasi untuk melihat posisi Anda saat
                ini
              </li>
            </ul>
          </div>

          <!-- Bagian Instal Aplikasi (PWA) -->
          <div class="panduan-section">
            <h3>📲 Instal Aplikasi (PWA)</h3>
            <p>
              KenMap bisa diinstal sebagai aplikasi di komputer maupun HP, seperti aplikasi native —
              tanpa perlu App Store/Play Store. Setelah diinstal, aplikasi punya ikon sendiri dan
              bisa dibuka tanpa membuka browser terlebih dahulu.
            </p>

            <div class="tutorial-item">
              <h4>💻 Cara Install (Komputer — Chrome/Edge)</h4>
              <ol>
                <li>Buka KenMap di browser</li>
                <li>
                  Klik ikon <strong>install</strong> (biasanya berbentuk layar dengan panah ke
                  bawah) di ujung kanan address bar
                </li>
                <li>
                  Kalau ikon tidak muncul, buka menu titik tiga (⋮) → cari opsi "Install KenMap…"
                </li>
                <li>Klik <strong>Install</strong> pada dialog konfirmasi</li>
              </ol>
            </div>

            <div class="tutorial-item">
              <h4>📱 Cara Install (Android — Chrome)</h4>
              <ol>
                <li>Buka KenMap di Chrome</li>
                <li>Tap menu titik tiga (⋮) di kanan atas</li>
                <li>
                  Pilih <strong>"Install aplikasi"</strong> atau
                  <strong>"Tambahkan ke layar utama"</strong>
                </li>
                <li>Tap <strong>Install</strong> pada dialog konfirmasi</li>
              </ol>
            </div>

            <div class="tutorial-item">
              <h4>📱 Cara Install (iPhone/iPad — Safari)</h4>
              <ol>
                <li>Buka KenMap di Safari (harus Safari, browser lain tidak bisa)</li>
                <li>Tap ikon <strong>Share/Bagikan</strong> (kotak dengan panah ke atas)</li>
                <li>Pilih <strong>"Tambah ke Layar Utama"</strong></li>
                <li>Tap <strong>Tambah</strong> di pojok kanan atas</li>
              </ol>
            </div>

            <p class="hierarki-caption">
              Catatan: tombol install hanya muncul kalau situs diakses lewat
              <strong>HTTPS</strong> (atau <code>localhost</code>). Kalau aplikasi diakses lewat
              alamat HTTP biasa (misalnya IP lokal tanpa HTTPS), tombol install tidak akan tersedia.
            </p>

            <h4 class="pwa-subheading">🔄 Cara Update Kalau Ada Fitur Baru</h4>
            <p>
              KenMap otomatis mengecek pembaruan setiap kali aplikasi dibuka. Kalau ada versi baru:
            </p>
            <ul>
              <li>Pembaruan akan terunduh otomatis di latar belakang saat Anda memakai aplikasi</li>
              <li>
                Tutup aplikasi sepenuhnya lalu buka lagi (atau refresh halaman) untuk memuat versi
                terbaru
              </li>
              <li>
                Kalau setelah refresh masih terasa ada yang aneh/fitur baru belum muncul, coba tutup
                aplikasi dari task switcher (bukan cuma minimize), lalu buka ulang
              </li>
            </ul>
          </div>

          <!-- Bagian Tips -->
          <div class="panduan-section">
            <h3>💡 Tips & Trik</h3>
            <ul>
              <li>Selalu login sebelum menambah atau mengubah data</li>
              <li>Gunakan koordinat yang akurat untuk penempatan pin</li>
              <li>Lengkapi semua informasi wajib sebelum menyimpan</li>
              <li>Periksa kembali data sebelum menyimpan untuk menghindari kesalahan</li>
            </ul>
          </div>
        </div>

        <div class="panduan-footer">
          <button class="btn-close-footer" @click="onClose">Tutup</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  visible: Boolean,
});

const emit = defineEmits(["close"]);

function onClose() {
  emit("close");
}
</script>

<style scoped>
.panduan-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  overflow-y: auto;
}

.panduan-modal {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  width: 90%;
  max-width: 700px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin: auto;
}

.panduan-header {
  padding: 20px 24px;
  border-bottom: 1px solid #27272a;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panduan-header h2 {
  margin: 0;
  color: #ededed;
  font-size: 18px;
  font-weight: 600;
}

.btn-close {
  background: transparent;
  border: 1px solid #27272a;
  border-radius: 6px;
  color: #a1a1aa;
  width: 32px;
  height: 32px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: #27272a;
  color: #ededed;
  border-color: #3f3f46;
}

.panduan-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  color: #a1a1aa;
  font-size: 14px;
  line-height: 1.6;
}

.panduan-section {
  margin-bottom: 28px;
}

.panduan-section h3 {
  color: #ededed;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #27272a;
}

.panduan-section p {
  margin: 8px 0;
  color: #a1a1aa;
}

.panduan-section ul,
.panduan-section ol {
  margin: 8px 0;
  padding-left: 20px;
}

.panduan-section li {
  margin: 6px 0;
  color: #a1a1aa;
}

.tutorial-item {
  background: #27272a;
  border-left: 3px solid #3ecf8e;
  padding: 12px 16px;
  border-radius: 6px;
  margin: 12px 0;
}

.tutorial-item h4 {
  margin: 0 0 8px 0;
  color: #3ecf8e;
  font-size: 14px;
  font-weight: 600;
}

.tutorial-item ol {
  margin: 8px 0;
  padding-left: 24px;
}

.tutorial-item li {
  margin: 4px 0;
  color: #a1a1aa;
  font-size: 13px;
}

.pin-types {
  background: #27272a;
  border-radius: 6px;
  padding: 12px;
}

.pin-type-item {
  padding: 8px 12px;
  margin: 6px 0;
  background: #3f3f46;
  border-radius: 4px;
  color: #a1a1aa;
  font-size: 13px;
}

.pin-type-note em {
  display: block;
  font-style: normal;
  color: #e0a458;
  font-size: 12px;
  margin-top: 4px;
}

.pwa-subheading {
  color: #ededed;
  font-size: 14px;
  font-weight: 600;
  margin: 20px 0 8px 0;
}

code {
  background: #27272a;
  border: 1px solid #3f3f46;
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 12px;
  color: #3ecf8e;
  font-family: monospace;
}

.hierarki-svg {
  width: 100%;
  height: auto;
  margin: 8px 0;
}

.node-infra {
  fill: #1b3a30;
  stroke: #3ecf8e;
  stroke-width: 1;
}

.node-klien {
  fill: #3a2416;
  stroke: #e0a458;
  stroke-width: 1;
}

.node-title {
  fill: #ededed;
  font-size: 14px;
  font-weight: 600;
}

.node-sub {
  fill: #a1a1aa;
  font-size: 12px;
}

.node-sub-klien {
  fill: #d8b78a;
}

.node-arrow {
  stroke: #3ecf8e;
  stroke-width: 1.5;
}

.hierarki-caption {
  font-size: 13px;
  color: #a1a1aa;
  margin-top: 8px;
}

.coming-soon-note {
  background: #27272a;
  border-left: 3px solid #e0a458;
  padding: 12px 16px;
  border-radius: 6px;
  color: #a1a1aa;
  font-size: 13px;
  margin: 0 0 10px 0;
}

.coming-soon-note strong {
  color: #e0a458;
}

.panduan-footer {
  padding: 12px 24px;
  border-top: 1px solid #27272a;
  display: flex;
  justify-content: flex-end;
}

.btn-close-footer {
  padding: 8px 20px;
  background: #3ecf8e;
  color: #121212;
  border: 1px solid #3ecf8e;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close-footer:hover {
  background: #30b078;
  border-color: #30b078;
}

/* Scrollbar styling */
.panduan-content::-webkit-scrollbar {
  width: 6px;
}

.panduan-content::-webkit-scrollbar-track {
  background: #27272a;
  border-radius: 3px;
}

.panduan-content::-webkit-scrollbar-thumb {
  background: #3ecf8e;
  border-radius: 3px;
}

.panduan-content::-webkit-scrollbar-thumb:hover {
  background: #30b078;
}

strong {
  color: #ededed;
}
</style>
