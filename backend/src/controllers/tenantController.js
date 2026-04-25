const Tenant = require('../models/Tenant')
const TenantDepartment = require('../models/TenantDepartment')
const TenantUser = require('../models/TenantUser')
const { success, error, paginate } = require('../utils/response')

const ROLE_ENUM = ['admin', 'dispatcher', 'measurer', 'designer', 'producer', 'constructor', 'finance']

/**
 * GET /api/v1/tenant/info
 * 当前租户信息
 */
async function getTenantInfo(req, res) {
  const tenantId = req.user.tenant_id
  const stats = await Promise.all([
    TenantDepartment.count({ where: { tenant_id: tenantId } }),
    TenantUser.count({ where: { tenant_id: tenantId } }),
  ])
  return success(res, { tenant_id: tenantId, department_count: stats[0], user_count: stats[1] })
}

/**
 * PUT /api/v1/tenant/info
 * 更新租户信息（仅超管）
 */
async function updateTenantInfo(req, res) {
  if (req.user.role !== 'super_admin') {
    return error(res, '仅超级管理员可操作', 403)
  }

  const tenantId = req.tenantId
  const tenant = await Tenant.findByPk(tenantId)
  if (!tenant) {
    return error(res, '租户不存在', 404)
  }

  const { name, contact_name, contact_phone, contact_email, max_users, order_code_prefix, modules } = req.body
  const updates = {}
  if (name !== undefined) updates.name = name
  if (contact_name !== undefined) updates.contact_name = contact_name
  if (contact_phone !== undefined) updates.contact_phone = contact_phone
  if (contact_email !== undefined) updates.contact_email = contact_email
  if (max_users !== undefined) updates.max_users = parseInt(max_users, 10)
  if (order_code_prefix !== undefined) updates.order_code_prefix = order_code_prefix
  if (modules !== undefined) updates.modules = modules

  if (Object.keys(updates).length === 0) {
    return error(res, '没有需要更新的字段', 400)
  }

  await tenant.update(updates)
  return success(res, tenant, '租户信息更新成功')
}

/**
 * GET /api/v1/tenant/departments
 * 部门列表（当前租户）
 */
async function listDepartments(req, res) {
  const tenantId = req.tenantId
  const departments = await TenantDepartment.findAll({
    where: { tenant_id: tenantId },
    order: [['id', 'ASC']],
  })
  return success(res, departments)
}

/**
 * POST /api/v1/tenant/departments
 * 创建部门
 */
async function createDepartment(req, res) {
  const { name, manager_id, region_codes } = req.body
  const dept = await TenantDepartment.create({
    tenant_id: req.tenantId,
    name,
    manager_id: manager_id || null,
    region_codes: region_codes || [],
  })
  return success(res, dept, '部门创建成功', 201)
}

/**
 * GET /api/v1/tenant/departments/:id
 * 部门详情
 */
async function getDepartment(req, res) {
  const dept = await TenantDepartment.findOne({
    where: { id: req.params.id, tenant_id: req.tenantId },
  })
  if (!dept) return error(res, '部门不存在', 404)
  return success(res, dept)
}

/**
 * PUT /api/v1/tenant/departments/:id
 * 更新部门
 */
async function updateDepartment(req, res) {
  const dept = await TenantDepartment.findOne({
    where: { id: req.params.id, tenant_id: req.tenantId },
  })
  if (!dept) return error(res, '部门不存在', 404)

  const { name, manager_id, region_codes } = req.body
  if (name !== undefined) dept.name = name
  if (manager_id !== undefined) dept.manager_id = manager_id
  if (region_codes !== undefined) dept.region_codes = region_codes
  await dept.save()
  return success(res, dept, '部门更新成功')
}

/**
 * DELETE /api/v1/tenant/departments/:id
 * 删除部门（检查是否有人员归属）
 */
async function deleteDepartment(req, res) {
  const dept = await TenantDepartment.findOne({
    where: { id: req.params.id, tenant_id: req.tenantId },
  })
  if (!dept) return error(res, '部门不存在', 404)

  const userCount = await TenantUser.count({
    where: { department_id: dept.id, tenant_id: req.tenantId },
  })
  if (userCount > 0) {
    return error(res, `该部门下还有 ${userCount} 名人员，无法删除`, 400)
  }

  await dept.destroy()
  return success(res, null, '部门删除成功')
}

/**
 * GET /api/v1/tenant/users
 * 人员列表（支持筛选+分页）
 */
