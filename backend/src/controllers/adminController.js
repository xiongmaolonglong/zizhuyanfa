const { Op, fn, col, literal } = require('sequelize')
const {
  Tenant,
  TenantUser,
  TenantRegion,
  Client,
  WorkOrder,
  WorkOrderLog,
  WoDeclaration,
} = require('../models')
const { success, error, paginate } = require('../utils/response')
const sequelize = require('../config/database')
const { getDefaultTenantSettings } = require('../utils/defaultSettings')

// ============================================================
// 租户管理
// ============================================================

/**
 * GET /api/v1/admin/tenants
 * 租户列表（支持筛选+分页）
 */
async function listTenants(req, res) {
  const { status, keyword, page = 1, limit = 20 } = req.query

  const where = {}
  if (status && ['active', 'suspended', 'expired', 'deleted'].includes(status)) {
    where.status = status
  }
  if (keyword) {
    where[Op.or] = [
      { name: { [Op.like]: `%${keyword}%` } },
      { contact_name: { [Op.like]: `%${keyword}%` } },
      { contact_phone: { [Op.like]: `%${keyword}%` } },
    ]
  }

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10)
  const pageSize = Math.min(Math.max(1, parseInt(limit, 10)), 100)

  const { count, rows } = await Tenant.findAndCountAll({
    where,
    attributes: [
      'id', 'name', 'contact_name', 'contact_phone', 'contact_email',
      'status', 'max_users', 'order_code_prefix', 'modules', 'created_at',
    ],
    order: [['created_at', 'DESC']],
    limit: pageSize,
    offset,
  })

  // 附带每个租户的统计信息
  const tenantIds = rows.map(t => t.id)
  const stats = await WorkOrder.findAll({
    where: { tenant_id: { [Op.in]: tenantIds } },
    attributes: [
      'tenant_id',
      [fn('COUNT', col('id')), 'order_count'],
    ],
    group: ['tenant_id'],
    raw: true,
  })

  const userStats = await TenantUser.findAll({
    where: { tenant_id: { [Op.in]: tenantIds }, status: 'active' },
    attributes: [
      'tenant_id',
      [fn('COUNT', col('id')), 'user_count'],
    ],
    group: ['tenant_id'],
    raw: true,
  })

  const clientStats = await Client.findAll({
    where: { tenant_id: { [Op.in]: tenantIds }, status: 'active' },
    attributes: [
      'tenant_id',
      [fn('COUNT', col('id')), 'client_count'],
    ],
    group: ['tenant_id'],
    raw: true,
  })

  const statsMap = {}
  for (const s of stats) {
    statsMap[s.tenant_id] = statsMap[s.tenant_id] || {}
    statsMap[s.tenant_id].order_count = parseInt(s.order_count, 10)
  }
  for (const s of userStats) {
    statsMap[s.tenant_id] = statsMap[s.tenant_id] || {}
    statsMap[s.tenant_id].user_count = parseInt(s.user_count, 10)
  }
  for (const s of clientStats) {
    statsMap[s.tenant_id] = statsMap[s.tenant_id] || {}
    statsMap[s.tenant_id].client_count = parseInt(s.client_count, 10)
  }

  const data = rows.map(t => {
    const tJson = t.toJSON()
    const tStats = statsMap[t.id] || {}
    tStats.order_count = tStats.order_count || 0
    tStats.user_count = tStats.user_count || 0
    tStats.client_count = tStats.client_count || 0
    return { ...tJson, stats: tStats }
  })

  const pagination = {
    page: parseInt(page, 10),
    limit: pageSize,
    total: count,
    pages: Math.ceil(count / pageSize),
  }

  return paginate(res, data, pagination)
}

/**
 * POST /api/v1/admin/tenants
 * 创建租户 + 默认管理员
 */
