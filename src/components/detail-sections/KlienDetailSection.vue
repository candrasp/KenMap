<template>
  <div class="detail-section">
    <AddressWithMapButton :alamat="data.alamat" :lat="data.lat" :lng="data.lng" />
    <div class="detail-row">
      <span class="value coords">{{ data.lat.toFixed(6) }}, {{ data.lng.toFixed(6) }}</span>
    </div>
    <div v-if="data.nama_odp" class="detail-row">
      <span class="label">Terhubung ke ODP</span>
      <span class="value highlighted">{{ data.nama_odp }} (Port #{{ data.nomor_port || "-" }})</span>
    </div>
    <div v-if="data.ip" class="detail-row">
      <span class="label">IP Address</span>
      <span class="value" style="font-family: monospace; font-size: 12px">{{ data.ip }}</span>
    </div>
    <div v-if="data.nomor_hp" class="detail-row">
      <span class="label">Nomor HP</span>
      <span class="value">{{ data.nomor_hp }}</span>
    </div>
    <div v-if="data.onu_id" class="detail-row">
      <span class="label">ONU ID</span>
      <span class="value" style="font-family: monospace; font-size: 12px">{{ data.onu_id }}</span>
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
