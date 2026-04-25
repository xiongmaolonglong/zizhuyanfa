const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const ctrl = require('../controllers/wechatController')

// 不需要登录的接口
router.post('/login', ctrl.wechatLogin)

// 需要登录的接口
router.post('/bind', requireAuth, ctrl.bindWechat)
router.post('/subscribe', requireAuth, ctrl.subscribe)
router.post('/test-message', requireAuth, ctrl.testMessage)

module.exports = router
