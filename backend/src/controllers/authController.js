const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const TenantUser = require('../models/TenantUser')
const ClientUser = require('../models/ClientUser')
const { success, error } = require('../utils/response')

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET || JWT_SECRET === 'dev-secret-change-me') {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production')
  }
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

/**
 * 生成 JWT token
 */
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * 从用户实例中排除敏感字段
 */
function sanitizeUser(user) {
  const u = user.toJSON()
  delete u.password_hash
  delete u.createdAt
  delete u.updatedAt
  delete u.deletedAt
  return u
}

// ==================== 广告商员工登录 ====================

async function tenantLogin(req, res) {
  try {
    const { phone, password } = req.body

    if (!phone || !password) {
      return error(res, '手机号和密码不能为空', 400)
    }

    const user = await TenantUser.findOne({ where: { phone, status: 'active' } })
    if (!user) {
      return error(res, '手机号或密码错误', 401)
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return error(res, '手机号或密码错误', 401)
    }

    const token = signToken({
      user_id: user.id,
      user_type: 'tenant',
      tenant_id: user.tenant_id,
      role: user.role,
    })

    return success(res, { token, user: sanitizeUser(user) }, '登录成功')
  } catch (err) {
    console.error('Tenant login error:', err)
    return error(res, '登录失败，请稍后重试')
  }
}

// ==================== 甲方人员登录 ====================

async function clientLogin(req, res) {
  try {
    const { phone, password } = req.body

    if (!phone || !password) {
      return error(res, '手机号和密码不能为空', 400)
    }

    const user = await ClientUser.findOne({ where: { phone, status: 'active' } })
    if (!user) {
      return error(res, '手机号或密码错误', 401)
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return error(res, '手机号或密码错误', 401)
    }

    const token = signToken({
      user_id: user.id,
      user_type: 'client',
      client_id: user.client_id,
      role: user.role,
    })

    return success(res, { token, user: sanitizeUser(user) }, '登录成功')
  } catch (err) {
    console.error('Client login error:', err)
    return error(res, '登录失败，请稍后重试')
  }
}

// ==================== 超级管理员登录 ====================

async function superAdminLogin(req, res) {
  try {
    const { phone, password } = req.body

    if (!phone || !password) {
      return error(res, '手机号和密码不能为空', 400)
    }

    // 超管账号从环境变量读取，与租户账号完全隔离
    const adminPhone = process.env.SUPER_ADMIN_PHONE
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD

    if (!adminPhone || !adminPassword) {
      return error(res, '超级管理员未配置，请联系系统管理员')
    }

    if (phone !== adminPhone || password !== adminPassword) {
      return error(res, '账号或密码错误', 401)
    }

    const token = signToken({
      user_id: 0,
      user_type: 'super_admin',
      tenant_id: null,
      role: 'super_admin',
    })

    return success(res, {
      token,
      user: { id: 0, name: '超级管理员', role: 'super_admin', user_type: 'super_admin' },
    }, '登录成功')
  } catch (err) {
    console.error('Super admin login error:', err)
    return error(res, '登录失败，请稍后重试')
  }
}

// ==================== 修改密码 ====================

async function changePassword(req, res) {
  try {
    const { old_password, new_password } = req.body

    if (!old_password || !new_password) {
      return error(res, '旧密码和新密码不能为空', 400)
    }

    if (new_password.length < 6) {
      return error(res, '新密码至少 6 位', 400)
    }

    const { user_id, user_type } = req.user
    const Model = user_type === 'tenant' ? TenantUser : ClientUser

    const user = await Model.findByPk(user_id)
    if (!user) {
      return error(res, '用户不存在', 404)
    }

    const valid = await bcrypt.compare(old_password, user.password_hash)
    if (!valid) {
      return error(res, '旧密码错误', 400)
    }

    user.password_hash = new_password // beforeUpdate hook will hash it
    await user.save()

    return success(res, null, '密码修改成功')
  } catch (err) {
    console.error('Change password error:', err)
    return error(res, '修改密码失败，请稍后重试')
  }
}

// ==================== 忘记密码（通过手机号重置） ====================

