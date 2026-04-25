import api from './index'

export function getWorkOrder(id) {
  return api.get(`/work-orders/${id}`)
}

export function getWorkOrderLogs(id) {
  return api.get(`/work-orders/${id}/logs`)
}
