const { Op } = require('sequelize')
const {
  WorkOrder,
  WoDeclaration,
  WoApproval,
  WoMeasurement,
  WoDesign,
  WoConstruction,
  WoFinance,
  WoArchive,
  WorkOrderLog,
  Notification,
  TenantUser,
  ClientUser,
  Client,
  Tenant,
} = require('../models')
const { success, error, paginate } = require('../utils/response')

const STAGE_LABELS = {
  declaration: '申报中',
  approval: '审批中',
  assignment: '待派单',
  measurement: '测量中',
  design: '设计中',
  production: '生产中',
  construction: '施工中',
  finance: '结算中',
  archive: '已归档',
  aftersale: '售后中',
}

const STAGE_COLORS = {
  declaration: '#e6a23c',
  approval: '#e6a23c',
  assignment: '#409eff',
  measurement: '#409eff',
  design: '#409eff',
  production: '#409eff',
  construction: '#409eff',
  finance: '#67c23a',
  archive: '#909399',
  aftersale: '#f56c6c',
}

function safeJSON(field) {
  if (!field) return []
  if (typeof field === 'string') {
    try { return JSON.parse(field) } catch { return [] }
  }
  return field
}

function formatDate(val) {
  if (!val) return ''
  const d = new Date(val)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(5, 10)
}

// ==================== 首页统计 ====================

/**
 * GET /api/v1/client/dashboard
 * 返回：统计、待办、进行中工单、通知预览、联系方式
 */
