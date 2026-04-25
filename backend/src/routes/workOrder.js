const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const { injectTenant } = require('../middleware/tenant')
const controller = require('../controllers/workOrderController')
const changeLogController = require('../controllers/changeLogController')
const reviewController = require('../controllers/workOrderReviewController')

// 所有工单路由需要登录 + 租户隔离
router.use(requireAuth, injectTenant)

// 创建工单（补录）
router.post('/', controller.createWorkOrder)

// 工单统计（必须在 :id 之前）
router.get('/stats', controller.getWorkOrderStats)

// 工单趋势（必须在 :id 之前）
router.get('/trend', controller.getWorkOrderTrend)

// 人员负载（必须在 :id 之前）
router.get('/staff-workload', controller.getStaffWorkload)

// 审核中心（必须在 :id 之前）
router.get('/reviews/tasks', controller.getReviewTasks)

// 元素选项（必须在 :id 之前）
router.get('/element-options', controller.getElementOptions)

// 工单列表
router.get('/', controller.listWorkOrders)

// 全部操作日志（必须在 :id 之前）
router.get('/logs', controller.getAllWorkOrderLogs)

// 工单操作日志（必须在 :id 之前）
router.get('/:id/logs', controller.getWorkOrderLogs)

// 变更记录（必须在 :id 之前）
router.get('/:id/change-logs', changeLogController.listChangeLogs)
router.post('/:id/change-logs', changeLogController.createChangeLog)
router.put('/change-logs/:logId', changeLogController.updateChangeLog)
router.delete('/change-logs/:logId', changeLogController.deleteChangeLog)

// 编辑工单（必须在 :id 之前）
router.put('/:id', controller.updateWorkOrder)

// 删除工单（必须在 :id 之前）
router.delete('/:id', controller.deleteWorkOrder)

// 阶段推进（必须在 :id 之前）
router.put('/:id/advance', controller.advanceWorkOrder)

// 看板拖拽变更（必须在 :id 之前）
router.put('/:id/stage', controller.updateStage)

// 批量推进（必须在 :id 之前）
router.post('/batch-advance', controller.batchAdvance)

// 工单快捷操作（必须在 :id 之前）
router.post('/:id/remark', controller.addRemark)
router.put('/:id/assign', controller.reassign)
router.put('/:id/tags', controller.updateTags)
router.put('/:id/priority', controller.updatePriority)
router.put('/:id/deadline', controller.updateDeadline)

// 审核现场创建的工单（必须在 :id 之前）
router.post('/:id/review', reviewController.reviewWorkOrder)

// 工单详情
router.get('/:id', controller.getWorkOrder)

module.exports = router
