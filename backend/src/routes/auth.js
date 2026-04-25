const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { requireAuth } = require('../middleware/auth')

// 不需要认证
router.post('/tenant/login', authController.tenantLogin)
router.post('/client/login', authController.clientLogin)
router.post('/admin/login', authController.superAdminLogin)
router.post('/forgot-password', authController.forgotPassword)

// 短信相关（不需要认证）
router.post('/sms/send', authController.sendSmsCode)
router.post('/sms/login', authController.smsLogin)

// 需要认证
router.post('/change-password', requireAuth, authController.changePassword)
router.get('/me', requireAuth, authController.getCurrentUser)

module.exports = router
