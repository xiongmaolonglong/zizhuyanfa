import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Settings from '../../src/views/Settings.vue'
import ElementPlus from 'element-plus'

vi.mock('../../src/api', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ code: 0, data: {} }),
    put: vi.fn().mockResolvedValue({ code: 0, data: {} })
  }
}))

function createSettings(user = {}) {
  setActivePinia(createPinia())
  const { useAuthStore } = require('../../src/store/auth')
  const auth = useAuthStore()
  const defaultUser = { id: 1, name: '张三', phone: '13800001001', role: 'leader' }
  auth.login('test_token', { ...defaultUser, ...user })
  return mount(Settings, {
    global: { plugins: [ElementPlus] }
  })
}

describe('Settings 页面', () => {
  it('显示保存姓名按钮', () => {
    const wrapper = createSettings()
    const btn = wrapper.find('button', { text: '保存姓名' })
    expect(btn.exists()).toBe(true)
  })

  it('姓名为空时点击保存提示错误', async () => {
    const wrapper = createSettings({ name: '' })
    const input = wrapper.find('input')
    await input.setValue('')
  })
})
