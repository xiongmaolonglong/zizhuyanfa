const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const { injectTenant } = require('../middleware/tenant')
const controller = require('../controllers/aftersaleController')

// 所有售后路由需要登录 + 租户隔离
router.use(requireAuth, injectTenant)

// 提交售后
router.post('/', controller.createAftersale)

// 售后列表
router.get('/', controller.listAftersales)

// 售后详情（必须在子路由之前）
router.get('/:id', controller.getAftersale)

// 处理售后
router.post('/:id/handle', controller.handleAftersale)

// 售后评价
router.post('/:id/rate', controller.rateAftersale)

module.exports = router
