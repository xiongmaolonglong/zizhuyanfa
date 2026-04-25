const express = require('express')
const router = express.Router()
const { requireTenant } = require('../middleware/auth')
const { injectTenant } = require('../middleware/tenant')
const { validate } = require('../middleware/validate')
const controller = require('../controllers/tenantController')

// 所有路由都需要 tenant 认证 + 租户隔离
router.use(requireTenant, injectTenant)

// ========== 租户信息 ==========
router.get('/info', controller.getTenantInfo)
router.put('/info', controller.updateTenantInfo)

// ========== 部门管理 ==========
router.get('/departments', controller.listDepartments)
router.post(
  '/departments',
  validate({ name: { required: true, type: 'string', min: 1, max: 100 } }),
  controller.createDepartment,
)
router.get('/departments/:id', controller.getDepartment)
router.put('/departments/:id', controller.updateDepartment)
router.delete('/departments/:id', controller.deleteDepartment)

// ========== 人员管理 ==========
router.get('/users', controller.listUsers)
router.post(
  '/users',
  validate({
    name: { required: true, type: 'string', min: 1, max: 50 },
    phone: { required: true, type: 'phone' },
    password: { required: true, type: 'string', min: 6 },
    role: { type: 'string', enum: ['admin', 'dispatcher', 'measurer', 'designer', 'producer', 'constructor', 'finance'] },
    status: { type: 'string', enum: ['active', 'disabled'] },
  }),
  controller.createUser,
)
router.get('/users/:id', controller.getUser)
router.delete('/users/:id', controller.deleteUser)
router.put('/users/:id', controller.updateUser)

// 子路由（必须在 :id 之前）
router.put('/users/:id/status', controller.updateUserStatus)

// ========== 统计 ==========
router.get('/stats', controller.getStats)

module.exports = router