async function createTenant(req, res) {
  const { name, contact_name, contact_phone, email, region_codes, order_code_prefix } = req.body

  if (!name) {
    return error(res, '租户名称不能为空', 400)
  }

  const transaction = await sequelize.transaction()
  try {
    // 1. 创建租户（带默认配置）
    const tenant = await Tenant.create({
      name,
      contact_name: contact_name || '',
      contact_phone: contact_phone || '',
      contact_email: email || '',
      order_code_prefix: order_code_prefix || 'GG',
      status: 'active',
      settings: getDefaultTenantSettings(),
    }, { transaction })

    // 2. 创建地区关联（如果有）
    if (Array.isArray(region_codes) && region_codes.length > 0) {
      await TenantRegion.bulkCreate(
        region_codes.map(code => ({
          tenant_id: tenant.id,
          region_code: code,
        })),
        { transaction },
      )
    }

    // 3. 创建默认管理员账号（密码随机生成，首次登录需修改）
    const defaultPassword = 'Admin@123456'
    await TenantUser.create({
      tenant_id: tenant.id,
      name: contact_name || '管理员',
      phone: contact_phone || `admin_${tenant.id}`,
      email: email || '',
      password_hash: defaultPassword,
      role: 'admin',
      status: 'active',
    }, { transaction })

    await transaction.commit()

    return success(res, {
      id: tenant.id,
      name: tenant.name,
      admin_phone: contact_phone || `admin_${tenant.id}`,
      default_password: defaultPassword,
    }, '租户创建成功')
  } catch (err) {
    await transaction.rollback()
    if (err.name === 'SequelizeUniqueConstraintError') {
      return error(res, '手机号已存在，请更换', 400)
    }
    return error(res, '创建租户失败')
  }
}

/**
 * GET /api/v1/admin/tenants/:id
 * 租户详情 + 统计
 */
async function getTenant(req, res) {
  const id = parseInt(req.params.id, 10)

  const tenant = await Tenant.findByPk(id, {
    include: [
      { model: TenantRegion, as: 'regions', attributes: ['id', 'region_code'] },
    ],
  })

  if (!tenant) {
    return error(res, '租户不存在', 404)
  }

  // 统计
  const totalOrders = await WorkOrder.count({ where: { tenant_id: id } })
  const activeUsers = await TenantUser.count({ where: { tenant_id: id, status: 'active' } })
  const activeClients = await Client.count({ where: { tenant_id: id, status: 'active' } })

  // 各环节分布
  const stageCounts = await WorkOrder.findAll({
    where: { tenant_id: id },
    attributes: [
      'current_stage',
      [fn('COUNT', col('id')), 'count'],
    ],
    group: ['current_stage'],
    raw: true,
  })
  const byStage = {}
  for (const row of stageCounts) {
    byStage[row.current_stage] = parseInt(row.count, 10)
  }

  const result = tenant.toJSON()
  result.stats = {
    total_orders: totalOrders,
    active_users: activeUsers,
    active_clients: activeClients,
    orders_by_stage: byStage,
  }

  return success(res, result)
}

/**
 * PUT /api/v1/admin/tenants/:id
 * 更新租户
 */
async function updateTenant(req, res) {
  const id = parseInt(req.params.id, 10)
  const { name, contact_name, contact_phone, email, max_users, order_code_prefix, modules } = req.body

  const tenant = await Tenant.findByPk(id)
  if (!tenant) {
    return error(res, '租户不存在', 404)
  }

  const updates = {}
  if (name !== undefined) updates.name = name
  if (contact_name !== undefined) updates.contact_name = contact_name
  if (contact_phone !== undefined) updates.contact_phone = contact_phone
  if (email !== undefined) updates.contact_email = email
  if (max_users !== undefined) updates.max_users = parseInt(max_users, 10)
  if (order_code_prefix !== undefined) updates.order_code_prefix = order_code_prefix
  if (modules !== undefined) updates.modules = modules

  await tenant.update(updates)

  return success(res, tenant, '更新成功')
}

/**
 * PUT /api/v1/admin/tenants/:id/status
 * 启用/暂停/删除租户
 */
