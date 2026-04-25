const express = require('express')
const router = express.Router()

const authRoutes = require('./auth')
const addressRoutes = require('./address')
const tenantRoutes = require('./tenant')
const clientRoutes = require('./client')
const workOrderRoutes = require('./workOrder')
const assignmentRoutes = require('./assignment')
const declarationRoutes = require('./declaration')
const tenantDeclarationRoutes = require('./tenantDeclaration')
const designRoutes = require('./design')
const fileRoutes = require('./file')
const productionRoutes = require('./production')
const constructionRoutes = require('./construction')
const financeRoutes = require('./finance')
const archiveRoutes = require('./archive')
const aftersaleRoutes = require('./aftersale')
const adminRoutes = require('./admin')
const notificationRoutes = require('./notification')
const wechatRoutes = require('./wechat')

// Health check
router.use('/health', (req, res) => res.json({ status: 'ok' }))

// Auth routes -> /api/v1/auth/*
router.use('/auth', authRoutes)

// Address dictionary routes -> /api/v1/addresses/*
router.use('/addresses', addressRoutes)

const clientOrgRoutes = require('./clientOrg')
const formConfigRoutes = require('./formConfig')
const tenantSettingsRoutes = require('./tenantSettings')

// 表单配置 routes -> /api/v1/tenant/form-config/*
// 必须在 /tenant 之前，因为 form-config 允许甲方用户访问
router.use('/tenant/form-config', formConfigRoutes)

// 甲方用户组织架构 routes -> /api/v1/client-organization/*
router.use('/client-organization', clientOrgRoutes)

// 租户系统配置 routes -> /api/v1/tenant/settings
router.use('/tenant/settings', tenantSettingsRoutes)

// Tenant declaration routes -> /api/v1/tenant/declarations/*
// 必须在 /tenant 之前
router.use('/tenant/declarations', tenantDeclarationRoutes)

// Tenant management routes -> /api/v1/tenants/* (and /tenant/* for frontend compatibility)
// /tenant 是通配路由，会拦截所有 /tenant/* 子路径，所以必须在更具体的路由之后注册
router.use('/tenants', tenantRoutes)
router.use('/tenant', tenantRoutes)

// Client (甲方) management routes -> /api/v1/clients/*
router.use('/clients', clientRoutes)

// Work Order routes -> /api/v1/work-orders/*
router.use('/work-orders', workOrderRoutes)

// Assignment & Measurement routes -> /api/v1/*
router.use('/', assignmentRoutes)

// Design routes -> /api/v1/designs/*
router.use('/designs', designRoutes)

// Declaration routes (client) -> /api/v1/declarations/*
router.use('/declarations', declarationRoutes)

// File upload routes -> /api/v1/files/*
router.use('/files', fileRoutes)

// Production routes -> /api/v1/production/*
router.use('/production', productionRoutes)

// Construction routes -> /api/v1/construction/*
router.use('/construction', constructionRoutes)

// Finance routes -> /api/v1/finance/*
router.use('/finance', financeRoutes)

// Archive routes -> /api/v1/archives/*
router.use('/archives', archiveRoutes)

// Aftersale routes -> /api/v1/aftersales/*
router.use('/aftersales', aftersaleRoutes)

// Warehouse routes -> /api/v1/warehouse/*
router.use('/warehouse', require('./warehouse'))

// Notification routes -> /api/v1/notifications/*
router.use('/notifications', notificationRoutes)

// WeChat routes -> /api/v1/wechat/*
router.use('/wechat', wechatRoutes)

// Client (甲方小程序) API routes -> /api/v1/client/*
router.use('/client', require('./clientApi'))

// Super Admin routes -> /api/v1/admin/*
router.use('/admin', adminRoutes)

// APP version management (admin) -> /api/v1/admin/app-versions/*
router.use('/admin/app-versions', require('./adminAppVersions'))

// APP version check (public) -> /api/v1/app/*
router.use('/app', require('./appVersion'))

module.exports = router
