const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const controller = require('../controllers/notificationController')

// 所有通知路由需要登录
router.use(requireAuth)

// 未读统计（必须在 :id 之前）
router.get('/unread-count', controller.getUnreadCount)

// 标记全部已读（必须在 :id 之前）
router.post('/read-all', controller.markAllAsRead)

// 通知列表
router.get('/', controller.listNotifications)

// 子路由（必须在 :id 之前）
router.post('/:id/read', controller.markAsRead)

// 通知详情（自动标记已读）
router.get('/:id', controller.getNotification)

module.exports = router