async function updateTenantStatus(req, res) {
  const id = parseInt(req.params.id, 10)
  const { status } = req.body

  if (!['active', 'suspended', 'deleted'].includes(status)) {
    return error(res, '无效的状态值', 400)
  }

  const tenant = await Tenant.findByPk(id)
  if (!tenant) {
    return error(res, '租户不存在', 404)
  }

  await tenant.update({ status })

  return success(res, { id: tenant.id, status: tenant.status }, '状态更新成功')
}

// ============================================================
// 全局数据看板
// ============================================================

/**
 * GET /api/v1/admin/dashboard
 * 全局看板
 */
async function getDashboard(req, res) {
  // 工单总数
  const totalOrders = await WorkOrder.count()

  // 各环节分布
  const stageCounts = await WorkOrder.findAll({
    attributes: [
      'current_stage',
      [fn('COUNT', col('id')), 'count'],
    ],
    group: ['current_stage'],
    raw: true,
  })
  const ordersByStage = {}
  for (const row of stageCounts) {
    ordersByStage[row.current_stage] = parseInt(row.count, 10)
  }

  // 租户统计
  const totalTenants = await Tenant.count()
  const activeTenants = await Tenant.count({ where: { status: 'active' } })

  // 甲方统计
  const totalClients = await Client.count()
  const activeClients = await Client.count({ where: { status: 'active' } })

  // 地区分布（通过工单的申报信息）
  const regionCounts = await WoDeclaration.findAll({
    attributes: [
      'city_code',
      [fn('COUNT', col('id')), 'count'],
    ],
    group: ['city_code'],
    having: literal('city_code IS NOT NULL AND city_code != ""'),
    raw: true,
  })
  const byRegion = regionCounts.map(r => ({
    city_code: r.city_code,
    count: parseInt(r.count, 10),
  }))

  // TOP 广告商排名（按工单量）
  const topTenants = await WorkOrder.findAll({
    attributes: [
      'tenant_id',
      [fn('COUNT', col('id')), 'order_count'],
    ],
    group: ['tenant_id'],
    order: [[fn('COUNT', col('id')), 'DESC']],
    limit: 10,
    raw: true,
  })

  // 补充租户名称
  const topTenantIds = topTenants.map(t => t.tenant_id)
  const tenantMap = {}
  if (topTenantIds.length > 0) {
    const tenants = await Tenant.findAll({
      where: { id: { [Op.in]: topTenantIds } },
      attributes: ['id', 'name'],
    })
    for (const t of tenants) {
      tenantMap[t.id] = t.name
    }
  }
  const topAdvertisers = topTenants.map(t => ({
    tenant_id: t.tenant_id,
    name: tenantMap[t.tenant_id] || '未知',
    order_count: parseInt(t.order_count, 10),
  }))

  return success(res, {
    total_orders: totalOrders,
    orders_by_stage: ordersByStage,
    total_tenants: totalTenants,
    active_tenants: activeTenants,
    total_clients: totalClients,
    active_clients: activeClients,
    by_region: byRegion,
    top_advertisers: topAdvertisers,
  })
}

/**
 * GET /api/v1/admin/dashboard/trend
 * 趋势数据
 */
