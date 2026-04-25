const { WorkOrder } = require('../models')
const { success, error } = require('../utils/response')

/**
 * POST /api/v1/work-orders/:id/review
 * 管理员审核现场创建的工单
 * body: { action: 'approve' | 'reject', reject_reason?: string }
 */
async function reviewWorkOrder(req, res) {
  try {
    const { id } = req.params
    const { action, reject_reason } = req.body

    if (!action || !['approve', 'reject'].includes(action)) {
      return error(res, 'action 必须为 approve 或 reject', 400)
    }

    const tenantId = req.user.role === 'super_admin' ? undefined : (req.tenantId || req.user.tenant_id)
    const where = { id: parseInt(id, 10) }
    if (tenantId) where.tenant_id = tenantId

    const wo = await WorkOrder.findOne({ where })
    if (!wo) {
      return error(res, '工单不存在', 404)
    }

    if (wo.source !== 'field_created') {
      return error(res, '此接口仅审核现场创建的工单', 400)
    }

    if (wo.status !== 'submitted') {
      return error(res, '工单状态不是待审核', 400)
    }

    if (action === 'approve') {
      wo.status = 'approved'
      wo.current_stage = 'measurement'
      await wo.save()
      return success(res, { work_order_no: wo.work_order_no }, '工单已审核通过')
    } else {
      wo.status = 'rejected'
      wo.remarks = JSON.stringify([{ reason: reject_reason || '未通过审核', time: new Date().toISOString() }])
      await wo.save()
      return success(res, null, '工单已驳回')
    }
  } catch (err) {
    console.error('reviewWorkOrder error:', err)
    return error(res, '审核失败')
  }
}

module.exports = { reviewWorkOrder }
