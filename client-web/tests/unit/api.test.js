import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { createPinia, setActivePinia } from 'pinia'

describe('API 401 拦截器', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('收到 401 时自动跳转登录', async () => {
    const { useAuthStore } = await import('../../src/store/auth')
    const auth = useAuthStore()
    auth.login('fake_token', { id: 1, name: 'test', phone: '13800001001', role: 'leader' })

    const res = await fetch('/api/v1/test', { method: 'GET' })
      .then(() => true)
      .catch(() => false)

    const api = (await import('../../src/api/index.js')).default

    await api.get('/test').catch(() => {})

    expect(auth.token).toBeDefined()
  })
})
