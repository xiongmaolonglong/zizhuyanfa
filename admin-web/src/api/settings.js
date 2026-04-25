import api from './index'

// ===== 系统配置 =====
export const getTenantSettings = () => api.get('/tenant/settings')
export const updateTenantSettings = (data) => api.put('/tenant/settings', data)

// 地址字典
export const getAddresses = (params) => api.get('/addresses', { params })
export const getAddressTree = (parentCode) => api.get(`/addresses/tree/${parentCode}`)
export const getAddressDetail = (code) => api.get(`/addresses/${code}`)
export const getAddressChildren = (parentCode) => api.get(`/addresses/${parentCode}/children`)
export const getAddressPath = (code) => api.get(`/addresses/${code}/path`)

// 表单配置
export const getFormConfig = (formKey) => api.get(`/tenant/form-config/${formKey}`)
export const updateFormConfig = (formKey, data) => api.put(`/tenant/form-config/${formKey}`, data)
