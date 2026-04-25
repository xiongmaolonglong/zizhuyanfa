import api from './index'

export function getDeclarations(params) {
  return api.get('/declarations', { params })
}

export function getDeclaration(id) {
  return api.get(`/declarations/${id}`)
}

export function createDeclaration(data) {
  return api.post('/declarations', data)
}

export function updateDeclaration(id, data) {
  return api.put(`/declarations/${id}`, data)
}

export function deleteDeclaration(id) {
  return api.delete(`/declarations/${id}`)
}

export function getFormConfig(type) {
  return api.get(`/tenant/form-config/${type}`)
}
