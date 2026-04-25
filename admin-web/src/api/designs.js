import api from './index'

// ===== 设计管理 =====
export const getDesigns = (params) => api.get('/designs', { params })
export const getDesignById = (id) => api.get(`/designs/${id}`)
export const createDesign = (data) => api.post('/designs', data)
export const updateDesign = (id, data) => api.put(`/designs/${id}`, data)

// 审核设计
export const reviewDesign = (id, data) => api.put(`/designs/${id}/review`, data)

// 设计文件
export const uploadDesignFile = (data) => api.post('/designs/upload', data)
