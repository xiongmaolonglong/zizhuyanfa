const { Op } = require('sequelize')
const AppVersion = require('../models/AppVersion')
const { success, error, paginate } = require('../utils/response')

/**
 * 比较两个版本号，返回 -1/0/1
 */
function compareVersion(a, b) {
  const partsA = String(a).split('.').map(Number)
  const partsB = String(b).split('.').map(Number)
  const len = Math.max(partsA.length, partsB.length)
  for (let i = 0; i < len; i++) {
    const va = partsA[i] || 0
    const vb = partsB[i] || 0
    if (va > vb) return 1
    if (va < vb) return -1
  }
  return 0
}

// ==================== 公开接口：APP 检查更新 ====================

/**
 * POST /api/v1/app/check-version
 * APP 启动时检查更新（公开接口，无需认证）
 * Body: { app_name: 'measure-app', platform: 'android', current_version: '1.0.0' }
 */
async function checkVersion(req, res) {
  const { app_name, platform, current_version } = req.body

  if (!app_name || !platform) {
    return error(res, '缺少 app_name 或 platform 参数', 400)
  }

  // 查找已发布的最新版本
  const latest = await AppVersion.findOne({
    where: { app_name, platform, status: 'published' },
    order: [['build_number', 'DESC']],
  })

  if (!latest) {
    return success(res, { has_update: false })
  }

  // 没有当前版本（首次安装）或版本号低于最新版本
  const needsUpdate = !current_version || compareVersion(current_version, latest.version) < 0

  if (!needsUpdate) {
    return success(res, { has_update: false })
  }

  return success(res, {
    has_update: true,
    force_update: latest.force_update,
    latest_version: latest.version,
    build_number: latest.build_number,
    update_type: latest.update_type,
    download_url: latest.download_url,
    changelog: latest.changelog || [],
    min_required_version: latest.min_required_version,
  })
}

// ==================== 管理接口 ====================

/**
 * GET /api/v1/admin/app-versions
 * 版本列表（支持筛选+分页）
 */
async function listVersions(req, res) {
  const { app_name, platform, status, keyword, page = 1, limit = 20 } = req.query

  const where = {}
  if (app_name) where.app_name = app_name
  if (platform) where.platform = platform
  if (status) where.status = status
  if (keyword) {
    where[Op.or] = [
      { version: { [Op.like]: `%${keyword}%` } },
      { download_url: { [Op.like]: `%${keyword}%` } },
    ]
  }

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10)
  const pageSize = Math.min(Math.max(1, parseInt(limit, 10)), 100)

  const { count, rows } = await AppVersion.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit: pageSize,
    offset,
  })

  const pagination = {
    page: parseInt(page, 10),
    limit: pageSize,
    total: count,
    pages: Math.ceil(count / pageSize),
  }

  return paginate(res, rows, pagination)
}

/**
 * GET /api/v1/admin/app-versions/:id
 * 版本详情
 */
async function getVersion(req, res) {
  const id = parseInt(req.params.id, 10)
  const version = await AppVersion.findByPk(id)

  if (!version) {
    return error(res, '版本不存在', 404)
  }

  return success(res, version)
}

/**
 * POST /api/v1/admin/app-versions
 * 创建新版本
 */
async function createVersion(req, res) {
  const { app_name, platform, version, build_number, min_required_version, force_update, update_type, download_url, changelog } = req.body

  if (!app_name) {
    return error(res, 'app_name 不能为空', 400)
  }
  if (!platform) {
    return error(res, 'platform 不能为空', 400)
  }
  if (!version) {
    return error(res, 'version 不能为空', 400)
  }
  if (!build_number) {
    return error(res, 'build_number 不能为空', 400)
  }

  // 检查同一平台同一构建号是否已存在
  const existing = await AppVersion.findOne({
    where: { app_name, platform, build_number: parseInt(build_number, 10) },
  })
  if (existing) {
    return error(res, `构建号 ${build_number} 已存在`, 400)
  }

  const newVersion = await AppVersion.create({
    app_name,
    platform,
    version,
    build_number: parseInt(build_number, 10),
    min_required_version: min_required_version || null,
    force_update: !!force_update,
    update_type: update_type || 'recommended',
    download_url: download_url || null,
    changelog: changelog || [],
    status: 'draft',
  })

  return success(res, newVersion, '版本创建成功')
}

/**
 * PUT /api/v1/admin/app-versions/:id
 * 更新版本信息
 */
async function updateVersion(req, res) {
  const id = parseInt(req.params.id, 10)
  const version = await AppVersion.findByPk(id)

  if (!version) {
    return error(res, '版本不存在', 404)
  }

  const allowed = ['version', 'min_required_version', 'force_update', 'update_type', 'download_url', 'changelog', 'app_name']
  const updates = {}
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key]
    }
  }

  if (updates.force_update !== undefined) {
    updates.update_type = updates.force_update ? 'required' : 'recommended'
  }

  await version.update(updates)

  return success(res, version, '版本更新成功')
}

/**
 * PUT /api/v1/admin/app-versions/:id/status
 * 发布/下架版本
 */
async function updateStatus(req, res) {
  const id = parseInt(req.params.id, 10)
  const { status } = req.body

  if (!['draft', 'published', 'archived'].includes(status)) {
    return error(res, '无效的状态值', 400)
  }

  const version = await AppVersion.findByPk(id)
  if (!version) {
    return error(res, '版本不存在', 404)
  }

  const updates = { status }
  if (status === 'published') {
    updates.published_at = new Date()
  }

  await version.update(updates)

  return success(res, { id: version.id, status: version.status }, status === 'published' ? '发布成功' : '下架成功')
}

/**
 * DELETE /api/v1/admin/app-versions/:id
 * 删除版本（软删除）
 */
async function deleteVersion(req, res) {
  const id = parseInt(req.params.id, 10)
  const version = await AppVersion.findByPk(id)

  if (!version) {
    return error(res, '版本不存在', 404)
  }

  if (version.status === 'published') {
    return error(res, '已发布的版本不能删除，请先下架', 400)
  }

  await version.destroy()

  return success(res, null, '版本删除成功')
}

module.exports = {
  checkVersion,
  listVersions,
  getVersion,
  createVersion,
  updateVersion,
  updateStatus,
  deleteVersion,
}
