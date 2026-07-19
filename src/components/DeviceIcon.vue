<template>
  <svg
    v-if="type === 'sto'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
    <path d="M6 12h12M6 22h12" />
    <path d="M9 6h.01M15 6h.01M9 9h.01M15 9h.01M9 16h.01M15 16h.01" />
  </svg>
  <svg
    v-else-if="type === 'olt'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
  <svg
    v-else-if="type === 'odc'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
  </svg>
  <svg
    v-else-if="type === 'odp'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
</template>

<script setup>
// type: 'sto' | 'odc' | 'odp' | 'klien' (default fallback = icon klien/orang)
defineProps({
  type: { type: String, default: "" },
});
</script>
