const { Op } = require('sequelize')
const { WoWarehouse, WoProduction, WorkOrder, TenantUser } = require('../models')
const { success, error, paginate } = require('../utils/response')
const { generateNo } = require('../services/numberGenerator')
const { createLog } = require('../services/logService')

// ==================== 入库登记 ====================

/**
 * POST /api/v1/warehouse/inbound
 * 生产完成后入库登记
 * 请求体: { production_id, work_order_id, material_type, spec, quantity, unit, warehouse_location, operator_id, notes }
 */
async function createInbound(req, res) {
  const { production_id, work_order_id, material_type, spec, quantity, unit, warehouse_location, notes } = req.body

  if (!quantity || quantity <= 0) {
    return error(res, '入库数量必须大于0', 400)
  }

  const tenantId = req.user.role === 'super_admin' ? undefined : (req.tenantId || req.user.tenant_id)

  // 如果关联了生产任务，验证存在且属于当前租户
  if (production_id) {
    const prodWhere = { id: production_id }
    if (tenantId) {
      const prod = await WoProduction.findByPk(production_id, {
        include: [{ model: WorkOrder, as: 'workOrder', attributes: ['id', 'tenant_id'] }],
      })
      if (!prod || (tenantId && prod.workOrder?.tenant_id !== tenantId)) {
        return error(res, '生产任务不存在', 404)
      }
    }
  }

  const operator = await TenantUser.findByPk(req.user.user_id)

  const record = await WoWarehouse.create({
    tenant_id: tenantId,
    work_order_id: work_order_id || null,
    production_id: production_id || null,
    type: 'inbound',
    source: production_id ? 'production' : 'return',
    material_type: material_type || '',
    spec: spec || '',
    quantity,
    unit: unit || '件',
    warehouse_location: warehouse_location || '',
    operator_id: req.user.user_id,
    operator_name: operator ? operator.real_name : '',
    receipt_no: generateNo('WH'),
    notes: notes || '',
  })

  // 如果关联了工单，记录日志
  if (work_order_id) {
    await createLog(work_order_id, req.user, 'warehouse_inbound', 'production',
      `入库登记: ${material_type || '材料'} x${quantity}${unit || '件'}，单号: ${record.receipt_no}`)
  }

  return success(res, record, '入库登记成功')
}

// ==================== 出库登记 ====================

/**
 * POST /api/v1/warehouse/outbound
 * 施工队领料出库
 * 请求体: { work_order_id, production_id, material_type, quantity, constructor_id, constructor_name, notes }
 */
async function createOutbound(req, res) {
  const { work_order_id, production_id, material_type, quantity, constructor_id, constructor_name, notes } = req.body

  if (!quantity || quantity <= 0) {
    return error(res, '出库数量必须大于0', 400)
  }

  const tenantId = req.user.role === 'super_admin' ? undefined : (req.tenantId || req.user.tenant_id)

  // 验证工单存在
  if (work_order_id) {
    const woWhere = { id: work_order_id }
    if (tenantId) woWhere.tenant_id = tenantId
    const wo = await WorkOrder.findOne({ where: woWhere })
    if (!wo) {
      return error(res, '工单不存在', 404)
    }
  }

  const operator = await TenantUser.findByPk(req.user.user_id)

  const record = await WoWarehouse.create({
    tenant_id: tenantId,
    work_order_id: work_order_id || null,
    production_id: production_id || null,
    type: 'outbound',
    source: 'pickup',
    material_type: material_type || '',
    quantity,
    unit: '件',
    constructor_id,
    constructor_name: constructor_name || '',
    operator_id: req.user.user_id,
    operator_name: operator ? operator.real_name : '',
    receipt_no: generateNo('WH'),
    notes: notes || '',
  })

  // 记录工单日志
  if (work_order_id) {
    await createLog(work_order_id, req.user, 'warehouse_outbound', 'construction',
      `出库领料: ${material_type || '材料'} x${quantity}件，施工队: ${constructor_name || ''}，单号: ${record.receipt_no}`)
  }

  return success(res, record, '出库登记成功')
}

// ==================== 库存台账列表 ====================

/**
 * GET /api/v1/warehouse/records
 * 出入库记录列表
 * 查询参数: type, source, work_order_id, material_type, page, limit, start_date, end_date
 */
