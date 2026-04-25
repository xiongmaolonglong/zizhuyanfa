import api from './index'

export function getTenantList(params) {
  return api.get('/tenants', { params })
}

export function createTenant(data) {
  return api.post('/tenants', data)
}

export function getTenantDetail(id) {
  return api.get(`/tenants/${id}`)
}

export function updateTenant(id, data) {
  return api.put(`/tenants/${id}`, data)
}

export function updateTenantStatus(id, status) {
  return api.put(`/tenants/${id}/status`, { status })
}

export function getDashboard() {
  return api.get('/dashboard')
}

export function getDashboardTrend(period = 'day') {
  return api.get('/dashboard/trend', { params: { period } })
}

export function getClients(params) {
  return api.get('/clients', { params })
}

export function getDeclarations(params) {
  return api.get('/declarations', { params })
}

export function getSettings() {
  return api.get('/settings')
}

export function updateSettings(data) {
  return api.put('/settings', data)
}
