<template>
  <Teleport to="body">
    <div v-if="visible" class="confirmation-overlay" @click.self="onCancel">
      <div class="confirmation-modal">
        <div class="confirmation-header">
          <h3>{{ title }}</h3>
        </div>

        <div class="confirmation-body">
          {{ message }}
        </div>

        <div class="confirmation-footer">
          <button class="btn-cancel" @click="onCancel">
            Batal
          </button>
          <button class="btn-confirm" @click="onConfirm" :disabled="isLoading">
            {{ confirmText || 'Ya, Lanjutkan' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  visible: Boolean,
  title: String,
  message: String,
  confirmText: String,
  isDangerous: {
    type: Boolean,
    default: false
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'cancel'])

function onConfirm() {
  emit('confirm')
}

function onCancel() {
  emit('cancel')
}
</script>

<style scoped>
.confirmation-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
}

.confirmation-modal {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
  width: 90%;
  max-width: 380px;
  overflow: hidden;
}

.confirmation-header {
  padding: 16px 20px;
  border-bottom: 1px solid #27272a;
}

.confirmation-header h3 {
  margin: 0;
  color: #ededed;
  font-size: 16px;
  font-weight: 600;
}

.confirmation-body {
  padding: 16px 20px;
  color: #a1a1aa;
  font-size: 14px;
  line-height: 1.5;
  min-height: 60px;
  display: flex;
  align-items: center;
}

.confirmation-footer {
  padding: 12px 20px;
  border-top: 1px solid #27272a;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-cancel,
.btn-confirm {
  padding: 8px 16px;
  border: 1px solid #27272a;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: transparent;
  color: #a1a1aa;
}

.btn-cancel:hover {
  background: #27272a;
  color: #ededed;
}

.btn-confirm {
  background: #3ecf8e;
  color: #121212;
  border-color: #3ecf8e;
}

.btn-confirm:hover:not(:disabled) {
  background: #30b078;
  border-color: #30b078;
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
