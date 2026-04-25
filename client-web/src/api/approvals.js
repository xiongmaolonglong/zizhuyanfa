import api from './index'

export function getMyApprovals(params) {
  return api.get('/declarations/my-approvals', { params })
}

export function approveDeclaration(id, data) {
  return api.post(`/declarations/${id}/approve`, data)
}

export function rejectDeclaration(id, data) {
  return api.post(`/declarations/${id}/reject`, data)
}
