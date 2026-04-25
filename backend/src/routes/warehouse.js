const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const { injectTenant } = require('../middleware/tenant')
const controller = require('../controllers/warehouseController')

// 所有仓库路由需要登录 + 租户隔离
router.use(requireAuth, injectTenant)

// 库存概览（必须在 records/:id 之前）
router.get('/inventory', controller.getInventory)

// 出入库记录
router.post('/inbound', controller.createInbound)
router.post('/outbound', controller.createOutbound)
router.get('/records', controller.listRecords)
router.get('/records/:id', controller.getRecord)
router.delete('/records/:id', controller.deleteRecord)

module.exports = router
