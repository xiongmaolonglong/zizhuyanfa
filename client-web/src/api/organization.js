import api from './index'

// 部门
export function getDepartments() {
  return api.get('/client-organization/departments')
}

export function createDepartment(data) {
  return api.post('/client-organization/departments', data)
}

export function updateDepartment(id, data) {
  return api.put(`/client-organization/departments/${id}`, data)
}

export function deleteDepartment(id) {
  return api.delete(`/client-organization/departments/${id}`)
}

// 用户
export function getUsers() {
  return api.get('/client-organization/users')
}

export function createUser(data) {
  return api.post('/client-organization/users', data)
}

export function updateUser(id, data) {
  return api.put(`/client-organization/users/${id}`, data)
}

export function deleteUser(id) {
  return api.delete(`/client-organization/users/${id}`)
}

export function resetPassword(id, data) {
  return api.post(`/client-organization/users/${id}/reset-password`, data)
}