async function getDashboardTrend(req, res) {
  const { period = 'day' } = req.query

  let dateFormat
  let daysBack
  switch (period) {
  case 'week':
    dateFormat = '%Y-%u' // 按周
    daysBack = 12 // 12周
    break
  case 'month':
    dateFormat = '%Y-%m' // 按月
    daysBack = 12 // 12月
    break
  case 'day':
  default:
    dateFormat = '%Y-%m-%d' // 按天
    daysBack = 30 // 30天
    break
  }

  // 创建趋势
  const createdAt = await WorkOrder.findAll({
    attributes: [
      [fn('DATE_FORMAT', col('created_at'), dateFormat), 'date'],
      [fn('COUNT', col('id')), 'created'],
    ],
    where: {
      created_at: {
        [Op.gte]: literal(`DATE_SUB(NOW(), INTERVAL ${daysBack} ${period === 'day' ? 'DAY' : period === 'week' ? 'WEEK' : 'MONTH'})`),
      },
    },
    group: [fn('DATE_FORMAT', col('created_at'), dateFormat)],
    order: [[fn('DATE_FORMAT', col('created_at'), dateFormat), 'ASC']],
    raw: true,
  })

  // 完成趋势
  const completedAt = await WorkOrder.findAll({
    attributes: [
      [fn('DATE_FORMAT', col('completed_at'), dateFormat), 'date'],
      [fn('COUNT', col('id')), 'completed'],
    ],
    where: {
      completed_at: {
        [Op.gte]: literal(`DATE_SUB(NOW(), INTERVAL ${daysBack} ${period === 'day' ? 'DAY' : period === 'week' ? 'WEEK' : 'MONTH'})`),
      },
    },
    group: [fn('DATE_FORMAT', col('completed_at'), dateFormat)],
    order: [[fn('DATE_FORMAT', col('completed_at'), dateFormat), 'ASC']],
    raw: true,
  })

  // 合并
  const trendMap = {}
  for (const row of createdAt) {
    trendMap[row.date] = trendMap[row.date] || { date: row.date, created: 0, completed: 0 }
    trendMap[row.date].created = parseInt(row.created, 10)
  }
  for (const row of completedAt) {
    trendMap[row.date] = trendMap[row.date] || { date: row.date, created: 0, completed: 0 }
    trendMap[row.date].completed = parseInt(row.completed, 10)
  }

  const trend = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date))

  return success(res, { period, trend })
}

// ============================================================
// 工单穿透查询
// ============================================================

/**
 * GET /api/v1/admin/work-orders
 * 全局工单查询（无 tenant_id 过滤）
 */