async function listRecords(req, res) {
  const { type, source, work_order_id, material_type, page = 1, limit = 20, start_date, end_date } = req.query

  const tenantId = req.user.role === 'super_admin' ? undefined : (req.tenantId || req.user.tenant_id)
  const where = {}
  if (tenantId) where.tenant_id = tenantId
  if (type) where.type = type
  if (source) where.source = source
  if (work_order_id) where.work_order_id = parseInt(work_order_id, 10)
  if (material_type) where.material_type = { [Op.like]: `%${material_type}%` }
  if (start_date || end_date) {
    where.created_at = {}
    if (start_date) where.created_at[Op.gte] = start_date
    if (end_date) where.created_at[Op.lte] = `${end_date} 23:59:59`
  }

  const { count, rows } = await WoWarehouse.findAndCountAll({
    where,
    include: [
      { model: WorkOrder, as: 'workOrder', attributes: ['id', 'order_no', 'project_name', 'client_name'] },
      { model: WoProduction, as: 'production', attributes: ['id', 'production_task_no', 'material_type', 'status'] },
    ],
    order: [['created_at', 'DESC']],
    limit: parseInt(limit, 10),
    offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
  })

  const p = parseInt(page, 10)
  const l = parseInt(limit, 10)
  return paginate(res, rows, { page: p, limit: l, total: count, total_pages: Math.ceil(count / l) })
}

// ==================== 库存概览 ====================

/**
 * GET /api/v1/warehouse/inventory
 * 当前库存概览（按材料类型汇总）
 */
async function getInventory(req, res) {
  const tenantId = req.user.role === 'super_admin' ? undefined : (req.tenantId || req.user.tenant_id)
  const where = {}
  if (tenantId) where.tenant_id = tenantId

  // 获取所有出入库记录
  const records = await WoWarehouse.findAll({
    where,
    attributes: ['material_type', 'spec', 'type', 'quantity', 'unit', 'warehouse_location'],
    raw: true,
  })

  // 按材料类型+规格+单位+库位汇总
  const inventoryMap = {}
  for (const record of records) {
    const key = `${record.material_type}|${record.spec || ''}|${record.unit}|${record.warehouse_location || ''}`
    if (!inventoryMap[key]) {
      inventoryMap[key] = {
        material_type: record.material_type,
        spec: record.spec || '',
        unit: record.unit,
        warehouse_location: record.warehouse_location || '',
        total_in: 0,
        total_out: 0,
      }
    }
    if (record.type === 'inbound') {
      inventoryMap[key].total_in += parseFloat(record.quantity)
    } else if (record.type === 'outbound') {
      inventoryMap[key].total_out += parseFloat(record.quantity)
    }
  }

  const inventory = Object.values(inventoryMap)
    .map(item => ({
      ...item,
      stock: item.total_in - item.total_out,
    }))
    .filter(item => item.stock > 0) // 只显示有库存的
    .sort((a, b) => b.stock - a.stock)

  // 统计汇总
  const summary = {
    total_materials: inventory.length,
    total_inbound: records.filter(r => r.type === 'inbound').length,
    total_outbound: records.filter(r => r.type === 'outbound').length,
  }

  return success(res, { inventory, summary })
}

// ==================== 单条记录详情 ====================

/**
 * GET /api/v1/warehouse/records/:id
 */
async function getRecord(req, res) {
  const { id } = req.params
  const tenantId = req.user.role === 'super_admin' ? undefined : (req.tenantId || req.user.tenant_id)

  const where = { id }
  if (tenantId) where.tenant_id = tenantId

  const record = await WoWarehouse.findOne({
    where,
    include: [
      { model: WorkOrder, as: 'workOrder', attributes: ['id', 'order_no', 'project_name', 'client_name'] },
      { model: WoProduction, as: 'production', attributes: ['id', 'production_task_no', 'material_type', 'status'] },
    ],
  })

  if (!record) {
    return error(res, '记录不存在', 404)
  }

  return success(res, record)
}

// ==================== 删除记录 ====================

/**
 * DELETE /api/v1/warehouse/records/:id
 */
async function deleteRecord(req, res) {
  const { id } = req.params
  const tenantId = req.user.role === 'super_admin' ? undefined : (req.tenantId || req.user.tenant_id)

  const where = { id }
  if (tenantId) where.tenant_id = tenantId

  const record = await WoWarehouse.findOne({ where })
  if (!record) {
    return error(res, '记录不存在', 404)
  }

  await record.destroy()

  return success(res, null, '记录已删除')
}

module.exports = {
  createInbound,
  createOutbound,
  listRecords,
  getInventory,
  getRecord,
  deleteRecord,
}
