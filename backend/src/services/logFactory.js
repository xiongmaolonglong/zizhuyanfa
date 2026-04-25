const WorkOrder = require('../models/WorkOrder')
const { success, error } = require('../utils/response')

/**
 * 创建日志类 CRUD 控制器
 * @param {object} options
 * @param {object} options.Model - Sequelize 模型
 * @param {string} options.modelName - 模型中文名称（用于错误提示）
 * @param {string} options.parentParam - 工单参数名，如 'id' 或 'workOrderId'
 * @param {string} options.logParam - 日志ID参数名，如 'logId'
 * @param {function} options.getCreateData - 从 req.body/params 提取创建数据的函数
 * @param {function} options.getUpdateData - 从 req.body 提取更新数据的函数
 * @param {function} [options.afterCreate] - 创建后回调 (log, req, res)
 * @param {function} [options.afterList] - 查询后回调 (logs, req, res) -> logs
 */
function createLogController(options) {
  const {
    Model,
    modelName,
    parentParam = 'id',
    logParam = 'logId',
    getCreateData,
    getUpdateData,
    afterCreate,
    afterList,
  } = options

  async function getWorkOrder(id) {
    return WorkOrder.findOne({ where: { id: parseInt(id, 10) } })
  }

  async function list(req, res) {
    const parentId = req.params[parentParam]
    const wo = await getWorkOrder(parentId)
    if (!wo) return error(res, '工单不存在', 404)
    if (wo.tenant_id !== req.tenantId) return error(res, '无权操作此工单', 403)

    let logs = await Model.findAll({
      where: { work_order_id: wo.id },
      order: [['created_at', 'DESC']],
    })

    if (afterList) logs = await afterList(logs, req, res)
    return success(res, logs)
  }

  async function create(req, res) {
    const parentId = req.params[parentParam]
    const wo = await getWorkOrder(parentId)
    if (!wo) return error(res, '工单不存在', 404)
    if (wo.tenant_id !== req.tenantId) return error(res, '无权操作此工单', 403)

    const createData = getCreateData(req)
    if (createData instanceof Error) return error(res, createData.message, 400)

    const log = await Model.create({
      ...createData,
      work_order_id: wo.id,
      created_by: req.user.user_id,
    })

    if (afterCreate) await afterCreate(log, req, res)
    return success(res, log, `${modelName}已添加`, 201)
  }

  async function update(req, res) {
    const logId = req.params[logParam]
    const log = await Model.findByPk(logId)
    if (!log) return error(res, `${modelName}不存在`, 404)

    const wo = await getWorkOrder(log.work_order_id)
    if (!wo) return error(res, '工单不存在', 404)
    if (wo.tenant_id !== req.tenantId) return error(res, '无权操作此工单', 403)

    const updateData = getUpdateData(req)
    await log.update(updateData)
    return success(res, log, '更新成功')
  }

  async function remove(req, res) {
    const logId = req.params[logParam]
    const log = await Model.findByPk(logId)
    if (!log) return error(res, `${modelName}不存在`, 404)

    const wo = await getWorkOrder(log.work_order_id)
    if (!wo) return error(res, '工单不存在', 404)
    if (wo.tenant_id !== req.tenantId) return error(res, '无权操作此工单', 403)

    await log.destroy()
    return success(res, null, '删除成功')
  }

  return { list, create, update, remove }
}

module.exports = { createLogController }
