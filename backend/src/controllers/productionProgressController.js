const { fn, col } = require('sequelize')
const WoProductionProgress = require('../models/WoProductionProgress')
const WorkOrder = require('../models/WorkOrder')
const { success, error } = require('../utils/response')

const DEFAULT_STEPS = ['下料', '制作', '组装', '质检']

async function getProgress(req, res) {
  const { workOrderId } = req.params
  const wo = await WorkOrder.findOne({ where: { id: parseInt(workOrderId, 10) } })
  if (!wo) return error(res, '工单不存在', 404)
  if (wo.tenant_id !== req.tenantId) return error(res, '无权操作此工单', 403)

  let progress = await WoProductionProgress.findAll({
    where: { work_order_id: wo.id },
    order: [['id', 'ASC']],
  })

  // 首次查询，自动创建默认步骤
  if (!progress.length) {
    await WoProductionProgress.bulkCreate(
      DEFAULT_STEPS.map(step => ({ work_order_id: wo.id, step_name: step, progress_pct: 0 }))
    )
    progress = await WoProductionProgress.findAll({
      where: { work_order_id: wo.id },
      order: [['id', 'ASC']],
    })
  }

  // 计算整体进度（各步骤平均值）
  const overallPct = progress.length
    ? Math.round(progress.reduce((sum, p) => sum + p.progress_pct, 0) / progress.length)
    : 0

  return success(res, { steps: progress, overall_pct: overallPct })
}

async function updateProgress(req, res) {
  const { workOrderId } = req.params
  const { steps } = req.body // [{ step_name, progress_pct }, ...]

  if (!steps?.length) return error(res, '进度数据不能为空', 400)

  const wo = await WorkOrder.findOne({ where: { id: parseInt(workOrderId, 10) } })
  if (!wo) return error(res, '工单不存在', 404)
  if (wo.tenant_id !== req.tenantId) return error(res, '无权操作此工单', 403)

  for (const item of steps) {
    if (!item.step_name || item.progress_pct == null) continue

    await WoProductionProgress.update(
      { progress_pct: Math.min(100, Math.max(0, item.progress_pct)) },
      { where: { work_order_id: wo.id, step_name: item.step_name } }
    )
  }

  // 返回更新后的进度
  return getProgress(req, res)
}

module.exports = { getProgress, updateProgress }
