<template>
  <div>
    <!-- Detail Sliding Panel -->
    <Transition name="slide">
      <div v-if="device" class="detail-panel" @click.stop>
        <!-- Header -->
        <div class="panel-header">
          <div class="header-main">
            <div
              class="device-icon"
              :style="{ background: deviceColor + '20', color: deviceColor }"
            >
              <DeviceIcon :type="device.type" />
            </div>
            <div class="header-titles">
              <h3>{{ device.data.nama }}</h3>
              <div style="display: flex; align-items: center; gap: 8px">
                <span class="device-type-badge">{{ deviceTypeName }}</span>
                <StatusBadge
                  v-if="headerBadge"
                  :label="headerBadge.label"
                  :color="headerBadge.color"
                  :bg="headerBadge.bg"
                />
              </div>
            </div>
          </div>
          <div class="header-actions">
            <button class="close-btn" @click="store.clearSelectedDevice" title="Tutup">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Content Body -->
        <div class="panel-body">
          <StoDetailSection v-if="device.type === 'sto'" ref="stoDetailSectionRef" :data="device.data" />
          <OltDetailSection v-else-if="device.type === 'olt'" :data="device.data" />
          <OdcDetailSection v-else-if="device.type === 'odc'" :data="device.data" />
          <OdpDetailSection
            v-else-if="device.type === 'odp'"
            :data="device.data"
            :color="deviceColor"
          />
          <KlienDetailSection v-else-if="device.type === 'klien'" :data="device.data" />

          <!-- Catatan umum: dipertahankan persis seperti versi sebelumnya. Catatan: kondisi
               ini secara efektif tidak pernah true untuk 4 tipe device yang ada saat ini,
               karena sto/klien punya baris catatan sendiri di section masing-masing, sementara
               odc/odp memang tidak menampilkan catatan sama sekali. Kemungkinan ini bug lama
               (odc/odp seharusnya juga menampilkan catatan) — beri tahu saya kalau mau dibetulkan. -->
          <div class="detail-section partition">
            <div
              v-if="
                device.data.catatan &&
                device.type !== 'klien' &&
                device.type !== 'odc' &&
                device.type !== 'odp' &&
                device.type !== 'sto'
              "
              class="detail-row notes-box"
            >
              <span class="label">Catatan</span>
              <p class="value italic">"{{ device.data.catatan }}"</p>
            </div>
          </div>
        </div>

        <!-- Footer containing Edit button -->
        <div v-if="auth.isLoggedIn" class="panel-footer">
          <button class="edit-action-btn" @click="openEditModal" title="Edit Data">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="width: 14px; height: 14px"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Edit Data</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Edit Modals (delegated to dedicated components) -->
    <EditStoModal
      v-if="device && device.type === 'sto'"
      :visible="isEditModalVisible"
      :device="device"
      @close="closeEditModal"
      @olt-created="onOltCreated"
    />
    <EditOdcModal
      v-if="device && device.type === 'odc'"
      :visible="isEditModalVisible"
      :device="device"
      @close="closeEditModal"
    />
    <EditOdpModal
      v-if="device && device.type === 'odp'"
      :visible="isEditModalVisible"
      :device="device"
      @close="closeEditModal"
    />
    <EditKlienModal
      v-if="device && device.type === 'klien'"
      :visible="isEditModalVisible"
      :device="device"
      @close="closeEditModal"
    />
    <EditOltModal
      v-if="device && device.type === 'olt'"
      :visible="isEditModalVisible"
      :device="device"
      @close="closeEditModal"
    />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useInfrastrukturStore } from "@/stores/infrastruktur";
