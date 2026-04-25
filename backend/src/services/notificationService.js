const { Notification } = require('../models')

/**
 * Create an in-app notification for a user.
 */
async function sendNotification(userId, title, content, type, workOrderId, userType = 'tenant') {
  return Notification.create({
    user_id: userId,
    user_type: userType,
    title,
    content,
    type,
    work_order_id: workOrderId,
  })
}

module.exports = { sendNotification }
