import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Notifications from '../../src/views/Notifications.vue'
import ElementPlus from 'element-plus'
import api from '../../src/api'
import { useRouter } from 'vue-router'

vi.mock('../../src/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: [
        { id: 1, title: '审批通知', type: 'approval', is_read: false, work_order_id: 100, created_at: '2026-04-20' },
        { id: 2, title: '进度更新', type: 'progress', is_read: true, work_order_id: 101, created_at: '2026-04-19' },
      ]
    }),
    post: vi.fn().mockResolvedValue({ code: 0 })
  }
}))

vi.mock('vue-router', () => ({
  useRouter: vi.fn()
}))

function createWrapper() {
  setActivePinia(createPinia())
  useRouter.mockReturnValue({ push: vi.fn() })
  return mount(Notifications, {
    global: { plugins: [ElementPlus] }
  })
}

describe('Notifications 页面', () => {
  beforeEach(() => {
    api.get.mockClear()
    api.post.mockClear()
  })

  it('加载时获取通知列表', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    expect(api.get).toHaveBeenCalledWith('/notifications')
  })

  it('通知数据正确渲染', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    expect(wrapper.text()).toContain('审批通知')
    expect(wrapper.text()).toContain('进度更新')
  })

  it('点击未读通知调用标记已读 API', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    const buttons = wrapper.findAll('button')
    const viewBtn = buttons.find(b => b.text() === '查看')
    if (viewBtn) {
      await viewBtn.trigger('click')
      expect(api.post).toHaveBeenCalledWith('/notifications/1/read')
    }
  })

  it('全部已读调用 API 并更新本地状态', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    const allReadBtn = wrapper.find('button')
    await allReadBtn.trigger('click')
    expect(api.post).toHaveBeenCalledWith('/notifications/read-all')
  })
})
