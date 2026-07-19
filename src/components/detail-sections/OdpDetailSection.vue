<template>
  <div class="detail-section">
    <AddressWithMapButton :alamat="data.alamat" :lat="data.lat" :lng="data.lng" />
    <div class="detail-row">
      <span class="value coords">{{ data.lat.toFixed(6) }}, {{ data.lng.toFixed(6) }}</span>
    </div>
    <div class="detail-row">
      <span class="label">Tipe Pemasangan</span>
      <span class="value">{{
        data.tipe_pemasangan === "tanam" ? "Tanam (Pedestal)" : "Tiang (Pole)"
      }}</span>
    </div>
    <div class="detail-row">
      <span class="label">Kapasitas Port</span>
      <span class="value">{{ data.kapasitas_port || 8 }} Port</span>
    </div>
    <div class="detail-row">
      <span class="label">Port Terpakai</span>
      <div class="usage-container">
        <span class="value"
          ><strong>{{ data.port_terpakai || 0 }}</strong> / {{ data.kapasitas_port || 8 }} Port</span
        >
        <div class="progress-bar">
          <div class="progress" :style="{ width: usagePercentage + '%', background: color }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import AddressWithMapButton from "@/components/AddressWithMapButton.vue";

const props = defineProps({
  data: { type: Object, required: true },
  color: { type: String, default: "var(--sb-accent)" },
});

const usagePercentage = computed(() => {
  const capacity = props.data.kapasitas_port || 8;
  const used = props.data.port_terpakai || 0;
  return Math.min(100, Math.round((used / capacity) * 100));
});
</script>
