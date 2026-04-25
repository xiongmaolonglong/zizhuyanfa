const { success, error, paginate } = require('../utils/response')
const sseBroker = require('../services/sseBroker')
const sequelize = require('../config/database')
const Sequelize = require('sequelize')
const {
  WoDeclaration,
  WoApproval,
  WorkOrder,
  WorkOrderLog,
  Notification,
  ClientUser,
  Client,
  TenantUser,
  FormConfig,
} = require('../models')
const { generateWorkOrderNo } = require('../services/workOrderNoService')
const wechatService = require('../services/wechatService')

/**
 * POST /api/v1/declarations
 * 甲方创建申报（自动创建工单）
 */
async function createDeclaration(req, res) {
  const {
    title, project_type, project_category, description, activity_name,
    province_code, city_code, district_code, street_code, detail_address, address,
    contact_name, contact_phone, photos, attachments,
    approver_id,
  } = req.body

  // 提取动态自定义字段（不在标准字段列表中的都算自定义字段）
  const standardKeys = ['title', 'project_type', 'project_category', 'description', 'activity_name',
    'province_code', 'city_code', 'district_code', 'street_code', 'detail_address', 'address',
    'contact_name', 'contact_phone', 'photos', 'attachments', 'approver_id', 'client_id']
  const customData = {}
  for (const [key, val] of Object.entries(req.body)) {
    if (!standardKeys.includes(key) && val !== undefined && val !== null && val !== '') {
      customData[key] = val
    }
  }

  // 兼容 address 字段（对象 {full_address, province, city, district} 或字符串）
  const resolvedAddress = address || {}
  const effectiveDetailAddress = (typeof resolvedAddress === 'object' ? resolvedAddress.full_address || resolvedAddress.title : resolvedAddress) || detail_address
  const effectiveProvince = typeof resolvedAddress === 'object' ? (resolvedAddress.province || province_code) : province_code
  const effectiveCity = typeof resolvedAddress === 'object' ? (resolvedAddress.city || city_code) : city_code
  const effectiveDistrict = typeof resolvedAddress === 'object' ? (resolvedAddress.district || district_code) : district_code

  // title 可以从前端传入，或者用 project_type + 描述生成
  const effectiveTitle = title || project_type || description || '申报工单'

  const t = await sequelize.transaction()

  try {
    const userId = req.user.user_id
    const clientId = req.user.client_id

    // 获取当前用户的 client 信息以确定 tenant
    const currentUser = await ClientUser.findByPk(userId, {
      include: [{ model: Client, attributes: ['id', 'tenant_id', 'approval_enabled'], paranoid: false }],
      transaction: t,
    })
    if (!currentUser) {
      await t.rollback()
      return error(res, '用户不存在', 404)
    }
    const tenantId = currentUser.Client?.tenant_id || currentUser.client?.tenant_id
    const clientApprovalEnabled = currentUser.Client?.approval_enabled || currentUser.client?.approval_enabled

    // 校验 project_type 必须在配置范围内
    if (project_type) {
      const ptConfig = await FormConfig.findOne({
        where: { tenant_id: tenantId, form_type: 'work_order_create', field_key: 'project_type' },
      })
      if (ptConfig && ptConfig.options) {
        const opts = typeof ptConfig.options === 'string' ? JSON.parse(ptConfig.options) : ptConfig.options
        const allowedValues = (opts || []).map(o => o.value)
        if (!allowedValues.includes(project_type)) {
          await t.rollback()
          return error(res, `无效的项目类型: ${project_type}`, 400)
        }
      }
    }

    // 获取审批人（如果前端没传 approver_id，则找该甲方的 manager）
    let resolvedApproverId = approver_id
    if (!resolvedApproverId && clientApprovalEnabled) {
      const manager = await ClientUser.findOne({
        where: { client_id: clientId, role: 'manager', status: 'active' },
        transaction: t,
      })
      resolvedApproverId = manager?.id
    }

    // 如果启用了审批但找不到审批人，自动关闭审批流
    let effectiveApprovalEnabled = clientApprovalEnabled && !!resolvedApproverId

    // Generate work order number
    const { work_order_no } = await generateWorkOrderNo(tenantId)

    // Create work order（包含动态自定义字段）
    const woPayload = {
      work_order_no,
      tenant_id: tenantId,
      client_id: clientId,
      client_user_id: userId,
      title: effectiveTitle,
      activity_name,
      project_category,
      description,
      current_stage: effectiveApprovalEnabled ? 'declaration' : 'assignment',
      status: 'submitted',
    }
    if (Object.keys(customData).length > 0) {
      woPayload.custom_data = customData
    }
    const wo = await WorkOrder.create(woPayload, { transaction: t })

    // Create declaration
    const declaration = await WoDeclaration.create({
      work_order_id: wo.id,
      project_type,
      province_code: effectiveProvince,
      city_code: effectiveCity,
      district_code: effectiveDistrict,
      street_code,
      detail_address: effectiveDetailAddress,
      address: effectiveDetailAddress,
      contact_name,
      contact_phone,
      photos: photos || [],
      attachments: attachments || [],
      created_by: userId,
    }, { transaction: t })

    // Handle approval flow
    if (effectiveApprovalEnabled && resolvedApproverId) {
      await WoApproval.create({
        work_order_id: wo.id,
        approver_id: resolvedApproverId,
        status: 'pending',
      }, { transaction: t })

      await wo.update({
        current_stage: 'approval',
      }, { transaction: t })

      // Notify approver
      const approver = await ClientUser.findByPk(resolvedApproverId, { transaction: t })
      if (approver) {
        await Notification.create({
          user_id: resolvedApproverId,
          user_type: 'client',
          title: '新的申报待审批',
          content: `您有一条新的申报需要审批：${title}`,
          type: 'approval_request',
          work_order_id: wo.id,
        }, { transaction: t })
      }
    } else {
      // No approval needed, flow directly to assignment
      await wo.update({
        current_stage: 'assignment',
      }, { transaction: t })
    }

    // Log action
    await WorkOrderLog.create({
      work_order_id: wo.id,
      user_id: userId,
      user_type: 'client',
      action: 'declaration_created',
      stage: 'declaration',
      detail: `申报已创建：${title}${project_type ? `（${project_type}）` : ''}`,
      ip_address: req.ip,
    }, { transaction: t })

    await t.commit()

    // SSE: notify tenant of new declaration
    sseBroker.emitToTenant(String(tenantId), 'declaration:new', {
      declaration_id: declaration.id,
      work_order_id: wo.id,
      work_order_no: wo.work_order_no,
    })

    return success(res, {
      id: declaration.id,
      work_order_no: wo.work_order_no,
      approval_enabled: clientApprovalEnabled,
    }, '申报已创建', 201)
  } catch (err) {
    if (!t.finished) await t.rollback()
    return error(res, err.message || '创建申报失败', 500)
  }
}

