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
                <li>Modal akan muncul dengan pilihan tipe pin (STO, OLT, ODC, ODP, Klien)</li>
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
                <li>Pilih tipe pin (STO, OLT, ODC, ODP, Klien)</li>
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
              <div class="pin-type-item">
                <strong>OLT</strong> - Optical Line Terminal (sumber feeder)
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
                <strong>Pencarian Koordinat:</strong> Gunakan search bar untuk mencari lokasi
                berdasarkan koordinat
              </li>
              <li>
                <strong>Ukur Jarak:</strong> Gunakan tool pengukur untuk menghitung jarak antar
                lokasi
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

          <!-- Bagian Tips -->
          <div class="panduan-section">
            <h3>💡 Tips & Trik</h3>
            <ul>
              <li>Selalu login sebelum menambah atau mengubah data</li>
              <li>Gunakan koordinat yang akurat untuk penempatan pin</li>
              <li>Lengkapi semua informasi wajib sebelum menyimpan</li>
              <li>Gunakan foto/screenshot untuk dokumentasi perangkat</li>
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
