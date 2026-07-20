<template>
  <div id="map"></div>
</template>

<script setup>
import { useLeaflet } from '@/composables/useLeaflet'

const { map, statusText, isOnline, activeSettings, fetchSettings } = useLeaflet('map')

// Expose untuk dipakai di MapPage
defineExpose({ map, statusText, isOnline, activeSettings, fetchSettings })
</script>

<style scoped>
#map {
  position: absolute;
  inset: 0;
}
</style>