import { useAuthStore } from "@/stores/auth";
import EditStoModal from "@/components/modals/EditStoModal.vue";
import EditOltModal from "@/components/modals/EditOltModal.vue";
import EditOdcModal from "@/components/modals/EditOdcModal.vue";
import EditOdpModal from "@/components/modals/EditOdpModal.vue";
import EditKlienModal from "@/components/modals/EditKlienModal.vue";
import DeviceIcon from "@/components/DeviceIcon.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import StoDetailSection from "@/components/detail-sections/StoDetailSection.vue";
import OltDetailSection from "@/components/detail-sections/OltDetailSection.vue";
import OdcDetailSection from "@/components/detail-sections/OdcDetailSection.vue";
import OdpDetailSection from "@/components/detail-sections/OdpDetailSection.vue";
import KlienDetailSection from "@/components/detail-sections/KlienDetailSection.vue";
import { getStatusBadge } from "@/utils/statusBadge";
import "@/assets/detail-panel-shared.css";

const store = useInfrastrukturStore();
const auth = useAuthStore();

const device = computed(() => store.selectedDevice);

// Edit modal visibility — actual form state lives in each modal component
const isEditModalVisible = ref(false);
const stoDetailSectionRef = ref(null);

const deviceColor = computed(() => {
  if (!device.value) return "var(--sb-accent)";
  switch (device.value.type) {
    case "sto":
      return "#a855f7";
    case "olt":
      return "#06b6d4";
    case "odc":
      return "#3ecf8e";
    case "odp":
      return "#3b82f6";
    case "klien":
      if (device.value.data.status === "aktif") return "#10b981";
      if (device.value.data.status === "nonaktif") return "#ef4444";
      return "#f59e0b";
    default:
      return "var(--sb-accent)";
  }
});

const deviceTypeName = computed(() => {
  if (!device.value) return "";
  switch (device.value.type) {
    case "sto":
      return "STO";
    case "olt":
      return "OLT";
    case "odc":
      return "ODC";
    case "odp":
      return "ODP";
    case "klien":
      return "Pelanggan";
    default:
      return "";
  }
});

// Status default per tipe device kalau field status kosong dari data.
// Dipakai getStatusBadge() untuk badge kecil di header (menggantikan 12 computed
// statusLabel/Color/Bg yang sebelumnya ada, satu set per tipe device).
// OLT tidak punya field status, jadi tidak ada default untuknya.
const STATUS_DEFAULTS = { sto: "aktif", odc: "planning", odp: "planning", klien: "pending" };

const headerBadge = computed(() => {
  if (!device.value) return null;
  const defaultStatus = STATUS_DEFAULTS[device.value.type];
  if (!defaultStatus) return null;
  return getStatusBadge(device.value.data.status, defaultStatus);
});

function openEditModal() {
  if (!device.value) return;
  isEditModalVisible.value = true;
}

function closeEditModal() {
  isEditModalVisible.value = false;
}

function onOltCreated() {
  if (stoDetailSectionRef.value) {
    stoDetailSectionRef.value.loadOltForSto(device.value?.data?.id);
  }
}
</script>

<style scoped>
.detail-panel {
  position: absolute;
  z-index: 1000;
  background: var(--sb-bg-panel);
  border: 1px solid var(--sb-border);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(16px);
  display: flex;
  flex-direction: column;
  color: var(--sb-text-primary);
  overflow: hidden;
  transition:
    transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.35s ease;
}

/* Header styling */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--sb-border);
}

.header-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.device-icon svg {
  width: 24px;
  height: 24px;
}

.header-titles h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.device-type-badge {
  font-size: 11px;
  color: var(--sb-text-secondary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-action-btn {
  background: var(--sb-accent);
  color: var(--sb-accent-text);
  border: none;
  font-weight: 600;
  font-size: 13px;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s ease;
}

.edit-action-btn:hover {
  background: var(--sb-accent-hover);
}

.panel-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--sb-border);
  background: rgba(0, 0, 0, 0.15);
  display: flex;
  justify-content: stretch;
}

.panel-footer .edit-action-btn {
  width: 100%;
  justify-content: center;
}

