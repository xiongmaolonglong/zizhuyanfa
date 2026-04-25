import api from './index'

// ===== 费用管理 =====
export const getFinances = (params) => api.get('/finance', { params })
export const getFinanceByWorkOrder = (workOrderId) => api.get(`/finance/${workOrderId}`)
export const createFinance = (data) => api.post('/finance', data)
export const updateFinance = (id, data) => api.put(`/finance/${id}`, data)
export const confirmFinance = (id, data) => api.put(`/finance/${id}/confirm`, data)