async function getDashboard(req, res) {
  try {
    const userId = req.user.user_id

    // --- 基础统计 ---
    const totalCount = await WorkOrder.count({ where: { client_user_id: userId } })

    const activeCount = await WorkOrder.count({
      where: {
        client_user_id: userId,
        current_stage: { [Op.notIn]: ['archive', 'aftersale'] },
        status: { [Op.notIn]: ['archived', 'aftersale_closed'] },
      },
    })

    // --- 最近申报 ---
    const recentList = await WorkOrder.findAll({
      where: { client_user_id: userId },
      order: [['created_at', 'DESC']],
      limit: 5,
      attributes: ['id', 'work_order_no', 'title', 'current_stage', 'created_at'],
    })

    const mappedRecent = recentList.map(wo => ({
      id: wo.id,
      declareNo: wo.work_order_no,
      title: wo.title,
      stage: STAGE_LABELS[wo.current_stage] || wo.current_stage,
      stageColor: STAGE_COLORS[wo.current_stage] || '#909399',
      createdAt: formatDate(wo.created_at),
    }))

    // --- 待办提醒 ---
    const allStages = [
      'declaration', 'approval', 'assignment', 'measurement',
      'design', 'production', 'construction', 'finance', 'archive',
    ]

    const activeOrders = await WorkOrder.findAll({
      where: {
        client_user_id: userId,
        current_stage: { [Op.notIn]: ['archive', 'aftersale'] },
        status: { [Op.notIn]: ['archived', 'aftersale_closed'] },
      },
      attributes: ['id', 'work_order_no', 'title', 'current_stage', 'status', 'deadline'],
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const pendingTasks = []

    for (const wo of activeOrders) {
      const stageIdx = allStages.indexOf(wo.current_stage)
      const deadline = wo.deadline ? new Date(wo.deadline) : null
      if (deadline) deadline.setHours(0, 0, 0, 0)

      // 设计待确认
      if (wo.current_stage === 'design') {
        pendingTasks.push({
          workOrderId: wo.id,
          workOrderNo: wo.work_order_no,
          title: wo.title,
          type: 'design_confirm',
          label: '设计稿待确认',
          desc: `${wo.work_order_no} 的设计稿已就绪，请确认`,
          urgency: isOverdue(deadline, today) ? 'urgent' : 'normal',
        })
      }

      // 施工待验收
      if (wo.current_stage === 'construction' && wo.status === 'completed') {
        pendingTasks.push({
          workOrderId: wo.id,
          workOrderNo: wo.work_order_no,
          title: wo.title,
          type: 'construction_accept',
          label: '施工待验收',
          desc: `${wo.work_order_no} 施工已完成，请验收`,
          urgency: isOverdue(deadline, today) ? 'urgent' : 'normal',
        })
      }

      // 结算待处理
      if (wo.current_stage === 'finance') {
        pendingTasks.push({
          workOrderId: wo.id,
          workOrderNo: wo.work_order_no,
          title: wo.title,
          type: 'finance_pending',
          label: '费用待处理',
          desc: `${wo.work_order_no} 进入结算阶段`,
          urgency: isOverdue(deadline, today) ? 'urgent' : 'normal',
        })
      }

      // 超时预警
      if (deadline && deadline < today) {
        const daysOverdue = Math.floor((today - deadline) / (1000 * 60 * 60 * 24))
        const existing = pendingTasks.find(t => t.workOrderId === wo.id)
        if (existing) {
          existing.urgency = 'urgent'
          existing.desc += `（已超时${daysOverdue}天）`
        } else {
          pendingTasks.push({
            workOrderId: wo.id,
            workOrderNo: wo.work_order_no,
            title: wo.title,
            type: 'overdue',
            label: '已超时',
            desc: `${wo.work_order_no} 已超时${daysOverdue}天`,
            urgency: 'urgent',
          })
        }
      }
    }

    // --- 进行中的工单（带进度） ---
    const inProgressOrders = activeOrders.slice(0, 5).map(wo => {
      const currentIdx = allStages.indexOf(wo.current_stage)
      const progress = Math.round(((currentIdx + 1) / allStages.length) * 100)
      return {
        id: wo.id,
        declareNo: wo.work_order_no,
        title: wo.title,
        stage: STAGE_LABELS[wo.current_stage] || wo.current_stage,
        stageColor: STAGE_COLORS[wo.current_stage] || '#909399',
        progress,
        deadline: wo.deadline ? String(wo.deadline) : '',
      }
    })

    // --- 通知预览 ---
    const latestNotifications = await Notification.findAll({
      where: { user_id: userId, user_type: 'client' },
      order: [['created_at', 'DESC']],
      limit: 3,
      attributes: ['id', 'title', 'type', 'work_order_id', 'is_read', 'created_at'],
    })

    const mappedNotifications = latestNotifications.map(n => ({
      id: n.id,
      title: n.title,
      type: n.type,
      workOrderId: n.work_order_id,
      isRead: n.is_read,
      createdAt: n.created_at ? new Date(n.created_at).toLocaleString('zh-CN', {
        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      }) : '',
    }))

    // --- 联系方式 ---
    const contactInfo = await getTenantContact(userId)

    return success(res, {
      totalCount,
      activeCount,
      recentList: mappedRecent,
      pendingTasks,
      inProgressOrders,
      notifications: mappedNotifications,
      contactInfo,
    })
  } catch (err) {
    return error(res, err.message || '获取统计失败', 500)
  }
}

/**
 * 判断是否超时
 */
function isOverdue(deadline, today) {
  return deadline && deadline < today
}

/**
 * 获取租户联系方式
 */
async function getTenantContact(userId) {
  try {
    const clientUser = await ClientUser.findByPk(userId, {
      include: [{
        model: Client,
        as: 'client',
        attributes: ['id', 'name', 'tenant_id'],
      }],
    })

    if (!clientUser || !clientUser.client) {
      return { tenantName: '', phone: '', contact: '' }
    }

    const tenant = await Tenant.findByPk(clientUser.client.tenant_id, {
      attributes: ['name', 'contact_name', 'contact_phone'],
    })

    return {
      tenantName: tenant?.name || '',
      phone: tenant?.contact_phone || '',
      contact: tenant?.contact_name || '',
    }
  } catch {
    return { tenantName: '', phone: '', contact: '' }
  }
}

// ==================== 我的工单列表 ====================

/**
 * GET /api/v1/client/work-orders
 */
async function listWorkOrders(req, res) {
  try {
    const { stage, page = 1, limit = 20 } = req.query
    const pageNum = parseInt(page, 10) || 1
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100)
    const offset = (pageNum - 1) * limitNum

    const where = { client_user_id: req.user.user_id }
    if (stage) where.current_stage = stage

    const { count, rows } = await WorkOrder.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset,
      attributes: ['id', 'work_order_no', 'title', 'current_stage', 'status', 'created_at'],
    })

    const mapped = rows.map(wo => ({
      id: wo.id,
      declareNo: wo.work_order_no,
      title: wo.title,
      stage: STAGE_LABELS[wo.current_stage] || wo.current_stage,
      stageColor: STAGE_COLORS[wo.current_stage] || '#909399',
      createdAt: formatDate(wo.created_at),
    }))

    return paginate(res, mapped, {
      total: count,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(count / limitNum),
    })
  } catch (err) {
    return error(res, err.message || '获取列表失败', 500)
  }
}

