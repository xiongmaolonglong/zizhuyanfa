const { Op } = require('sequelize')
const { WoAftersale, WorkOrder, WorkOrderLog, TenantUser, ClientUser } = require('../models')
const { success, error, paginate } = require('../utils/response')

// ==================== 工具函数 ====================

async function createLog(workOrderId, user, action, stage, detail) {
  return WorkOrderLog.create({
    work_order_id: workOrderId,
    user_id: user.user_id,
    user_type: user.user_type,
    action,
    stage,
    detail,
    ip_address: user._ip || null,
  })
}

// ==================== 提交售后 ====================

/**
 * POST /api/v1/aftersales
 * 甲方提交售后申请
 * 请求体: { work_order_id, description, photos: [] }
 */
async function createAftersale(req, res) {
  const { work_order_id, description, photos } = req.body

  if (!work_order_id) {
    return error(res, '工单ID不能为空', 400)
  }
  if (!description) {
    return error(res, '售后描述不能为空', 400)
  }

  const tenantId = req.user.role === 'super_admin' ? undefined : (req.tenantId || req.user.tenant_id)
  const woWhere = { id: parseInt(work_order_id, 10) }
  if (tenantId) woWhere.tenant_id = tenantId

  const workOrder = await WorkOrder.findOne({ where: woWhere })
  if (!workOrder) {
    return error(res, '工单不存在', 404)
  }

  const aftersale = await WoAftersale.create({
    work_order_id: workOrder.id,
    client_user_id: req.user.user_id || null,
    description,
    photos: photos || [],
    status: 'pending',
  })

  // 更新工单状态
  await workOrder.update({
    current_stage: 'aftersale',
    status: 'aftersale_pending',
  })

  // 记录日志
  await createLog(workOrder.id, req.user, 'aftersale_created', 'aftersale',
    `售后申请已提交: ${description.substring(0, 100)}`)

  return success(res, aftersale, '售后申请已提交')
}

// ==================== 售后列表 ====================

/**
 * GET /api/v1/aftersales
 * 售后列表
 * 筛选: ?status=&work_order_id=&page=&limit=
 */
async function listAftersales(req, res) {
  const { status, work_order_id, page = 1, limit = 20 } = req.query
  const tenantId = req.user.role === 'super_admin' ? undefined : (req.tenantId || req.user.tenant_id)

  const where = {}
  if (status) where.status = status
  if (work_order_id) where.work_order_id = parseInt(work_order_id, 10)

  // 租户隔离
  if (tenantId) {
    const woIds = await WorkOrder.findAll({
      where: { tenant_id: tenantId },
      attributes: ['id'],
      raw: true,
    })
    if (woIds.length === 0) {
      return paginate(res, [], { page: parseInt(page, 10), limit: parseInt(limit, 10), total: 0, pages: 0 })
    }
    where.work_order_id = woIds.map(w => w.id)
  }

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10)
  const pageSize = Math.min(Math.max(1, parseInt(limit, 10)), 100)

  const { count, rows } = await WoAftersale.findAndCountAll({
    where,
    include: [
      {
        model: WorkOrder,
        as: 'workOrder',
        attributes: ['id', 'work_order_no', 'title', 'current_stage', 'status', 'custom_data'],
        required: false,
      },
      {
        model: ClientUser,
        as: 'clientRequester',
        attributes: ['id', 'real_name', 'phone'],
        required: false,
      },
      {
        model: TenantUser,
        as: 'handler',
        attributes: ['id', 'real_name', 'phone'],
        required: false,
      },
    ],
    order: [['created_at', 'DESC']],
    limit: pageSize,
    offset,
  })

  const pagination = {
    page: parseInt(page, 10),
    limit: pageSize,
    total: count,
    pages: Math.ceil(count / pageSize),
  }

  return paginate(res, rows, pagination)
}

// ==================== 售后详情 ====================

/**
 * GET /api/v1/aftersales/:id
 * 详情
 */
