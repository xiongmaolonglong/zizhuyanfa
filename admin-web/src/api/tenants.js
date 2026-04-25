import api from './index'

// ===== 租户/人员 =====
export const getTenantUsers = (params) => api.get('/tenants/users', { params })
export const getTenantDepartments = (params) => api.get('/tenants/departments', { params })
export const createTenantDepartment = (data) => api.post('/tenants/departments', data)
export const updateTenantDepartment = (id, data) => api.put(`/tenants/departments/${id}`, data)
export const deleteTenantDepartment = (id) => api.delete(`/tenants/departments/${id}`)

// 人员
export const createTenantUser = (data) => api.post('/tenants/users', data)
export const updateTenantUser = (id, data) => api.put(`/tenants/users/${id}`, data)
export const deleteTenantUser = (id) => api.delete(`/tenants/users/${id}`)
export const resetUserPassword = (id) => api.put(`/tenants/users/${id}/reset-password`)
export const updateUserStatus = (id, data) => api.put(`/tenants/users/${id}/status`, data)
