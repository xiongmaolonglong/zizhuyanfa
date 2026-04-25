import api from './index'

// ===== 仓库管理 =====

// 入库登记
export const createInbound = (data) => api.post('/warehouse/inbound', data)

// 出库登记
export const createOutbound = (data) => api.post('/warehouse/outbound', data)

// 出入库记录列表
export const getWarehouseRecords = (params) => api.get('/warehouse/records', { params })

// 单条记录详情
export const getWarehouseRecord = (id) => api.get(`/warehouse/records/${id}`)

// 删除记录
export const deleteWarehouseRecord = (id) => api.delete(`/warehouse/records/${id}`)

// 库存概览
export const getInventory = () => api.get('/warehouse/inventory')
