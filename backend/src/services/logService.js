const { WorkOrderLog } = require('../models')

/**
 * Create a work order log entry.
 * Supports two calling patterns:
 * 1. createLog(workOrderId, userObj, action, stage, detail, options)
 *    - userObj: { user_id, user_type, _ip }
 *    - options: { log_type, field_name, old_value, new_value, amount_change }
 * 2. createLog(workOrderId, userId, action, stage, detail, ip)
 *    - userId: number (defaults user_type to 'tenant')
 */
async function createLog(workOrderId, userOrId, action, stage, detail, extra = {}) {
  if (typeof userOrId === 'number' || typeof userOrId === 'string') {
    // Pattern 2: (workOrderId, userId, action, stage, detail, ip)
    return WorkOrderLog.create({
      work_order_id: workOrderId,
      user_id: userOrId,
      user_type: 'tenant',
      action,
      stage,
      detail: detail || null,
      ip_address: extra || null,
    })
  }

  // Pattern 1: (workOrderId, user, action, stage, detail, options)
  return WorkOrderLog.create({
    work_order_id: workOrderId,
    user_id: userOrId.user_id,
    user_type: userOrId.user_type,
    action,
    stage,
    detail,
    ip_address: userOrId._ip || null,
    log_type: extra.log_type || null,
    field_name: extra.field_name || null,
    old_value: extra.old_value || null,
    new_value: extra.new_value || null,
    amount_change: extra.amount_change || null,
  })
}

module.exports = { createLog }
