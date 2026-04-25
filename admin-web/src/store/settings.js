import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref({})
  const users = ref([])
  const departments = ref([])
  const loaded = ref(false)

  async function loadAll() {
    if (loaded.value) return

    try {
      const [settingsRes, usersRes, deptsRes] = await Promise.all([
        api.get('/tenant/settings'),
        api.get('/tenants/users', { params: { limit: 200 } }),
        api.get('/tenants/departments'),
      ])

      settings.value = settingsRes.data || {}
      users.value = usersRes.data || []
      departments.value = deptsRes.data || deptsRes || []
      loaded.value = true
    } catch {
      // 静默失败，各页面可自行加载
    }
  }

  function invalidate() {
    loaded.value = false
  }

  return { settings, users, departments, loaded, loadAll, invalidate }
})
