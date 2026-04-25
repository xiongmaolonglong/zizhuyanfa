import api from './index'

export function getDeclarations(params) {
  return api.get('/admin/declarations', { params })
}