/**
 * GET /api/v1/declarations
 * 甲方申报列表
 */
async function getDeclarations(req, res) {
  try {
    const { status, stage, page = 1, limit = 10 } = req.query
    const pageNum = parseInt(page, 10) || 1
    const limitNum = parseInt(limit, 10) || 10
    const offset = (pageNum - 1) * limitNum

    const where = { '$work_order.client_user_id$': req.user.user_id }
    if (status) where['$work_order.status$'] = status
    if (stage) where['$work_order.current_stage$'] = stage

    const { count, rows } = await WoDeclaration.findAndCountAll({
      where,
      include: [
        {
          model: WorkOrder,
          as: 'work_order',
          attributes: ['id', 'work_order_no', 'title', 'activity_name', 'status', 'current_stage', 'created_at'],
          include: [
            { model: WoApproval, as: 'approval', attributes: ['id', 'status', 'comment', 'approved_at'], required: false },
          ],
        },
        { model: ClientUser, as: 'creator', attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset,
      subQuery: false,
      distinct: true,
    })

    return paginate(res, rows, {
      total: count,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(count / limitNum),
    })
  } catch (err) {
    console.error('getDeclarations error:', err)
    return error(res, '获取申报列表失败', 500)
  }
}

/**
 * GET /api/v1/declarations/my-pending-approvals
 * 我的审批记录（待审批/已审批/已驳回）
 */
async function getMyApprovals(req, res) {
  try {
    const { tab = 'pending', page = 1, limit = 10 } = req.query
    const pageNum = parseInt(page, 10) || 1
    const limitNum = parseInt(limit, 10) || 10
    const offset = (pageNum - 1) * limitNum

    const approvalStatus = { pending: 'pending', approved: 'approved', rejected: 'rejected' }
    const status = approvalStatus[tab] || 'pending'

    const { count, rows } = await WoDeclaration.findAndCountAll({
      where: { '$work_order->approval.approver_id$': req.user.user_id, '$work_order->approval.status$': status },
      include: [
        {
          model: WorkOrder,
          as: 'work_order',
          attributes: ['id', 'work_order_no', 'title', 'current_stage', 'created_at'],
          include: [
            { model: WoApproval, as: 'approval', attributes: ['id', 'status', 'comment', 'approved_at'], required: true },
          ],
        },
        { model: ClientUser, as: 'creator', attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset,
      subQuery: false,
      distinct: true,
    })

    return paginate(res, rows, {
      total: count,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(count / limitNum),
    })
  } catch (err) {
    console.error('getMyApprovals error:', err)
    return error(res, '获取审批列表失败', 500)
  }
}

/**
 * GET /api/v1/declarations/:id
 * 申报详情
 */
async function getDeclarationById(req, res) {
  try {
    const declaration = await WoDeclaration.findByPk(req.params.id, {
      include: [
        {
          model: WorkOrder,
          as: 'work_order',
          attributes: ['id', 'work_order_no', 'status', 'current_stage', 'created_at'],
          include: [
            { model: WoApproval, as: 'approval', attributes: ['id', 'status', 'comment', 'approved_at'], required: false },
          ],
        },
        { model: ClientUser, as: 'creator', attributes: ['id', 'name'] },
      ],
    })

    if (!declaration) {
      return error(res, '申报不存在', 404)
    }

    return success(res, declaration)
  } catch (err) {
    return error(res, '获取申报详情失败', 500)
  }
}

/**
 * GET /api/v1/tenant/declarations
 * 广告商查看收到的申报
 */
async function getTenantDeclarations(req, res) {
  try {
    const { status, stage, keyword, project_type, page = 1, limit = 10 } = req.query
    const pageNum = parseInt(page, 10) || 1
    const limitNum = parseInt(limit, 10) || 10
    const offset = (pageNum - 1) * limitNum

    const where = { '$work_order.client.tenant_id$': req.user.tenant_id, created_by: { [Sequelize.Op.ne]: null }, received_at: null }
    if (status) where['$work_order.status$'] = status
    if (project_type) where.project_type = project_type
    // 显示未被接收的申报（declaration/approval/assignment 阶段，received_at 为空表示未被广告商接收）
    where['$work_order.current_stage$'] = { [Sequelize.Op.in]: ['declaration', 'approval', 'assignment'] }

    // 关键词搜索：工单号、项目名、甲方名称
    if (keyword) {
      const kw = `%${keyword}%`
      where[Sequelize.Op.or] = [
        { '$work_order.work_order_no$': { [Sequelize.Op.like]: kw } },
        { '$work_order.title$': { [Sequelize.Op.like]: kw } },
        { '$work_order.client.name$': { [Sequelize.Op.like]: kw } },
      ]
    }

    const { count, rows } = await WoDeclaration.findAndCountAll({
      where,
      include: [
        {
          model: WorkOrder,
          as: 'work_order',
          where: { tenant_id: req.user.tenant_id },
          attributes: ['id', 'work_order_no', 'title', 'status', 'current_stage', 'created_at'],
          include: [
            { model: Client, as: 'client', attributes: ['id', 'name'] },
            { model: WoApproval, as: 'approval', attributes: ['id', 'status'], required: false },
          ],
        },
        { model: ClientUser, as: 'creator', attributes: ['id', 'name'] },
      ],
      attributes: ['id', 'project_type', 'created_by', 'created_at', 'received_at'],
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset,
      subQuery: false,
      distinct: true,
    })

    // 将申报时间映射到 work_order 上方便前端使用
    const mappedRows = rows.map(r => {
      const data = r.toJSON()
      data.submitted_at = data.created_at
      return data
    })

    return paginate(res, mappedRows, {
      total: count,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(count / limitNum),
    })
  } catch (err) {
    return error(res, '获取申报列表失败', 500)
  }
}

/**
 * GET /api/v1/tenant/declarations/:id
 * 广告商查看申报详情
 * 支持：申报 ID 或工单 ID（当传工单 ID 时，自动查找关联的申报）
 */
async function getTenantDeclarationById(req, res) {
  try {
    const id = req.params.id

    // 先尝试按申报 ID 查找
    let declaration = await WoDeclaration.findOne({
      where: { id },
      include: [
        {
          model: WorkOrder,
          as: 'work_order',
          where: { tenant_id: req.user.tenant_id },
          attributes: ['id', 'work_order_no', 'title', 'description', 'status', 'current_stage', 'created_at'],
          include: [
            { model: Client, as: 'client', attributes: ['id', 'name', 'contact_name', 'contact_phone'] },
            { model: WoApproval, as: 'approval', attributes: ['id', 'status', 'comment', 'approved_at'], required: false },
          ],
        },
        { model: ClientUser, as: 'creator', attributes: ['id', 'name'] },
      ],
    })

    // 如果按申报 ID 找不到，尝试按工单 ID 查找
    if (!declaration) {
      declaration = await WoDeclaration.findOne({
        where: { work_order_id: id },
        include: [
          {
            model: WorkOrder,
            as: 'work_order',
            where: { tenant_id: req.user.tenant_id },
            attributes: ['id', 'work_order_no', 'title', 'description', 'status', 'current_stage', 'created_at'],
            include: [
              { model: Client, as: 'client', attributes: ['id', 'name', 'contact_name', 'contact_phone'] },
              { model: WoApproval, as: 'approval', attributes: ['id', 'status', 'comment', 'approved_at'], required: false },
            ],
          },
          { model: ClientUser, as: 'creator', attributes: ['id', 'name'] },
        ],
      })
    }

    if (!declaration) {
      return error(res, '申报不存在或无权访问', 404)
    }

    return success(res, declaration)
  } catch (err) {
    return error(res, '获取申报详情失败', 500)
  }
}

/**
 * POST /api/v1/declarations/:id/approve
 * 审批通过
 */
async function approveDeclaration(req, res) {
  const t = await sequelize.transaction()

  try {
    const userId = req.user.user_id
    const declarationId = req.params.id
    const { comment } = req.body

    // Find pending approval for this declaration's work order
    const declaration = await WoDeclaration.findOne({
      where: { id: declarationId },
      include: [{ model: WorkOrder, as: 'work_order', attributes: ['id', 'work_order_no', 'title', 'tenant_id', 'current_stage', 'status'] }],
      transaction: t,
    })

    if (!declaration) {
      await t.rollback()
      return error(res, '申报不存在', 404)
    }

    const approval = await WoApproval.findOne({
      where: { work_order_id: declaration.work_order_id, status: 'pending' },
      transaction: t,
    })

    if (!approval) {
      await t.rollback()
      return error(res, '该申报没有待审批记录', 400)
    }

    if (approval.approver_id !== userId) {
      await t.rollback()
      return error(res, '您不是此申报的审批人', 403)
    }

    // Update approval
    await approval.update({
      status: 'approved',
      comment,
      approved_at: Sequelize.fn('NOW'),
    }, { transaction: t })

    // 审批通过后保持在 approval 阶段，等广告商接收后再流转到 assignment
    // Update work order status only
    await declaration.work_order.update({
      status: 'approved',
    }, { transaction: t })

    // Log
    await WorkOrderLog.create({
      work_order_id: declaration.work_order_id,
      user_id: userId,
      user_type: 'client',
      action: 'declaration_approved',
      stage: 'approval',
      detail: comment ? `审批通过：${comment}` : '审批通过',
      ip_address: req.ip,
    }, { transaction: t })

    // Notify tenant users of this client's work order
    const tenantUsers = await TenantUser.findAll({
      where: { tenant_id: declaration.work_order.tenant_id },
      attributes: ['id'],
      transaction: t,
    })

    for (const tu of tenantUsers) {
      await Notification.create({
        user_id: tu.id,
        user_type: 'tenant',
        title: '新工单待处理',
        content: `申报已通过审批，工单已流转到您处：${declaration.work_order.work_order_no}`,
        type: 'work_order_assigned',
        work_order_id: declaration.work_order_id,
      }, { transaction: t })

      // 发送微信订阅消息
      if (tu.wechat_openid) {
        try {
          await wechatService.notifyWorkOrderChange(
            tu.wechat_openid,
            declaration.work_order.toJSON(),
            'assigned',
          )
        } catch (wechatErr) {
          console.error('[WeChat] 发送订阅消息失败:', wechatErr.message)
        }
      }
    }

    await t.commit()

    // SSE: notify tenant that declaration was approved
    sseBroker.emitToTenant(String(declaration.work_order.tenant_id), 'declaration:approved', {
      declaration_id: declaration.id,
      work_order_id: declaration.work_order_id,
      work_order_no: declaration.work_order.work_order_no,
    })

    return success(res, { message: '审批通过，工单已流转到广告商' })
  } catch (err) {
    if (!t.finished) await t.rollback()
    return error(res, err.message || '审批操作失败', 500)
  }
}

/**
 * POST /api/v1/declarations/:id/reject
 * 审批驳回
 */
async function rejectDeclaration(req, res) {
  const t = await sequelize.transaction()

  try {
    const userId = req.user.user_id
    const declarationId = req.params.id
    const { comment } = req.body

    const declaration = await WoDeclaration.findOne({
      where: { id: declarationId },
      include: [{ model: WorkOrder, as: 'work_order', attributes: ['id', 'work_order_no', 'title', 'client_user_id', 'tenant_id'] }],
      transaction: t,
    })

    if (!declaration) {
      await t.rollback()
      return error(res, '申报不存在', 404)
    }

    const approval = await WoApproval.findOne({
      where: { work_order_id: declaration.work_order_id, status: 'pending' },
      transaction: t,
    })

    if (!approval) {
      await t.rollback()
      return error(res, '该申报没有待审批记录', 400)
    }

    if (approval.approver_id !== userId) {
      await t.rollback()
      return error(res, '您不是此申报的审批人', 403)
    }

    // Update approval
    await approval.update({
      status: 'rejected',
      comment,
      approved_at: Sequelize.fn('NOW'),
    }, { transaction: t })

    // Update work order
    await declaration.work_order.update({
      status: 'rejected',
    }, { transaction: t })

    // Log
    await WorkOrderLog.create({
      work_order_id: declaration.work_order_id,
      user_id: userId,
      user_type: 'client',
      action: 'declaration_rejected',
      stage: 'approval',
      detail: comment ? `审批驳回：${comment}` : '审批驳回',
      ip_address: req.ip,
    }, { transaction: t })

    // Notify the submitter (client user who created the work order)
    const submitter = await ClientUser.findByPk(declaration.work_order.client_user_id, { transaction: t })
    await Notification.create({
      user_id: declaration.work_order.client_user_id,
      user_type: 'client',
      title: '申报被驳回',
      content: `您的申报 "${declaration.work_order.work_order_no}" 已被驳回。${comment ? `原因：${comment}` : ''}`,
      type: 'declaration_rejected',
      work_order_id: declaration.work_order_id,
    }, { transaction: t })

    // 发送微信订阅消息
    if (submitter && submitter.wechat_openid) {
      try {
        await wechatService.sendSubscriptionMessage(
          submitter.wechat_openid,
          process.env.WECHAT_TEMPLATE_REJECTED || '',
          {
            thing1: { value: declaration.work_order.work_order_no || '' },
            thing2: { value: declaration.work_order.title || '' },
            phrase3: { value: '已驳回' },
            thing4: { value: comment || '请修改后重新提交' },
            date5: { value: new Date().toLocaleDateString('zh-CN') },
          },
          '/pages/declare-detail/declare-detail',
        )
      } catch (wechatErr) {
        console.error('[WeChat] 发送订阅消息失败:', wechatErr.message)
      }
    }

    await t.commit()

    // SSE: notify tenant of declaration rejection
    sseBroker.emitToTenant(String(declaration.work_order.tenant_id), 'declaration:rejected', {
      declaration_id: declaration.id,
      work_order_id: declaration.work_order_id,
      work_order_no: declaration.work_order.work_order_no,
    })

    return success(res, { message: '已驳回申报' })
  } catch (err) {
    if (!t.finished) await t.rollback()
    return error(res, err.message || '审批操作失败', 500)
  }
}

/**
 * POST /api/v1/tenant/declarations/:id/receive
 * 广告商接收申报，流转到派单环节
 */
async function receiveDeclaration(req, res) {
  try {
    const declaration = await WoDeclaration.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: WorkOrder,
          as: 'work_order',
          where: { tenant_id: req.user.tenant_id },
          attributes: ['id', 'work_order_no', 'title'],
        },
      ],
    })

    if (!declaration) {
      return error(res, '申报不存在或无权访问', 404)
    }

    if (declaration.received_at) {
      return error(res, '该申报已被接收', 400)
    }

    const wo = declaration.work_order
    // 允许接收: 已通过审批的，或无需审批的 (status='submitted' 且 current_stage='assignment')
    // 不允许接收: 审批尚未通过且尚在审批中的
    if (wo.current_stage === 'approval' && wo.status !== 'approved') {
      return error(res, '该申报尚在甲方审批中，无法接收', 400)
    }

    // 标记已接收，流转到 assignment 阶段进入工单管理
    declaration.received_at = new Date()
    await declaration.save()

    await wo.update({ current_stage: 'assignment', status: 'submitted' })

    await WorkOrderLog.create({
      work_order_id: wo.id,
      user_id: req.user.user_id,
      user_type: 'tenant',
      action: 'declaration_received',
      stage: 'assignment',
      detail: '广告商已接收工单，待派单',
      ip_address: req.ip,
    })

    // SSE: notify that declaration was received
    sseBroker.emitToTenant(String(req.user.tenant_id), 'declaration:received', {
      declaration_id: declaration.id,
      work_order_id: wo.id,
      work_order_no: wo.work_order_no,
    })

    return success(res, { work_order_no: wo.work_order_no }, '已接收申报')
  } catch (err) {
    console.error('receiveDeclaration error:', err)
    return error(res, err.message || '接收申报失败', 500)
  }
}