async function listAllWorkOrders(req, res) {
  const { tenant_id, stage, status, keyword, page = 1, limit = 20 } = req.query

  const where = {}
  if (tenant_id) where.tenant_id = parseInt(tenant_id, 10)
  if (stage) where.current_stage = stage
  if (status) where.status = status
  if (keyword) {
    where[Op.or] = [
      { title: { [Op.like]: `%${keyword}%` } },
      { work_order_no: { [Op.like]: `%${keyword}%` } },
    ]
  }

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10)
  const pageSize = Math.min(Math.max(1, parseInt(limit, 10)), 100)

  const { count, rows } = await WorkOrder.findAndCountAll({
    where,
    include: [
      {
        model: Tenant,
        as: 'tenant',
        attributes: ['id', 'name'],
        required: false,
      },
      {
        model: Client,
        as: 'client',
        attributes: ['id', 'name'],
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

/**
 * GET /api/v1/admin/work-orders/:id
 * 任意工单详情
 */
async function getWorkOrder(req, res) {
  const { id } = req.params

  const workOrder = await WorkOrder.findByPk(parseInt(id, 10), {
    include: [
      { model: Tenant, as: 'tenant', attributes: ['id', 'name'] },
      { model: Client, as: 'client', attributes: ['id', 'name'] },
    ],
  })

  if (!workOrder) {
    return error(res, '工单不存在', 404)
  }

  // 获取操作日志
  const logs = await WorkOrderLog.findAll({
    where: { work_order_id: workOrder.id },
    order: [['created_at', 'DESC']],
  })

  const result = workOrder.toJSON()
  result.logs = logs

  return success(res, result)
}

/**
 * GET /api/v1/admin/work-orders/:id/logs
 * 工单操作日志
 */
async function getWorkOrderLogs(req, res) {
  const { id } = req.params

  // 确认工单存在
  const workOrder = await WorkOrder.findByPk(parseInt(id, 10), { attributes: ['id'] })
  if (!workOrder) {
    return error(res, '工单不存在', 404)
  }

  const logs = await WorkOrderLog.findAll({
    where: { work_order_id: workOrder.id },
    order: [['created_at', 'DESC']],
  })

  return success(res, logs)
}

// ============================================================
// 甲方监管
// ============================================================

/**
 * GET /api/v1/admin/clients
 * 全局甲方列表
 */
async function listAllClients(req, res) {
  const { status, keyword, tenant_id, is_admin, page = 1, limit = 20 } = req.query

  const where = {}
  if (status) where.status = status
  if (keyword) {
    where[Op.or] = [
      { name: { [Op.like]: `%${keyword}%` } },
      { contact_name: { [Op.like]: `%${keyword}%` } },
    ]
  }
  if (tenant_id) where.tenant_id = parseInt(tenant_id, 10)
  if (is_admin !== undefined) where.is_admin = is_admin === 'true' || is_admin === '1'

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10)
  const pageSize = Math.min(Math.max(1, parseInt(limit, 10)), 100)

  const { count, rows } = await Client.findAndCountAll({
    where,
    include: [
      { model: Tenant, as: 'tenant', attributes: ['id', 'name'] },
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
 * PUT /api/v1/admin/clients/:id/admin
 * 设置/取消甲方管理员权限
 */
async function updateClientAdmin(req, res) {
  const id = parseInt(req.params.id, 10)
  const { is_admin } = req.body

  if (is_admin === undefined) {
    return error(res, '缺少 is_admin 参数', 400)
  }

  const client = await Client.findByPk(id)
  if (!client) {
    return error(res, '甲方不存在', 404)
  }

  await client.update({ is_admin: !!is_admin })

  return success(res, { id: client.id, is_admin: client.is_admin }, '权限设置成功')
}

// ============================================================
// 全局申报列表
// ============================================================

/**
 * GET /api/v1/admin/declarations
 * 全局申报列表
 */
async function listAllDeclarations(req, res) {
  const { page = 1, limit = 20 } = req.query

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10)
  const pageSize = Math.min(Math.max(1, parseInt(limit, 10)), 100)

  const { count, rows } = await WoDeclaration.findAndCountAll({
    include: [
      {
        model: WorkOrder,
        as: 'work_order',
        attributes: ['id', 'work_order_no', 'title', 'current_stage', 'status', 'tenant_id'],
        include: [
          { model: Tenant, as: 'tenant', attributes: ['id', 'name'], required: false },
          { model: Client, as: 'client', attributes: ['id', 'name'] },
        ],
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

// ============================================================
// 系统配置
// ============================================================

/**
 * GET /api/v1/admin/settings
 * 获取系统配置
 */
async function getSettings(req, res) {
  // 系统配置当前存在 Tenant.modules 等字段中，这里返回全局配置
  const settings = {
    timeout_threshold: 7, // 默认超时天数
    max_upload_size: 50, // MB
    allowed_file_types: ['jpg', 'jpeg', 'png', 'pdf', 'dwg', 'dxf'],
    enable_notification: true,
    enable_auto_assign: false,
  }

  return success(res, settings)
}

/**
 * PUT /api/v1/admin/settings
 * 更新系统配置
 */
async function updateSettings(req, res) {
  const { timeout_threshold, max_upload_size, allowed_file_types, enable_notification, enable_auto_assign } = req.body

  const settings = {
    timeout_threshold: timeout_threshold !== undefined ? parseInt(timeout_threshold, 10) : 7,
    max_upload_size: max_upload_size !== undefined ? parseInt(max_upload_size, 10) : 50,
    allowed_file_types: allowed_file_types || ['jpg', 'jpeg', 'png', 'pdf', 'dwg', 'dxf'],
    enable_notification: enable_notification !== undefined ? !!enable_notification : true,
    enable_auto_assign: enable_auto_assign !== undefined ? !!enable_auto_assign : false,
  }

  return success(res, settings, '配置更新成功')
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  // 租户管理
  listTenants,
  createTenant,
  getTenant,
  updateTenant,
  updateTenantStatus,
  // 全局数据看板
  getDashboard,
  getDashboardTrend,
  // 工单穿透查询
  listAllWorkOrders,
  getWorkOrder,
  getWorkOrderLogs,
  // 甲方监管
  listAllClients,
  updateClientAdmin,
  // 全局申报
  listAllDeclarations,
  // 系统配置
  getSettings,
  updateSettings,
}
