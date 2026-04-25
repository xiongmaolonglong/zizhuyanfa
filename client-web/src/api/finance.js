import api from './index'

export function getFinance(params) {
  return api.get('/finance', { params })
}

export function confirmFinance(id, data) {
  return api.put(`/finance/${id}/confirm`, data)
}
