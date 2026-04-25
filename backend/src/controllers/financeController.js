const { Op } = require('sequelize')
const { WoFinance, WorkOrder, WorkOrderLog, WoConstruction, WoArchive } = require('../models')
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

// ==================== 生成报价 ====================

/**
 * POST /api/v1/finance/:workOrderId/quote
 * 生成报价单
 * 请求体: { items: [{ description, amount }], total_amount, notes: '' }
 */
async function createQuote(req, res) {
  const { workOrderId } = req.params
  const { items, total_amount, notes } = req.body

  if (!items || !Array.isArray(items) || items.length === 0) {
    return error(res, '报价明细不能为空', 400)
  }
  if (!total_amount || total_amount <= 0) {
    return error(res, '报价总额必须大于0', 400)
  }

  const tenantId = req.user.role === 'super_admin' ? undefined : (req.tenantId || req.user.tenant_id)
  const woWhere = { id: parseInt(workOrderId, 10) }
  if (tenantId) woWhere.tenant_id = tenantId

  const workOrder = await WorkOrder.findOne({ where: woWhere })
  if (!workOrder) {
    return error(res, '工单不存在', 404)
  }

  // 查找或创建财务记录
  let finance = await WoFinance.findOne({ where: { work_order_id: workOrder.id } })

  if (finance) {
    // 更新已有报价
    await finance.update({
      quote_amount: total_amount,
      quote_notes: notes || null,
      status: 'quoted',
    })
  } else {
    // 创建新报价
    finance = await WoFinance.create({
      work_order_id: workOrder.id,
      quote_amount: total_amount,
      quote_notes: notes || null,
      status: 'quoted',
    })
  }

  // 检查预算是否超限
  let budgetWarning = null
  if (finance.budget_total && total_amount > finance.budget_total) {
    budgetWarning = `报价总额 ${total_amount} 超出预算 ${finance.budget_total}，超出 ${(total_amount - finance.budget_total).toFixed(2)}`
  }

  // 更新工单状态
  await workOrder.update({
    current_stage: 'finance',
    status: 'quoted',
  })

  await createLog(workOrder.id, req.user, 'quote_created', 'finance',
    `报价单已生成: ${total_amount}元${budgetWarning ? ' [预算警告] ' + budgetWarning : ''}`)

  return success(res, { ...finance.toJSON(), budget_warning: budgetWarning },
    budgetWarning ? '报价已生成，但超出预算' : '报价单已生成')
}

// ==================== 报价列表 ====================

/**
 * GET /api/v1/finance/quotes
 * 报价列表
 */
