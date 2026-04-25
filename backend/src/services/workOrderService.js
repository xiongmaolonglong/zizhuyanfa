const { Op, fn, col } = require('sequelize')
const WorkOrder = require('../models/WorkOrder')
const WorkOrderLog = require('../models/WorkOrderLog')
const TenantUser = require('../models/TenantUser')
const ClientUser = require('../models/ClientUser')

/**
 * 验证工单属于当前租户，并返回工单对象
 */
async function requireWorkOrderOwnership(workOrderId, tenantId) {
  const wo = await WorkOrder.findOne({
    where: { id: parseInt(workOrderId, 10) },
  })
  if (!wo) return null
  if (wo.tenant_id !== tenantId) return null
  return wo
}

/**
 * 获取工单操作日志
 */
async function getWorkOrderLogs(workOrderId, { includeTenantFilter, tenantId }) {
  const workOrderWhere = { id: parseInt(workOrderId, 10) }
  if (includeTenantFilter && tenantId) {
    workOrderWhere.tenant_id = tenantId
  }

  const workOrder = await WorkOrder.findOne({
    where: workOrderWhere,
    attributes: ['id'],
  })

  if (!workOrder) return null

  const logs = await WorkOrderLog.findAll({
    where: { work_order_id: workOrder.id },
    order: [['created_at', 'DESC']],
    raw: true,
  })

  // 批量查询用户名，避免 N+1
  const tenantUserIds = [...new Set(logs.filter(l => l.user_type === 'tenant').map(l => l.user_id))]
  const clientUserIds = [...new Set(logs.filter(l => l.user_type === 'client').map(l => l.user_id))]

  const [tenantUsers, clientUsers] = await Promise.all([
    tenantUserIds.length
      ? TenantUser.findAll({ where: { id: { [Op.in]: tenantUserIds } }, attributes: ['id', 'name'], raw: true })
      : [],
    clientUserIds.length
      ? ClientUser.findAll({ where: { id: { [Op.in]: clientUserIds } }, attributes: ['id', 'name'], raw: true })
      : [],
  ])

  const tenantNameMap = {}
  for (const u of tenantUsers) tenantNameMap[u.id] = u.name
  const clientNameMap = {}
  for (const u of clientUsers) clientNameMap[u.id] = u.name

  for (const log of logs) {
    if (log.user_type === 'super_admin') {
      log.user_name = '超级管理员'
    } else if (log.user_type === 'tenant') {
      log.user_name = tenantNameMap[log.user_id] || '未知'
    } else if (log.user_type === 'client') {
      log.user_name = clientNameMap[log.user_id] || '未知'
    } else {
      log.user_name = '未知'
    }
  }

  return logs
}

/**
 * 获取工单新建/完成趋势
 */
async function getWorkOrderTrend({ tenantId, days = 7 }) {
  const where = {}
  if (tenantId) where.tenant_id = tenantId

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - parseInt(days, 10) + 1)
  startDate.setHours(0, 0, 0, 0)

  const [newCounts, completedCounts] = await Promise.all([
    WorkOrder.findAll({
      where: { ...where, created_at: { [Op.gte]: startDate } },
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [fn('DATE', col('created_at'))],
      raw: true,
    }),
    WorkOrder.findAll({
      where: { ...where, completed_at: { [Op.gte]: startDate } },
      attributes: [
        [fn('DATE', col('completed_at')), 'date'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [fn('DATE', col('completed_at'))],
      raw: true,
    }),
  ])

  // 构建完整日期序列（补 0）
  const dateMap = {}
  for (let i = 0; i < parseInt(days, 10); i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    dateMap[dateStr] = { new_count: 0, completed_count: 0 }
  }

  for (const row of newCounts) {
    if (dateMap[row.date]) dateMap[row.date].new_count = parseInt(row.count, 10)
  }
  for (const row of completedCounts) {
    if (dateMap[row.date]) dateMap[row.date].completed_count = parseInt(row.count, 10)
  }

  return Object.entries(dateMap).map(([date, counts]) => ({ date, ...counts }))
}

module.exports = { requireWorkOrderOwnership, getWorkOrderLogs, getWorkOrderTrend }
