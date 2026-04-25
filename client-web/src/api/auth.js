import api from './index'

export function clientLogin(data) {
  return api.post('/auth/client/login', data)
}

export function updateProfile(data) {
  return api.put('/auth/profile', data)
}

export function changePassword(data) {
  return api.post('/auth/change-password', data)
}
