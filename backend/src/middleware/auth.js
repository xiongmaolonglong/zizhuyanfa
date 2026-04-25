const jwt = require('jsonwebtoken')
const Client = require('../models/Client')

function verifyToken(token) {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.includes('dev-secret')) {
    throw new Error('JWT_SECRET 未配置或仍为开发默认值，生产环境必须设置强密钥')
  }
  try {
    return jwt.verify(token, secret)
  } catch {
    return null
  }
}

/**
 * JWT 认证中间件
 * 要求任一类型用户登录即可
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录或登录已过期' })
  }

  const token = header.slice(7)
  const payload = verifyToken(token)
  if (!payload) {
    return res.status(401).json({ error: '未登录或登录已过期' })
  }

  req.user = {
    user_id: payload.user_id,
    user_type: payload.user_type,   // 'tenant' | 'client'
    tenant_id: payload.tenant_id,
    client_id: payload.client_id,
    role: payload.role,
  }

  next()
}

/**
 * 仅 tenant（广告商员工）可访问
 */
function requireTenant(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录或登录已过期' })
  }

  const token = header.slice(7)
  const payload = verifyToken(token)
  if (!payload) {
    return res.status(401).json({ error: '未登录或登录已过期' })
  }

  if (payload.user_type !== 'tenant') {
    return res.status(403).json({ error: '无权访问此资源' })
  }

  req.user = {
    user_id: payload.user_id,
    user_type: 'tenant',
    tenant_id: payload.tenant_id,
    role: payload.role,
  }

  next()
}

/**
 * 仅 client（甲方人员）可访问
 */
function requireClient(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录或登录已过期' })
  }

  const token = header.slice(7)
  const payload = verifyToken(token)
  if (!payload) {
    return res.status(401).json({ error: '未登录或登录已过期' })
  }

  if (payload.user_type !== 'client') {
    return res.status(403).json({ error: '无权访问此资源' })
  }

  req.user = {
    user_id: payload.user_id,
    user_type: 'client',
    client_id: payload.client_id,
    tenant_id: payload.tenant_id,
    role: payload.role,
  }

  next()
}

/**
 * 超级管理员权限
 * 要求 user_type='tenant' 且 role='admin'，或专门的 'super_admin' 角色
 */
function requireAdmin(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录或登录已过期' })
  }

  const token = header.slice(7)
  const payload = verifyToken(token)
  if (!payload) {
    return res.status(401).json({ error: '未登录或登录已过期' })
  }

  const isAdmin = payload.role === 'super_admin'
    || (payload.user_type === 'tenant' && payload.role === 'admin')

  if (!isAdmin) {
    return res.status(403).json({ error: '需要管理员权限' })
  }

  req.user = {
    user_id: payload.user_id,
    user_type: payload.user_type,
    tenant_id: payload.tenant_id,
    role: payload.role,
  }

  next()
}

/**
 * tenant（广告商）或 client（甲方）均可访问
 */
function requireTenantOrClient(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录或登录已过期' })
  }

  const token = header.slice(7)
  const payload = verifyToken(token)
  if (!payload) {
    return res.status(401).json({ error: '未登录或登录已过期' })
  }

  if (payload.user_type !== 'tenant' && payload.user_type !== 'client') {
    return res.status(403).json({ error: '无权访问此资源' })
  }

  req.user = {
    user_id: payload.user_id,
    user_type: payload.user_type,
    tenant_id: payload.tenant_id,
    client_id: payload.client_id,
    role: payload.role,
  }

  next()
}

/**
 * 解析 client 用户的 tenant_id 并注入到 req.user
 * 用于 multer 等需要同步访问 req.user.tenant_id 的场景
 */
async function injectTenant(req, res, next) {
  if (req.user?.tenant_id) return next()
  if (req.user?.user_type === 'client' && req.user?.client_id) {
    const client = await Client.findByPk(req.user.client_id, {
      attributes: ['tenant_id'],
      paranoid: false,
    })
    if (client) {
      req.user.tenant_id = client.tenant_id
    } else {
      console.error('[injectTenant] Client not found for client_id:', req.user.client_id)
    }
  }
  next()
}

/**
 * 甲方管理员权限
 * 要求 user_type='client' 且对应 Client 的 is_admin=true
 * 需要 req.user.client_id 已设置，并通过 Client 模型查询 is_admin
 * 注意：此中间件会异步查询 Client 的 is_admin 字段
 */
async function requireClientAdmin(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录或登录已过期' })
  }

  const token = header.slice(7)
  const payload = verifyToken(token)
  if (!payload) {
    return res.status(401).json({ error: '未登录或登录已过期' })
  }

  if (payload.user_type !== 'client') {
    return res.status(403).json({ error: '无权访问此资源' })
  }

  req.user = {
    user_id: payload.user_id,
    user_type: 'client',
    client_id: payload.client_id,
    tenant_id: payload.tenant_id,
    role: payload.role,
  }

  // 查询 Client 表确认 is_admin
  const client = await Client.findByPk(payload.client_id, {
    attributes: ['id', 'is_admin'],
  })
  if (!client || !client.is_admin) {
    return res.status(403).json({ error: '需要甲方管理员权限' })
  }

  next()
}

module.exports = { requireAuth, requireTenant, requireClient, requireTenantOrClient, requireAdmin, requireClientAdmin, injectTenant }