// ==================== 工单详情 ====================

/**
 * GET /api/v1/client/work-orders/:id
 */
async function getWorkOrderDetail(req, res) {
  try {
    const id = parseInt(req.params.id, 10)

    const workOrder = await WorkOrder.findOne({
      where: { id, client_user_id: req.user.user_id },
      include: [{ model: WoDeclaration, as: 'declaration', required: false }],
    })

    if (!workOrder) {
      return error(res, '工单不存在或无权查看', 404)
    }

    // 全流程进度阶段
    const allStages = [
      'declaration', 'approval', 'assignment', 'measurement',
      'design', 'production', 'construction', 'finance', 'archive',
    ]
    const currentIdx = allStages.indexOf(workOrder.current_stage)

    const stages = allStages.map((key, idx) => ({
      key,
      label: STAGE_LABELS[key] || key,
      done: idx < currentIdx,
      current: idx === currentIdx,
    }))

    // 操作日志
    const rawLogs = await WorkOrderLog.findAll({
      where: { work_order_id: id },
      order: [['created_at', 'DESC']],
      limit: 50,
      raw: true,
    })

    const logs = rawLogs.map(log => ({
      id: log.id,
      content: log.detail || log.action,
      time: log.created_at ? new Date(log.created_at).toLocaleString('zh-CN') : '',
    }))

    const dec = workOrder.declaration || {}

    return success(res, {
      id: workOrder.id,
      declareNo: workOrder.work_order_no,
      title: workOrder.title,
      stage: STAGE_LABELS[workOrder.current_stage] || workOrder.current_stage,
      stageColor: STAGE_COLORS[workOrder.current_stage] || '#909399',
      current_stage: workOrder.current_stage,
      status: workOrder.status,
      description: workOrder.description || '',
      activity_name: workOrder.activity_name || '',
      address: dec.address || dec.full_address || '',
      detailAddress: dec.detail_address || '',
      typeLabel: dec.project_type || '',
      contactName: dec.contact_name || '',
      contactPhone: dec.contact_phone || '',
      photos: safeJSON(dec.photos),
      stages,
      logs,
    })
  } catch (err) {
    return error(res, err.message || '获取详情失败', 500)
  }
}

// ==================== 设计详情 ====================

/**
 * GET /api/v1/client/work-orders/:id/design
 */
