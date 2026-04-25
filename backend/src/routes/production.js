const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const { injectTenant } = require('../middleware/tenant')
const controller = require('../controllers/productionController')
const progressController = require('../controllers/productionProgressController')

// 所有生产路由需要登录 + 租户隔离
router.use(requireAuth, injectTenant)

// 生产进度（必须在 :id/:workOrderId 之前）
router.get('/:workOrderId/progress', progressController.getProgress)
router.put('/:workOrderId/progress', progressController.updateProgress)

// 生产清单视图（必须在 :id/:workOrderId 之前）
router.get('/view/:material_type', controller.getProductionView)

// 合并创建生产任务（必须在 :id 之前）
router.post('/tasks/merge', controller.mergeTasks)

// 生产计划（按材料分组待合并任务）（必须在 :id 之前）
router.get('/pending-groups', controller.getPendingGroups)

// 合并已有生产任务（必须在 :id 之前）
router.post('/tasks/:id/merge', controller.mergeExistingTasks)

// 工厂领料登记
router.post('/material-pickup', controller.materialPickup)

// 生产批次
router.post('/batches', controller.createBatch)
router.get('/batches', controller.listBatches)
router.get('/batches/:id', controller.getBatch)

// 生产导出记录（必须在 :id 之前）
router.post('/exports', controller.createExport)
router.post('/exports/by-wo', controller.getExportsByWorkOrders)
router.get('/exports', controller.listExports)

// 生产任务列表
router.get('/tasks', controller.listTasks)

// 生产任务详情（必须在子路由之前）
router.get('/tasks/:id', controller.getTask)

// 更新生产状态
router.post('/tasks/:id/status', controller.updateStatus)

// 标记材料组完成
router.post('/groups/complete', controller.markGroupComplete)

module.exports = router
