<template>
  <Teleport to="body">
    <div v-if="visible" class="login-modal" @click.self="close">
      <div class="login-modal-content">
        <span class="close-btn" @click="close">&times;</span>
        <h3>{{ step === "type" ? "Tambahkan Pin" : `Tambah ${selectedTypeLabel}` }}</h3>

        <!-- Step 1: Pilih tipe -->
        <div v-if="step === 'type'" class="pin-type-grid">
          <button
            v-for="t in PIN_TYPES"
            :key="t.type"
            class="pin-type-btn"
            :style="getPinTypeStyle(t.type)"
            @click="selectType(t)"
          >
            <img
              :src="`/icons/${t.icon || t.type}.svg`"
              :alt="t.label"
              style="width: 28px; height: 28px"
              :style="getPinIconStyle(t.type)"
            />
            <span>{{ t.label }}</span>
          </button>
        </div>

        <!-- Step 2: Isi form -->
        <div v-else>
          <div class="dropdown-divider" style="margin: 16px 0"></div>
          <p style="font-size: 12px; color: var(--sb-text-secondary); margin-bottom: 12px">
            Koordinat: <strong style="color: var(--sb-accent)">{{ coordDisplay }}</strong>
          </p>
          <form @submit.prevent="onSubmit">
            <div class="input-group">
              <label>Nama</label>
              <input v-model="pinName" type="text" required placeholder="Nama lokasi..." />
            </div>
            <div v-if="selectedType === 'odc' || selectedType === 'odp'" class="input-group">
              <label>Tipe Pemasangan</label>
              <div class="tipe-pemasangan-group">
                <button
                  v-for="tipe in tipePemasanganOptions"
                  :key="tipe"
                  type="button"
                  class="tipe-btn"
                  :class="{ active: pinTipePemasangan === tipe }"
                  @click="pinTipePemasangan = tipe"
                >
                  {{ tipePemasanganLabel(tipe) }}
                </button>
              </div>
            </div>
            <div class="input-group">
              <label>Keterangan</label>
              <input
                v-model="pinKeterangan"
                type="text"
                placeholder="Keterangan tambahan (opsional)"
              />
            </div>
            <div v-if="error" class="login-error" style="display: block">{{ error }}</div>
            <div style="display: flex; gap: 8px; margin-top: 4px">
              <button
                type="button"
                class="submit-btn"
                style="
                  background: var(--sb-bg-hover);
                  color: var(--sb-text-secondary);
                  border: 1px solid var(--sb-border);
                "
                @click="step = 'type'"
              >
                Kembali
              </button>
              <button type="submit" class="submit-btn" :disabled="saving">
                {{ saving ? "Menyimpan..." : "Simpan Pin" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useInfrastrukturStore } from "@/stores/infrastruktur";
import { useNotification } from "@/composables/useNotification";

const props = defineProps({
  visible: Boolean,
  lat: Number,
  lng: Number,
});
const emit = defineEmits(["close"]);

const infraStore = useInfrastrukturStore();
const { success } = useNotification();

const PIN_TYPES = [
  { type: "sto", label: "STO" },
  { type: "odc", label: "ODC" },
  { type: "odp", label: "ODP", icon: "odp-tiang" },
  { type: "klien-aktif", label: "Klien Aktif" },
  { type: "klien-nonaktif", label: "Klien Nonaktif" },
  { type: "klien-pending", label: "Klien Pending" },
];

const step = ref("type");
const selectedType = ref(null);
const selectedTypeLabel = ref("");
const pinName = ref("");
const pinKeterangan = ref("");
const pinTipePemasangan = ref("tiang");
const error = ref("");
const saving = ref(false);

const tipePemasanganOptions = computed(() => {
  if (selectedType.value === "odc") {
    return ["tiang", "tanam", "dinding"];
  } else if (selectedType.value === "odp") {
    return ["tiang", "tanam"];
  }
  return [];
});

function tipePemasanganLabel(tipe) {
  const labels = {
    tiang: "Tiang",
    tanam: "Tanam",
    dinding: "Dinding",
  };
  return labels[tipe] || tipe;
}

const coordDisplay = computed(() =>
  props.lat !== undefined ? `${props.lat.toFixed(6)}, ${props.lng.toFixed(6)}` : "",
);

function close() {
  emit("close");
}

watch(
  () => props.visible,
  (v) => {
    if (v) {
      step.value = "type";
      selectedType.value = null;
      pinName.value = "";
      pinKeterangan.value = "";
      pinTipePemasangan.value = "tiang";
      error.value = "";
    }
  },
);

function selectType(t) {
  selectedType.value = t.type;
  selectedTypeLabel.value = t.label;
  pinTipePemasangan.value = "tiang";
  step.value = "form";
}

function getPinTypeStyle(type) {
  const colors = {
    sto: { bg: "rgba(168, 85, 247, 0.15)", color: "#a855f7" },
    odc: { bg: "rgba(62, 207, 142, 0.15)", color: "#3ecf8e" },
    odp: { bg: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" },
    "klien-aktif": { bg: "rgba(16, 185, 129, 0.15)", color: "#10b981" },
    "klien-nonaktif": { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444" },
    "klien-pending": { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" },
  };
  const style = colors[type] || { bg: "rgba(99, 102, 241, 0.15)", color: "#3b82f6" };
  return { background: style.bg };
}

function getPinIconStyle(type) {
  const colors = {
    "klien-aktif": "brightness(1.2)",
    "klien-nonaktif": "brightness(1.2)",
    "klien-pending": "brightness(1.2)",
  };
  const filter = colors[type];
  if (filter) {
    return { filter };
  }
  return { filter: "invert(0.85)" };
}

async function onSubmit() {
  error.value = "";
  saving.value = true;
  try {
    const body = {
      type: selectedType.value,
      name: pinName.value.trim(),
      keterangan: pinKeterangan.value.trim(),
      lat: props.lat,
      lng: props.lng,
    };
    if (selectedType.value === "odc" || selectedType.value === "odp") {
      body.tipe_pemasangan = pinTipePemasangan.value;
    }
    const res = await fetch("/api/pins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      close();
      success(`Pin "${pinName.value}" berhasil disimpan!`);
      await infraStore.loadAll();
    } else {
      error.value = data.error || "Gagal menyimpan pin.";
    }
  } catch {
    error.value = "Gagal menghubungi server.";
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.pin-type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 16px 0;
}

.pin-type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 12px;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  font-weight: 500;
  color: var(--sb-text-primary);
  background: rgba(99, 102, 241, 0.15);
}

.pin-type-btn:hover {
  border-color: var(--sb-accent);
  transform: translateY(-2px);
}

.pin-type-btn:active {
  transform: translateY(0);
}

.tipe-pemasangan-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tipe-btn {
  flex: 1;
  min-width: 80px;
  padding: 8px 12px;
  border: 1px solid var(--sb-border);
  border-radius: 6px;
  background: var(--sb-bg-hover);
  color: var(--sb-text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tipe-btn:hover {
  border-color: var(--sb-accent);
  background: rgba(62, 207, 142, 0.1);
}

.tipe-btn.active {
  border-color: var(--sb-accent);
  background: var(--sb-accent);
  color: var(--sb-accent-text);
}
</style>
