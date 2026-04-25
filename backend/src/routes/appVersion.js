const express = require('express')
const router = express.Router()
const controller = require('../controllers/appVersionController')

// 公开接口：APP 检查更新
router.post('/check-version', controller.checkVersion)

module.exports = router
