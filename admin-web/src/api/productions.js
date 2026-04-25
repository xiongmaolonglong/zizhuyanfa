import api from './index'

// ===== 生产管理 =====
export const getProductions = (params) => api.get('/production', { params })
export const getProductionByWorkOrder = (workOrderId) => api.get(`/production/${workOrderId}`)
export const createProduction = (data) => api.post('/production', data)
export const updateProduction = (id, data) => api.put(`/production/${id}`, data)

// 生产进度
export const getProductionProgress = (workOrderId) => api.get(`/production/${workOrderId}/progress`)
export const addProductionProgress = (workOrderId, data) => api.post(`/production/${workOrderId}/progress`, data)
