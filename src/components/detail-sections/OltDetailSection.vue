<template>
  <div class="detail-section">
    <div v-if="data.kode" class="detail-row">
      <span class="label">Kode OLT</span>
      <span class="value" style="font-family: monospace">{{ data.kode }}</span>
    </div>
    <AddressWithMapButton :alamat="data.alamat" :lat="data.lat" :lng="data.lng" />
    <div v-if="data.lat && data.lng" class="detail-row">
      <span class="value coords">{{ data.lat.toFixed(6) }}, {{ data.lng.toFixed(6) }}</span>
    </div>
    <div v-if="data.jumlah_port_pon || data.jumlah_port_pon === 0" class="detail-row">
      <span class="label">Jumlah Port PON</span>
      <span class="value">{{ data.jumlah_port_pon }}</span>
    </div>
    <div v-if="data.vendor" class="detail-row">
      <span class="label">Vendor</span>
      <span class="value">{{ data.vendor }}</span>
    </div>
    <div v-if="data.catatan" class="detail-row notes-box">
      <span class="label">Catatan</span>
      <p class="value italic">"{{ data.catatan }}"</p>
    </div>
  </div>
</template>

<script setup>
import AddressWithMapButton from "@/components/AddressWithMapButton.vue";

defineProps({
  data: { type: Object, required: true },
});
</script>