async function getWorkOrderDesign(req, res) {
  try {
    const id = parseInt(req.params.id, 10)

    const workOrder = await WorkOrder.findOne({
      where: { id, client_user_id: req.user.user_id },
    })

    if (!workOrder) {
      return error(res, '工单不存在或无权查看', 404)
    }

    const design = await WoDesign.findOne({
      where: { work_order_id: id },
      include: [{ model: TenantUser, as: 'designer', attributes: ['id', 'name'] }],
      order: [['version', 'DESC']],
    })

    if (!design) {
      return success(res, { design: null, measurements: [], message: '暂无设计稿' })
    }

    const measurements = await WoMeasurement.findAll({
      where: { work_order_id: id },
      order: [['created_at', 'ASC']],
    })

    return success(res, {
      design: {
        ...design.get({ plain: true }),
        effect_images: safeJSON(design.effect_images),
        source_files: safeJSON(design.source_files),
        material_list: safeJSON(design.material_list),
        face_mapping: safeJSON(design.face_mapping),
      },
      measurements,
    })
  } catch (err) {
    return error(res, err.message || '获取设计详情失败', 500)
  }
}

// ==================== 施工信息 ====================

/**
 * GET /api/v1/client/work-orders/:id/construction
 */
async function getWorkOrderConstruction(req, res) {
  try {
    const id = parseInt(req.params.id, 10)

    const workOrder = await WorkOrder.findOne({
      where: { id, client_user_id: req.user.user_id },
    })

    if (!workOrder) {
      return error(res, '工单不存在或无权查看', 404)
    }

    const constructions = await WoConstruction.findAll({
      where: { work_order_id: id },
      order: [['created_at', 'DESC']],
    })

    return success(res, {
      constructions: constructions.map(c => ({
        id: c.id,
        status: c.status,
        before_photos: safeJSON(c.before_photos),
        during_photos: safeJSON(c.during_photos),
        after_photos: safeJSON(c.after_photos),
        notes: c.notes,
        constructed_at: c.constructed_at,
        client_verified_at: c.client_verified_at,
      })),
    })
  } catch (err) {
    return error(res, err.message || '获取施工信息失败', 500)
  }
}

// ==================== 费用信息 ====================

/**
 * GET /api/v1/client/work-orders/:id/finance
 */
async function getWorkOrderFinance(req, res) {
  try {
    const id = parseInt(req.params.id, 10)

    const workOrder = await WorkOrder.findOne({
      where: { id, client_user_id: req.user.user_id },
    })

    if (!workOrder) {
      return error(res, '工单不存在或无权查看', 404)
    }

    const finance = await WoFinance.findOne({ where: { work_order_id: id } })

    if (!finance) {
      return success(res, { finance: null, message: '暂无费用信息' })
    }

    return success(res, {
      finance: {
        quote_amount: finance.quote_amount,
        quote_notes: finance.quote_notes,
        payment_records: safeJSON(finance.payment_records),
        invoice_number: finance.invoice_number,
        invoice_file: finance.invoice_file,
        status: finance.status,
        settlement_status: finance.settlement_status,
      },
    })
  } catch (err) {
    return error(res, err.message || '获取费用信息失败', 500)
  }
}

// ==================== 归档列表 ====================

/**
 * GET /api/v1/client/archives
 */