/**
 * POST /api/v1/tenant/declarations/:id/reject
 * 广告商驳回申报，退回给甲方
 */
async function rejectTenantDeclaration(req, res) {
  const t = await sequelize.transaction()
  try {
    const { comment } = req.body

    const declaration = await WoDeclaration.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: WorkOrder,
          as: 'work_order',
          where: { tenant_id: req.user.tenant_id },
          attributes: ['id', 'work_order_no', 'title', 'client_user_id', 'current_stage'],
        },
      ],
      transaction: t,
    })

    if (!declaration) {
      await t.rollback()
      return error(res, '申报不存在或无权访问', 404)
    }

    if (declaration.received_at) {
      await t.rollback()
      return error(res, '该申报已被接收，无法驳回', 400)
    }

    // 更新工单状态为已驳回
    await declaration.work_order.update({
      status: 'rejected',
    }, { transaction: t })

    // 记录操作日志
    await WorkOrderLog.create({
      work_order_id: declaration.work_order_id,
      user_id: req.user.user_id,
      user_type: 'tenant',
      action: 'declaration_rejected_by_tenant',
      stage: 'declaration',
      detail: comment ? `广告商驳回申报：${comment}` : '广告商驳回申报',
      ip_address: req.ip,
    }, { transaction: t })

    // 通知提交人
    await Notification.create({
      user_id: declaration.work_order.client_user_id,
      user_type: 'client',
      title: '申报被驳回',
      content: `您的申报 "${declaration.work_order.work_order_no}" 已被广告商驳回。${comment ? `原因：${comment}` : ''}`,
      type: 'declaration_rejected',
      work_order_id: declaration.work_order_id,
    }, { transaction: t })

    await t.commit()

    // SSE: notify that declaration was rejected by tenant
    sseBroker.emitToTenant(String(req.user.tenant_id), 'declaration:rejected', {
      declaration_id: declaration.id,
      work_order_id: declaration.work_order_id,
      work_order_no: declaration.work_order.work_order_no,
    })

    return success(res, { work_order_no: declaration.work_order.work_order_no }, '已驳回申报')
  } catch (err) {
    if (!t.finished) await t.rollback()
    console.error('rejectTenantDeclaration error:', err)
    return error(res, err.message || '驳回申报失败', 500)
  }
}

