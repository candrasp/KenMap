import { ref } from 'vue'

const notifications = ref([])
let notificationId = 0

export function useNotification() {
  function show(message, options = {}) {
    const {
      type = 'info', // 'info', 'success', 'error', 'warning'
      duration = 4000,
      title = ''
    } = options

    const id = notificationId++
    const notification = {
      id,
      message,
      title,
      type,
      duration
    }

    notifications.value.push(notification)

    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }

    return id
  }

  function success(message, title = 'Berhasil') {
    return show(message, { type: 'success', title })
  }

  function error(message, title = 'Error') {
    return show(message, { type: 'error', title, duration: 6000 })
  }

  function warning(message, title = 'Peringatan') {
    return show(message, { type: 'warning', title })
  }

  function info(message, title = 'Informasi') {
    return show(message, { type: 'info', title })
  }

  function remove(id) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  function clear() {
    notifications.value = []
  }

  return {
    notifications,
    show,
    success,
    error,
    warning,
    info,
    remove,
    clear
  }
}
