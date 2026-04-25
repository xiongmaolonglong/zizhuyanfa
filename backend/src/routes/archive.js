const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const { injectTenant } = require('../middleware/tenant')
const controller = require('../controllers/archiveController')

// 所有归档路由需要登录 + 租户隔离
router.use(requireAuth, injectTenant)

// 归档列表
router.get('/', controller.listArchives)

// 归档导出（必须在 :workOrderId 之前）
router.get('/:workOrderId/export', controller.exportArchive)

// 创建归档
router.post('/:workOrderId', controller.createArchive)

// 归档详情
router.get('/:workOrderId', controller.getArchive)

module.exports = router