.edit-action-btn svg {
  width: 13px;
  height: 13px;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--sb-text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: var(--sb-text-primary);
  background: var(--sb-bg-hover);
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

/* Body styling */
.panel-body {
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: var(--sb-border) transparent;
}

/* Custom Scrollbar for Webkit (Chrome, Safari, Edge) */
.panel-body::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.panel-body::-webkit-scrollbar-track {
  background: transparent;
}

.panel-body::-webkit-scrollbar-thumb {
  background: var(--sb-border);
  border-radius: 99px;
}

.panel-body::-webkit-scrollbar-thumb:hover {
  background: var(--sb-border-hover);
}

.detail-section.partition {
  border-top: 1px solid var(--sb-border);
  padding-top: 20px;
}

/* NOTE: berikut ini styling untuk large-modal / form edit (modal-header, modal-body,
   input-group, dst) dan delete-btn/delete-confirm-btn. Berdasarkan template DetailPanel
   saat ini, tidak ada elemen yang memakai class-class ini lagi (form edit sudah
   didelegasikan penuh ke EditStoModal/EditOdcModal/EditOdpModal/EditKlienModal).
   Kemungkinan ini sisa dari sebelum modal diekstrak ke component terpisah.
   Saya BELUM menghapusnya karena scoped CSS di sini hanya otomatis "bocor" ke elemen
   root dari child component (bukan ke semua elemen di dalam template child) — jadi
   kalau salah satu Edit*Modal.vue kebetulan TIDAK men-scope style-nya sendiri dan
   diam-diam mengandalkan aturan ini, menghapusnya bisa merusak tampilan modal.
   Cek dulu style di Edit*Modal.vue sebelum menghapus blok ini. */
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
  flex-shrink: 0;
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--sb-border);
  background: rgba(0, 0, 0, 0.1);
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
  padding: 10px 12px;
  color: var(--sb-text-primary);
  font-size: 14px;
  transition: border-color 0.2s;
  outline: none;
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

@media (max-width: 550px) {
  .form-row-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.client-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.error-banner {
  background: var(--sb-error-bg);
  color: var(--sb-error);
  font-size: 13px;
  padding: 10px 14px;
  border-radius: 6px;
  font-weight: 500;
  margin-top: 4px;
}

.cancel-btn {
  background: transparent;
  color: var(--sb-text-primary);
  border: 1px solid var(--sb-border);
  padding: 10px 18px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
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
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:hover {
  background: var(--sb-accent-hover);
}

.save-btn:disabled {
  opacity: 0.6;
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
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background: #dc2626;
}

.delete-btn:active {
  transform: scale(0.98);
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
  transition: all 0.2s;
}

.delete-confirm-btn:hover:not(:disabled) {
  background: #dc2626;
}

.delete-confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-confirm-btn:active:not(:disabled) {
  transform: scale(0.98);
}

/* Responsive Desktop & Mobile layout */
@media (min-width: 768px) {
  .detail-panel {
    top: 20px;
    left: 20px;
    bottom: 20px;
    width: 360px;
    border-radius: 12px;
  }

  /* Transition slide from left */
  .slide-enter-from,
  .slide-leave-to {
    transform: translateX(-400px);
    opacity: 0;
  }

  .slide-enter-to,
  .slide-leave-from {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 767px) {
  .detail-panel {
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 50vh;
    border-radius: 16px 16px 0 0;
    border-bottom: none;
    border-left: none;
    border-right: none;
  }

  /* Transition slide from bottom */
  .slide-enter-from,
  .slide-leave-to {
    transform: translateY(100%);
    opacity: 0;
  }

  .slide-enter-to,
  .slide-leave-from {
    transform: translateY(0);
    opacity: 1;
  }
}
/* Hide spin buttons for input number within the detail panel */
.modal-body input[type="number"]::-webkit-inner-spin-button,
.modal-body input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none !important;
  margin: 0 !important;
}

.modal-body input[type="number"] {
  -moz-appearance: textfield !important;
  appearance: none !important;
}
</style>
