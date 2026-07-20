<template>
  <div id="btn-login-container">
    <!-- Tombol Login (belum login) -->
    <button v-if="!auth.isLoggedIn" id="btn-login" class="btn-top-right" @click="$emit('open-login')">
      <img src="/icons/log-in.svg" alt="Login" style="width:16px;vertical-align:middle;filter:invert(0.9);" />
      Login
    </button>

    <!-- Tombol User Toggle (sudah login) -->
    <button v-else id="btn-user-toggle" class="btn-top-right" style="display:inline-flex;align-items:center;gap:6px;" @click.stop="toggleDropdown">
      <img src="/icons/user-round-check.svg" alt="User" style="width:16px;height:16px;filter:invert(0.9);" />
      <span>{{ auth.username }}</span>
      <img src="/icons/chevron-down.svg" alt="Chevron" style="width:12px;height:12px;filter:invert(0.7);margin-left:2px;" />
    </button>

    <!-- Dropdown -->
    <div v-if="auth.isLoggedIn && dropdownOpen" class="user-dropdown" @click.stop>
      <div class="dropdown-item" id="dropdown-username">
        <img src="/icons/user-round-check.svg" alt="User" style="width:16px;height:16px;filter:invert(0.7);" />
        <span>{{ auth.username }}</span>
      </div>
      <div class="dropdown-divider"></div>
      <button class="dropdown-item" @click="onSetting">
        <img src="/icons/settings.svg" alt="Setting" style="width:16px;height:16px;filter:invert(0.7);" />
        Setting
      </button>
      <button class="dropdown-item" @click="onLogoutClick">
        <img src="/icons/log-out.svg" alt="Logout" style="width:16px;height:16px;filter:invert(0.7);" />
        Logout
      </button>
    </div>

    <!-- Confirmation Modal -->
    <ConfirmationModal
      :visible="confirmLogoutVisible"
      title="Logout"
      message="Apakah Anda yakin ingin logout?"
      confirm-text="Ya, Logout"
      @confirm="onLogoutConfirm"
      @cancel="confirmLogoutVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useNotification } from '@/composables/useNotification'
import ConfirmationModal from '@/components/modals/ConfirmationModal.vue'

const auth = useAuthStore()
const { error } = useNotification()
const dropdownOpen = ref(false)
const confirmLogoutVisible = ref(false)

const emit = defineEmits(['open-login', 'open-settings'])

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
}

function onLogoutClick() {
  dropdownOpen.value = false
  confirmLogoutVisible.value = true
}

async function onLogoutConfirm() {
  const ok = await auth.logout()
  if (ok) {
    confirmLogoutVisible.value = false
    window.location.reload()
  } else {
    error('Gagal melakukan logout.')
    confirmLogoutVisible.value = false
  }
}

function onSetting() {
  dropdownOpen.value = false
  emit('open-settings')
}

function onDocClick() {
  dropdownOpen.value = false
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>
