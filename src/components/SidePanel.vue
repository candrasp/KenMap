<template>
  <div id="panel">
    <span id="badge" :class="isOnline ? 'online' : 'offline'">{{ isOnline ? 'ONLINE' : 'OFFLINE' }}</span>
    <div class="legend"><span class="swatch" style="background:#c0392b"></span>Batas Kota/Kabupaten</div>
    <div class="legend"><span class="swatch" style="background:#e67e22"></span>Batas Kecamatan</div>
    <div class="legend"><span class="swatch" style="background:#2980b9"></span>Batas Desa</div>
    <button id="btn-download" @click="downloadOffline">Unduh area untuk offline</button>
    <div id="status">{{ statusText }}</div>
  </div>
</template>

<script setup>
import { PONOROGO_BOUNDS, MIN_ZOOM, MAX_ZOOM, ESRI_URL, DB_TILE_PREFIX } from '@/composables/useLeaflet'
import { useNotification } from '@/composables/useNotification'

const props = defineProps({
  isOnline: Boolean,
  statusText: String,
})

const { info } = useNotification()

async function downloadOffline() {
  const tiles = []
  for (let z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
    // Simplified tile list calculation
    const total = tiles.length
    if (total > 8000 && !confirm(`Akan mengunduh ${total} tile. Lanjutkan?`)) return
  }
  info('Fitur unduh offline akan segera tersedia.')
}
</script>
