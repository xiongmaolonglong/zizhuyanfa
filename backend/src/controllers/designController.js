const { Op } = require('sequelize')
const {
  WorkOrder,
  WoDesign,
  WoMeasurement,
  WoDeclaration,
  WoProduction,
  WorkOrderLog,
  Notification,
  TenantUser,
  Client,
  ClientUser,
} = require('../models')
const { createLog } = require('./workOrderController')
const { success, error, paginate } = require('../utils/response')
const { injectTenant } = require('../middleware/tenant')

// 解析 JSON 字段（数据库为 longtext，Sequelize 未自动解析）
function parseJSON(field) {
  if (typeof field === 'string') {
    try { return JSON.parse(field) } catch { return [] }
  }
  return field || []
}

// ==================== 设计师待设计任务列表 ====================

/**
 * GET /api/v1/designs/tasks
 * 设计师待设计任务列表
 * 管理员（role=admin/super_admin）可查看所有工单
 */
async function getDesignerTasks(req, res) {
  const { page = 1, limit = 20 } = req.query

  // 管理员看所有，普通设计师只看自己的
  const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin'

  const where = {
    current_stage: 'design',
  }

  if (!isAdmin) {
    where.assigned_tenant_user_id = req.user.user_id
  }

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10)
  const pageSize = Math.min(Math.max(1, parseInt(limit, 10)), 100)

  const { count, rows } = await WorkOrder.findAndCountAll({
    where,
    include: [
      {
        model: WoMeasurement,
        as: 'measurements',
        required: false,
        attributes: ['id', 'face_name', 'width', 'height', 'area', 'photos', 'materials'],
      },
      {
        model: TenantUser,
        as: 'designer',
        required: false,
        attributes: ['id', 'name', 'phone'],
      },
    ],
    attributes: [
      'id', 'work_order_no', 'title', 'status', 'current_stage',
      'deadline', 'created_at', 'designer_id',
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

/**
 * 生成生产任务编号: PROD-YYYYMMDD-XXXX
 */
function generateProductionTaskNo() {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `PROD-${dateStr}-${random}`
}

// ==================== 设计详情页（工单+测量+设计+日志） ====================

/**
 * GET /api/v1/designs/:workOrderId/detail
 * 设计详情页数据：工单基本信息 + 测量数据 + 设计稿 + 操作日志
 */
async function getDesignDetail(req, res) {
  const workOrderId = parseInt(req.params.workOrderId, 10)

  // 工单基本信息
  const workOrder = await WorkOrder.findByPk(workOrderId, {
    attributes: [
      'id', 'work_order_no', 'title', 'project_category', 'description',
      'status', 'current_stage', 'deadline', 'created_at',
      'client_id', 'assigned_tenant_user_id', 'designer_id',
      'custom_data',
    ],
    include: [
      { model: Client, as: 'client', attributes: ['id', 'name'], required: false },
      { model: TenantUser, as: 'designer', required: false, attributes: ['id', 'name', 'phone'] },
    ],
  })
  if (!workOrder) {
    return error(res, '工单不存在', 404)
  }

  // 申报信息（地址、联系人、广告类型等）
  const declaration = await WoDeclaration.findOne({
    where: { work_order_id: workOrderId },
    attributes: ['full_address', 'contact_name', 'contact_phone', 'photos', 'project_type'],
  })

  // 测量数据
  const measurements = await WoMeasurement.findAll({
    where: { work_order_id: workOrderId },
    order: [['created_at', 'ASC']],
  })

  // 设计稿（所有版本）
  const designs = await WoDesign.findAll({
    where: { work_order_id: workOrderId },
    include: [
      { model: TenantUser, as: 'designer', attributes: ['id', 'name', 'phone'] },
      { model: TenantUser, as: 'reviewer', attributes: ['id', 'name'] },
    ],
    order: [['version', 'ASC']],
  })

  // 操作日志
  const rawLogs = await WorkOrderLog.findAll({
    where: { work_order_id: workOrderId },
    order: [['created_at', 'DESC']],
    limit: 50,
    raw: true,
  })

  // 填充 user_name
  const tenantUserIds = [...new Set(rawLogs.filter(l => l.user_type === 'tenant').map(l => l.user_id))]
  const clientUserIds = [...new Set(rawLogs.filter(l => l.user_type === 'client').map(l => l.user_id))]
  const [tenantUsers, clientUsers] = await Promise.all([
    tenantUserIds.length ? TenantUser.findAll({ where: { id: { [Op.in]: tenantUserIds } }, attributes: ['id', 'name'], raw: true }) : [],
    clientUserIds.length ? ClientUser.findAll({ where: { id: { [Op.in]: clientUserIds } }, attributes: ['id', 'name'], raw: true }) : [],
  ])
  const tenantNameMap = {}
  for (const u of tenantUsers) tenantNameMap[u.id] = u.name
  const clientNameMap = {}
  for (const u of clientUsers) clientNameMap[u.id] = u.name
  const logs = rawLogs.map(log => {
    if (log.user_type === 'super_admin') return { ...log, user_name: '超级管理员' }
    if (log.user_type === 'tenant') return { ...log, user_name: tenantNameMap[log.user_id] || '未知' }
    if (log.user_type === 'client') return { ...log, user_name: clientNameMap[log.user_id] || '未知' }
    return { ...log, user_name: '未知' }
  })

  // 解析 JSON 字段（数据库为 longtext，Sequelize 未自动解析）
  function parseJSON(field) {
    if (typeof field === 'string') {
      try { return JSON.parse(field) } catch { return [] }
    }
    return field || []
  }

  const parsedDesigns = designs.map(d => {
    const plain = d.get ? d.get({ plain: true }) : d
    return {
      ...plain,
      effect_images: parseJSON(plain.effect_images),
      source_files: parseJSON(plain.source_files),
      material_list: parseJSON(plain.material_list),
      face_mapping: parseJSON(plain.face_mapping),
    }
  })

  return success(res, {
    work_order: workOrder,
    declaration: declaration || null,
    measurements,
    design: parsedDesigns[parsedDesigns.length - 1] || null,
    design_versions: parsedDesigns,
    logs,
  })
}

// ==================== 设计任务详情 ====================

/**
 * GET /api/v1/designs/tasks/:workOrderId
 * 设计任务详情（工单信息 + 测量数据）
 * 管理员可查看所有工单
 */
async function getTaskDetail(req, res) {
  const workOrderId = parseInt(req.params.workOrderId, 10)
  const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin'

  const where = { id: workOrderId }
  if (!isAdmin) {
    where.assigned_tenant_user_id = req.user.user_id
  }

  const workOrder = await WorkOrder.findOne({
    where,
    include: [
      {
        model: WoMeasurement,
        as: 'measurements',
        required: false,
        attributes: [
          'id', 'face_name', 'width', 'height', 'area', 'depth',
          'photos', 'notes', 'created_at',
        ],
      },
      {
        model: WoDesign,
        as: 'designs',
        required: false,
      },
    ],
  })

  if (!workOrder) {
    return error(res, '任务不存在或无权访问', 404)
  }

  return success(res, workOrder)
}

// ==================== 上传设计稿 ====================

/**
 * POST /api/v1/designs/:workOrderId
 * 上传设计稿
 */
async function uploadDesign(req, res) {
  const workOrderId = parseInt(req.params.workOrderId, 10)
  const {
    effect_images,
    source_files,
    material_list,
    face_mapping,
    internal_notes,
  } = req.body

  if (!effect_images || !Array.isArray(effect_images)) {
    return error(res, '效果图不能为空', 400)
  }

  // 校验工单存在且可操作
  const workOrder = await WorkOrder.findByPk(workOrderId)
  if (!workOrder) {
    return error(res, '工单不存在', 404)
  }

  if (workOrder.current_stage !== 'design' && workOrder.status !== 'designing') {
    return error(res, '当前工单不在设计阶段，无法上传设计', 400)
  }

  // 优先使用已指派的设计师，否则用当前操作用户
  const designerId = workOrder.designer_id || req.user.user_id

  // 获取当前最大版本号
  const latestDesign = await WoDesign.findOne({
    where: { work_order_id: workOrderId },
    order: [['version', 'DESC']],
  })
  const nextVersion = latestDesign ? latestDesign.version + 1 : 1

  // 创建新版本设计记录，直接进入审核
  const design = await WoDesign.create({
    work_order_id: workOrderId,
    designer_id: designerId,
    version: nextVersion,
    effect_images,
    source_files: source_files || [],
    material_list: material_list || [],
    face_mapping: face_mapping || [],
    internal_notes: internal_notes || null,
    status: 'reviewing',
  })

  // 更新工单
  await workOrder.update({
    current_stage: 'design',
    status: 'designing',
  })

  // 记录日志
  await createLog(workOrderId, req.user, 'design_upload', 'design', `上传设计稿 v${nextVersion}`)

  return success(res, design, '设计稿上传成功')
}

// ==================== 获取设计稿信息 ====================

/**
 * GET /api/v1/designs/:workOrderId
 * 获取设计稿信息
 */
async function getDesignInfo(req, res) {
  const workOrderId = parseInt(req.params.workOrderId, 10)

  const design = await WoDesign.findOne({
    where: { work_order_id: workOrderId },
    include: [
      { model: TenantUser, as: 'designer', attributes: ['id', 'name', 'phone'] },
      { model: TenantUser, as: 'reviewer', attributes: ['id', 'name'] },
    ],
    order: [['version', 'DESC']],
  })

  if (!design) {
    return error(res, '设计稿不存在', 404)
  }

  const plain = design.get ? design.get({ plain: true }) : design
  const parsed = {
    ...plain,
    effect_images: parseJSON(plain.effect_images),
    source_files: parseJSON(plain.source_files),
    material_list: parseJSON(plain.material_list),
    face_mapping: parseJSON(plain.face_mapping),
  }
  return success(res, parsed)
}

// ==================== 审核设计稿 ====================

/**
 * POST /api/v1/designs/:workOrderId/review
 * 审核设计稿（管理员）
 */
async function reviewDesign(req, res) {
  const workOrderId = parseInt(req.params.workOrderId, 10)
  const { action, comment } = req.body

  if (!['approve', 'reject'].includes(action)) {
    return error(res, '审核操作必须为 approve 或 reject', 400)
  }

  const design = await WoDesign.findOne({
    where: { work_order_id: workOrderId },
    order: [['version', 'DESC']],
  })
  if (!design) {
    return error(res, '设计稿不存在', 404)
  }

  const workOrder = await WorkOrder.findByPk(workOrderId)
  if (!workOrder) {
    return error(res, '工单不存在', 404)
  }

  const reviewerId = req.user.user_id
  const now = new Date()

  if (action === 'approve') {
    // 审核通过
    await design.update({
      status: 'approved',
      reviewer_id: reviewerId,
      review_comment: comment || null,
      reviewed_at: now,
    })

    // 工单进入生产环节
    await workOrder.update({
      current_stage: 'production',
      status: 'producing',
    })

    // 自动创建生产任务
    const parsedMaterialList = typeof design.material_list === 'string'
      ? JSON.parse(design.material_list)
      : design.material_list
    const parsedFaceMapping = typeof design.face_mapping === 'string'
      ? JSON.parse(design.face_mapping)
      : design.face_mapping

    // 优先用 material_list，如果没有则从 face_mapping 提取材料类型
    let materialTypes = []
    if (Array.isArray(parsedMaterialList) && parsedMaterialList.length > 0) {
      materialTypes = parsedMaterialList.map(m => m.material_type || m.type).filter(Boolean)
    } else if (Array.isArray(parsedFaceMapping) && parsedFaceMapping.length > 0) {
      materialTypes = [...new Set(parsedFaceMapping.map(m => m.material_type).filter(Boolean))]
    }

    // 按材料类型创建生产任务
    if (materialTypes.length > 0) {
      for (const matType of materialTypes) {
        await WoProduction.create({
          work_order_id: workOrderId,
          production_task_no: generateProductionTaskNo(),
          material_type: matType,
          status: 'scheduled',
        })
      }
    } else {
      // 如果没有任何材料信息，创建一个通用生产任务
      await WoProduction.create({
        work_order_id: workOrderId,
        production_task_no: generateProductionTaskNo(),
        material_type: '待确认',
        status: 'scheduled',
      })
    }

    await createLog(workOrderId, req.user, 'design_approve', 'design', comment || '设计审核通过')
  } else {
    // 审核驳回
    await design.update({
      status: 'rejected',
      reviewer_id: reviewerId,
      review_comment: comment || null,
      reviewed_at: now,
    })

    // 工单保持 designing 状态（退回设计师修改）
    await workOrder.update({
      current_stage: 'design',
      status: 'designing',
    })

    await createLog(workOrderId, req.user, 'design_reject', 'design', comment || '设计审核驳回')

    // 通知设计师
    await Notification.create({
      user_id: design.designer_id,
      user_type: 'tenant',
      title: '设计稿被驳回',
      content: `工单 ${workOrder.work_order_no} 的设计稿已被驳回${comment ? '，原因：' + comment : ''}`,
      type: 'design_rejected',
      work_order_id: workOrderId,
    })
  }

  const updated = await WoDesign.findByPk(design.id)
  return success(res, updated, action === 'approve' ? '审核通过' : '审核驳回')
}

// ==================== 修改设计稿 ====================

/**
 * PUT /api/v1/designs/:workOrderId
 * 修改设计稿（被驳回后重新提交）
 */
async function updateDesign(req, res) {
  const workOrderId = parseInt(req.params.workOrderId, 10)
  const {
    effect_images,
    source_files,
    material_list,
    face_mapping,
    internal_notes,
  } = req.body

  const design = await WoDesign.findOne({
    where: { work_order_id: workOrderId },
    order: [['version', 'DESC']],
  })
  if (!design) {
    return error(res, '设计稿不存在', 404)
  }

  if (design.status !== 'rejected') {
    return error(res, '只能修改被驳回的设计稿', 400)
  }

  await design.update({
    effect_images: effect_images || design.effect_images,
    source_files: source_files !== undefined ? source_files : design.source_files,
    material_list: material_list !== undefined ? material_list : design.material_list,
    face_mapping: face_mapping !== undefined ? face_mapping : design.face_mapping,
    internal_notes: internal_notes !== undefined ? internal_notes : design.internal_notes,
    status: 'reviewing',
    review_comment: null,
    reviewed_at: null,
  })

  // 工单保持设计阶段
  const workOrder = await WorkOrder.findByPk(workOrderId)
  if (workOrder) {
    await workOrder.update({
      current_stage: 'design',
      status: 'designing',
    })
  }

  await createLog(workOrderId, req.user, 'design_update', 'design', '修改并重新提交设计稿')

  return success(res, design, '设计稿已重新提交')
}

// ==================== 提交设计审核 ====================

/**
 * POST /api/v1/designs/:workOrderId/submit-review
 * 设计师提交设计审核（驳回后重新上传后调用）
 */
async function submitReview(req, res) {
  const workOrderId = parseInt(req.params.workOrderId, 10)

  const design = await WoDesign.findOne({
    where: { work_order_id: workOrderId },
    order: [['version', 'DESC']],
  })
  if (!design) {
    return error(res, '设计稿不存在', 404)
  }

  if (design.status !== 'designing') {
    return error(res, '当前状态不可提交审核', 400)
  }

  await design.update({ status: 'reviewing' })

  await createLog(workOrderId, req.user, 'design_submit', 'design', `提交设计稿 v${design.version} 审核`)

  return success(res, design, '已提交审核')
}

// ==================== 撤回设计稿 ====================

/**
 * POST /api/v1/designs/:workOrderId/withdraw
 * 设计师撤回审核中的设计稿，回到可修改状态
 */
async function withdrawDesign(req, res) {
  const workOrderId = parseInt(req.params.workOrderId, 10)

  const design = await WoDesign.findOne({
    where: { work_order_id: workOrderId },
    order: [['version', 'DESC']],
  })
  if (!design) {
    return error(res, '设计稿不存在', 404)
  }

  if (design.status !== 'reviewing') {
    return error(res, '只有审核中的设计稿才能撤回', 400)
  }

  await design.update({ status: 'rejected' })

  await createLog(workOrderId, req.user, 'design_withdraw', 'design', `撤回设计稿 v${design.version}，回到修改状态`)

  return success(res, design, '已撤回，可重新修改')
}

// ==================== 材料清单变更 ====================

/**
 * POST /api/v1/designs/:workOrderId/materials
 * 修改材料用量
 */
async function updateMaterials(req, res) {
  const workOrderId = parseInt(req.params.workOrderId, 10)
  const { changes } = req.body

  if (!changes || !Array.isArray(changes) || changes.length === 0) {
    return error(res, '材料变更数据不能为空', 400)
  }

  const design = await WoDesign.findOne({
    where: { work_order_id: workOrderId },
    order: [['version', 'DESC']],
  })
  if (!design) {
    return error(res, '设计稿不存在', 404)
  }

  let materialList = design.material_list
  if (typeof materialList === 'string') {
    try { materialList = JSON.parse(materialList) } catch { materialList = [] }
  }
  if (!materialList || !Array.isArray(materialList)) {
    return error(res, '当前无材料清单', 400)
  }

  const updatedMaterialList = materialList.map((item) => {
    // 查找匹配的变更
    const change = changes.find(
      (c) => c.material_type === item.material_type
    )
    if (change) {
      return {
        ...item,
        confirmed_qty: change.new_qty,
        notes: change.reason || item.notes || '',
        _change_record: {
          old_qty: change.old_qty,
          new_qty: change.new_qty,
          reason: change.reason,
          changed_at: new Date().toISOString(),
          changed_by: req.user.user_id,
        },
      }
    }
    return item
  })

  await design.update({ material_list: updatedMaterialList })

  // 记录材料变更日志
  const changeSummary = changes
    .map((c) => `${c.material_type}: ${c.old_qty} -> ${c.new_qty} (${c.reason || ''})`)
    .join('; ')

  await createLog(workOrderId, req.user, 'material_change', 'design', `材料变更: ${changeSummary}`)

  return success(res, design, '材料用量已更新')
}

// ==================== 导出设计报告数据 ====================

/**
 * GET /api/v1/designs/:workOrderId/export
 * 获取设计报告数据（用于前端生成 PDF）
 */
async function exportDesignReport(req, res) {
  const workOrderId = parseInt(req.params.workOrderId, 10)

  const workOrder = await WorkOrder.findByPk(workOrderId, {
    attributes: [
      'id', 'work_order_no', 'title', 'project_category',
      'description', 'status', 'current_stage', 'deadline',
      'created_at', 'completed_at',
    ],
  })

  if (!workOrder) {
    return error(res, '工单不存在', 404)
  }

  const design = await WoDesign.findOne({
    where: { work_order_id: workOrderId },
    include: [
      { model: TenantUser, as: 'designer', attributes: ['id', 'name', 'phone'] },
      { model: TenantUser, as: 'reviewer', attributes: ['id', 'name'] },
    ],
    order: [['version', 'DESC']],
  })

  const measurements = await WoMeasurement.findAll({
    where: { work_order_id: workOrderId },
    attributes: ['id', 'face_name', 'width', 'height', 'area', 'depth', 'photos', 'notes', 'created_at'],
    order: [['created_at', 'ASC']],
  })

  const report = {
    work_order: {
      work_order_no: workOrder.work_order_no,
      title: workOrder.title,
      project_category: workOrder.project_category,
      description: workOrder.description,
      status: workOrder.status,
      current_stage: workOrder.current_stage,
      deadline: workOrder.deadline,
      created_at: workOrder.created_at,
    },
    measurements: measurements.map((m) => ({
      face_name: m.face_name,
      width: m.width,
      height: m.height,
      area: m.area,
      depth: m.depth,
      photos: m.photos,
      notes: m.notes,
    })),
    design: design
      ? {
        designer_name: design.designer?.name || null,
        reviewer_name: design.reviewer?.name || null,
        effect_images: parseJSON(design.effect_images),
        source_files: parseJSON(design.source_files),
        material_list: parseJSON(design.material_list),
        face_mapping: parseJSON(design.face_mapping),
        internal_notes: design.internal_notes,
        status: design.status,
        review_comment: design.review_comment,
        reviewed_at: design.reviewed_at,
      }
      : null,
  }

  return success(res, report)
}

// ==================== 获取设计师列表 ====================

/**
 * GET /api/v1/designs/designers
 * 获取所有设计师（用于指派下拉选择）
 */
async function getDesigners(req, res) {
  const designers = await TenantUser.findAll({
    where: { role: 'designer', status: 'active' },
    attributes: ['id', 'name', 'phone'],
    order: [['name', 'ASC']],
  })
  return success(res, designers)
}

// ==================== 指派设计师 ====================

/**
 * POST /api/v1/designs/:workOrderId/assign
 * 指派设计师到工单
 */
async function assignDesigner(req, res) {
  const workOrderId = parseInt(req.params.workOrderId, 10)
  const { designer_id } = req.body

  if (!designer_id) {
    return error(res, '请选择设计师', 400)
  }

  const workOrder = await WorkOrder.findByPk(workOrderId)
  if (!workOrder) {
    return error(res, '工单不存在', 404)
  }

  const designer = await TenantUser.findByPk(designer_id)
  if (!designer) {
    return error(res, '设计师不存在', 404)
  }

  await workOrder.update({ designer_id })

  // 记录日志
  await createLog(workOrderId, req.user, 'designer_assign', 'design', `指派设计师：${designer.name}`)

  return success(res, { designer_id, designer_name: designer.name }, '设计师指派成功')
}

// ==================== 自动生成材料清单 ====================

/**
 * GET /api/v1/designs/:workOrderId/auto-materials
 * 根据测量数据自动生成材料清单
 */
async function autoGenerateMaterials(req, res) {
  const workOrderId = parseInt(req.params.workOrderId, 10)

  const measurements = await WoMeasurement.findAll({
    where: { work_order_id: workOrderId },
    order: [['created_at', 'ASC']],
  })

  if (!measurements.length) {
    return error(res, '暂无测量数据', 400)
  }

  // 聚合材料：按材料类型汇总面积和面数
  const materialMap = {}

  for (const m of measurements) {
    let materials = m.materials
    if (typeof materials === 'string') {
      try { materials = JSON.parse(materials) } catch { materials = [] }
    }
    if (!Array.isArray(materials)) continue

    for (const mat of materials) {
      const type = mat.material_type || mat.type || '未分类'
      const faces = mat.faces || []

      if (!materialMap[type]) {
        materialMap[type] = {
          material_type: type,
          total_area: 0,
          face_count: 0,
          faces: [],
          unit: 'm²',
        }
      }

      for (const face of faces) {
        let w = face._widthM || 0
        let h = face._heightM || 0
        if (!w && !h) {
          const dims = [face.width, face.height, face.length].filter(v => v && v > 0)
          w = dims[0] || 0
          h = dims[1] || 0
        }
        const area = face.area || (w * h) || 0

        materialMap[type].total_area += area
        materialMap[type].face_count += 1
        materialMap[type].faces.push({
          label: face.label || face.face_name || '未知面',
          width: w,
          height: h,
          area,
          notes: face.notes || '',
        })
      }
    }
  }

  const materialList = Object.values(materialMap).map(m => ({
    ...m,
    total_area: parseFloat(m.total_area.toFixed(2)),
  }))

  if (!materialList.length) {
    return error(res, '测量数据中无材料信息', 400)
  }

  return success(res, { material_list: materialList, count: materialList.length }, '材料清单已生成')
}

// ==================== 确认设计定稿 ====================

/**
 * POST /api/v1/designs/:workOrderId/confirm
 * 确认设计定稿（审核通过后可由设计师或管理员确认）
 */
async function confirmDesign(req, res) {
  const workOrderId = parseInt(req.params.workOrderId, 10)

  const workOrder = await WorkOrder.findByPk(workOrderId)
  if (!workOrder) {
    return error(res, '工单不存在', 404)
  }

  const design = await WoDesign.findOne({
    where: { work_order_id: workOrderId },
    order: [['version', 'DESC']],
  })
  if (!design) {
    return error(res, '设计稿不存在', 404)
  }

  if (design.status !== 'approved') {
    return error(res, '只能确认已审核通过的设计稿', 400)
  }

  await design.update({ status: 'confirmed' })

  // 工单状态更新
  await workOrder.update({
    current_stage: 'design',
    status: 'design_confirmed',
  })

  await createLog(workOrderId, req.user, 'design_confirm', 'design', '设计确认定稿')

  return success(res, design, '设计已确认定稿')
}

module.exports = {
  getDesignerTasks,
  getTaskDetail,
  getDesignDetail,
  uploadDesign,
  getDesignInfo,
  reviewDesign,
  updateDesign,
  submitReview,
  withdrawDesign,
  updateMaterials,
  exportDesignReport,
  getDesigners,
  assignDesigner,
  autoGenerateMaterials,
  confirmDesign,
}
