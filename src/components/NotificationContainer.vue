<template>
  <div class="notification-container">
    <transition-group name="notification" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification"
        :class="`notification-${notification.type}`"
      >
        <div class="notification-content">
          <div class="notification-icon">
            <svg v-if="notification.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <svg v-else-if="notification.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <svg v-else-if="notification.type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>

          <div class="notification-text">
            <div v-if="notification.title" class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
          </div>

          <button class="notification-close" @click="remove(notification.id)" title="Tutup">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="notification-progress">
          <div class="notification-progress-bar" :style="{ animationDuration: notification.duration + 'ms' }"></div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useNotification } from '@/composables/useNotification'

const { notifications, remove } = useNotification()
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.notification {
  pointer-events: auto;
  background: var(--sb-bg-panel);
  border: 1px solid var(--sb-border);
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(16px);
  overflow: hidden;
  animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  min-width: 350px;
  max-width: 450px;
}

.notification-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  color: var(--sb-text-primary);
}

.notification-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-top: 2px;
}

.notification-icon svg {
  width: 100%;
  height: 100%;
}

.notification-success .notification-icon {
  color: #10b981;
}

.notification-error .notification-icon {
  color: #ef4444;
}

.notification-warning .notification-icon {
  color: #f59e0b;
}

.notification-info .notification-icon {
  color: #3b82f6;
}

.notification-text {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 2px;
  color: var(--sb-text-primary);
}

.notification-message {
  font-size: 12px;
  color: var(--sb-text-secondary);
  line-height: 1.4;
  word-break: break-word;
}

.notification-close {
  flex-shrink: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--sb-text-secondary);
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
  margin-top: 2px;
}

.notification-close:hover {
  color: var(--sb-text-primary);
}

.notification-close svg {
  width: 16px;
  height: 16px;
}

.notification-progress {
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.notification-progress-bar {
  height: 100%;
  animation: shrink linear forwards;
  background: currentColor;
  opacity: 0.6;
}

.notification-success .notification-progress-bar {
  background: #10b981;
}

.notification-error .notification-progress-bar {
  background: #ef4444;
}

.notification-warning .notification-progress-bar {
  background: #f59e0b;
}

.notification-info .notification-progress-bar {
  background: #3b82f6;
}

@keyframes slideInRight {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-leave-active {
  animation: slideOutRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(400px);
    opacity: 0;
  }
}

@keyframes shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.notification-enter-from {
  transform: translateX(400px);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(400px);
  opacity: 0;
}
</style>
