const { Op } = require('sequelize')
const Client = require('../models/Client')
const ClientUser = require('../models/ClientUser')
const ClientDepartment = require('../models/ClientDepartment')
const ClientRegion = require('../models/ClientRegion')
const { success, error, paginate } = require('../utils/response')
const { buildTenantFilter } = require('../middleware/tenant')
const orgService = require('../services/clientOrgService')

/**
 * 确保客户端属于当前租户
 */
function ensureClientOwnership(req, clientId) {
  const where = { id: clientId }
  buildTenantFilter(Client, where)(req)
  return where
}

// ==================== 甲方企业管理 ====================

/**
 * GET /api/v1/clients - 甲方列表
 */
async function listClients(req, res) {
  try {
    const { page = 1, limit = 20, status, name } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const where = {}

    buildTenantFilter(Client, where)(req)
    if (status) where.status = status
    if (name) where.name = { [Op.like]: `%${name}%` }

    const { count, rows } = await Client.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['id', 'DESC']],
    })

    return paginate(res, rows, {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
    })
  } catch (err) {
    console.error('listClients error:', err)
    return error(res, '获取甲方列表失败')
  }
}

/**
 * POST /api/v1/clients - 创建甲方
 */
async function createClient(req, res) {
  try {
    const { name, contact_name, contact_phone, email, address, status, approval_enabled, is_admin } = req.body

    if (!name) return error(res, '甲方名称不能为空', 400)

    const tenantId = req.tenantId || req.user?.tenant_id
    if (!tenantId) return error(res, '无法确定租户信息', 400)

    const client = await Client.create({
      name,
      contact_name,
      contact_phone,
      email,
      address,
      status: status || 'active',
      approval_enabled: approval_enabled || false,
      is_admin: is_admin || false,
      tenant_id: tenantId,
    })

    return success(res, client, '创建成功', 201)
  } catch (err) {
    console.error('createClient error:', err)
    return error(res, '创建甲方失败')
  }
}

/**
 * GET /api/v1/clients/:id - 甲方详情
 */
async function getClient(req, res) {
  try {
    const where = ensureClientOwnership(req, req.params.id)
    const client = await Client.findOne({ where })
    if (!client) return error(res, '甲方不存在', 404)

    return success(res, client)
  } catch (err) {
    console.error('getClient error:', err)
    return error(res, '获取甲方详情失败')
  }
}

/**
 * PUT /api/v1/clients/:id - 更新甲方
 */
async function updateClient(req, res) {
  try {
    const where = ensureClientOwnership(req, req.params.id)
    const client = await Client.findOne({ where })
    if (!client) return error(res, '甲方不存在', 404)

    const { name, contact_name, contact_phone, email, address, status, approval_enabled, is_admin } = req.body
    await client.update({
      ...(name !== undefined && { name }),
      ...(contact_name !== undefined && { contact_name }),
      ...(contact_phone !== undefined && { contact_phone }),
      ...(email !== undefined && { email }),
      ...(address !== undefined && { address }),
      ...(status !== undefined && { status }),
      ...(approval_enabled !== undefined && { approval_enabled }),
      ...(is_admin !== undefined && { is_admin }),
    })

    return success(res, client, '更新成功')
  } catch (err) {
    console.error('updateClient error:', err)
    return error(res, '更新甲方失败')
  }
}

/**
 * DELETE /api/v1/clients/:id - 软删除甲方
 */
async function deleteClient(req, res) {
  try {
    const where = ensureClientOwnership(req, req.params.id)
    const client = await Client.findOne({ where })
    if (!client) return error(res, '甲方不存在', 404)

    await client.destroy()
    return success(res, null, '删除成功')
  } catch (err) {
    console.error('deleteClient error:', err)
    return error(res, '删除甲方失败')
  }
}

// ==================== 甲方部门管理 ====================

/**
 * GET /api/v1/clients/:clientId/departments - 部门列表
 */
async function listDepartments(req, res) {
  try {
    const clientId = req.params.clientId
    await ensureClientOwnership(req, clientId)
    const departments = await orgService.listDepartments(clientId)
    return success(res, departments)
  } catch (err) {
    console.error('listDepartments error:', err)
    return error(res, '获取部门列表失败')
  }
}

/**
 * POST /api/v1/clients/:clientId/departments - 创建部门
 */
