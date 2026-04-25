import { ref } from 'vue'
import api from '../api'

/**
 * 全局共享：元素类型（project_type）选项
 * 从 FormConfig 的 project_type 字段读取下拉选项
 */
const cache = { options: [], labelMap: {}, loaded: false, loading: false }

export function useElementOptions() {
  const options = ref([])

  async function load(force = false) {
    if (cache.loaded && !force && cache.options.length) {
      options.value = cache.options
      return cache.options
    }
    if (cache.loading) {
      while (cache.loading) await new Promise(r => setTimeout(r, 50))
      options.value = cache.options
      return cache.options
    }
    cache.loading = true
    try {
      const res = await api.get('/work-orders/element-options')
      const data = res.data || []
      cache.options = data
      cache.labelMap = {}
      for (const item of data) {
        if (item.value && item.label) cache.labelMap[item.value] = item.label
      }
      cache.loaded = true
      options.value = cache.options
      return data
    } catch {
      options.value = []
      cache.loaded = true
      return []
    } finally {
      cache.loading = false
    }
  }

  function labelOf(value) {
    if (!value) return '—'
    return cache.labelMap[value] || value
  }

  return { options, load, labelOf }
}
