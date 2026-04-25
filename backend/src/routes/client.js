const express = require('express')
const router = express.Router()
const { requireTenant } = require('../middleware/auth')
const { injectTenant } = require('../middleware/tenant')
const clientController = require('../controllers/clientController')

// 所有甲方管理接口都需要 tenant 登录
router.use(requireTenant)
router.use(injectTenant)

// ==================== 甲方企业 ====================
router.get('/', clientController.listClients)
router.post('/', clientController.createClient)

// ==================== 默认甲方（必须在 :id 之前） ====================
router.get('/default', clientController.getDefaultClient)
router.put('/default', clientController.setDefaultClient)

// ==================== 具体甲方操作 ====================
router.get('/:id', clientController.getClient)
router.put('/:id', clientController.updateClient)
router.delete('/:id', clientController.deleteClient)

// ==================== 甲方部门 ====================
router.get('/:clientId/departments', clientController.listDepartments)
router.post('/:clientId/departments', clientController.createDepartment)
router.put('/:clientId/departments/:id', clientController.updateDepartment)
router.delete('/:clientId/departments/:id', clientController.deleteDepartment)

// ==================== 甲方人员 ====================
router.get('/:clientId/users', clientController.listUsers)
router.post('/:clientId/users', clientController.createUser)
router.put('/:clientId/users/:id', clientController.updateUser)
router.delete('/:clientId/users/:id', clientController.deleteUser)

// ==================== 甲方人员管辖区域 ====================
router.get('/:clientId/users/:userId/regions', clientController.listRegions)
router.post('/:clientId/users/:userId/regions', clientController.setRegions)
router.delete('/:clientId/users/:userId/regions/:id', clientController.deleteRegion)

module.exports = router
