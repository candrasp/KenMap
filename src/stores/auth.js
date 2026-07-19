import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(false)
  const username = ref('')

  async function checkLoginStatus() {
    try {
      const res = await fetch('/api/me')
      const data = await res.json()
      if (data.loggedIn) {
        isLoggedIn.value = true
        username.value = data.username
      } else {
        isLoggedIn.value = false
        username.value = ''
      }
    } catch {
      isLoggedIn.value = false
      username.value = ''
    }
  }

  async function login(usernameVal, password) {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameVal, password }),
    })
    const data = await res.json()
    if (res.ok) {
      isLoggedIn.value = true
      username.value = data.username || usernameVal
      return { ok: true }
    }
    return { ok: false, error: data.error || 'Username atau password salah.' }
  }

  async function logout() {
    const res = await fetch('/api/logout', { method: 'POST' })
    if (res.ok) {
      isLoggedIn.value = false
      username.value = ''
      return true
    }
    return false
  }

  return { isLoggedIn, username, checkLoginStatus, login, logout }
})
