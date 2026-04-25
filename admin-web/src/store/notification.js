import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'
import { useAuthStore } from './auth'

const SSE_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref(0)
  const declarationsCount = ref(0)
  const measurements = ref([])
  const designs = ref([])
  const internalVerifications = ref([])

  // 待派单统计
  const pendingDispatch = ref({ measure: 0, design: 0, install: 0 })

  const auditCount = computed(() =>
    measurements.value.length + designs.value.length + internalVerifications.value.length
  )

  const dispatchCount = computed(() =>
    pendingDispatch.value.measure + pendingDispatch.value.design + pendingDispatch.value.install
  )

  async function fetchAll() {
    // 通知未读
    try {
      const res = await api.get('/notifications/unread-count')
      unreadCount.value = res.data?.count || 0
    } catch { /* 静默 */ }

    // 申报数（全部待处理申报）
    try {
      const res = await api.get('/tenant/declarations', { params: { limit: 100 } })
      declarationsCount.value = (res.data || []).length
    } catch { /* 静默 */ }

    // 审核中心
    try {
      const res = await api.get('/work-orders/reviews/tasks')
      const d = res.data || {}
      measurements.value = d.measurements || []
      designs.value = d.designs || []
      internalVerifications.value = d.internalVerifications || []
    } catch { /* 静默 */ }

    // 待派单统计
    try {
      const [measureRes, designRes, installRes] = await Promise.all([
        api.get('/work-orders', { params: { stage: 'assignment', limit: 100 } }),
        api.get('/work-orders', { params: { stage: 'design', limit: 100 } }),
        api.get('/work-orders', { params: { stage: 'construction', limit: 100 } }),
      ])
      const measureList = measureRes.data?.list || measureRes.data || []
      const designList = designRes.data?.list || designRes.data || []
      const installList = installRes.data?.list || installRes.data || []

      pendingDispatch.value = {
        measure: measureList.filter(w => !w.assigned_tenant_user_id).length,
        design: designList.filter(w => !w.designer_id).length,
        install: installList.filter(w => !w.constructor_id).length,
      }
    } catch { /* 静默 */ }
  }

  let pollTimer = null
  let sseConnection = null

  function startPolling(intervalMs = 30000) {
    if (pollTimer) return // 防止重复启动
    pollTimer = setInterval(fetchAll, intervalMs)
    return pollTimer
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  /**
   * 建立 SSE 连接，接收实时事件并刷新通知数据
   */
  function startSSE() {
    if (sseConnection) return

    const authStore = useAuthStore()
    if (!authStore.token) return

    const url = `${SSE_BASE_URL}/tenant/declarations/stream?token=${encodeURIComponent(authStore.token)}`
    sseConnection = new EventSource(url)

    sseConnection.addEventListener('message', () => {
      // 收到任意申报事件 → 刷新侧栏徽标
      fetchAll()
    })

    sseConnection.addEventListener('error', () => {
      sseConnection?.close()
      sseConnection = null
      // 5 秒后重连
      setTimeout(startSSE, 5000)
    })
  }

  function stopSSE() {
    if (sseConnection) {
      sseConnection.close()
      sseConnection = null
    }
  }

  return {
    unreadCount, declarationsCount, auditCount, dispatchCount,
    measurements, designs, internalVerifications,
    pendingDispatch,
    fetchAll, startPolling, stopPolling,
    startSSE, stopSSE,
  }
})
