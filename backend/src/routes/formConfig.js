const express = require('express')
const router = express.Router()
const { requireTenant, requireTenantOrClient } = require('../middleware/auth')
const { injectTenant } = require('../middleware/tenant')
const ctrl = require('../controllers/formConfigController')

// 读取表单配置：广告商和甲方都可以
router.get('/:formType', requireTenantOrClient, injectTenant, ctrl.getFormConfig)

// 写入操作：仅广告商
router.use(requireTenant, injectTenant)

// 更新表单配置（批量覆盖）
router.put('/:formType', ctrl.updateFormConfig)

// 添加自定义字段
router.post('/:formType/fields', ctrl.addCustomField)

// 重置为默认
router.post('/:formType/reset', ctrl.resetFormConfig)

module.exports = router
