<template>
  <div v-if="visible" class="large-modal" @click.self="closeModal">
    <div class="large-modal-content">
      <div class="modal-header">
        <h3>Edit Optical Distribution Cabinet (ODC)</h3>
        <button class="close-btn" @click="closeModal" title="Batal">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            style="width: 20px; height: 20px"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <form v-if="auth.isLoggedIn" @submit.prevent="saveChanges" class="modal-form">
        <div class="modal-body">
          <!-- Baris 1: Nama / Label | Alamat -->
          <div class="form-row-grid">
            <div class="input-group">
              <label>Nama / Label</label>
              <input v-model="formName" type="text" required placeholder="Masukkan nama..." />
            </div>
            <div class="input-group">
              <label>Alamat</label>
              <input v-model="formAlamat" type="text" placeholder="Alamat..." />
            </div>
          </div>

          <!-- Baris 2: Kode ODC | Status -->
          <div class="form-row-grid">
            <div class="input-group">
              <label>Kode ODC</label>
              <input v-model="formKode" type="text" placeholder="ODC-PNR-01" />
            </div>
            <div class="input-group">
              <label>Status</label>
              <select v-model="formStatus">
                <option value="planning">Planning</option>
                <option value="aktif">Aktif</option>
                <option value="maintenance">Maintenance</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          <!-- Baris 3: Tipe Pemasangan | OLT Sumber Feeder -->
          <div class="form-row-grid">
            <div class="input-group">
              <label>Tipe Pemasangan</label>
              <select v-model="formTipePemasangan">
                <option value="tiang">Tiang</option>
                <option value="tanam">Tanam</option>
                <option value="dinding">Dinding</option>
              </select>
            </div>

            <div class="input-group">
              <label>OLT Sumber Feeder</label>
              <select v-model="formOltId" :disabled="loadingOlt">
                <option value="">Belum ditentukan</option>
                <option v-for="olt in oltList" :key="olt.id" :value="olt.id">
                  {{ olt.kode }} — {{ olt.nama }}
                </option>
              </select>
            </div>
          </div>

          <!-- Baris 4: Rasio Splitter | Core Feeder -->
          <div class="form-row-grid">
            <div class="input-group">
              <label>Jumlah Core Feeder</label>
              <input v-model.number="formJumlahCoreFeeder" type="number" min="0" />
            </div>
            <div class="input-group">
              <label>Rasio Splitter</label>
              <select v-model="formRasioSplitter">
                <option value="">Pilih Rasio Splitter</option>
                <option value="1:4">1:4</option>
                <option value="1:8">1:8</option>
                <option value="1:16">1:16</option>
                <option value="1:32">1:32</option>
                <option value="1:64">1:64</option>
              </select>
            </div>
          </div>

          <!-- Baris 5: Jumlah Slot Splitter | Kapasitas Port -->
          <div class="form-row-grid">
            <div class="input-group">
              <label>Jumlah Slot Splitter</label>
              <select v-model.number="formJumlahSlotSplitter">
                <option :value="0">Pilih jumlah slot</option>
                <option v-for="opt in slotOptions" :key="opt" :value="opt">{{ opt }} slot</option>
              </select>
            </div>

            <div class="input-group">
              <div style="display: flex; justify-content: space-between; align-items: center">
                <label style="margin: 0">Kapasitas Port</label>
                <label class="manual-toggle">
                  <input type="checkbox" v-model="formKapasitasManual" />
                  Atur manual
                </label>
              </div>
              <input
                v-model.number="formKapasitas"
                type="number"
                min="0"
                required
                :disabled="!formKapasitasManual"
                :placeholder="!formKapasitasManual ? `Otomatis: ${kapasitasOtomatis}` : ''"
              />
              <span class="kapasitas-hint">
                {{
                  !formKapasitasManual
                    ? `Dihitung dari ${formJumlahSlotSplitter || 0} slot × rasio ${formRasioSplitter || "-"}`
                    : ""
                }}
              </span>
            </div>
          </div>

          <!-- Baris 6: Catatan -->
          <div class="input-group">
            <label>Catatan</label>
            <textarea v-model="formCatatan" rows="3" placeholder="Tambahkan catatan..."></textarea>
          </div>

          <div v-if="errorMsg" class="error-banner">{{ errorMsg }}</div>
        </div>

        <div class="modal-footer">
          <button type="button" class="delete-btn" @click="openDeleteModal">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="width: 14px; height: 14px"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path
                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
              ></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            <span>Hapus ODC</span>
          </button>
          <div style="flex: 1" class="footer-spacer"></div>
          <div class="footer-actions">
            <button type="button" class="cancel-btn" @click="closeModal">Batal</button>
            <button type="submit" class="save-btn" :disabled="saving">
              {{ saving ? "Menyimpan..." : "Simpan Perubahan" }}
            </button>
          </div>
        </div>
      </form>

      <div v-else class="modal-body" style="gap: 16px">
        <div
          style="
            background: rgba(239, 68, 68, 0.1);
            border-left: 3px solid #ef4444;
            padding: 12px 14px;
            border-radius: 0 6px 6px 0;
          "
        >
          <p style="margin: 0; font-size: 14px; color: var(--sb-text-primary)">
            Anda harus login untuk mengedit ODC. Silakan kembali dan login terlebih dahulu.
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <Teleport to="body">
    <div
      v-if="isDeleteModalVisible"
      class="large-modal delete-modal-overlay"
      @click.self="closeDeleteModal"
    >
      <div class="large-modal-content" style="max-width: 450px">
        <div class="modal-header">
          <h3 style="color: #ef4444">Konfirmasi Hapus ODC</h3>
          <button class="close-btn" @click="closeDeleteModal" title="Batal">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="width: 20px; height: 20px"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body" style="gap: 16px">
          <div
            style="
              background: rgba(239, 68, 68, 0.1);
              border-left: 3px solid #ef4444;
              padding: 12px 14px;
              border-radius: 0 6px 6px 0;
            "
          >
            <p style="margin: 0; font-size: 13px; color: var(--sb-text-primary)">
              Anda akan menghapus <strong>{{ device?.data?.nama }}</strong> dari sistem. Tindakan
              ini tidak dapat dibatalkan.
            </p>
          </div>

          <div class="input-group">
            <label>Ketik "HAPUS" untuk mengonfirmasi:</label>
            <input
              v-model="deleteConfirmText"
              type="text"
              placeholder="HAPUS"
              @keydown.enter="confirmDelete"
              style="text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500"
            />
          </div>
        </div>

        <div class="modal-footer">
          <div class="footer-actions">
            <button type="button" class="cancel-btn" @click="closeDeleteModal">Batal</button>
            <button
              type="button"
              class="delete-confirm-btn"
              :disabled="deleteConfirmText !== 'HAPUS' || deleting"
              @click="confirmDelete"
            >
              {{ deleting ? "Menghapus..." : "Hapus ODC" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { useInfrastrukturStore } from "@/stores/infrastruktur";
import { useAuthStore } from "@/stores/auth";
import { useNotification } from "@/composables/useNotification";

const props = defineProps({
  visible: Boolean,
  device: Object,
});

const emit = defineEmits(["close"]);

const store = useInfrastrukturStore();
const auth = useAuthStore();
const { success, error } = useNotification();

const formName = ref("");
const formAlamat = ref("");
const formKapasitas = ref(0);
const formCatatan = ref("");
const formKode = ref("");
const formOltId = ref("");
const formTipePemasangan = ref("tiang");
const formNomorTiang = ref("");
const formJumlahSlotSplitter = ref(0);
const formRasioSplitter = ref("");
const formJumlahCoreFeeder = ref(null);
const formStatus = ref("planning");
const formKapasitasManual = ref(false);
const errorMsg = ref("");
const saving = ref(false);

const oltList = ref([]);
const loadingOlt = ref(false);

// Opsi jumlah slot splitter mengikuti kapasitas fisik cabinet yang lazim per tipe pemasangan
const slotOptionsByTipe = {
  tiang: [2, 4, 6],
  tanam: [8, 12, 16, 24],
  dinding: [4, 6, 8, 12],
};
const slotOptions = computed(
  () => slotOptionsByTipe[formTipePemasangan.value] || [2, 4, 6, 8, 12, 16, 24],
);

// Kapasitas teoretis = jumlah slot terisi splitter x output per splitter (dari rasio, mis. 1:8 -> 8)
const kapasitasOtomatis = computed(() => {
  const outputPerSplitter = parseInt(formRasioSplitter.value?.split(":")[1], 10) || 0;
  return (formJumlahSlotSplitter.value || 0) * outputPerSplitter;
});

watch([formJumlahSlotSplitter, formRasioSplitter], () => {
  if (!formKapasitasManual.value) {
    formKapasitas.value = kapasitasOtomatis.value;
  }
});

// Delete states
const isDeleteModalVisible = ref(false);
const deleteConfirmText = ref("");
const deleting = ref(false);

async function loadOltList() {
  loadingOlt.value = true;
  try {
    const res = await fetch("/api/olt");
    if (res.ok) oltList.value = await res.json();
  } catch (err) {
    console.error("Gagal memuat daftar OLT:", err);
  } finally {
    loadingOlt.value = false;
  }
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal && props.device) {
      const d = props.device.data;
      formName.value = d.nama || "";
      formAlamat.value = d.alamat || "";
      formKapasitas.value = d.kapasitas_port || 0;
      formCatatan.value = d.catatan || "";
      formKode.value = d.kode || "";
      formOltId.value = d.olt_id || "";
      formTipePemasangan.value = d.tipe_pemasangan || "tiang";
      formNomorTiang.value = d.nomor_tiang || "";
      formJumlahSlotSplitter.value = d.jumlah_slot_splitter || 0;
      formRasioSplitter.value = d.rasio_splitter || "";
      formJumlahCoreFeeder.value = d.jumlah_core_feeder ?? null;
      formStatus.value = d.status || "planning";
      // Checkbox "Atur manual" hanya dicentang kalau kapasitas_port yang tersimpan
      // memang berbeda dari hasil hitung otomatis (slot x rasio) — bukan default
      // saat modal dibuka, supaya pin yang baru dipasang tidak langsung tercentang.
      {
        const outputPerSplitter = parseInt((d.rasio_splitter || "").split(":")[1], 10) || 0;
        const autoKapasitas = (d.jumlah_slot_splitter || 0) * outputPerSplitter;
        formKapasitasManual.value = (d.kapasitas_port || 0) !== autoKapasitas;
      }
      errorMsg.value = "";
      loadOltList();
    }
  },
);

