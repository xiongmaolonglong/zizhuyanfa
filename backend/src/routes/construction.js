const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const { injectTenant } = require('../middleware/tenant')
const controller = require('../controllers/constructionController')
const constructionLogController = require('../controllers/constructionLogController')

// 所有施工路由需要登录 + 租户隔离
router.use(requireAuth, injectTenant)

// 施工任务列表
router.get('/tasks', controller.listTasks)

// 施工任务详情（必须在 :workOrderId 之前定义具体路径）
router.get('/tasks/:workOrderId', controller.getTask)

// 施工日志（必须在 :workOrderId 之前）
router.get('/:workOrderId/logs', constructionLogController.listConstructionLogs)
router.post('/:workOrderId/logs', constructionLogController.createConstructionLog)
router.put('/logs/:logId', constructionLogController.updateConstructionLog)
router.delete('/logs/:logId', constructionLogController.deleteConstructionLog)

// 子路由（必须在 :workOrderId 之前）
router.post('/:workOrderId/assign', controller.assignConstructor)
router.post('/:workOrderId/internal-verify', controller.internalVerify)
router.post('/:workOrderId/verify', controller.clientVerify)
router.post('/:workOrderId/exception', controller.reportException)

// 提交施工记录
router.post('/:workOrderId', controller.submitConstruction)

module.exports = router
