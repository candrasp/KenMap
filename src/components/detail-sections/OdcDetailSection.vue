<template>
  <div class="detail-section">
    <div v-if="data.kode" class="detail-row">
      <span class="label">Kode ODC</span>
      <span class="value" style="font-family: monospace">{{ data.kode }}</span>
    </div>
    <AddressWithMapButton :alamat="data.alamat" :lat="data.lat" :lng="data.lng" />
    <div class="detail-row">
      <span class="value coords">{{ data.lat.toFixed(6) }}, {{ data.lng.toFixed(6) }}</span>
    </div>
    <div class="detail-row">
      <span class="label">Tipe Pemasangan</span>
      <span class="value">{{ tipePemasanganLabel }}</span>
    </div>
    <div v-if="data.nomor_tiang" class="detail-row">
      <span class="label">Nomor Tiang</span>
      <span class="value">{{ data.nomor_tiang }}</span>
    </div>
    <div v-if="data.olt_nama" class="detail-row">
      <span class="label">OLT Sumber</span>
      <span class="value">{{ data.olt_nama }} ({{ data.olt_kode }})</span>
    </div>
    <div class="detail-row">
      <span class="label">Kapasitas Port</span>
      <span class="value">{{ data.kapasitas_port || 0 }} Port</span>
    </div>
    <div v-if="data.jumlah_slot_splitter || data.jumlah_slot_splitter === 0" class="detail-row">
      <span class="label">Slot Splitter</span>
      <span class="value">{{ data.jumlah_slot_splitter }}</span>
    </div>
    <div v-if="data.rasio_splitter" class="detail-row">
      <span class="label">Rasio Splitter</span>
      <span class="value">{{ data.rasio_splitter }}</span>
    </div>
    <div v-if="data.jumlah_core_feeder || data.jumlah_core_feeder === 0" class="detail-row">
      <span class="label">Core Feeder</span>
      <span class="value">{{ data.jumlah_core_feeder }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import AddressWithMapButton from "@/components/AddressWithMapButton.vue";

const props = defineProps({
  data: { type: Object, required: true },
});

const tipePemasanganLabel = computed(() => {
  if (props.data.tipe_pemasangan === "tanam") return "Tanam";
  if (props.data.tipe_pemasangan === "tiang") return "Tiang";
  if (props.data.tipe_pemasangan === "dinding") return "Dinding";
  return "—";
});
</script>