/**
 * PUT /api/v1/declarations/:id
 * 编辑申报（仅草稿/审批中/已驳回状态可编辑）
 */
async function updateDeclaration(req, res) {
  const { title, activity_name, project_type, description } = req.body
  const userId = req.user.user_id

  const declaration = await WoDeclaration.findOne({
    where: { id: req.params.id },
    include: [
      { model: WorkOrder, as: 'work_order', attributes: ['id', 'tenant_id', 'status', 'current_stage', 'client_user_id', 'title', 'activity_name', 'description'] },
    ],
  })

  if (!declaration) return error(res, '申报不存在', 404)

  const wo = declaration.work_order
  if (wo.client_user_id !== userId) return error(res, '无权修改此申报', 403)

  const allowed = ['draft', 'pending_approval', 'rejected']
  if (!allowed.includes(wo.status)) return error(res, '当前状态不允许修改', 400)

  // 校验 project_type 必须在配置范围内
  if (project_type) {
    const ptConfig = await FormConfig.findOne({
      where: { tenant_id: wo.tenant_id, form_type: 'work_order_create', field_key: 'project_type' },
    })
    if (ptConfig && ptConfig.options) {
      const opts = typeof ptConfig.options === 'string' ? JSON.parse(ptConfig.options) : ptConfig.options
      const allowedValues = (opts || []).map(t => t.value)
      if (!allowedValues.includes(project_type)) {
        return error(res, `无效的项目类型: ${project_type}`, 400)
      }
    }
  }

  const woUpdate = {}
  if (title !== undefined) woUpdate.title = title
  if (activity_name !== undefined) woUpdate.activity_name = activity_name
  if (description !== undefined) woUpdate.description = description
  if (Object.keys(woUpdate).length > 0) await wo.update(woUpdate)

  const decUpdate = {}
  if (project_type !== undefined) decUpdate.project_type = project_type
  if (Object.keys(decUpdate).length > 0) await declaration.update(decUpdate)

  await WorkOrderLog.create({
    work_order_id: wo.id, user_id: userId, user_type: 'client',
    action: 'declaration_updated', stage: wo.current_stage,
    detail: '申报已修改', ip_address: req.ip,
  })

  return success(res, {}, '修改成功')
}

