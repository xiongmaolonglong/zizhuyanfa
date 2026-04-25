import api from './index'

// ===== 甲方管理 =====
export const getClients = (params) => api.get('/clients', { params })
export const getClientById = (id) => api.get(`/clients/${id}`)
export const createClient = (data) => api.post('/clients', data)
export const updateClient = (id, data) => api.put(`/clients/${id}`, data)
export const deleteClient = (id) => api.delete(`/clients/${id}`)
export const getDefaultClient = () => api.get('/clients/default')

// 甲方用户
export const getClientUsers = (id) => api.get(`/clients/${id}/users`)
export const createClientUser = (id, data) => api.post(`/clients/${id}/users`, data)
export const updateClientUser = (clientId, userId, data) => api.put(`/clients/${clientId}/users/${userId}`, data)
export const deleteClientUser = (clientId, userId) => api.delete(`/clients/${clientId}/users/${userId}`)

// 甲方部门
export const getClientDepartments = (id) => api.get(`/clients/${id}/departments`)
export const createClientDepartment = (id, data) => api.post(`/clients/${id}/departments`, data)
export const updateClientDepartment = (clientId, deptId, data) => api.put(`/clients/${clientId}/departments/${deptId}`, data)
export const deleteClientDepartment = (clientId, deptId) => api.delete(`/clients/${clientId}/departments/${deptId}`)
