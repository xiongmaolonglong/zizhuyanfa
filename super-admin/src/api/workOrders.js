import api from './index'

/**
 * 获取工单列表（跨租户平台级搜索）
 */
export async function fetchWorkOrders(params = {}) {
  const data = await api.get('/admin/work-orders', { params })
  return data
}

/**
 * 获取工单详情
 */
export async function fetchWorkOrderDetail(id) {
  const data = await api.get(`/admin/work-orders/${id}`)
  return data
}

export default api
