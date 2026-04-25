const { Op } = require('sequelize')
const { WoArchive, WorkOrder, WorkOrderLog, WoDeclaration, WoMeasurement, WoDesign, WoConstruction } = require('../models')
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

/**
 * 生成归档编号
 * 格式: ARCH-YYYYMMDD-XXXX
 */
function generateArchiveNo() {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ARCH-${dateStr}-${random}`
}

/**
 * 收集工单全流程文件URL
 */
async function collectWorkOrderFiles(workOrderId) {
  const files = []

  // 申报照片
  const declaration = await WoDeclaration.findOne({ where: { work_order_id: workOrderId } })
  if (declaration) {
    if (declaration.photos && declaration.photos.length) {
      files.push({ type: 'declaration_photos', urls: declaration.photos })
    }
    if (declaration.id_photo_front) {
      files.push({ type: 'id_card_front', url: declaration.id_photo_front })
    }
    if (declaration.id_photo_back) {
      files.push({ type: 'id_card_back', url: declaration.id_photo_back })
    }
  }

  // 测量数据
  const measurements = await WoMeasurement.findAll({
    where: { work_order_id: workOrderId },
    order: [['created_at', 'ASC']],
  })
  for (const m of measurements) {
    if (m.photos && m.photos.length) {
      files.push({ type: 'measurement_photos', urls: m.photos })
    }
    if (m.data) {
      files.push({ type: 'measurement_data', data: m.data })
    }
  }

  // 设计图
  const designs = await WoDesign.findAll({
    where: { work_order_id: workOrderId },
    order: [['created_at', 'ASC']],
  })
  for (const d of designs) {
    if (d.design_files && d.design_files.length) {
      files.push({ type: 'design_files', urls: d.design_files })
    }
    if (d.preview_images && d.preview_images.length) {
      files.push({ type: 'design_previews', urls: d.preview_images })
    }
  }

  // 施工照片
  const constructions = await WoConstruction.findAll({
    where: { work_order_id: workOrderId },
    order: [['created_at', 'ASC']],
  })
  for (const c of constructions) {
    if (c.before_photos && c.before_photos.length) {
      files.push({ type: 'construction_before', urls: c.before_photos })
    }
    if (c.during_photos && c.during_photos.length) {
      files.push({ type: 'construction_during', urls: c.during_photos })
    }
    if (c.after_photos && c.after_photos.length) {
      files.push({ type: 'construction_after', urls: c.after_photos })
    }
    if (c.signature_path) {
      files.push({ type: 'construction_signature', url: c.signature_path })
    }
  }

  return files
}

// ==================== 创建归档 ====================

/**
 * POST /api/v1/archives/:workOrderId
 * 创建归档
 */
async function createArchive(req, res) {
  const { workOrderId } = req.params
  const tenantId = req.user.role === 'super_admin' ? undefined : (req.tenantId || req.user.tenant_id)

  const woWhere = { id: parseInt(workOrderId, 10) }
  if (tenantId) woWhere.tenant_id = tenantId

  const workOrder = await WorkOrder.findOne({ where: woWhere })
  if (!workOrder) {
    return error(res, '工单不存在', 404)
  }

  // 检查是否已归档
  const existingArchive = await WoArchive.findOne({ where: { work_order_id: workOrder.id } })
  if (existingArchive) {
    return error(res, '该工单已归档', 400)
  }

  // 自动汇总全流程文件
  const fileUrls = await collectWorkOrderFiles(workOrder.id)

  // 创建归档记录
  const archiveNo = generateArchiveNo()
  const archive = await WoArchive.create({
    work_order_id: workOrder.id,
    archive_no: archiveNo,
    file_urls: fileUrls,
    archive_status: 'archived',
    archived_at: new Date().toISOString().slice(0, 10),
    archived_by: req.user.user_id,
  })

  // 更新工单状态
  await workOrder.update({
    current_stage: 'archive',
    status: 'archived',
  })

  // 记录日志
  await createLog(workOrder.id, req.user, 'archived', 'archive',
    `工单已归档，归档编号: ${archiveNo}`)

  return success(res, archive, '归档成功')
}

// ==================== 归档列表 ====================

/**
 * GET /api/v1/archives
 * 归档列表
 * 筛选: ?page=&limit=&keyword=
 */
async function listArchives(req, res) {
  const { page = 1, limit = 20, keyword } = req.query
  const tenantId = req.user.role === 'super_admin' ? undefined : (req.tenantId || req.user.tenant_id)

  const where = {}

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

  // 关键词搜索
  if (keyword) {
    // 先查匹配的工单
    const woKeywordWhere = {
      [Op.or]: [
        { title: { [Op.like]: `%${keyword}%` } },
        { work_order_no: { [Op.like]: `%${keyword}%` } },
      ],
    }
    if (tenantId) woKeywordWhere.tenant_id = tenantId

    const matchedWos = await WorkOrder.findAll({
      where: woKeywordWhere,
      attributes: ['id'],
      raw: true,
    })
    const matchedWoIds = matchedWos.map(w => w.id)
    where.work_order_id = matchedWoIds.length > 0 ? matchedWoIds : (where.work_order_id || [-1])
  }

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10)
  const pageSize = Math.min(Math.max(1, parseInt(limit, 10)), 100)

  const { count, rows } = await WoArchive.findAndCountAll({
    where,
    include: [
      {
        model: WorkOrder,
        as: 'workOrder',
        attributes: ['id', 'work_order_no', 'title', 'current_stage', 'status', 'completed_at', 'custom_data'],
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

// ==================== 归档详情 ====================

/**
 * GET /api/v1/archives/:workOrderId
 * 归档详情
 */
async function getArchive(req, res) {
  const { workOrderId } = req.params
  const tenantId = req.user.role === 'super_admin' ? undefined : (req.tenantId || req.user.tenant_id)

  const woWhere = { id: parseInt(workOrderId, 10) }
  if (tenantId) woWhere.tenant_id = tenantId

  const workOrder = await WorkOrder.findOne({ where: woWhere })
  if (!workOrder) {
    return error(res, '工单不存在', 404)
  }

  const archive = await WoArchive.findOne({
    where: { work_order_id: workOrder.id },
    include: [
      {
        model: WorkOrder,
        as: 'workOrder',
        attributes: ['id', 'work_order_no', 'title', 'description', 'current_stage', 'status', 'completed_at', 'custom_data'],
        required: false,
      },
    ],
  })

  if (!archive) {
    return error(res, '归档记录不存在', 404)
  }

  return success(res, archive)
}

// ==================== 归档导出 ====================

/**
 * GET /api/v1/archives/:workOrderId/export
 * 获取归档数据（用于 PDF/ZIP 生成）
 */
async function exportArchive(req, res) {
  const { workOrderId } = req.params
  const tenantId = req.user.role === 'super_admin' ? undefined : (req.tenantId || req.user.tenant_id)

  const woWhere = { id: parseInt(workOrderId, 10) }
  if (tenantId) woWhere.tenant_id = tenantId

  const workOrder = await WorkOrder.findOne({
    where: woWhere,
    include: [
      { model: WoDeclaration, as: 'declaration', required: false },
      { model: WoMeasurement, as: 'measurements', required: false },
      { model: WoDesign, as: 'designs', required: false },
      { model: WoConstruction, as: 'constructions', required: false },
    ],
  })

  if (!workOrder) {
    return error(res, '工单不存在', 404)
  }

  const archive = await WoArchive.findOne({ where: { work_order_id: workOrder.id } })

  // 收集所有文件URL
  const allFileUrls = await collectWorkOrderFiles(workOrder.id)

  const exportData = {
    archive_no: archive?.archive_no || null,
    archived_at: archive?.archived_at || null,
    work_order: {
      id: workOrder.id,
      work_order_no: workOrder.work_order_no,
      title: workOrder.title,
      description: workOrder.description,
      status: workOrder.status,
      current_stage: workOrder.current_stage,
      completed_at: workOrder.completed_at,
    },
    declaration: workOrder.declaration || null,
    measurements: workOrder.measurements || [],
    designs: workOrder.designs || [],
    constructions: workOrder.constructions || [],
    file_urls: allFileUrls,
    total_files: allFileUrls.reduce((sum, f) => sum + (f.urls ? f.urls.length : 1), 0),
  }

  return success(res, exportData)
}

module.exports = {
  createArchive,
  listArchives,
  getArchive,
  exportArchive,
}
