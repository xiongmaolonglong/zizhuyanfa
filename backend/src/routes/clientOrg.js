const express = require('express')
const router = express.Router()
const { requireClient } = require('../middleware/auth')
const ctrl = require('../controllers/clientOrgController')

// 甲方用户组织架构管理
router.use(requireClient)

// 部门管理
router.get('/departments', ctrl.listDepartments)
router.post('/departments', ctrl.createDepartment)
router.put('/departments/:id', ctrl.updateDepartment)
router.delete('/departments/:id', ctrl.deleteDepartment)

// 人员管理
router.get('/users', ctrl.listUsers)
router.post('/users', ctrl.createUser)
router.put('/users/:id', ctrl.updateUser)
router.delete('/users/:id', ctrl.deleteUser)
router.post('/users/:id/reset-password', ctrl.resetPassword)

module.exports = router
