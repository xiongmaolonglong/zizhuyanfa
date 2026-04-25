import api from './index'

export function getNotifications(params) {
  return api.get('/notifications', { params })
}

export function markNotificationAsRead(id) {
  return api.post(`/notifications/${id}/read`)
}

export function markAllNotificationsAsRead() {
  return api.post('/notifications/read-all')
}
