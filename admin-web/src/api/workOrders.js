import api from './index'

// ===== 工单管理 =====
export const getWorkOrders = (params) => api.get('/work-orders', { params })
export const getWorkOrderById = (id) => api.get(`/work-orders/${id}`)
export const createWorkOrder = (data) => api.post('/work-orders', data)
export const updateWorkOrder = (id, data) => api.put(`/work-orders/${id}`, data)
export const deleteWorkOrder = (id) => api.delete(`/work-orders/${id}`)

// 环节推进
export const advanceStage = (id, data) => api.put(`/work-orders/${id}/stage`, data)

// 工单操作
export const addRemark = (id, data) => api.post(`/work-orders/${id}/remark`, data)
export const reassignWorkOrder = (id, data) => api.put(`/work-orders/${id}/assign`, data)
export const updateTags = (id, data) => api.put(`/work-orders/${id}/tags`, data)
export const updatePriority = (id, data) => api.put(`/work-orders/${id}/priority`, data)
export const updateDeadline = (id, data) => api.put(`/work-orders/${id}/deadline`, data)

// 统计与趋势
export const getWorkOrderStats = () => api.get('/work-orders/stats')
export const getWorkOrderTrend = (days = 7) => api.get('/work-orders/trend', { params: { days } })

// 创建表单配置
export const getCreateFormConfig = () => api.get('/tenant/form-config/work_order_create')
