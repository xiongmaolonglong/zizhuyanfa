import api from './index'

// ===== 归档管理 =====
export const getArchives = (params) => api.get('/archives', { params })
export const getArchiveByWorkOrder = (workOrderId) => api.get(`/archives/${workOrderId}`)
export const createArchive = (data) => api.post('/archives', data)
export const updateArchive = (id, data) => api.put(`/archives/${id}`, data)
