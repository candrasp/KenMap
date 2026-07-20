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

  async function changePassword(oldPassword, newPassword) {
    const res = await fetch('/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword, newPassword }),
    })
    const data = await res.json()
    if (res.ok) {
      return { ok: true }
    }
    return { ok: false, error: data.error || 'Gagal mengubah password.' }
  }

  async function fetchAdmins() {
    const res = await fetch('/api/admins')
    if (res.ok) {
      return await res.json()
    }
    throw new Error('Gagal mengambil daftar admin.')
  }

  async function createAdmin(usernameVal, password) {
    const res = await fetch('/api/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameVal, password }),
    })
    const data = await res.json()
    if (res.ok) {
      return { ok: true }
    }
    return { ok: false, error: data.error || 'Gagal menambah admin baru.' }
  }

  async function changeUsername(newUsername) {
    const res = await fetch('/api/admins/change-username', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newUsername }),
    })
    const data = await res.json()
    if (res.ok) {
      username.value = newUsername
      return { ok: true }
    }
    return { ok: false, error: data.error || 'Gagal mengganti username.' }
  }

  async function deleteAdmin(id) {
    const res = await fetch(`/api/admins/${id}`, {
      method: 'DELETE',
    })
    const data = await res.json()
    if (res.ok) {
      return { ok: true }
    }
    return { ok: false, error: data.error || 'Gagal menghapus admin.' }
  }

  return { 
    isLoggedIn, username, checkLoginStatus, login, logout, 
    changePassword, fetchAdmins, createAdmin, changeUsername, deleteAdmin 
  }
})