async function listUsers(req, res) {
  const { role, status, department_id, page = 1, limit = 20 } = req.query
  const where = { tenant_id: req.tenantId }

  if (role && ROLE_ENUM.includes(role)) where.role = role
  if (status && ['active', 'disabled'].includes(status)) where.status = status
  if (department_id) where.department_id = parseInt(department_id, 10)

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10)
  const pageSize = Math.min(Math.max(1, parseInt(limit, 10)), 100)

  const { count, rows } = await TenantUser.findAndCountAll({
    where,
    order: [['id', 'ASC']],
    limit: pageSize,
    offset,
    attributes: { exclude: ['password_hash'] },
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
 * POST /api/v1/tenant/users
 * 创建人员（phone 唯一，密码自动 hash）
 */
async function createUser(req, res) {
  const { name, phone, password, role, department_id, status } = req.body

  // phone 唯一校验
  if (phone) {
    const existing = await TenantUser.findOne({
      where: { phone, tenant_id: req.tenantId },
    })
    if (existing) return error(res, '手机号已存在', 400)
  }

  const user = await TenantUser.create({
    tenant_id: req.tenantId,
    name,
    phone,
    password_hash: password,
    role: role || 'admin',
    department_id: department_id || null,
    status: status || 'active',
  })

  const result = user.toJSON()
  delete result.password_hash
  return success(res, result, '人员创建成功', 201)
}

/**
 * GET /api/v1/tenant/users/:id
 * 人员详情
 */
async function getUser(req, res) {
  const user = await TenantUser.findOne({
    where: { id: req.params.id, tenant_id: req.tenantId },
    attributes: { exclude: ['password_hash'] },
  })
  if (!user) return error(res, '人员不存在', 404)
  return success(res, user)
}

/**
 * PUT /api/v1/tenant/users/:id
 * 更新人员
 */
async function updateUser(req, res) {
  const user = await TenantUser.findOne({
    where: { id: req.params.id, tenant_id: req.tenantId },
  })
  if (!user) return error(res, '人员不存在', 404)

  const { name, phone, password, role, department_id, status } = req.body

  // phone 唯一校验（排除自己）
  if (phone && phone !== user.phone) {
    const existing = await TenantUser.findOne({
      where: { phone, tenant_id: req.tenantId },
    })
    if (existing) return error(res, '手机号已被其他人员使用', 400)
  }

  if (name !== undefined) user.name = name
  if (phone !== undefined) user.phone = phone
  if (password !== undefined) user.password_hash = password
  if (role !== undefined) user.role = role
  if (department_id !== undefined) user.department_id = department_id
  if (status !== undefined) user.status = status

  await user.save()

  const result = user.toJSON()
  delete result.password_hash
  return success(res, result, '人员更新成功')
}

/**
 * DELETE /api/v1/tenant/users/:id
 * 删除人员（软删除）
 */
async function deleteUser(req, res) {
  const user = await TenantUser.findOne({
    where: { id: req.params.id, tenant_id: req.tenantId },
  })
  if (!user) return error(res, '人员不存在', 404)

  await user.destroy()
  return success(res, null, '人员删除成功')
}

/**
 * PUT /api/v1/tenant/users/:id/status
 * 启用/禁用人员
 */
async function updateUserStatus(req, res) {
  const user = await TenantUser.findOne({
    where: { id: req.params.id, tenant_id: req.tenantId },
  })
  if (!user) return error(res, '人员不存在', 404)

  const { status } = req.body
  if (!status || !['active', 'disabled'].includes(status)) {
    return error(res, 'status 必须为 active 或 disabled', 400)
  }

  user.status = status
  await user.save()

  const result = user.toJSON()
  delete result.password_hash
  return success(res, result, `人员已${status === 'active' ? '启用' : '禁用'}`)
}

/**
 * GET /api/v1/tenant/stats
 * 租户统计
 */
async function getStats(req, res) {
  const tenantId = req.tenantId

  const [departmentCount, userCount, roleCounts] = await Promise.all([
    TenantDepartment.count({ where: { tenant_id: tenantId } }),
    TenantUser.count({ where: { tenant_id: tenantId } }),
    TenantUser.findAll({
      where: { tenant_id: tenantId },
      attributes: ['role', [TenantUser.sequelize.fn('COUNT', TenantUser.sequelize.col('id')), 'count']],
      group: ['role'],
      raw: true,
    }),
  ])

  const byRole = {}
  for (const row of roleCounts) {
    byRole[row.role] = parseInt(row.count, 10)
  }

  return success(res, {
    department_count: departmentCount,
    user_count: userCount,
    by_role: byRole,
  })
}

module.exports = {
  getTenantInfo,
  updateTenantInfo,
  listDepartments,
  createDepartment,
  getDepartment,
  updateDepartment,
  deleteDepartment,
  listUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  getStats,
}
