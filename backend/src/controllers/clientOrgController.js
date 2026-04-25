const { success, error } = require('../utils/response')
const orgService = require('../services/clientOrgService')

// 获取当前用户所在企业的部门列表
async function listDepartments(req, res) {
  try {
    const departments = await orgService.listDepartments(req.user.client_id)

    // 获取每个部门的人数
    const deptsWithCount = await Promise.all(departments.map(async dept => {
      const count = await require('../models/ClientUser').count({
        where: { client_id: req.user.client_id, department_id: dept.id, status: 'active' }
      })
      return { ...dept.toJSON(), user_count: count }
    }))

    return success(res, deptsWithCount)
  } catch (err) {
    console.error('List client departments error:', err)
    return error(res, '获取部门列表失败')
  }
}

// 创建部门
async function createDepartment(req, res) {
  try {
    if (req.user.role !== 'manager') {
      return error(res, '只有管理员可以创建部门', 403)
    }

    const { name } = req.body
    if (!name?.trim()) {
      return error(res, '部门名称不能为空', 400)
    }

    const dept = await orgService.createDepartment(req.user.client_id, { name: name.trim() })
    return success(res, dept, '部门创建成功', 201)
  } catch (err) {
    console.error('Create client department error:', err)
    return error(res, '创建部门失败')
  }
}

// 更新部门
async function updateDepartment(req, res) {
  try {
    if (req.user.role !== 'manager') {
      return error(res, '只有管理员可以编辑部门', 403)
    }

    const { id } = req.params
    const { name, manager_id } = req.body

    const dept = await orgService.findDepartment({ id, client_id: req.user.client_id })
    if (!dept) return error(res, '部门不存在', 404)

    if (name !== undefined) dept.name = name.trim()
    if (manager_id !== undefined) dept.manager_id = manager_id || null

    await dept.save()
    return success(res, dept, '部门更新成功')
  } catch (err) {
    console.error('Update client department error:', err)
    return error(res, '更新部门失败')
  }
}

// 删除部门
async function deleteDepartment(req, res) {
  try {
    if (req.user.role !== 'manager') {
      return error(res, '只有管理员可以删除部门', 403)
    }

    const { id } = req.params
    const dept = await orgService.findDepartment({ id, client_id: req.user.client_id })
    if (!dept) return error(res, '部门不存在', 404)

    // 检查部门下是否有人员
    const userCount = await require('../models/ClientUser').count({
      where: { client_id: req.user.client_id, department_id: id }
    })
    if (userCount > 0) return error(res, `部门下还有 ${userCount} 人，无法删除`, 400)

    await dept.destroy()
    return success(res, null, '部门删除成功')
  } catch (err) {
    console.error('Delete client department error:', err)
    return error(res, '删除部门失败')
  }
}

// 获取当前用户所在企业的用户列表
async function listUsers(req, res) {
  try {
    const { role, status, department_id, page, limit } = req.query
    const result = await orgService.listUsers(req.user.client_id, {
      role, status, department_id, page, limit,
    })

    // findAndCountAll 返回 { count, rows }，findAll 返回数组
    if (Array.isArray(result)) {
      return success(res, result)
    }
    return success(res, { list: result.rows, total: result.count })
  } catch (err) {
    console.error('List client users error:', err)
    return error(res, '获取人员列表失败')
  }
}

// 创建人员
async function createUser(req, res) {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ error: '只有管理员可以添加人员' })
    }

    const { name, phone, password, role, department_id } = req.body
    if (!name?.trim()) return error(res, '姓名不能为空', 400)
    if (!phone?.trim()) return error(res, '手机号不能为空', 400)
    if (!password?.trim()) return error(res, '密码不能为空', 400)

    // 检查手机号是否已存在
    const existing = await orgService.findUserByPhone(phone.trim())
    if (existing) return error(res, '该手机号已被使用', 400)

    const user = await orgService.createUser(req.user.client_id, {
      name: name.trim(),
      phone: phone.trim(),
      password,
      role: role || 'staff',
      department_id: department_id || null,
    })

    const result = user.toJSON()
    delete result.password_hash
    return success(res, result, '人员添加成功', 201)
  } catch (err) {
    console.error('Create client user error:', err)
    return error(res, '添加人员失败')
  }
}

// 更新人员
async function updateUser(req, res) {
  try {
    if (req.user.role !== 'manager') {
      return error(res, '只有管理员可以编辑人员', 403)
    }

    const { id } = req.params
    const { name, phone, role, department_id, status } = req.body

    const user = await orgService.findUser({ id, client_id: req.user.client_id })
    if (!user) return error(res, '人员不存在', 404)

    if (name !== undefined) user.name = name.trim()
    if (phone !== undefined && phone.trim() !== user.phone) {
      const existing = await orgService.findUserByPhone(phone.trim())
      if (existing && existing.id !== parseInt(id)) {
        return error(res, '该手机号已被使用', 400)
      }
      user.phone = phone.trim()
    }
    if (role !== undefined) user.role = role
    if (department_id !== undefined) user.department_id = department_id || null
    if (status !== undefined) user.status = status

    await user.save()

    const result = user.toJSON()
    delete result.password_hash
    return success(res, result, '人员更新成功')
  } catch (err) {
    console.error('Update client user error:', err)
    return error(res, '更新人员失败')
  }
}

// 删除人员
async function deleteUser(req, res) {
  try {
    if (req.user.role !== 'manager') {
      return error(res, '只有管理员可以删除人员', 403)
    }

    const { id } = req.params
    const user = await orgService.findUser({ id, client_id: req.user.client_id })
    if (!user) return error(res, '人员不存在', 404)
    if (user.id === req.user.user_id) return error(res, '不能删除自己', 400)

    await user.destroy()
    return success(res, null, '人员删除成功')
  } catch (err) {
    console.error('Delete client user error:', err)
    return error(res, '删除人员失败')
  }
}

// 重置人员密码
async function resetPassword(req, res) {
  try {
    if (req.user.role !== 'manager') {
      return error(res, '只有管理员可以重置密码', 403)
    }

    const { id } = req.params
    const { password } = req.body
    if (!password?.trim()) return error(res, '新密码不能为空', 400)

    const user = await orgService.findUser({ id, client_id: req.user.client_id })
    if (!user) return error(res, '人员不存在', 404)

    user.password_hash = password
    await user.save()
    return success(res, null, '密码重置成功')
  } catch (err) {
    console.error('Reset client user password error:', err)
    return error(res, '重置密码失败')
  }
}

module.exports = {
  listDepartments, createDepartment, updateDepartment, deleteDepartment,
  listUsers, createUser, updateUser, deleteUser, resetPassword,
}
