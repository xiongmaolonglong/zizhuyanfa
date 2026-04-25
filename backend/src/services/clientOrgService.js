const ClientUser = require('../models/ClientUser')
const ClientDepartment = require('../models/ClientDepartment')

/**
 * 共享部门/人员管理服务。
 * clientController 和 clientOrgController 都调用这些方法，
 * 只负责数据操作，权限校验由各自控制器处理。
 */

async function listDepartments(clientId) {
  return ClientDepartment.findAll({
    where: { client_id: clientId },
    order: [['id', 'ASC']],
  })
}

async function createDepartment(clientId, { name, manager_id }) {
  return ClientDepartment.create({
    client_id: clientId,
    name,
    manager_id: manager_id || null,
  })
}

async function findDepartment({ id, client_id }) {
  return ClientDepartment.findOne({ where: { id, client_id } })
}

async function listUsers(clientId, { role, status, department_id, page, limit } = {}) {
  const where = { client_id: clientId }
  if (role) where.role = role
  if (status) where.status = status
  if (department_id) where.department_id = department_id

  if (page && limit) {
    const offset = (parseInt(page) - 1) * parseInt(limit)
    return ClientUser.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash'] },
      limit: parseInt(limit),
      offset,
      order: [['id', 'DESC']],
    })
  }

  return ClientUser.findAll({
    where,
    attributes: { exclude: ['password_hash'] },
    order: [['id', 'DESC']],
  })
}

async function createUser(clientId, { name, phone, password, role, department_id }) {
  return ClientUser.create({
    client_id: clientId,
    name,
    phone,
    password_hash: password,
    role: role || 'staff',
    department_id: department_id || null,
  })
}

async function findUser({ id, client_id }) {
  return ClientUser.findOne({ where: { id, client_id } })
}

async function findUserByPhone(phone) {
  return ClientUser.findOne({ where: { phone } })
}

module.exports = {
  listDepartments, createDepartment, findDepartment,
  listUsers, createUser, findUser, findUserByPhone,
}
