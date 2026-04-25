import api from './index'

// ===== 派单管理 =====
export const createAssignment = (data) => api.post('/assignments', data)
export const getAssignment = (id) => api.get(`/assignments/${id}`)
export const getAssignments = (params) => api.get('/assignments', { params })

// 测量
export const getMeasurementTasks = (params) => api.get('/measurements/tasks', { params })
export const getMeasurementDetail = (id) => api.get(`/measurements/${id}`)
export const submitMeasurement = (data) => api.post('/measurements', data)
export const proxySubmitMeasurement = (id, data) => api.post(`/measurements/${id}/proxy`, data)
export const updateMeasurement = (id, data) => api.put(`/measurements/${id}`, data)
export const reviewMeasurement = (id, data) => api.put(`/measurements/${id}/review`, data)

// 接收派单
export const receiveAssignment = (id, data) => api.put(`/assignments/${id}/receive`, data)
