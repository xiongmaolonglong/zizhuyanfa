const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')

class SocketService {
  constructor() {
    /** @type {import('socket.io').Server | null} */
    this.io = null
    /** userId:string -> Set<Socket> */
    this.users = new Map()
  }

  /**
   * Attach Socket.IO to an HTTP server.
   * @param {import('http').Server} httpServer
   */
  init(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGINS
          ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
          : ['http://localhost:5173', 'http://localhost:3002', 'http://127.0.0.1:5173', 'https://bh.fsbhgg.com', 'https://bh.fsbhgg.com:3002', 'https://bh.fsbhgg.com:3003'],
        credentials: true,
      },
    })

    this.io.use(this.authenticate.bind(this))

    this.io.on('connection', (socket) => {
      const { user_id, user_type, tenant_id } = socket.user

      // Join user-specific room
      const room = `${user_type}:${user_id}`
      socket.join(room)

      // Track online users
      if (!this.users.has(user_id)) {
        this.users.set(user_id, new Set())
      }
      this.users.get(user_id).add(socket)

      socket.on('disconnect', () => {
        const sockets = this.users.get(user_id)
        if (sockets) {
          sockets.delete(socket)
          if (sockets.size === 0) {
            this.users.delete(user_id)
          }
        }
      })
    })

    console.log('[SocketIO] Service initialized')
  }

  /**
   * Socket.IO auth middleware — verify JWT from handshake.
   */
  authenticate(socket, next) {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token
    if (!token) {
      return next(new Error('未提供认证令牌'))
    }

    const payload = this.verifyToken(token)
    if (!payload) {
      return next(new Error('认证令牌无效或已过期'))
    }

    socket.user = {
      user_id: payload.user_id,
      user_type: payload.user_type,
      tenant_id: payload.tenant_id,
      client_id: payload.client_id,
      role: payload.role,
    }
    next()
  }

  verifyToken(token) {
    const secret = process.env.JWT_SECRET
    if (!secret || secret.includes('dev-secret')) {
      return null
    }
    try {
      return jwt.verify(token, secret)
    } catch {
      return null
    }
  }

  /**
   * Emit an event to a specific user.
   * @param {string} userType - 'tenant' | 'client'
   * @param {number|string} userId
   * @param {string} eventType - e.g. 'notification:new'
   * @param {Object} payload
   */
  emitToUser(userType, userId, eventType, payload) {
    if (!this.io) return

    const room = `${userType}:${userId}`

    this.io.to(room).emit('notification', {
      type: eventType,
      ...payload,
      ts: Date.now(),
    })
  }

  /**
   * Get count of currently online users.
   */
  getOnlineUserCount() {
    return this.users.size
  }

  /**
   * Check if a user is currently connected.
   */
  isUserOnline(userId) {
    return this.users.has(String(userId))
  }
}

module.exports = new SocketService()
