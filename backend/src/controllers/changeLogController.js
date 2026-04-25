const WoChangeLog = require('../models/WoChangeLog')
const WorkOrder = require('../models/WorkOrder')
const { success, error } = require('../utils/response')

async function listChangeLogs(req, res) {
  const { id } = req.params
  const wo = await WorkOrder.findOne({ where: { id: parseInt(id, 10) } })
  if (!wo) return error(res, '工单不存在', 404)
  if (wo.tenant_id !== req.tenantId) return error(res, '无权操作此工单', 403)

  const logs = await WoChangeLog.findAll({
    where: { work_order_id: wo.id },
    order: [['created_at', 'DESC']],
  })
  return success(res, logs)
}

async function createChangeLog(req, res) {
  const { id } = req.params
  const { change_type, description, reason, cost_impact, approved_by } = req.body

  if (!change_type || !description) return error(res, '变更类型和描述为必填', 400)

  const wo = await WorkOrder.findOne({ where: { id: parseInt(id, 10) } })
  if (!wo) return error(res, '工单不存在', 404)
  if (wo.tenant_id !== req.tenantId) return error(res, '无权操作此工单', 403)

  const log = await WoChangeLog.create({
    work_order_id: wo.id,
    change_type,
    description,
    reason: reason || null,
    cost_impact: cost_impact || 0,
    approved_by: approved_by || null,
    created_by: req.user.user_id,
  })
  return success(res, log, '变更已记录', 201)
}

async function updateChangeLog(req, res) {
  const { logId } = req.params
  const { change_type, description, reason, cost_impact, approved_by } = req.body

  const log = await WoChangeLog.findByPk(logId)
  if (!log) return error(res, '变更记录不存在', 404)

  // 通过工单验证租户权限
  const wo = await WorkOrder.findOne({ where: { id: log.work_order_id } })
  if (!wo) return error(res, '工单不存在', 404)
  if (wo.tenant_id !== req.tenantId) return error(res, '无权操作此工单', 403)

  await log.update({
    change_type: change_type !== undefined ? change_type : log.change_type,
    description: description !== undefined ? description : log.description,
    reason: reason !== undefined ? reason : log.reason,
    cost_impact: cost_impact !== undefined ? cost_impact : log.cost_impact,
    approved_by: approved_by !== undefined ? approved_by : log.approved_by,
  })
  return success(res, log, '更新成功')
}

async function deleteChangeLog(req, res) {
  const { logId } = req.params

  const log = await WoChangeLog.findByPk(logId)
  if (!log) return error(res, '变更记录不存在', 404)

  // 通过工单验证租户权限
  const wo = await WorkOrder.findOne({ where: { id: log.work_order_id } })
  if (!wo) return error(res, '工单不存在', 404)
  if (wo.tenant_id !== req.tenantId) return error(res, '无权操作此工单', 403)

  await log.destroy()
  return success(res, null, '删除成功')
}

module.exports = { listChangeLogs, createChangeLog, updateChangeLog, deleteChangeLog }
