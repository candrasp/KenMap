<template>
  <span class="status-badge-small" :style="{ background: bg, color }">{{ label }}</span>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  color: { type: String, required: true },
  bg: { type: String, required: true },
});
</script>

<style scoped>
.status-badge-small {
  display: inline-block;
  padding: 3px 8px;
  font-size: 10px;
  font-weight: 600;
  border-radius: 4px;
}
</style>
