const WoConstructionLog = require('../models/WoConstructionLog')
const WorkOrder = require('../models/WorkOrder')
const { success, error } = require('../utils/response')

async function listConstructionLogs(req, res) {
  const { workOrderId } = req.params
  const wo = await WorkOrder.findOne({ where: { id: parseInt(workOrderId, 10) } })
  if (!wo) return error(res, '工单不存在', 404)
  if (wo.tenant_id !== req.tenantId) return error(res, '无权操作此工单', 403)

  const logs = await WoConstructionLog.findAll({
    where: { work_order_id: wo.id },
    order: [['log_date', 'DESC'], ['created_at', 'DESC']],
  })
  return success(res, logs)
}

async function createConstructionLog(req, res) {
  const { workOrderId } = req.params
  const { log_date, content, labor_count, labor_hours, problem_description, photos, weather } = req.body

  if (!log_date) return error(res, '施工日期为必填', 400)

  const wo = await WorkOrder.findOne({ where: { id: parseInt(workOrderId, 10) } })
  if (!wo) return error(res, '工单不存在', 404)
  if (wo.tenant_id !== req.tenantId) return error(res, '无权操作此工单', 403)

  const log = await WoConstructionLog.create({
    work_order_id: wo.id,
    log_date,
    content: content || null,
    labor_count: labor_count || null,
    labor_hours: labor_hours || null,
    problem_description: problem_description || null,
    photos: photos || null,
    weather: weather || null,
    created_by: req.user.user_id,
  })
  return success(res, log, '施工日志已添加', 201)
}

async function updateConstructionLog(req, res) {
  const { logId } = req.params
  const { log_date, content, labor_count, labor_hours, problem_description, photos, weather } = req.body

  const log = await WoConstructionLog.findByPk(logId)
  if (!log) return error(res, '施工日志不存在', 404)

  // 通过工单验证租户权限
  const wo = await WorkOrder.findOne({ where: { id: log.work_order_id } })
  if (!wo) return error(res, '工单不存在', 404)
  if (wo.tenant_id !== req.tenantId) return error(res, '无权操作此工单', 403)

  await log.update({
    log_date: log_date || log.log_date,
    content: content !== undefined ? content : log.content,
    labor_count: labor_count !== undefined ? labor_count : log.labor_count,
    labor_hours: labor_hours !== undefined ? labor_hours : log.labor_hours,
    problem_description: problem_description !== undefined ? problem_description : log.problem_description,
    photos: photos !== undefined ? photos : log.photos,
    weather: weather !== undefined ? weather : log.weather,
  })
  return success(res, log, '更新成功')
}

async function deleteConstructionLog(req, res) {
  const { logId } = req.params
  const log = await WoConstructionLog.findByPk(logId)
  if (!log) return error(res, '施工日志不存在', 404)

  // 通过工单验证租户权限
  const wo = await WorkOrder.findOne({ where: { id: log.work_order_id } })
  if (!wo) return error(res, '工单不存在', 404)
  if (wo.tenant_id !== req.tenantId) return error(res, '无权操作此工单', 403)

  await log.destroy()
  return success(res, null, '删除成功')
}

module.exports = { listConstructionLogs, createConstructionLog, updateConstructionLog, deleteConstructionLog }
