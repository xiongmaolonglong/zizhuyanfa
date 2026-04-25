const express = require('express')
const router = express.Router()
const { requireAdmin } = require('../middleware/auth')
const controller = require('../controllers/appVersionController')

// 所有路由都需要 admin 权限
router.use(requireAdmin)

router.get('/', controller.listVersions)
router.get('/:id', controller.getVersion)
router.post('/', controller.createVersion)
router.put('/:id', controller.updateVersion)
router.put('/:id/status', controller.updateStatus)
router.delete('/:id', controller.deleteVersion)

module.exports = router