function closeModal() {
  emit("close");
}

async function saveChanges() {
  if (!props.device) return;
  errorMsg.value = "";
  saving.value = true;

  const bodyData = {
    nama: formName.value.trim(),
    alamat: formAlamat.value.trim() || null,
    kapasitas_port: formKapasitas.value,
    catatan: formCatatan.value.trim() || null,
    lat: props.device.data.lat,
    lng: props.device.data.lng,
    kode: formKode.value.trim() || null,
    olt_id: formOltId.value || null,
    tipe_pemasangan: formTipePemasangan.value,
    nomor_tiang: formTipePemasangan.value === "tiang" ? formNomorTiang.value.trim() || null : null,
    jumlah_slot_splitter: formJumlahSlotSplitter.value,
    rasio_splitter: formRasioSplitter.value.trim() || null,
    jumlah_core_feeder: formJumlahCoreFeeder.value,
    status: formStatus.value,
  };

  try {
    const res = await fetch(`/api/odc/${props.device.data.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    });
    const data = await res.json();
    if (res.ok) {
      await store.loadAll();
      const updated = store.odcList.find((x) => x.id === props.device.data.id);
      if (updated) {
        store.setSelectedDevice({ type: "odc", data: updated });
      }
      success("Perubahan ODC berhasil disimpan!");
      closeModal();
    } else {
      errorMsg.value = data.error || "Gagal menyimpan perubahan.";
    }
  } catch (err) {
    errorMsg.value = "Gagal menghubungi server.";
    console.error(err);
  } finally {
    saving.value = false;
  }
}

function openDeleteModal() {
  deleteConfirmText.value = "";
  isDeleteModalVisible.value = true;
}

function closeDeleteModal() {
  deleteConfirmText.value = "";
  isDeleteModalVisible.value = false;
}

async function confirmDelete() {
  if (!props.device || deleteConfirmText.value !== "HAPUS") return;
  deleting.value = true;

  try {
    const res = await fetch(`/api/odc/${props.device.data.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      isDeleteModalVisible.value = false;
      closeModal();
      await store.loadAll();
      store.clearSelectedDevice();
      success("ODC berhasil dihapus!");
    } else {
      const data = await res.json();
      error(data.error || "Gagal menghapus ODC.");
    }
  } catch (err) {
    error("Gagal menghubungi server.");
    console.error(err);
  } finally {
    deleting.value = false;
  }
}
</script>

<style scoped>
.large-modal {
  display: flex;
  position: fixed;
  z-index: 2001;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(18, 18, 18, 0.75);
  backdrop-filter: blur(8px);
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.delete-modal-overlay {
  z-index: 2002;
}

.large-modal-content {
  background-color: var(--sb-bg-card);
  border: 1px solid var(--sb-border);
  color: var(--sb-text-primary);
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid var(--sb-border);
  position: relative;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  flex: 1;
}

.modal-header .close-btn {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--sb-text-secondary);
  border-radius: 50%;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.modal-header .close-btn:hover {
  background: var(--sb-bg-hover);
  color: var(--sb-text-primary);
}

.modal-form {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.modal-body {
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-group label {
  font-size: 12px;
  font-weight: 600;
  color: var(--sb-text-secondary);
}

.input-group input,
.input-group select,
.input-group textarea {
  background: var(--sb-bg-base);
  border: 1px solid var(--sb-border);
  border-radius: 6px;
  padding: 10px 14px;
  color: var(--sb-text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.manual-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 400;
  color: var(--sb-text-secondary);
  cursor: pointer;
}

.manual-toggle input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.kapasitas-hint {
  display: block;
  min-height: 14px;
  font-size: 11px;
  color: var(--sb-text-secondary);
}

.input-group input:focus,
.input-group select:focus,
.input-group textarea:focus {
  border-color: var(--sb-accent);
}

.form-row-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 480px) {
  .form-row-grid {
    grid-template-columns: 1fr;
  }
}

.error-banner {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid #ef4444;
  color: #ef4444;
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--sb-border);
  background: rgba(0, 0, 0, 0.1);
  align-items: center;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.cancel-btn {
  background: transparent;
  border: 1px solid var(--sb-border);
  color: var(--sb-text-primary);
  padding: 10px 18px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-btn:hover {
  background: var(--sb-bg-hover);
}

.save-btn {
  background: var(--sb-accent);
  color: var(--sb-accent-text);
  border: none;
  padding: 10px 18px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.save-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.2s ease;
}

.delete-btn:hover {
  background: #dc2626;
}

.delete-confirm-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.delete-confirm-btn:hover:not(:disabled) {
  background: #dc2626;
}

.delete-confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Mobile responsive styles */
@media (max-width: 480px) {
  .large-modal-content {
    max-width: calc(100vw - 24px);
    max-height: 95vh;
  }

  .modal-body {
    padding: 16px;
    gap: 12px;
  }

  .modal-footer {
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px;
  }

  .delete-btn {
    width: 100%;
    justify-content: center;
    padding: 10px 12px;
    font-size: 13px;
  }

  .cancel-btn,
  .save-btn,
  .delete-confirm-btn {
    padding: 10px 14px;
    font-size: 13px;
  }

  .footer-spacer {
    display: none;
  }

  .footer-actions {
    width: 100%;
    gap: 8px;
  }

  .footer-actions > button {
    flex: 1;
  }

  .input-group input,
  .input-group select,
  .input-group textarea {
    padding: 8px 10px;
    font-size: 13px;
  }

  .form-row-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .modal-header h3 {
    font-size: 16px;
  }
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none !important;
  display: none !important;
  margin: 0 !important;
}

input[type="number"] {
  -moz-appearance: textfield !important;
  appearance: none !important;
}
</style>
