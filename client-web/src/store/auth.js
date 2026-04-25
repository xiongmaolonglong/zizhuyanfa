import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('client_token') || '')
  const user = ref(JSON.parse(localStorage.getItem('client_user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)

  function login(tokenData, userData) {
    token.value = tokenData
    user.value = userData
    localStorage.setItem('client_token', tokenData)
    localStorage.setItem('client_user', JSON.stringify(userData))
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('client_token')
    localStorage.removeItem('client_user')
  }

  return { token, user, isLoggedIn, login, logout }
})
