import api from './index'

// ===== 施工管理 =====
export const getConstructions = (params) => api.get('/construction', { params })
export const getConstructionByWorkOrder = (workOrderId) => api.get(`/construction/${workOrderId}`)
export const createConstruction = (data) => api.post('/construction', data)
export const updateConstruction = (id, data) => api.put(`/construction/${id}`, data)

// 施工日志
export const getConstructionLogs = (workOrderId) => api.get(`/construction/${workOrderId}/logs`)
export const createConstructionLog = (workOrderId, data) => api.post(`/construction/${workOrderId}/logs`, data)
export const updateConstructionLog = (logId, data) => api.put(`/construction/logs/${logId}`, data)
export const deleteConstructionLog = (logId) => api.delete(`/construction/logs/${logId}`)
