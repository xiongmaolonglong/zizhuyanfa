const express = require('express')
const router = express.Router()
const addressController = require('../controllers/addressController')

// GET /api/v1/addresses - 获取地址列表
router.get('/', addressController.getAddressList)

// GET /api/v1/addresses/tree - 获取完整地址树
router.get('/tree', addressController.getAddressTree)

// GET /api/v1/addresses/path/:code - 地址完整路径（必须在 /:code 之前）
router.get('/path/:code', addressController.getAddressPath)

// GET /api/v1/addresses/:code - 单个地址详情
router.get('/:code', addressController.getAddressDetail)

// GET /api/v1/addresses/:code/children - 地址子级
router.get('/:code/children', addressController.getAddressChildren)

module.exports = router
