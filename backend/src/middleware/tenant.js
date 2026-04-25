/**
 * 多租户隔离中间件
 * 自动注入 tenant_id 过滤，防止跨租户数据访问
 */
const Client = require('../models/Client')

function injectTenant(req, res, next) {
  // 仅对有 user_type 的请求生效
  if (!req.user) return next()

  // 广告商用户：直接使用 JWT 中的 tenant_id
  if (req.user.user_type === 'tenant') {
    req.tenantId = req.user.tenant_id

    // 超级管理员跳过 tenant 过滤
    if (req.user.role === 'super_admin') return next()

    req.locals = req.locals || {}
    req.locals.tenant_id = req.tenantId
    return next()
  }

  // 甲方用户：通过 client_id 查询 tenant_id
  if (req.user.user_type === 'client' && req.user.client_id) {
    Client.findByPk(req.user.client_id, { attributes: ['tenant_id'] })
      .then(client => {
        if (client) {
          req.tenantId = client.tenant_id
          req.user.tenant_id = client.tenant_id
          req.locals = req.locals || {}
          req.locals.tenant_id = client.tenant_id
        }
        next()
      })
      .catch(e => {
        console.error('injectTenant client lookup error:', e)
        next()
      })
    return
  }

  next()
}

/**
 * 为 Sequelize 查询自动注入 tenant 过滤条件
 * 用法：在 controller 中调用 buildTenantFilter(Model, whereClause)
 */
function buildTenantFilter(Model, where = {}) {
  return function tenantFilter(req, _res, _next) {
    if (req.user?.role === 'super_admin') {
      return // 超管不过滤
    }
    const tenantId = req.tenantId || req.user?.tenant_id
    if (tenantId && Model.rawAttributes?.tenant_id) {
      where.tenant_id = tenantId
    }
  }
}

module.exports = { injectTenant, buildTenantFilter }
