const express = require('express')
const router = express.Router()
const designController = require('../controllers/designController')
const { requireTenant, requireAuth } = require('../middleware/auth')
const { injectTenant } = require('../middleware/tenant')

// ==================== 设计师工作台 ====================

// GET /api/v1/designs/tasks - 设计师待设计任务列表
router.get('/tasks', requireTenant, injectTenant, designController.getDesignerTasks)

// GET /api/v1/designs/tasks/:workOrderId - 设计任务详情
router.get('/tasks/:workOrderId', requireTenant, injectTenant, designController.getTaskDetail)

// GET /api/v1/designs/designers - 获取设计师列表
router.get('/designers', requireTenant, injectTenant, designController.getDesigners)

// ==================== 设计稿管理 ====================

// GET /api/v1/designs/:workOrderId/detail - 设计详情页（必须在 :workOrderId 之前）
router.get('/:workOrderId/detail', requireAuth, designController.getDesignDetail)

// GET /api/v1/designs/:workOrderId/export - 导出设计报告数据（必须在 :workOrderId 之前）
router.get('/:workOrderId/export', requireAuth, designController.exportDesignReport)

// GET /api/v1/designs/:workOrderId/auto-materials - 自动生成材料清单（必须在 :workOrderId 之前）
router.get('/:workOrderId/auto-materials', requireAuth, designController.autoGenerateMaterials)

// GET /api/v1/designs/:workOrderId - 获取设计稿信息
router.get('/:workOrderId', requireAuth, designController.getDesignInfo)

// POST /api/v1/designs/:workOrderId/review - 审核设计稿（管理员）
router.post('/:workOrderId/review', requireTenant, designController.reviewDesign)

// POST /api/v1/designs/:workOrderId/submit-review - 提交设计审核（设计师）
router.post('/:workOrderId/submit-review', requireTenant, injectTenant, designController.submitReview)

// POST /api/v1/designs/:workOrderId/withdraw - 撤回设计稿（设计师）
router.post('/:workOrderId/withdraw', requireTenant, injectTenant, designController.withdrawDesign)

// POST /api/v1/designs/:workOrderId/assign - 指派设计师（必须在 :workOrderId 之前）
router.post('/:workOrderId/assign', requireTenant, injectTenant, designController.assignDesigner)

// POST /api/v1/designs/:workOrderId/materials - 材料用量变更
router.post('/:workOrderId/materials', requireTenant, designController.updateMaterials)

// POST /api/v1/designs/:workOrderId/confirm - 确认设计定稿
router.post('/:workOrderId/confirm', requireTenant, designController.confirmDesign)

// POST /api/v1/designs/:workOrderId - 上传设计稿
router.post('/:workOrderId', requireTenant, injectTenant, designController.uploadDesign)

// PUT /api/v1/designs/:workOrderId - 修改设计稿（被驳回后重新提交）
router.put('/:workOrderId', requireTenant, injectTenant, designController.updateDesign)

module.exports = router