async function listQuotes(req, res) {
  const { status, page = 1, limit = 20 } = req.query
  const tenantId = req.user.role === 'super_admin' ? undefined : (req.tenantId || req.user.tenant_id)

  const where = {}
  if (status) where.status = status

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

  const { count, rows } = await WoFinance.findAndCountAll({
    where,
    include: [
      {
        model: WorkOrder,
        as: 'workOrder',
        attributes: ['id', 'work_order_no', 'title', 'current_stage', 'status'],
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

// ==================== 收款记录 ====================

/**
 * POST /api/v1/finance/:workOrderId/payment
 * 记录收款
 * 请求体: { amount, type: '预付款|进度款|尾款', date, notes }
 */
async function recordPayment(req, res) {
  const { workOrderId } = req.params
  const { amount, type, date, notes } = req.body

  if (!amount || amount <= 0) {
    return error(res, '收款金额必须大于0', 400)
  }
  if (!type) {
    return error(res, '收款类型不能为空', 400)
  }

  const tenantId = req.user.role === 'super_admin' ? undefined : (req.tenantId || req.user.tenant_id)
  const woWhere = { id: parseInt(workOrderId, 10) }
  if (tenantId) woWhere.tenant_id = tenantId

  const workOrder = await WorkOrder.findOne({ where: woWhere })
  if (!workOrder) {
    return error(res, '工单不存在', 404)
  }

  let finance = await WoFinance.findOne({ where: { work_order_id: workOrder.id } })
  if (!finance) {
    return error(res, '请先创建报价单', 400)
  }

  // 添加收款记录
  const paymentRecords = finance.payment_records || []
  paymentRecords.push({
    amount: parseFloat(amount),
    type,
    date: date || new Date().toISOString().slice(0, 10),
    notes: notes || null,
    recorded_by: req.user.user_id,
    recorded_at: new Date().toISOString(),
  })

  // 计算已收款总额
  const totalPaid = paymentRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0)
  const budgetUsed = parseFloat(finance.budget_used || 0) + parseFloat(amount)

  await finance.update({
    payment_records: paymentRecords,
    budget_used: budgetUsed,
    status: totalPaid >= (finance.quote_amount || 0) ? 'paid' : finance.status,
  })

  // 如果已全额收款，更新工单状态
  if (totalPaid >= (finance.quote_amount || 0)) {
    await workOrder.update({ status: 'paid' })
  }

  await createLog(workOrder.id, req.user, 'payment_recorded', 'finance',
    `收款记录: ${type} ${amount}元`)

  return success(res, finance, '收款记录已添加')
}

// ==================== 开票记录 ====================

/**
 * POST /api/v1/finance/:workOrderId/invoice
 * 开票
 * 请求体: { invoice_number, amount, file_url }
 */
async function recordInvoice(req, res) {
  const { workOrderId } = req.params
  const { invoice_number, amount, file_url } = req.body

  if (!invoice_number) {
    return error(res, '发票号不能为空', 400)
  }

  const tenantId = req.user.role === 'super_admin' ? undefined : (req.tenantId || req.user.tenant_id)
  const woWhere = { id: parseInt(workOrderId, 10) }
  if (tenantId) woWhere.tenant_id = tenantId

  const workOrder = await WorkOrder.findOne({ where: woWhere })
  if (!workOrder) {
    return error(res, '工单不存在', 404)
  }

  const finance = await WoFinance.findOne({ where: { work_order_id: workOrder.id } })
  if (!finance) {
    return error(res, '请先创建报价单', 400)
  }

  await finance.update({
    invoice_number,
    invoice_file: file_url || null,
    status: 'invoiced',
  })

  await workOrder.update({ status: 'invoiced' })

  await createLog(workOrder.id, req.user, 'invoice_created', 'finance',
    `开票记录: ${invoice_number}${amount ? ` ${amount}元` : ''}`)

  return success(res, finance, '开票记录已添加')
}

// ==================== 结算资料提交 ====================

/**
 * POST /api/v1/finance/:workOrderId/settlement
 * 提交结算
 */
async function submitSettlement(req, res) {
  const { workOrderId } = req.params

  const tenantId = req.user.role === 'super_admin' ? undefined : (req.tenantId || req.user.tenant_id)
  const woWhere = { id: parseInt(workOrderId, 10) }
  if (tenantId) woWhere.tenant_id = tenantId

  const workOrder = await WorkOrder.findOne({ where: woWhere })
  if (!workOrder) {
    return error(res, '工单不存在', 404)
  }

  const finance = await WoFinance.findOne({ where: { work_order_id: workOrder.id } })
  if (!finance) {
    return error(res, '请先创建报价单', 400)
  }

  // 检查必须有客户签名（施工验收）
  const construction = await WoConstruction.findOne({
    where: { work_order_id: workOrder.id },
    order: [['created_at', 'DESC']],
  })

  if (!construction || !construction.client_verified_at) {
    return error(res, '结算资料不完整: 缺少客户验收签名', 400)
  }

  // 检查预算是否超限
  let budgetWarning = null
  if (finance.budget_total && finance.budget_used > finance.budget_total) {
    budgetWarning = `预算超限: 已使用 ${finance.budget_used}，预算 ${finance.budget_total}`
  }

  await finance.update({
    settlement_status: 'complete',
  })

  await createLog(workOrder.id, req.user, 'settlement_submitted', 'finance',
    '结算资料已提交' + (budgetWarning ? ` [${budgetWarning}]` : ''))

  return success(res, {
    ...finance.toJSON(),
    budget_warning: budgetWarning,
  }, budgetWarning ? '结算已提交，但预算超限' : '结算资料已提交')
}

// ==================== 结算模板导出 ====================

/**
 * GET /api/v1/finance/settlement-template/:workOrderId
 * 获取结算数据（用于 Excel 填充）
 */
async function getSettlementTemplate(req, res) {
  const { workOrderId } = req.params
  const tenantId = req.user.role === 'super_admin' ? undefined : (req.tenantId || req.user.tenant_id)

  const woWhere = { id: parseInt(workOrderId, 10) }
  if (tenantId) woWhere.tenant_id = tenantId

  const workOrder = await WorkOrder.findOne({
    where: woWhere,
    include: [
      { model: WoConstruction, as: 'constructions', required: false },
    ],
  })

  if (!workOrder) {
    return error(res, '工单不存在', 404)
  }

  const finance = await WoFinance.findOne({ where: { work_order_id: workOrder.id } })

  // 构造结算数据
  const settlementData = {
    work_order_no: workOrder.work_order_no,
    title: workOrder.title,
    client: workOrder.client?.name || null,
    quote_amount: finance?.quote_amount || 0,
    budget_total: finance?.budget_total || 0,
    budget_used: finance?.budget_used || 0,
    budget_remaining: finance?.budget_remaining || 0,
    payment_records: finance?.payment_records || [],
    invoice_number: finance?.invoice_number || null,
    settlement_status: finance?.settlement_status || 'pending',
    constructions: workOrder.constructions?.map(c => ({
      before_photos: c.before_photos,
      during_photos: c.during_photos,
      after_photos: c.after_photos,
      notes: c.notes,
      duration_minutes: c.duration_minutes,
      client_verified: !!c.client_verified_at,
    })) || [],
  }

  return success(res, settlementData)
}

// ==================== 结算驳回 ====================

/**
 * POST /api/v1/finance/:workOrderId/settlement/reject
 * 总公司驳回结算
 * 请求体: { reason: '' }
 */
async function rejectSettlement(req, res) {
  const { workOrderId } = req.params
  const { reason } = req.body

  if (!reason) {
    return error(res, '驳回原因不能为空', 400)
  }

  const tenantId = req.user.role === 'super_admin' ? undefined : (req.tenantId || req.user.tenant_id)
  const woWhere = { id: parseInt(workOrderId, 10) }
  if (tenantId) woWhere.tenant_id = tenantId

  const workOrder = await WorkOrder.findOne({ where: woWhere })
  if (!workOrder) {
    return error(res, '工单不存在', 404)
  }

  const finance = await WoFinance.findOne({ where: { work_order_id: workOrder.id } })
  if (!finance) {
    return error(res, '财务记录不存在', 404)
  }

  await finance.update({
    settlement_status: 'rejected',
    settlement_rejection_reason: reason,
  })

  await createLog(workOrder.id, req.user, 'settlement_rejected', 'finance',
    `结算被驳回: ${reason}`)

  return success(res, finance, '结算已驳回')
}

// ==================== 甲方确认费用 ====================

/**
 * POST /api/v1/finance/:workOrderId/settlement/confirm
 * 甲方确认结算
 */
async function confirmFinance(req, res) {
  const { workOrderId } = req.params
  const tenantId = req.user.role === 'super_admin' ? undefined : (req.tenantId || req.user.tenant_id)

  const woWhere = { id: parseInt(workOrderId, 10) }
  if (tenantId) woWhere.tenant_id = tenantId

  const workOrder = await WorkOrder.findOne({ where: woWhere })
  if (!workOrder) {
    return error(res, '工单不存在', 404)
  }

  const finance = await WoFinance.findOne({ where: { work_order_id: workOrder.id } })
  if (!finance) {
    return error(res, '财务记录不存在', 404)
  }

  await finance.update({
    settlement_status: 'complete',
  })

  await createLog(workOrder.id, req.user, 'settlement_confirmed', 'finance', '甲方确认结算')

  return success(res, finance, '费用已确认')
}

module.exports = {
  createQuote,
  listQuotes,
  recordPayment,
  recordInvoice,
  submitSettlement,
  getSettlementTemplate,
  rejectSettlement,
  confirmFinance,
}