async function createDepartment(req, res) {
  try {
    const clientId = req.params.clientId
    await ensureClientOwnership(req, clientId)

    const { name, manager_id } = req.body
    if (!name) return error(res, '部门名称不能为空', 400)

    const department = await orgService.createDepartment(clientId, { name, manager_id })
    return success(res, department, '创建成功', 201)
  } catch (err) {
    console.error('createDepartment error:', err)
    return error(res, '创建部门失败')
  }
}

/**
 * PUT /api/v1/clients/:clientId/departments/:id - 更新部门
 */
async function updateDepartment(req, res) {
  try {
    const clientId = req.params.clientId
    await ensureClientOwnership(req, clientId)

    const { name, manager_id } = req.body
    const dept = await orgService.findDepartment({ id: req.params.id, client_id: clientId })
    if (!dept) return error(res, '部门不存在', 404)

    if (name !== undefined) dept.name = name
    if (manager_id !== undefined) dept.manager_id = manager_id
    await dept.save()

    return success(res, dept, '更新成功')
  } catch (err) {
    console.error('updateDepartment error:', err)
    return error(res, '更新部门失败')
  }
}

/**
 * DELETE /api/v1/clients/:clientId/departments/:id - 删除部门
 */
async function deleteDepartment(req, res) {
  try {
    const clientId = req.params.clientId
    await ensureClientOwnership(req, clientId)

    const dept = await orgService.findDepartment({ id: req.params.id, client_id: clientId })
    if (!dept) return error(res, '部门不存在', 404)

    await dept.destroy()
    return success(res, null, '删除成功')
  } catch (err) {
    console.error('deleteDepartment error:', err)
    return error(res, '删除部门失败')
  }
}

// ==================== 甲方人员管理 ====================

/**
 * GET /api/v1/clients/:clientId/users - 人员列表
 */
async function listUsers(req, res) {
  try {
    const clientId = req.params.clientId
    await ensureClientOwnership(req, clientId)

    const { role, status, department_id } = req.query
    const users = await orgService.listUsers(clientId, { role, status, department_id })
    return success(res, users)
  } catch (err) {
    console.error('listUsers error:', err)
    return error(res, '获取人员列表失败')
  }
}

/**
 * POST /api/v1/clients/:clientId/users - 创建人员
 */
async function createUser(req, res) {
  try {
    const clientId = req.params.clientId
    await ensureClientOwnership(req, clientId)

    const { name, phone, password, role, department_id } = req.body
    if (!name) return error(res, '姓名不能为空', 400)
    if (!phone) return error(res, '手机号不能为空', 400)
    if (!password) return error(res, '密码不能为空', 400)

    const existing = await orgService.findUserByPhone(phone)
    if (existing) return error(res, '手机号已被使用', 400)

    const user = await orgService.createUser(clientId, { name, phone, password, role, department_id })
    const result = user.toJSON()
    delete result.password_hash
    return success(res, result, '创建成功', 201)
  } catch (err) {
    console.error('createUser error:', err)
    return error(res, '创建人员失败')
  }
}

/**
 * PUT /api/v1/clients/:clientId/users/:id - 更新人员
 */
