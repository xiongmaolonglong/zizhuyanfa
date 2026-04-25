const express = require('express')
const router = express.Router()
const { requireClient } = require('../middleware/auth')
const ctrl = require('../controllers/clientApiController')

// 所有小程序客户端接口需要甲方登录
router.use(requireClient)

// 首页统计
router.get('/dashboard', ctrl.getDashboard)

// 工单列表
router.get('/work-orders', ctrl.listWorkOrders)

// 工单详情（必须在 /work-orders/:id 之前注册子路由）
router.get('/work-orders/:id', ctrl.getWorkOrderDetail)
router.get('/work-orders/:id/design', ctrl.getWorkOrderDesign)
router.get('/work-orders/:id/construction', ctrl.getWorkOrderConstruction)
router.get('/work-orders/:id/finance', ctrl.getWorkOrderFinance)

// 归档列表
router.get('/archives', ctrl.listArchives)

// 归档详情
router.get('/archives/:id', ctrl.getArchiveDetail)

// 通知列表
router.get('/notifications', ctrl.listNotifications)

// 通知详情
router.get('/notifications/:id', ctrl.getNotificationDetail)

// 标记通知已读
router.put('/notifications/:id', ctrl.markNotificationRead)

module.exports = router
