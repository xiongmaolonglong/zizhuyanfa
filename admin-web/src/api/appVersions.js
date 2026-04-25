import api from './index'

// 版本列表
export const getAppVersions = (params) => api.get('/admin/app-versions', { params })

// 版本详情
export const getAppVersion = (id) => api.get(`/admin/app-versions/${id}`)

// 创建版本
export const createAppVersion = (data) => api.post('/admin/app-versions', data)

// 更新版本
export const updateAppVersion = (id, data) => api.put(`/admin/app-versions/${id}`, data)

// 发布/下架
export const updateVersionStatus = (id, status) => api.put(`/admin/app-versions/${id}/status`, { status })

// 删除版本
export const deleteAppVersion = (id) => api.delete(`/admin/app-versions/${id}`)