async function updateUser(req, res) {
  try {
    const clientId = req.params.clientId
    await ensureClientOwnership(req, clientId)

    const user = await orgService.findUser({ id: req.params.id, client_id: clientId })
    if (!user) return error(res, '人员不存在', 404)

    const { name, phone, password, role, department_id, status } = req.body

    if (phone && phone !== user.phone) {
      const existing = await orgService.findUserByPhone(phone)
      if (existing) return error(res, '手机号已被使用', 400)
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
    return success(res, result, '更新成功')
  } catch (err) {
    console.error('updateUser error:', err)
    return error(res, '更新人员失败')
  }
}

/**
 * DELETE /api/v1/clients/:clientId/users/:id - 软删除人员
 */
async function deleteUser(req, res) {
  try {
    const clientId = req.params.clientId
    await ensureClientOwnership(req, clientId)

    const user = await orgService.findUser({ id: req.params.id, client_id: clientId })
    if (!user) return error(res, '人员不存在', 404)

    await user.destroy()
    return success(res, null, '删除成功')
  } catch (err) {
    console.error('deleteUser error:', err)
    return error(res, '删除人员失败')
  }
}

// ==================== 甲方人员管辖区域 ====================

/**
 * GET /api/v1/clients/:clientId/users/:userId/regions - 获取管辖区域
 */
async function listRegions(req, res) {
  try {
    const clientId = req.params.clientId
    const userId = req.params.userId
    await ensureClientOwnership(req, clientId)

    // 验证用户属于该甲方
    const user = await ClientUser.findOne({
      where: { id: userId, client_id: clientId },
    })
    if (!user) return error(res, '人员不存在', 404)

    const regions = await ClientRegion.findAll({
      where: { client_id: clientId, user_id: userId },
      order: [['id', 'ASC']],
    })

    return success(res, regions)
  } catch (err) {
    console.error('listRegions error:', err)
    return error(res, '获取管辖区域失败')
  }
}

/**
 * POST /api/v1/clients/:clientId/users/:userId/regions - 设置管辖区域
 */
async function setRegions(req, res) {
  try {
    const clientId = req.params.clientId
    const userId = req.params.userId
    await ensureClientOwnership(req, clientId)

    // 验证用户属于该甲方
    const user = await ClientUser.findOne({
      where: { id: userId, client_id: clientId },
    })
    if (!user) return error(res, '人员不存在', 404)

    const regions = req.body
    if (!Array.isArray(regions) || regions.length === 0) {
      return error(res, '区域数据不能为空', 400)
    }

    // 先删除该用户现有区域，再批量创建
    await ClientRegion.destroy({ where: { user_id: userId, client_id: clientId } })

    const regionRecords = regions.map(r => ({
      client_id: clientId,
      user_id: userId,
      province_code: r.province_code,
      city_code: r.city_code,
      district_code: r.district_code || null,
      street_code: r.street_code || null,
    }))

    const created = await ClientRegion.bulkCreate(regionRecords)
    return success(res, created, '设置成功', 201)
  } catch (err) {
    console.error('setRegions error:', err)
    return error(res, '设置管辖区域失败')
  }
}

/**
 * DELETE /api/v1/clients/:clientId/users/:userId/regions/:id - 删除区域
 */
async function deleteRegion(req, res) {
  try {
    const clientId = req.params.clientId
    const userId = req.params.userId
    const regionId = req.params.id
    await ensureClientOwnership(req, clientId)

    const region = await ClientRegion.findOne({
      where: { id: regionId, user_id: userId, client_id: clientId },
    })
    if (!region) return error(res, '区域不存在', 404)

    await region.destroy()
    return success(res, null, '删除成功')
  } catch (err) {
    console.error('deleteRegion error:', err)
    return error(res, '删除区域失败')
  }
}

// ==================== 默认甲方 ====================

/**
 * GET /api/v1/clients/default - 获取当前租户的默认甲方
 */
async function getDefaultClient(req, res) {
  try {
    const Tenant = require('../models/Tenant')
    const tenantId = req.user.tenant_id
    const tenant = await Tenant.findByPk(tenantId, { attributes: ['id', 'name', 'default_client_id'] })
    if (!tenant) return error(res, '租户不存在', 404)

    if (tenant.default_client_id) {
      const client = await Client.findByPk(tenant.default_client_id)
      return success(res, { default_client_id: client?.id, client: client || null })
    }
    return success(res, { default_client_id: null, client: null })
  } catch (err) {
    console.error('getDefaultClient error:', err)
    return error(res, '获取默认甲方失败')
  }
}

/**
 * PUT /api/v1/clients/default - 设置/取消默认甲方
 * body: { client_id: number | null }
 */
async function setDefaultClient(req, res) {
  try {
    const Tenant = require('../models/Tenant')
    const { client_id } = req.body
    const tenantId = req.user.tenant_id

    if (client_id) {
      const client = await Client.findOne({ where: { id: client_id, tenant_id: tenantId } })
      if (!client) return error(res, '甲方企业不存在或无权访问', 400)
    }

    const tenant = await Tenant.findByPk(tenantId)
    await tenant.update({ default_client_id: client_id || null })
    return success(res, { default_client_id: client_id }, '设置成功')
  } catch (err) {
    console.error('setDefaultClient error:', err)
    return error(res, '设置默认甲方失败')
  }
}

module.exports = {
  listClients,
  createClient,
  getClient,
  updateClient,
  deleteClient,
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listRegions,
  setRegions,
  deleteRegion,
  getDefaultClient,
  setDefaultClient,
}
