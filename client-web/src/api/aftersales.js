import api from './index'

export function createAftersale(data) {
  return api.post('/aftersale', data)
}

export function getAftersales(params) {
  return api.get('/aftersale', { params })
}

export function getAftersale(id) {
  return api.get(`/aftersale/${id}`)
}

export function handleAftersale(id, data) {
  return api.post(`/aftersale/${id}/handle`, data)
}

export function rateAftersale(id, data) {
  return api.post(`/aftersale/${id}/rate`, data)
}
