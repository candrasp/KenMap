<template>
  <Teleport to="body">
    <div v-if="visible" class="login-modal" @click.self="close">
      <div class="login-modal-content">
        <span class="close-btn" @click="close">&times;</span>
        <h3>Login Admin</h3>
        <form @submit.prevent="onSubmit">
          <div class="input-group">
            <label for="lm-username">Username</label>
            <input id="lm-username" v-model="usernameVal" type="text" required placeholder="Username" />
          </div>
          <div class="input-group">
            <label for="lm-password">Password</label>
            <div class="password-input-wrapper">
              <input id="lm-password" v-model="passwordVal" :type="showPassword ? 'text' : 'password'" required placeholder="Password" />
              <button
                type="button"
                class="password-toggle-btn"
                @click="showPassword = !showPassword"
                :title="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
              >
                <img :src="showPassword ? '/icons/eye-off.svg' : '/icons/eye.svg'" alt="Toggle" />
              </button>
            </div>
          </div>
          <div v-if="error" class="login-error" style="display:block;">{{ error }}</div>
          <button type="submit" class="submit-btn" :disabled="loading">
            {{ loading ? 'Memproses...' : 'Login' }}
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['close'])

const auth = useAuthStore()
const usernameVal = ref('')
const passwordVal = ref('')
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)

function close() {
  emit('close')
  error.value = ''
}

watch(() => props.visible, (v) => {
  if (v) {
    usernameVal.value = ''
    passwordVal.value = ''
    error.value = ''
    showPassword.value = false
  }
})

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    const result = await auth.login(usernameVal.value, passwordVal.value)
    if (result.ok) {
      close()
      window.location.reload()
    } else {
      error.value = result.error
    }
  } catch {
    error.value = 'Gagal menghubungi server.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.login-modal-content {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 12px;
  width: 90%;
  max-width: 380px;
  padding: 24px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
}

.login-modal-content h3 {
  margin: 0 0 20px 0;
  color: #ededed;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  font-size: 24px;
  color: #a1a1aa;
  cursor: pointer;
  line-height: 1;
}

.close-btn:hover {
  color: #ffffff;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.input-group label {
  color: #ededed;
  font-size: 12px;
  font-weight: 500;
}

.input-group input {
  background: #1f1f23;
  border: 1px solid #27272a;
  border-radius: 6px;
  padding: 10px 12px;
  color: #ffffff;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

.input-group input:focus {
  border-color: #3ecf8e;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper input {
  width: 100%;
  padding-right: 40px;
}

.password-toggle-btn {
  position: absolute;
  right: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  color: #a1a1aa;
  transition: color 0.2s;
}

.password-toggle-btn:hover {
  color: #ededed;
}

.password-toggle-btn img {
  width: 16px;
  height: 16px;
  filter: invert(0.7);
}

.login-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #f87171;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 12px;
  margin-bottom: 16px;
}

.submit-btn {
  width: 100%;
  background: #3ecf8e;
  color: #121212;
  border: none;
  border-radius: 6px;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #30b078;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
