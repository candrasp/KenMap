<template>
  <div v-if="alamat" class="alamat-row">
    <div class="alamat-content">
      <span class="label">Alamat</span>
      <p class="value address-text">{{ alamat }}</p>
    </div>
    <button class="open-maps-btn" @click="openGoogleMaps" title="Buka di Google Maps">
      <span>Google Maps</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M15 3h6v6" />
        <path d="M10 14 21 3" />
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      </svg>
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  alamat: { type: String, default: "" },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
});

function openGoogleMaps() {
  window.open(`https://www.google.com/maps?q=${props.lat},${props.lng}`, "_blank");
}
</script>

<style scoped>
.alamat-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.alamat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.address-text {
  line-height: 1.4;
  margin: 0;
}

.open-maps-btn {
  background: var(--sb-bg-hover);
  color: var(--sb-text-primary);
  border: 1px solid var(--sb-border);
  padding: 6px 12px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  flex-shrink: 0;
  white-space: nowrap;
}

.open-maps-btn:hover {
  background: var(--sb-accent);
  color: var(--sb-accent-text);
  border-color: var(--sb-accent);
}

.open-maps-btn:active {
  transform: scale(0.97);
}
</style>
