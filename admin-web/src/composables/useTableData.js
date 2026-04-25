import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

/**
 * Generic table data composable: loading + pagination + fetch.
 *
 * @param {Function} fetchFn - Async function({ page, pageSize, ...filters }) => { list, total }
 * @param {Object} [options]
 * @param {number} [options.pageSize=20] - Default page size
 * @param {string} [options.errorMsg='加载失败'] - Default error message
 * @returns {Object} { loading, data, pagination, fetch, refresh }
 */
export function useTableData(fetchFn, options = {}) {
  const { pageSize = 20, errorMsg = '加载失败' } = options

  const loading = ref(false)
  const data = ref([])
  const pagination = reactive({ page: 1, pageSize, total: 0 })

  async function fetch(extraParams = {}) {
    loading.value = true
    try {
      const params = { page: pagination.page, limit: pagination.pageSize, ...extraParams }
      const res = await fetchFn(params)
      const payload = res?.data || {}
      data.value = payload.list || payload || []
      pagination.total = payload.total ?? 0
    } catch (e) {
      ElMessage.error(e.response?.data?.error || errorMsg)
      data.value = []
      pagination.total = 0
    } finally {
      loading.value = false
    }
  }

  function refresh() {
    return fetch()
  }

  return { loading, data, pagination, fetch, refresh }
}
