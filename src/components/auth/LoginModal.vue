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
            <input id="lm-password" v-model="passwordVal" type="password" required placeholder="Password" />
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

function close() {
  emit('close')
  error.value = ''
}

watch(() => props.visible, (v) => {
  if (v) {
    usernameVal.value = ''
    passwordVal.value = ''
    error.value = ''
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
