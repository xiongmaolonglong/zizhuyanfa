import api from './index'

// ===== 售后管理 =====
export const getAftersales = (params) => api.get('/aftersales', { params })
export const getAftersaleById = (id) => api.get(`/aftersales/${id}`)
export const createAftersale = (data) => api.post('/aftersales', data)
export const updateAftersale = (id, data) => api.put(`/aftersales/${id}`, data)
export const resolveAftersale = (id, data) => api.put(`/aftersales/${id}/resolve`, data)