async function listArchives(req, res) {
  try {
    const { page = 1, limit = 20, keyword } = req.query
    const pageNum = parseInt(page, 10) || 1
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100)
    const offset = (pageNum - 1) * limitNum

    const woWhere = { client_user_id: req.user.user_id, current_stage: 'archive' }
    if (keyword) {
      woWhere[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { work_order_no: { [Op.like]: `%${keyword}%` } },
      ]
    }

    const woIds = await WorkOrder.findAll({
      where: woWhere,
      attributes: ['id'],
      raw: true,
    })

    if (woIds.length === 0) {
      return paginate(res, [], { page: pageNum, limit: limitNum, total: 0, total_pages: 0 })
    }

    const { count, rows } = await WoArchive.findAndCountAll({
      where: { work_order_id: { [Op.in]: woIds.map(w => w.id) } },
      include: [
        {
          model: WorkOrder,
          as: 'workOrder',
          attributes: ['id', 'work_order_no', 'title', 'completed_at'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset,
    })

    const mapped = rows.map(a => ({
      id: a.id,
      work_order_id: a.workOrder?.id,
      declareNo: a.workOrder?.work_order_no,
      title: a.workOrder?.title,
      stage: '已归档',
      stageColor: '#909399',
      createdAt: a.archived_at || formatDate(a.created_at),
    }))

    return paginate(res, mapped, {
      total: count,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(count / limitNum),
    })
  } catch (err) {
    return error(res, err.message || '获取归档列表失败', 500)
  }
}

// ==================== 归档详情 ====================

/**
 * GET /api/v1/client/archives/:id
 */
async function getArchiveDetail(req, res) {
  try {
    const id = parseInt(req.params.id, 10)

    const archive = await WoArchive.findOne({
      where: { id },
      include: [
        {
          model: WorkOrder,
          as: 'workOrder',
          where: { client_user_id: req.user.user_id },
          attributes: ['id', 'work_order_no', 'title', 'completed_at'],
        },
      ],
    })

    if (!archive) {
      return error(res, '归档不存在或无权查看', 404)
    }

    const wo = archive.workOrder
    return success(res, {
      id: archive.id,
      archive_no: archive.archive_no,
      declareNo: wo?.work_order_no,
      title: wo?.title,
      archived_at: archive.archived_at,
      file_urls: safeJSON(archive.file_urls),
    })
  } catch (err) {
    return error(res, err.message || '获取归档详情失败', 500)
  }
}

// ==================== 通知详情 ====================

/**
 * GET /api/v1/client/notifications/:id
 */
async function getNotificationDetail(req, res) {
  try {
    const id = parseInt(req.params.id, 10)

    const notification = await Notification.findByPk(id)

    if (!notification || notification.user_id !== req.user.user_id || notification.user_type !== 'client') {
      return error(res, '通知不存在或无权查看', 404)
    }

    return success(res, {
      id: notification.id,
      title: notification.title,
      content: notification.content,
      type: notification.type,
      workOrderId: notification.work_order_id,
      isRead: notification.is_read,
      createdAt: notification.created_at ? new Date(notification.created_at).toLocaleString('zh-CN') : '',
    })
  } catch (err) {
    return error(res, err.message || '获取通知详情失败', 500)
  }
}

/**
 * PUT /api/v1/client/notifications/:id
 */
async function markNotificationRead(req, res) {
  try {
    const id = parseInt(req.params.id, 10)

    const notification = await Notification.findByPk(id)

    if (!notification || notification.user_id !== req.user.user_id || notification.user_type !== 'client') {
      return error(res, '通知不存在或无权操作', 404)
    }

    await notification.update({ is_read: true, read_at: new Date() })

    return success(res, { id: notification.id }, '已标记为已读')
  } catch (err) {
    return error(res, err.message || '操作失败', 500)
  }
}

// ==================== 通知列表 ====================

/**
 * GET /api/v1/client/notifications
 */
async function listNotifications(req, res) {
  try {
    const { page = 1, limit = 20, unread_only } = req.query
    const pageNum = parseInt(page, 10) || 1
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100)
    const offset = (pageNum - 1) * limitNum

    const where = { user_id: req.user.user_id, user_type: 'client' }
    if (unread_only) where.is_read = false

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset,
    })

    const mapped = rows.map(n => ({
      id: n.id,
      title: n.title,
      content: n.content,
      type: n.type,
      work_order_id: n.work_order_id,
      is_read: n.is_read,
      created_at: n.created_at ? new Date(n.created_at).toLocaleString('zh-CN') : '',
    }))

    return paginate(res, mapped, {
      total: count,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(count / limitNum),
    })
  } catch (err) {
    return error(res, err.message || '获取通知失败', 500)
  }
}

module.exports = {
  getDashboard,
  listWorkOrders,
  getWorkOrderDetail,
  getWorkOrderDesign,
  getWorkOrderConstruction,
  getWorkOrderFinance,
  listArchives,
  getArchiveDetail,
  listNotifications,
  getNotificationDetail,
  markNotificationRead,
}
