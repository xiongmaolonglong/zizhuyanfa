const express = require('express')
const router = express.Router()
const { requireTenant, requireTenantOrClient } = require('../middleware/auth')
const { injectTenant } = require('../middleware/tenant')
const controller = require('../controllers/tenantSettingsController')

// 读取：广告商和甲方都可以
router.get('/', requireTenantOrClient, injectTenant, controller.getSettings)
router.get('/project-templates', requireTenantOrClient, injectTenant, controller.getProjectTemplates)
router.get('/material-type-map', requireTenantOrClient, injectTenant, controller.getMaterialTypeMap)

// 写入：仅广告商
router.use(requireTenant, injectTenant)
router.put('/', controller.updateSettings)
router.patch('/:key', controller.updateSettingKey)

module.exports = router
