import api from './index'

export function getUsers(params) {
  return api.get('/users', { params })
}