async function getAftersale(req, res) {
  const { id } = req.params
  const tenantId = req.user.role === 'super_admin' ? undefined : (req.tenantId || req.user.tenant_id)

  const where = { id: parseInt(id, 10) }

  // 租户隔离
  if (tenantId) {
    const aftersale = await WoAftersale.findByPk(id, {
      include: [
        {
          model: WorkOrder,
          as: 'workOrder',
          attributes: ['id', 'work_order_no', 'title', 'tenant_id'],
          required: false,
        },
        { model: ClientUser, as: 'clientRequester', attributes: ['id', 'real_name', 'phone'], required: false },
        { model: TenantUser, as: 'handler', attributes: ['id', 'real_name', 'phone'], required: false },
      ],
    })

    if (!aftersale || aftersale.workOrder?.tenant_id !== tenantId) {
      return error(res, '售后记录不存在', 404)
    }

    return success(res, aftersale)
  }

  const aftersale = await WoAftersale.findByPk(id, {
    include: [
      {
        model: WorkOrder,
        as: 'workOrder',
        attributes: ['id', 'work_order_no', 'title', 'current_stage', 'status', 'custom_data'],
        required: false,
      },
      { model: ClientUser, as: 'clientRequester', attributes: ['id', 'real_name', 'phone'], required: false },
      { model: TenantUser, as: 'handler', attributes: ['id', 'real_name', 'phone'], required: false },
    ],
  })

  if (!aftersale) {
    return error(res, '售后记录不存在', 404)
  }

  return success(res, aftersale)
}

// ==================== 处理售后 ====================

/**
 * POST /api/v1/aftersales/:id/handle
 * 处理售后
 * 请求体: { notes: '', photos: [], status: 'processing'|'resolved'|'closed' }
 */
async function handleAftersale(req, res) {
  const { id } = req.params
  const { notes, photos, status } = req.body

  const validStatuses = ['processing', 'resolved', 'closed']
  if (!status || !validStatuses.includes(status)) {
    return error(res, `无效的状态值，可选: ${validStatuses.join(', ')}`, 400)
  }

  const aftersale = await WoAftersale.findByPk(id, {
    include: [
      { model: WorkOrder, as: 'workOrder', attributes: ['id', 'work_order_no', 'title'] },
    ],
  })

  if (!aftersale) {
    return error(res, '售后记录不存在', 404)
  }

  const updateData = {
    status,
    handler_id: req.user.user_id,
    handler_photos: photos || aftersale.handler_photos,
  }
  if (notes) updateData.handler_notes = notes
  if (status === 'resolved' || status === 'closed') {
    updateData.resolved_at = new Date().toISOString().slice(0, 10)
  }

  await aftersale.update(updateData)

  // 更新工单状态
  if (status === 'resolved') {
    await aftersale.workOrder.update({ status: 'aftersale_resolved' })
  } else if (status === 'closed') {
    await aftersale.workOrder.update({ status: 'aftersale_closed' })
  }

  // 记录日志
  if (aftersale.workOrder) {
    await createLog(aftersale.workOrder.id, req.user, `aftersale_${status}`, 'aftersale',
      `售后处理: ${status}${notes ? ' - ' + notes : ''}`)
  }

  return success(res, aftersale, `售后已标记为${status}`)
}

// ==================== 售后评价 ====================

/**
 * POST /api/v1/aftersales/:id/rate
 * 评价
 * 请求体: { rating: 1-5 }
 */
async function rateAftersale(req, res) {
  const { id } = req.params
  const { rating } = req.body

  if (!rating || rating < 1 || rating > 5) {
    return error(res, '评分必须为1-5之间的整数', 400)
  }

  const aftersale = await WoAftersale.findByPk(id, {
    include: [
      { model: WorkOrder, as: 'workOrder', attributes: ['id', 'work_order_no', 'title'] },
    ],
  })

  if (!aftersale) {
    return error(res, '售后记录不存在', 404)
  }

  await aftersale.update({ rating })

  // 记录日志
  if (aftersale.workOrder) {
    await createLog(aftersale.workOrder.id, req.user, 'aftersale_rated', 'aftersale',
      `售后评价: ${rating}星`)
  }

  return success(res, aftersale, '评价成功')
}

module.exports = {
  createAftersale,
  listAftersales,
  getAftersale,
  handleAftersale,
  rateAftersale,
}
