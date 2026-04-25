const express = require('express')
const router = express.Router()
const { requireAuth, injectTenant } = require('../middleware/auth')
const { uploadSingle, uploadArray } = require('../middleware/upload')
const ctrl = require('../controllers/fileController')

// 所有文件路由需要登录
router.use(requireAuth)

// 上传单个文件 - 先注入 tenant_id 再处理上传
router.post('/', injectTenant, uploadSingle, ctrl.uploadFile)

// 批量上传文件（最多 9 个）
router.post('/batch', injectTenant, uploadArray, ctrl.uploadBatch)

// GET /api/v1/files 静态文件服务已由 app.js 的 express.static 处理

module.exports = router
