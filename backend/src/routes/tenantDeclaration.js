const express = require('express')
const jwt = require('jsonwebtoken')

const router = express.Router()
const { requireTenant, injectTenant } = require('../middleware/auth')
const sseBroker = require('../services/sseBroker')
const {
  getTenantDeclarations,
  getTenantDeclarationById,
  receiveDeclaration,
  rejectTenantDeclaration,
} = require('../controllers/declarationController')

/**
 * SSE auth — accepts Bearer header or ?token query param
 * Only for the /stream endpoint
 */
function sseAuth(req, res, next) {
  const secret = process.env.JWT_SECRET
  let token

  // Try header first
  const header = req.headers.authorization
  if (header && header.startsWith('Bearer ')) {
    token = header.slice(7)
  } else if (req.query.token) {
    token = req.query.token
  }

  if (!token) {
    return res.status(401).json({ error: '未登录或登录已过期' })
  }

  try {
    const payload = jwt.verify(token, secret)
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
  } catch {
    return res.status(401).json({ error: '未登录或登录已过期' })
  }
}

// SSE event stream — must be BEFORE router.use(requireTenant)
router.get('/stream', sseAuth, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  // Send initial ping so client knows connection is alive
  res.write(': connected\n\n')

  const tenantId = String(req.user.tenant_id)
  const unsubscribe = sseBroker.subscribe(tenantId, res)

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n')
  }, 25000)

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(heartbeat)
    unsubscribe()
  })
})

// Tenant routes - 广告商查看申报
router.use(requireTenant, injectTenant)
router.get('/', getTenantDeclarations)

// 子路由（必须在 :id 之前）
router.post('/:id/reject', rejectTenantDeclaration)
router.post('/:id/receive', receiveDeclaration)
router.get('/:id', getTenantDeclarationById)

module.exports = router
