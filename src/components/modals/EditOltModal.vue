<template>
  <Teleport to="body">
    <div v-if="visible" class="large-modal" @click.self="closeModal">
      <div class="large-modal-content">
        <div class="modal-header">
          <h3>Edit Optical Line Terminal (OLT)</h3>
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
            <div class="form-row-grid">
              <div class="input-group">
                <label>Kode OLT</label>
                <input v-model="formKode" type="text" required placeholder="OLT-PNR-01" />
              </div>
              <div class="input-group">
                <label>Nama OLT</label>
                <input v-model="formNama" type="text" required placeholder="Masukkan nama OLT..." />
              </div>
            </div>

            <div class="input-group">
              <label>STO Induk</label>
              <select v-model="formStoId">
                <option value="">Tidak ada (Legacy)</option>
                <option v-for="sto in stoList" :key="sto.id" :value="sto.id">
                  {{ sto.nama }} ({{ sto.kode }})
                </option>
              </select>
            </div>

            <div class="form-row-grid">
              <div class="input-group">
                <label>Jumlah Port PON</label>
                <input v-model.number="formJumlahPortPon" type="number" min="1" placeholder="16" />
              </div>
              <div class="input-group">
                <label>Vendor</label>
                <input
                  v-model="formVendor"
                  type="text"
                  placeholder="Misal: Huawei, ZTE, Nokia..."
                />
              </div>
            </div>

            <div class="input-group">
              <label>Catatan</label>
              <textarea
                v-model="formCatatan"
                rows="3"
                placeholder="Tambahkan catatan..."
              ></textarea>
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
              <span>Hapus OLT</span>
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
              Anda harus login untuk mengedit OLT. Silakan kembali dan login terlebih dahulu.
            </p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Delete Confirmation Modal -->
  <Teleport to="body">
    <div
      v-if="isDeleteModalVisible"
      class="large-modal delete-modal-overlay"
      @click.self="closeDeleteModal"
    >
      <div class="large-modal-content" style="max-width: 450px">
        <div class="modal-header">
          <h3 style="color: #ef4444">Konfirmasi Hapus OLT</h3>
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
              Anda akan menghapus <strong>{{ device?.data?.nama }}</strong> dari sistem. Kalau masih
              ada ODC yang terhubung ke OLT ini, penghapusan akan ditolak. Tindakan ini tidak dapat
              dibatalkan.
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
              {{ deleting ? "Menghapus..." : "Hapus OLT" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
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

const formKode = ref("");
const formNama = ref("");
const formStoId = ref("");
const formLat = ref(null);
const formLng = ref(null);
const formAlamat = ref("");
const formJumlahPortPon = ref(null);
const formVendor = ref("");
const formCatatan = ref("");
const errorMsg = ref("");
const saving = ref(false);

const stoList = ref([]);

const isDeleteModalVisible = ref(false);
const deleteConfirmText = ref("");
const deleting = ref(false);

onMounted(() => {
  loadStoList();
});

async function loadStoList() {
  try {
    const res = await fetch("/api/sto");
    if (res.ok) {
      stoList.value = await res.json();
    }
  } catch (err) {
    console.error("Gagal memuat daftar STO:", err);
  }
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal && props.device) {
      const d = props.device.data;
      formKode.value = d.kode || "";
      formNama.value = d.nama || "";
      formStoId.value = d.sto_id || "";
      formLat.value = d.lat ?? null;
      formLng.value = d.lng ?? null;
      formAlamat.value = d.alamat || "";
      formJumlahPortPon.value = d.jumlah_port_pon ?? null;
      formVendor.value = d.vendor || "";
      formCatatan.value = d.catatan || "";
      errorMsg.value = "";
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

  if (!formKode.value.trim() || !formNama.value.trim()) {
    errorMsg.value = "Kode dan Nama wajib diisi.";
    saving.value = false;
    return;
  }

  const bodyData = {
    kode: formKode.value.trim(),
    nama: formNama.value.trim(),
    sto_id: formStoId.value || null,
    lat: formLat.value ?? null,
    lng: formLng.value ?? null,
    alamat: formAlamat.value.trim() || null,
    jumlah_port_pon: formJumlahPortPon.value ?? null,
    vendor: formVendor.value.trim() || null,
    catatan: formCatatan.value.trim() || null,
  };

  try {
    const res = await fetch(`/api/olt/${props.device.data.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    });
    const data = await res.json();
    if (res.ok) {
      await store.loadAll();
      const updated = store.oltList.find((x) => x.id === props.device.data.id);
      if (updated) {
        store.setSelectedDevice({ type: "olt", data: updated });
      }
      success("Perubahan OLT berhasil disimpan!");
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
    const res = await fetch(`/api/olt/${props.device.data.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      isDeleteModalVisible.value = false;
      closeModal();
      await store.loadAll();
      store.clearSelectedDevice();
      success("OLT berhasil dihapus!");
    } else {
      const data = await res.json();
      error(data.error || "Gagal menghapus OLT.");
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
/* Hide spinner arrows on number inputs */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none !important;
  display: none !important;
  margin: 0 !important;
}

input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}

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
  transition: background-color 0.2s, color 0.2s;
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
</style>
