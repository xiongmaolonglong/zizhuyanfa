import api from './index'

// ===== 申报管理 =====
export const getDeclarations = (params) => api.get('/declarations', { params })
export const getDeclarationById = (id) => api.get(`/declarations/${id}`)
export const createDeclaration = (data) => api.post('/declarations', data)
export const updateDeclaration = (id, data) => api.put(`/declarations/${id}`, data)

// 接收申报
export const receiveDeclaration = (id, data) => api.put(`/declarations/${id}/receive`, data)
export const rejectDeclaration = (id, data) => api.put(`/declarations/${id}/reject`, data)

// 租户申报
export const getTenantDeclarations = (params) => api.get('/tenant/declarations', { params })
export const getTenantDeclarationById = (id) => api.get(`/tenant/declarations/${id}`)
export const tenantRejectDeclaration = (id, data) => api.post(`/tenant/declarations/${id}/reject`, data)
