<template>
  <Teleport to="body">
    <div v-if="visible" class="settings-modal-overlay" @click.self="close">
      <div class="settings-modal-content">
        <!-- Header -->
        <div class="settings-modal-header">
          <h3>Pengaturan Admin</h3>
          <span class="settings-close-btn" @click="close">x</span>
        </div>

        <!-- Navigation Tabs -->
        <div class="settings-tabs">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'map' }" 
            @click="activeTab = 'map'"
          >
            <img src="/icons/settings.svg" alt="Peta" class="tab-icon" />
            Tampilan Peta
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'password' }" 
            @click="activeTab = 'password'"
          >
            <img src="/icons/user-round-check.svg" alt="Sandi" class="tab-icon" />
            Ganti Password
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'admin' }" 
            @click="activeTab = 'admin'"
          >
            <img src="/icons/user-round-check.svg" alt="Admin" class="tab-icon" />
            Kelola Admin
          </button>
        </div>

        <!-- Content Area -->
        <div class="settings-modal-body">
          <!-- Tab 1: Tampilan Peta -->
          <div v-if="activeTab === 'map'" class="tab-pane">
            <p class="tab-subtitle">Atur visibilitas data boundaries, marker perangkat, dan kabel pada peta global.</p>
            <div class="settings-grid">
              <div v-for="item in settingsList" :key="item.key" class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">{{ item.label }}</span>
                  <span class="setting-desc">{{ item.desc }}</span>
                </div>
                <label class="switch-container">
                  <input 
                    type="checkbox" 
                    :checked="settingsState[item.key]" 
                    @change="toggleSetting(item.key, $event.target.checked)"
                    :disabled="updatingKeys.has(item.key)"
                  />
                  <span class="switch-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- Tab 2: Ganti Password -->
          <div v-if="activeTab === 'password'" class="tab-pane">
            <form @submit.prevent="handlePasswordChange" class="password-form">
              <div class="input-group">
                <label for="old-pass">Password Lama</label>
                <div class="password-input-wrapper">
                  <input
                    id="old-pass"
                    v-model="oldPassword"
                    :type="showOldPassword ? 'text' : 'password'"
                    required
                    placeholder="Masukkan password saat ini"
                  />
                  <button
                    type="button"
                    class="password-toggle-btn"
                    @click="showOldPassword = !showOldPassword"
                    :title="showOldPassword ? 'Sembunyikan password' : 'Tampilkan password'"
                  >
                    <img :src="showOldPassword ? '/icons/eye-off.svg' : '/icons/eye.svg'" alt="Toggle" />
                  </button>
                </div>
              </div>
              <div class="input-group">
                <label for="new-pass">Password Baru</label>
                <div class="password-input-wrapper">
                  <input
                    id="new-pass"
                    v-model="newPassword"
                    :type="showNewPassword ? 'text' : 'password'"
                    required
                    placeholder="Masukkan password baru"
                  />
                  <button
                    type="button"
                    class="password-toggle-btn"
                    @click="showNewPassword = !showNewPassword"
                    :title="showNewPassword ? 'Sembunyikan password' : 'Tampilkan password'"
                  >
                    <img :src="showNewPassword ? '/icons/eye-off.svg' : '/icons/eye.svg'" alt="Toggle" />
                  </button>
                </div>
              </div>
              <div class="input-group">
                <label for="confirm-pass">Konfirmasi Password Baru</label>
                <div class="password-input-wrapper">
                  <input
                    id="confirm-pass"
                    v-model="confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    required
                    placeholder="Ketik ulang password baru"
                  />
                  <button
                    type="button"
                    class="password-toggle-btn"
                    @click="showConfirmPassword = !showConfirmPassword"
                    :title="showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'"
                  >
                    <img :src="showConfirmPassword ? '/icons/eye-off.svg' : '/icons/eye.svg'" alt="Toggle" />
                  </button>
                </div>
              </div>

              <div v-if="pwdError" class="status-msg error">{{ pwdError }}</div>
              <div v-if="pwdSuccess" class="status-msg success">{{ pwdSuccess }}</div>

              <button type="submit" class="submit-btn" :disabled="pwdLoading">
                {{ pwdLoading ? 'Menyimpan...' : 'Perbarui Password' }}
              </button>
            </form>
          </div>

          <!-- Tab 3: Kelola Admin -->
          <div v-if="activeTab === 'admin'" class="tab-pane">
            <!-- Ubah Username Current Admin -->
            <div class="admin-section">
              <h4>Ubah Username Anda</h4>
              <form @submit.prevent="handleUsernameChange" class="inline-form">
                <div class="input-group flex-row">
                  <input 
                    v-model="newUsername" 
                    type="text" 
                    required 
                    placeholder="Masukkan username baru" 
                  />
                  <button type="submit" class="submit-btn" :disabled="usernameLoading">
                    {{ usernameLoading ? 'Memproses...' : 'Ubah Username' }}
                  </button>
                </div>
              </form>
            </div>

            <div class="divider"></div>

            <!-- Tambah Admin Baru -->
            <div class="admin-section">
              <h4>Tambah Admin Baru</h4>
              <form @submit.prevent="handleAddAdmin" class="add-admin-form">
                <div class="form-row">
                  <div class="input-group">
                    <label for="new-adm-user">Username</label>
                    <input 
                      id="new-adm-user"
                      v-model="addAdminUser" 
                      type="text" 
                      required 
                      placeholder="Username baru" 
                    />
                  </div>
                  <div class="input-group">
                    <label for="new-adm-pass">Password</label>
                    <div class="password-input-wrapper">
                      <input
                        id="new-adm-pass"
                        v-model="addAdminPass"
                        :type="showAddAdminPass ? 'text' : 'password'"
                        required
                        placeholder="Password baru"
                      />
                      <button
                        type="button"
                        class="password-toggle-btn"
                        @click="showAddAdminPass = !showAddAdminPass"
                        :title="showAddAdminPass ? 'Sembunyikan password' : 'Tampilkan password'"
                      >
                        <img :src="showAddAdminPass ? '/icons/eye-off.svg' : '/icons/eye.svg'" alt="Toggle" />
                      </button>
                    </div>
                  </div>
                </div>
                <button type="submit" class="submit-btn" :disabled="addAdminLoading">
                  {{ addAdminLoading ? 'Menyimpan...' : 'Tambah Admin' }}
                </button>
              </form>
            </div>

            <div class="divider"></div>

            <!-- Daftar Admin -->
            <div class="admin-section">
              <h4>Daftar Administrator</h4>
              <div class="admin-list-container">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th class="hide-mobile">Tanggal Dibuat</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="adm in adminList" :key="adm.id">
                      <td>
                        <span class="adm-name">{{ adm.username }}</span>
                        <span v-if="adm.username === auth.username" class="me-badge">Anda</span>
                      </td>
                      <td class="hide-mobile">{{ formatDate(adm.dibuat_pada) }}</td>
                      <td>
                        <button 
                          v-if="adm.username !== auth.username" 
                          class="delete-btn-sm" 
                          @click="handleDeleteAdmin(adm)"
                        >
                          Hapus
                        </button>
                        <span v-else class="text-muted">-</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Confirm Dialog: Hapus Admin -->
    <Transition name="fade-scale">
      <div v-if="confirmDialog.visible" class="confirm-overlay" @click.self="confirmDialog.visible = false">
        <div class="confirm-dialog">
          <div class="confirm-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </div>
          <h4 class="confirm-title">Hapus Administrator</h4>
          <p class="confirm-body">
            Apakah Anda yakin ingin menghapus admin
            <strong class="confirm-username">{{ confirmDialog.adminName }}</strong>?
            Tindakan ini tidak dapat dibatalkan.
          </p>
          <div class="confirm-actions">
            <button class="confirm-btn-cancel" @click="confirmDialog.visible = false">Batal</button>
            <button class="confirm-btn-delete" :disabled="confirmDialog.loading" @click="executeDeleteAdmin">
              <svg v-if="!confirmDialog.loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
              </svg>
              {{ confirmDialog.loading ? 'Menghapus...' : 'Ya, Hapus' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useNotification } from '@/composables/useNotification'

const props = defineProps({
  visible: Boolean,
  initialSettings: Object
})
const emit = defineEmits(['close', 'settings-updated'])

const auth = useAuthStore()
const { success, error } = useNotification()

const activeTab = ref('map')
const updatingKeys = ref(new Set())

// Settings mapping
const settingsList = [
  { key: 'tampilkan_batas_kota', label: 'Batas Kota/Kabupaten', desc: 'Tampilkan garis batas wilayah kota/kabupaten' },
  { key: 'tampilkan_batas_kecamatan', label: 'Batas Kecamatan', desc: 'Tampilkan garis batas wilayah kecamatan' },
  { key: 'tampilkan_batas_desa', label: 'Batas Desa', desc: 'Tampilkan garis batas wilayah desa' },
  { key: 'tampilkan_nama_kecamatan', label: 'Nama Kecamatan', desc: 'Tampilkan label text nama kecamatan' },
  { key: 'tampilkan_nama_desa', label: 'Nama Desa', desc: 'Tampilkan label text nama desa' },
  { key: 'tampilkan_odc', label: 'ODC', desc: 'Tampilkan marker perangkat ODC di peta' },
  { key: 'tampilkan_odp', label: 'ODP', desc: 'Tampilkan marker perangkat ODP di peta' },
  { key: 'tampilkan_kabel', label: 'Jalur Kabel', desc: 'Tampilkan jalur kabel optik di peta' },
  { key: 'tampilkan_klien', label: 'Marker Pelanggan', desc: 'Tampilkan marker lokasi pelanggan/klien' }
]

const settingsState = reactive({
  tampilkan_batas_kota: true,
  tampilkan_batas_kecamatan: true,
  tampilkan_batas_desa: true,
  tampilkan_nama_kecamatan: true,
  tampilkan_nama_desa: true,
  tampilkan_odc: true,
  tampilkan_odp: true,
  tampilkan_kabel: true,
  tampilkan_klien: false
})

// Password Form
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const pwdLoading = ref(false)
const pwdError = ref('')
const pwdSuccess = ref('')
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Admin Management Form
const adminList = ref([])
const newUsername = ref('')
const addAdminUser = ref('')
const addAdminPass = ref('')
const usernameLoading = ref(false)
const addAdminLoading = ref(false)
const showAddAdminPass = ref(false)

watch(() => props.visible, (v) => {
  if (v) {
    activeTab.value = 'map'
    // Copy initial settings values
    if (props.initialSettings) {
      Object.assign(settingsState, props.initialSettings)
    }
    // Reset forms
    oldPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    pwdError.value = ''
    pwdSuccess.value = ''
    showOldPassword.value = false
    showNewPassword.value = false
    showConfirmPassword.value = false
    
    newUsername.value = auth.username
    addAdminUser.value = ''
    addAdminPass.value = ''
    showAddAdminPass.value = false
  }
}, { immediate: true })

watch(() => props.initialSettings, (newVal) => {
  if (newVal) {
    Object.assign(settingsState, newVal)
  }
}, { deep: true })

watch(activeTab, (tab) => {
  if (tab === 'admin') {
    loadAdminList()
    newUsername.value = auth.username
  }
})

function close() {
  emit('close')
}

async function loadAdminList() {
  try {
    adminList.value = await auth.fetchAdmins()
  } catch (err) {
    error('Gagal mengambil daftar administrator.')
    console.error(err)
  }
}

async function toggleSetting(key, isChecked) {
  updatingKeys.value.add(key)
  try {
    const res = await fetch(`/api/pengaturan/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nilai: isChecked })
    })
    const data = await res.json()
    if (res.ok) {
      settingsState[key] = isChecked
      success(`Pengaturan berhasil diubah.`)
      emit('settings-updated')
    } else {
      error(data.error || 'Gagal memperbarui pengaturan.')
    }
  } catch (err) {
    error('Gagal menghubungi server.')
    console.error(err)
  } finally {
    updatingKeys.value.delete(key)
  }
}

async function handlePasswordChange() {
  pwdError.value = ''
  pwdSuccess.value = ''
  
  if (newPassword.value !== confirmPassword.value) {
    pwdError.value = 'Konfirmasi password baru tidak cocok.'
    return
  }

  pwdLoading.value = true
  try {
    const res = await auth.changePassword(oldPassword.value, newPassword.value)
    if (res.ok) {
      pwdSuccess.value = 'Password berhasil diperbarui.'
      oldPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
      success('Password admin berhasil diubah.')
    } else {
      pwdError.value = res.error
    }
  } catch (err) {
    pwdError.value = 'Gagal menghubungi server.'
  } finally {
    pwdLoading.value = false
  }
}

async function handleUsernameChange() {
  usernameLoading.value = true
  try {
    const res = await auth.changeUsername(newUsername.value)
    if (res.ok) {
      success('Username Anda berhasil diperbarui.')
      loadAdminList()
    } else {
      error(res.error)
    }
  } catch (err) {
    error('Gagal menghubungi server.')
  } finally {
    usernameLoading.value = false
  }
}

async function handleAddAdmin() {
  addAdminLoading.value = true
  try {
    const res = await auth.createAdmin(addAdminUser.value, addAdminPass.value)
    if (res.ok) {
      success('Admin baru berhasil ditambahkan.')
      addAdminUser.value = ''
      addAdminPass.value = ''
      loadAdminList()
    } else {
      error(res.error)
    }
  } catch (err) {
    error('Gagal menghubungi server.')
  } finally {
    addAdminLoading.value = false
  }
}

// Custom confirm dialog state
const confirmDialog = reactive({
  visible: false,
  adminName: '',
  adminId: null,
  loading: false
})

function handleDeleteAdmin(adm) {
  confirmDialog.adminName = adm.username
  confirmDialog.adminId = adm.id
  confirmDialog.loading = false
  confirmDialog.visible = true
}

async function executeDeleteAdmin() {
  confirmDialog.loading = true
  try {
    const res = await auth.deleteAdmin(confirmDialog.adminId)
    if (res.ok) {
      success('Admin berhasil dihapus.')
      confirmDialog.visible = false
      loadAdminList()
    } else {
      error(res.error)
    }
  } catch (err) {
    error('Gagal menghubungi server.')
  } finally {
    confirmDialog.loading = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.settings-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.settings-modal-content {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 12px;
  width: 90%;
  max-width: 580px;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.settings-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #27272a;
}

.settings-modal-header h3 {
  margin: 0;
  color: #ededed;
  font-size: 16px;
  font-weight: 600;
}

.settings-close-btn {
  font-size: 24px;
  color: #a1a1aa;
  cursor: pointer;
  line-height: 1;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.settings-close-btn:hover {
  color: #ffffff;
}

.settings-tabs {
  display: flex;
  background: #121214;
  border-bottom: 1px solid #27272a;
  padding: 0 12px;
}

.tab-btn {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #a1a1aa;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: #ededed;
}

.tab-btn.active {
  color: #3ecf8e;
  border-bottom-color: #3ecf8e;
}

.tab-icon {
  width: 14px;
  height: 14px;
  filter: invert(0.7);
}
.tab-btn.active .tab-icon {
  filter: invert(0.7) sepia(1) saturate(5) hue-rotate(100deg);
}

.settings-modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.tab-subtitle {
  color: #a1a1aa;
  font-size: 12px;
  margin-top: 0;
  margin-bottom: 18px;
}

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #1f1f23;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #27272a;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-right: 12px;
}

.setting-label {
  color: #ededed;
  font-size: 13px;
  font-weight: 500;
}

.setting-desc {
  color: #a1a1aa;
  font-size: 11px;
}

/* Switch styling */
.switch-container {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 22px;
  flex-shrink: 0;
}

.switch-container input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #3f3f46;
  transition: .2s;
  border-radius: 22px;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .2s;
  border-radius: 50%;
}

input:checked + .switch-slider {
  background-color: #3ecf8e;
}

input:checked + .switch-slider:before {
  transform: translateX(20px);
}

input:disabled + .switch-slider {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Password form styling */
.password-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
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

.status-msg {
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 12px;
}
.status-msg.error {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.2);
}
.status-msg.success {
  background: rgba(16, 185, 129, 0.1);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.submit-btn {
  background: #3ecf8e;
  color: #121212;
  border: none;
  border-radius: 6px;
  padding: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 6px;
}

.submit-btn:hover:not(:disabled) {
  background: #30b078;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Admin Management Styling */
.admin-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.admin-section h4 {
  margin: 0;
  color: #ededed;
  font-size: 13px;
  font-weight: 600;
  border-left: 3px solid #3ecf8e;
  padding-left: 8px;
}

.divider {
  height: 1px;
  background: #27272a;
  margin: 20px 0;
}

.inline-form .flex-row {
  display: flex;
  gap: 10px;
}

.inline-form .flex-row input {
  flex: 1;
}

.inline-btn {
  margin-top: 0 !important;
  padding: 0 16px !important;
  white-space: nowrap;
}

.add-admin-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.admin-list-container {
  background: #121214;
  border: 1px solid #27272a;
  border-radius: 8px;
  overflow: hidden;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  text-align: left;
}

.admin-table th {
  background: #1f1f23;
  color: #a1a1aa;
  padding: 10px 12px;
  font-weight: 600;
  border-bottom: 1px solid #27272a;
}

.admin-table td {
  padding: 10px 12px;
  color: #ededed;
  border-bottom: 1px solid #1f1f23;
}

.admin-table tr:last-child td {
  border-bottom: none;
}

.adm-name {
  font-weight: 500;
}

.me-badge {
  background: rgba(62, 207, 142, 0.15);
  color: #3ecf8e;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: 8px;
  font-weight: 600;
}

.delete-btn-sm {
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #ef4444;
  padding: 4px 10px;
  font-size: 11px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-btn-sm:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
}

.text-muted {
  color: #71717a;
}

/* ================================================
   RESPONSIVE - Mobile (max-width: 480px)
================================================ */
@media (max-width: 480px) {
  /* Modal takes full screen on mobile */
  .settings-modal-overlay {
    align-items: flex-end;
  }

  .settings-modal-content {
    width: 100%;
    max-width: 100%;
    max-height: 92vh;
    border-radius: 16px 16px 0 0;
    border-left: none;
    border-right: none;
    border-bottom: none;
  }

  /* Drag handle indicator */
  .settings-modal-content::before {
    content: '';
    display: block;
    width: 40px;
    height: 4px;
    background: #3f3f46;
    border-radius: 2px;
    margin: 10px auto 0;
  }

  .settings-modal-header {
    padding: 12px 16px 12px;
  }

  .settings-modal-header h3 {
    font-size: 15px;
  }

  /* Tabs: allow horizontal scrolling, prevent text wrap */
  .settings-tabs {
    padding: 0 8px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    flex-shrink: 0;
  }
  .settings-tabs::-webkit-scrollbar {
    display: none;
  }

  .tab-btn {
    padding: 10px 12px;
    font-size: 12px;
    white-space: nowrap;
    flex-shrink: 0;
    gap: 5px;
  }

  .tab-icon {
    width: 13px;
    height: 13px;
  }

  /* Modal body padding reduced */
  .settings-modal-body {
    padding: 16px;
    max-height: calc(92vh - 120px);
  }

  /* Setting items: keep row layout but reduce padding */
  .setting-item {
    padding: 10px 12px;
  }

  .setting-label {
    font-size: 12px;
  }

  .setting-desc {
    font-size: 10px;
  }

  /* Password form: full-width inputs */
  .input-group input {
    font-size: 16px; /* Prevents auto-zoom on iOS */
    padding: 12px;
  }

  /* Inline username form stacks vertically on mobile */
  .inline-form .flex-row {
    flex-direction: column;
    gap: 10px;
  }

  .inline-form .flex-row input {
    width: 100%;
  }

  /* Tambah admin two-col grid → single column */
  .form-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  /* Submit button: full width */
  .submit-btn {
    width: 100%;
    padding: 13px;
    font-size: 14px;
  }

  /* Admin table: hide date column, widen others */
  .admin-table .hide-mobile {
    display: none;
  }

  .admin-table th,
  .admin-table td {
    padding: 8px 10px;
    font-size: 11px;
  }

  .me-badge {
    display: block;
    margin-left: 0;
    margin-top: 3px;
    width: fit-content;
  }

  .delete-btn-sm {
    padding: 5px 10px;
    font-size: 11px;
  }

  /* Admin section heading */
  .admin-section h4 {
    font-size: 12px;
  }

  .divider {
    margin: 14px 0;
  }
}

/* Tablet adjustments (481px - 640px) */
@media (min-width: 481px) and (max-width: 640px) {
  .settings-modal-content {
    width: 96%;
    max-height: 88vh;
  }

  .settings-modal-body {
    padding: 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .tab-btn {
    padding: 10px 14px;
    font-size: 12px;
  }

  .input-group input {
    font-size: 16px;
  }
}

/* ================================================
   CUSTOM CONFIRM DIALOG
================================================ */
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 16px;
}

.confirm-dialog {
  background: #18181b;
  border: 1px solid #3f3f46;
  border-radius: 14px;
  width: 100%;
  max-width: 380px;
  padding: 28px 24px 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}

.confirm-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.confirm-icon svg {
  width: 24px;
  height: 24px;
  stroke: #ef4444;
}

.confirm-title {
  margin: 0;
  color: #ededed;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.confirm-body {
  margin: 0;
  color: #a1a1aa;
  font-size: 13px;
  line-height: 1.6;
}

.confirm-username {
  color: #ededed;
  font-weight: 600;
}

.confirm-actions {
  display: flex;
  gap: 10px;
  width: 100%;
  margin-top: 8px;
}

.confirm-btn-cancel {
  flex: 1;
  background: transparent;
  border: 1px solid #3f3f46;
  color: #a1a1aa;
  border-radius: 8px;
  padding: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.confirm-btn-cancel:hover {
  background: #27272a;
  color: #ededed;
  border-color: #52525b;
}

.confirm-btn-delete {
  flex: 1;
  background: #ef4444;
  border: none;
  color: #ffffff;
  border-radius: 8px;
  padding: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 0.2s;
}

.confirm-btn-delete:hover:not(:disabled) {
  background: #dc2626;
}

.confirm-btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.confirm-btn-delete svg {
  width: 14px;
  height: 14px;
  stroke: #ffffff;
}

/* Vue transition for confirm dialog */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
}
.fade-scale-enter-from .confirm-dialog,
.fade-scale-leave-to .confirm-dialog {
  transform: scale(0.92) translateY(8px);
}
</style>
