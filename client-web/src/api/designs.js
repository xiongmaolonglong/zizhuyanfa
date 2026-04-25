import api from './index'

export function getDesigns(params) {
  return api.get('/designs', { params })
}

export function reviewDesign(id, data) {
  return api.put(`/designs/${id}/review`, data)
}
