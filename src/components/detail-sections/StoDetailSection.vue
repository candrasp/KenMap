<template>
  <div class="detail-section">
    <div v-if="data.kode" class="detail-row">
      <span class="label">Kode STO</span>
      <span class="value" style="font-family: monospace">{{ data.kode }}</span>
    </div>
    <AddressWithMapButton :alamat="data.alamat" :lat="data.lat" :lng="data.lng" />
    <div class="detail-row">
      <span class="value coords">{{ data.lat.toFixed(6) }}, {{ data.lng.toFixed(6) }}</span>
    </div>

    <div class="detail-row olt-list-row">
      <span class="label">OLT Terhubung ({{ oltListForSto.length }})</span>

      <p v-if="isLoadingOlt" class="value olt-list-empty">Memuat daftar OLT...</p>
      <div v-else-if="oltListForSto.length" class="olt-list">
        <button
          v-for="olt in oltListForSto"
          :key="olt.id"
          type="button"
          class="olt-list-item"
          @click="openEditOlt(olt)"
        >
          <span class="olt-list-item-main">
            <span class="olt-kode">{{ olt.kode }}</span>
            <span class="olt-nama">{{ olt.nama }}</span>
          </span>
          <span class="olt-list-item-meta">
            <span v-if="olt.vendor">{{ olt.vendor }}</span>
            <span v-if="olt.jumlah_port_pon">{{ olt.jumlah_port_pon }} Port PON</span>
          </span>
        </button>
      </div>
      <p v-else class="value olt-list-empty">Belum ada OLT yang terhubung ke STO ini.</p>
    </div>

    <div v-if="data.catatan" class="detail-row notes-box">
      <span class="label">Catatan</span>
      <p class="value italic">"{{ data.catatan }}"</p>
    </div>

    <EditOltModal :visible="isEditOltVisible" :device="editOltDevice" @close="closeEditOlt" />
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import AddressWithMapButton from "@/components/AddressWithMapButton.vue";
import EditOltModal from "@/components/modals/EditOltModal.vue";

const props = defineProps({
  data: { type: Object, required: true },
});

const oltListForSto = ref([]);
const isLoadingOlt = ref(false);

// Catatan: GET /api/olt tidak benar-benar memfilter berdasarkan sto_id di
// server (query param itu diabaikan di route-nya), jadi kita ambil semua
// OLT lalu filter sendiri di client berdasarkan sto_id STO yang lagi dibuka.
async function loadOltForSto(stoId) {
  if (!stoId) {
    oltListForSto.value = [];
    return;
  }
  isLoadingOlt.value = true;
  try {
    const res = await fetch("/api/olt");
    if (res.ok) {
      const all = await res.json();
      oltListForSto.value = all.filter((olt) => Number(olt.sto_id) === Number(stoId));
    }
  } catch (err) {
    console.error("Gagal memuat daftar OLT untuk STO ini:", err);
  } finally {
    isLoadingOlt.value = false;
  }
}

watch(
  () => props.data?.id,
  (id) => {
    loadOltForSto(id);
  },
  { immediate: true },
);

const isEditOltVisible = ref(false);
const editOltDevice = ref(null);

function openEditOlt(olt) {
  editOltDevice.value = { type: "olt", data: olt };
  isEditOltVisible.value = true;
}

function closeEditOlt() {
  isEditOltVisible.value = false;
  loadOltForSto(props.data?.id);
}

defineExpose({ loadOltForSto });
</script>

<style scoped>
.olt-list-row {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.olt-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.olt-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--sb-bg-base);
  border: 1px solid var(--sb-border);
  border-radius: 6px;
  padding: 10px 12px;
  cursor: pointer;
  text-align: left;
  color: var(--sb-text-primary);
  transition: all 0.15s ease;
}

.olt-list-item:hover {
  border-color: var(--sb-accent);
  background: var(--sb-bg-hover);
}

.olt-list-item-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.olt-kode {
  font-family: monospace;
  font-size: 12px;
  color: var(--sb-text-secondary);
}

.olt-nama {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.olt-list-item-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-size: 12px;
  color: var(--sb-text-secondary);
  flex-shrink: 0;
}

.olt-list-empty {
  color: var(--sb-text-secondary);
  font-size: 13px;
}
</style>
