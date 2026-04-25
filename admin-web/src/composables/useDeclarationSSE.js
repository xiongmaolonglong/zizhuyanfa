import { ref, onUnmounted } from 'vue'
import { useAuthStore } from '../store/auth'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

/**
 * SSE 连接管理 — 监听申报相关的服务端事件
 * 由于 EventSource 不支持自定义请求头，token 通过查询参数传递
 */
export function useDeclarationSSE(onEvent) {
  const eventSource = ref(null)
  let reconnectTimer = null

  function connect() {
    disconnect()

    const auth = useAuthStore()
    if (!auth.token) return

    const url = `${BASE_URL}/tenant/declarations/stream?token=${encodeURIComponent(auth.token)}`
    const es = new EventSource(url)

    es.addEventListener('error', () => {
      es.close()
      // 5 秒后重试
      reconnectTimer = setTimeout(connect, 5000)
    })

    es.addEventListener('message', (e) => {
      try {
        const data = JSON.parse(e.data)
        onEvent?.(data)
      } catch {
        // 心跳或注释行忽略
      }
    })

    eventSource.value = es
  }

  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (eventSource.value) {
      eventSource.value.close()
      eventSource.value = null
    }
  }

  onUnmounted(disconnect)

  return { connect, disconnect, eventSource }
}