async function forgotPassword(req, res) {
  try {
    const { phone, code, new_password } = req.body

    if (!phone || !code || !new_password) {
      return error(res, '手机号、验证码和新密码不能为空', 400)
    }

    if (new_password.length < 6) {
      return error(res, '新密码至少 6 位', 400)
    }

    // 验证短信验证码
    const record = smsStore.get(phone)
    if (!record) {
      return error(res, '请先获取验证码', 400)
    }
    if (Date.now() > record.expires) {
      smsStore.delete(phone)
      return error(res, '验证码已过期，请重新获取', 400)
    }
    if (record.code !== code) {
      return error(res, '验证码错误', 401)
    }
    smsStore.delete(phone) // 一次性使用

    // 查找用户（甲方或广告商）
    let user = await TenantUser.findOne({ where: { phone, status: 'active' } })
    if (!user) {
      user = await ClientUser.findOne({ where: { phone, status: 'active' } })
    }
    if (!user) {
      return error(res, '该手机号未注册', 404)
    }

    user.password_hash = new_password // beforeUpdate hook will hash it
    await user.save()

    return success(res, null, '密码重置成功，请使用新密码登录')
  } catch (err) {
    console.error('Forgot password error:', err)
    return error(res, '重置密码失败，请稍后重试')
  }
}

// ==================== 发送短信验证码 ====================

// TODO: 接入真实短信服务（阿里云/腾讯云）
const smsStore = new Map() // 开发环境：内存存储验证码

async function sendSmsCode(req, res) {
  try {
    const { phone } = req.body

    if (!phone || !/^1\d{10}$/.test(phone)) {
      return error(res, '请输入正确的手机号', 400)
    }

    // 开发环境：生成随机验证码
    const code = String(Math.floor(100000 + Math.random() * 900000))

    // 存储验证码，5分钟过期
    smsStore.set(phone, { code, expires: Date.now() + 5 * 60 * 1000 })

    // TODO: 接入真实短信服务时替换此处
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[开发模式] 短信验证码 → ${phone}: ${code}`)
    }

    return success(res, {}, '验证码已发送')
  } catch (err) {
    console.error('Send SMS error:', err)
    return error(res, '发送失败，请稍后重试')
  }
}

// ==================== 短信验证码登录 ====================

async function smsLogin(req, res) {
  try {
    const { phone, code } = req.body

    if (!phone || !code) {
      return error(res, '手机号和验证码不能为空', 400)
    }

    const record = smsStore.get(phone)
    if (!record) {
      return error(res, '请先获取验证码', 400)
    }

    if (Date.now() > record.expires) {
      smsStore.delete(phone)
      return error(res, '验证码已过期，请重新获取', 400)
    }

    if (record.code !== code) {
      return error(res, '验证码错误', 401)
    }

    smsStore.delete(phone) // 一次性使用

    // 尝试查找甲方用户
    let user = await ClientUser.findOne({ where: { phone, status: 'active' } })
    if (user) {
      const token = signToken({
        user_id: user.id,
        user_type: 'client',
        client_id: user.client_id,
        role: user.role,
      })
      return success(res, { token, user: sanitizeUser(user) }, '登录成功')
    }

    // 尝试查找广告商用户
    user = await TenantUser.findOne({ where: { phone, status: 'active' } })
    if (user) {
      const token = signToken({
        user_id: user.id,
        user_type: 'tenant',
        tenant_id: user.tenant_id,
        role: user.role,
      })
      return success(res, { token, user: sanitizeUser(user) }, '登录成功')
    }

    return error(res, '该手机号未注册', 404)
  } catch (err) {
    console.error('SMS login error:', err)
    return error(res, '登录失败，请稍后重试')
  }
}

// ==================== 获取当前用户信息 ====================

async function getCurrentUser(req, res) {
  try {
    const { user_id, user_type } = req.user
    const Model = user_type === 'tenant' ? TenantUser : ClientUser

    const user = await Model.findByPk(user_id)
    if (!user) {
      return error(res, '用户不存在', 404)
    }

    return success(res, sanitizeUser(user))
  } catch (err) {
    console.error('Get current user error:', err)
    return error(res, '获取用户信息失败')
  }
}

module.exports = { tenantLogin, clientLogin, superAdminLogin, sendSmsCode, smsLogin, changePassword, forgotPassword, getCurrentUser }
