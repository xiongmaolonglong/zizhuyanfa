require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const path = require('path')
const fs = require('fs')
const sequelize = require('./config/database')
const errorHandler = require('./middleware/errorHandler')

const app = express()

// 安全头
app.use(helmet())

// Gzip 压缩（API 响应和静态文件）
app.use(compression({ level: 6 }))

// CORS 白名单配置
const corsWhitelist = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:3002', 'http://127.0.0.1:5173', 'https://bh.fsbhgg.com', 'https://bh.fsbhgg.com:3002', 'https://bh.fsbhgg.com:3003']

app.use(cors({
  origin: (origin, callback) => {
    // 允许无 origin 的请求（如移动端、Postman）
    if (!origin) return callback(null, true)
    // 开发环境允许所有
    if (process.env.NODE_ENV !== 'production') return callback(null, true)
    // 生产环境检查白名单
    if (corsWhitelist.includes(origin) || corsWhitelist.includes('*')) {
      callback(null, true)
    } else {
      callback(new Error('不允许的跨域请求'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// API 限流配置
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 500, // 每个 IP 最多 500 次请求
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
  // 信任反向代理
  trustProxy: process.env.NODE_ENV === 'production' ? 1 : 0,
})

// 登录接口单独限流（更严格）
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 10, // 每个 IP 最多 10 次登录尝试
  message: { error: '登录尝试过多，请 15 分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false,
})

// 信任反向代理（生产环境用 Nginx）
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1)
}

// 应用限流（排除静态资源）
app.use('/api', apiLimiter)
app.use('/api/v1/auth/tenant/login', loginLimiter)
app.use('/api/v1/auth/client/login', loginLimiter)
app.use('/api/v1/auth/admin/login', loginLimiter)
app.use('/api/v1/auth/sms/send', loginLimiter)

// 请求体解析
app.use(express.json({ limit: '500mb' }))
app.use(express.urlencoded({ extended: true, limit: '500mb' }))

// 日志配置
if (process.env.NODE_ENV === 'production') {
  // 生产环境：写入日志文件
  const logDir = path.join(__dirname, '..', 'logs')
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })
  const accessLog = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' })
  app.use(morgan('combined', { stream: accessLog }))
} else {
  // 开发环境：控制台输出
  app.use(morgan('dev'))
}

// Static files (COS 存储，本地不再提供)

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }))

// API routes
const apiRoutes = require('./routes')
app.use('/api/v1', apiRoutes)

// Error handler (must be last)
app.use(errorHandler)

const PORT = process.env.PORT || 3000

// 全局错误捕获，防止进程崩溃
process.on('uncaughtException', (err) => {
  console.error('[UncaughtException]', err.message, err.stack)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UnhandledRejection]', reason)
})

async function start() {
  try {
    await sequelize.authenticate()
    console.log('Database connected')
    await sequelize.sync({ alter: false })
    console.log('Database synced')
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  } catch (err) {
    console.error('Failed to start:', err)
    process.exit(1)
  }
}

module.exports = app
if (require.main === module) start()