/**
 * DELETE /api/v1/declarations/:id
 * 删除申报（软删除）
 */
async function deleteDeclaration(req, res) {
  const userId = req.user.user_id

  const declaration = await WoDeclaration.findOne({
    where: { id: req.params.id },
    include: [
      { model: WorkOrder, as: 'work_order', attributes: ['id', 'status', 'current_stage', 'client_user_id'] },
    ],
  })

  if (!declaration) return error(res, '申报不存在', 404)

  const wo = declaration.work_order
  if (wo.client_user_id !== userId) return error(res, '无权删除此申报', 403)

  // 已流转到派单及以后的环节不可删除
  const lockedStages = ['assignment', 'measurement', 'design', 'production', 'construction', 'finance', 'archive', 'aftersale']
  if (lockedStages.includes(wo.current_stage)) return error(res, '已进入派单/生产环节，无法删除', 400)

  await declaration.destroy()
  await wo.destroy()

  return success(res, {}, '已删除')
}

module.exports = {
  createDeclaration,
  getDeclarations,
  getMyApprovals,
  getDeclarationById,
  getTenantDeclarations,
  getTenantDeclarationById,
  approveDeclaration,
  rejectDeclaration,
  receiveDeclaration,
  rejectTenantDeclaration,
  updateDeclaration,
  deleteDeclaration,
}
