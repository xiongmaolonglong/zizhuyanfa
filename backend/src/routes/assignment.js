const express = require('express')
const router = express.Router()
const { requireTenant, requireAuth } = require('../middleware/auth')
const {
  listAssignments,
  createAssignment,
  getAssignment,
  receiveAssignment,
  listMeasurementTasks,
  getMeasurementTask,
  submitMeasurement,
  updateMeasurement,
  proxySubmitMeasurement,
  reviewMeasurement,
  getMeasurementHistory,
  getRecommendedMeasurers,
  batchReviewMeasurements,
} = require('../controllers/assignmentController')

// ==================== 派单管理 ====================

// 推荐测量员（必须在 :id 之前）
router.get('/assignments/recommended-measurers', requireTenant, getRecommendedMeasurers)

// 待派单列表（广告商派单员/管理员）
router.get('/assignments', requireTenant, listAssignments)

// 创建派单
router.post('/assignments', requireTenant, createAssignment)

// 派单详情（必须在子路由之前）
router.get('/assignments/:id', requireTenant, getAssignment)

// 测量员确认接收派单
router.put('/assignments/:id/receive', requireAuth, receiveAssignment)

// ==================== 测量任务 ====================

// 测量员的任务列表
router.get('/measurements/tasks', requireAuth, listMeasurementTasks)

// 批量审核测量数据（必须在 :workOrderId 之前）
router.post('/tenant/measurements/batch-review', requireTenant, batchReviewMeasurements)

// 测量任务详情
router.get('/measurements/tasks/:workOrderId', requireAuth, getMeasurementTask)

// 审核测量结果（必须在 :workOrderId 之前）
router.post('/measurements/:workOrderId/review', requireTenant, reviewMeasurement)

// 同地址历史工单
router.get('/measurements/:workOrderId/history', requireAuth, getMeasurementHistory)

// 提交测量数据
router.post('/measurements/:workOrderId', requireAuth, submitMeasurement)

// 更新测量数据（审核前修改）
router.put('/measurements/:workOrderId', requireTenant, updateMeasurement)

// 后台代录测量数据（租户管理员操作）
router.post('/measurements/:workOrderId/proxy-submit', requireTenant, proxySubmitMeasurement)

module.exports = router
