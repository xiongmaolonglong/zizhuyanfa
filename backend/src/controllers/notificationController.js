const { Op } = require('sequelize')
const Notification = require('../models/Notification')
const { success, error, paginate } = require('../utils/response')

// ==================== 通知服务（供其他控制器内部调用） ====================

/**
 * 创建通知
 * @param {object} params
 * @param {number} params.user_id - 接收通知的用户ID
 * @param {'tenant'|'client'} params.user_type - 接收通知的用户类型
 * @param {string} params.title - 通知标题
 * @param {string} [params.content] - 通知内容
 * @param {string} [params.type] - 通知类型
 * @param {number} [params.work_order_id] - 关联工单ID
 * @returns {Promise<Notification>}
 */
async function createNotification({ user_id, user_type, title, content, type, work_order_id }) {
  return Notification.create({
    user_id,
    user_type,
    title,
    content,
    type,
    work_order_id,
  })
}

// ==================== 用户通知列表 ====================

/**
 * GET /api/v1/notifications
 * 当前用户的通知列表（支持筛选+分页）
 */
async function listNotifications(req, res) {
  const { type, is_read, page = 1, limit = 20 } = req.query
  const { user_id, user_type } = req.user

  const where = { user_id, user_type }
  if (type) where.type = type
  if (is_read !== undefined && is_read !== '') {
    where.is_read = is_read === '1' || is_read === 'true'
  }

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10)
  const pageSize = Math.min(Math.max(1, parseInt(limit, 10)), 100)

  const { count, rows } = await Notification.findAndCountAll({
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

// ==================== 通知统计 ====================

/**
 * GET /api/v1/notifications/unread-count
 * 当前用户未读通知数量
 */
async function getUnreadCount(req, res) {
  const { user_id, user_type } = req.user

  const count = await Notification.count({
    where: { user_id, user_type, is_read: false },
  })

  return success(res, { unread_count: count })
}

// ==================== 通知详情 ====================

/**
 * GET /api/v1/notifications/:id
 * 通知详情（自动标记已读）
 */
async function getNotification(req, res) {
  const { id } = req.params
  const { user_id, user_type } = req.user

  const notification = await Notification.findOne({
    where: { id: parseInt(id, 10), user_id, user_type },
  })

  if (!notification) {
    return error(res, '通知不存在', 404)
  }

  // 自动标记已读
  if (!notification.is_read) {
    await notification.update({
      is_read: true,
      read_at: new Date(),
    })
  }

  return success(res, notification)
}

// ==================== 标记已读 ====================

/**
 * POST /api/v1/notifications/:id/read
 * 标记单条通知已读
 */
async function markAsRead(req, res) {
  const { id } = req.params
  const { user_id, user_type } = req.user

  const notification = await Notification.findOne({
    where: { id: parseInt(id, 10), user_id, user_type },
  })

  if (!notification) {
    return error(res, '通知不存在', 404)
  }

  if (notification.is_read) {
    return success(res, { message: '已读' })
  }

  await notification.update({
    is_read: true,
    read_at: new Date(),
  })

  return success(res, { message: '标记已读成功' })
}

/**
 * POST /api/v1/notifications/read-all
 * 标记当前用户所有通知为已读
 */
async function markAllAsRead(req, res) {
  const { user_id, user_type } = req.user

  const [affected] = await Notification.update(
    { is_read: true, read_at: new Date() },
    { where: { user_id, user_type, is_read: false } },
  )

  return success(res, { marked_count: affected })
}

module.exports = {
  createNotification,
  listNotifications,
  getUnreadCount,
  getNotification,
  markAsRead,
  markAllAsRead,
}
