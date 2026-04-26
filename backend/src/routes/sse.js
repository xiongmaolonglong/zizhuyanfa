const express = require('express')
const router = express.Router()
const sseBroker = require('../services/sseBroker')
const jwt = require('jsonwebtoken')

/**
 * GET /api/v1/sse/stream
 * Server-Sent Events stream for real-time notifications (web clients).
 * Auth via query param: ?token=<jwt>
 */
router.get('/stream', (req, res) => {
  // Authenticate via query token
  const token = req.query.token
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' })
  }

  const secret = process.env.JWT_SECRET
  if (!secret || secret.includes('dev-secret')) {
    return res.status(500).json({ error: '服务器配置错误' })
  }

  let payload
  try {
    payload = jwt.verify(token, secret)
  } catch {
    return res.status(401).json({ error: '认证令牌无效或已过期' })
  }

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected', ts: Date.now() })}\n\n`)

  const { tenant_id, user_id, user_type } = payload
  const tenantKey = tenant_id || `user:${user_id}`

  // Subscribe to SSE broker
  const cleanup = sseBroker.subscribe(tenantKey, res)

  // Cleanup on disconnect
  req.on('close', () => {
    cleanup()
    res.end()
  })
})

module.exports = router
