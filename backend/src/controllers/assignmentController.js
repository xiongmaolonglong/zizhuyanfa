const { Op, fn, col } = require('sequelize')
const sequelize = require('../config/database')
const WoAssignment = require('../models/WoAssignment')
const WoDeclaration = require('../models/WoDeclaration')
const WoMeasurement = require('../models/WoMeasurement')
const WorkOrder = require('../models/WorkOrder')
const WorkOrderLog = require('../models/WorkOrderLog')
const Tenant = require('../models/Tenant')
const Notification = require('../models/Notification')
const TenantUser = require('../models/TenantUser')
const { success, error, paginate } = require('../utils/response')
const { buildTenantFilter } = require('../middleware/tenant')

/**
 * 确保工单属于当前租户
 */
function ensureWorkOrderOwnership(req, workOrderId) {
  const where = { id: workOrderId }
  buildTenantFilter(WorkOrder, where)(req)
  return where
}

// ==================== 辅助函数 ====================

/**
 * 记录工单日志
 */
async function createLog(workOrderId, userId, action, stage, detail, ip) {
  return WorkOrderLog.create({
    work_order_id: workOrderId,
    user_id: userId,
    user_type: 'tenant',
    action,
    stage,
    detail: detail || null,
    ip_address: ip || null,
  })
}

/**
 * 发送通知
 */
async function sendNotification(userId, title, content, type, workOrderId) {
  return Notification.create({
    user_id: userId,
    user_type: 'tenant',
    title,
    content,
    type,
    work_order_id: workOrderId,
  })
}

// ==================== 派单管理 ====================

/**
 * GET /api/v1/assignments - 待派单列表
 */
async function listAssignments(req, res) {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const where = {}

    buildTenantFilter(WorkOrder, where)(req)
    if (status) where['$assignment.status$'] = status

    const { count, rows } = await WorkOrder.findAndCountAll({
      where,
      include: [
        {
          model: WoAssignment,
          as: 'assignment',
          include: [
            { model: TenantUser, as: 'assigner', attributes: ['id', 'name', 'phone'] },
            { model: TenantUser, as: 'assignee', attributes: ['id', 'name', 'phone'] },
          ],
        },
        { model: TenantUser, as: 'assignee', attributes: ['id', 'name', 'phone'] },
      ],
      limit: parseInt(limit),
      offset,
      order: [['id', 'DESC']],
      subQuery: false,
    })

    return paginate(res, rows, {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
    })
  } catch (err) {
    console.error('listAssignments error:', err)
    return error(res, '获取派单列表失败')
  }
}

/**
 * POST /api/v1/assignments - 创建派单
 */
async function createAssignment(req, res) {
  try {
    const { work_order_id, assigned_to, deadline, notes } = req.body

    if (!work_order_id) return error(res, '工单ID不能为空', 400)
    if (!assigned_to) return error(res, '被派单人员不能为空', 400)

    // 验证工单存在且属于当前租户
    const where = ensureWorkOrderOwnership(req, work_order_id)
    const workOrder = await WorkOrder.findOne({ where })
    if (!workOrder) return error(res, '工单不存在或无权操作', 404)

    // 验证被派单的测量员存在
    const measurer = await TenantUser.findByPk(assigned_to)
    if (!measurer) return error(res, '被派单人员不存在', 404)

    // 0. 清理已软删除的旧派单记录（避免 unique 约束冲突）
    await WoAssignment.destroy({
      where: { work_order_id },
      force: true,
    })

    // 1. 创建派单记录
    const assignment = await WoAssignment.create({
      work_order_id,
      assigned_by: req.user.user_id,
      assigned_to,
      status: 'assigned',
      deadline: deadline || null,
      notes: notes || null,
    })

    // 2. 更新工单状态
    await workOrder.update({
      current_stage: 'measurement',
      status: 'assigned',
      assigned_tenant_user_id: assigned_to,
    })

    // 3. 记录日志
    await createLog(
      work_order_id,
      req.user.user_id,
      'create_assignment',
      'assignment',
      `派单给 ${measurer.name}，截止日期: ${deadline || '未设置'}`,
      req.ip
    )

    // 4. 发送通知给被派单的测量员
    await sendNotification(
      assigned_to,
      '新派单通知',
      `您有新的测量任务：${workOrder.title}，工单号：${workOrder.work_order_no}`,
      'assignment',
      work_order_id
    )

    return success(res, assignment, '派单成功', 201)
  } catch (err) {
    console.error('createAssignment error:', err)
    const msg = err.errors?.map(e => e.message).join('；') || err.message || '派单失败'
    return error(res, msg, 500)
  }
}

/**
 * GET /api/v1/assignments/:id - 派单详情
 */
async function getAssignment(req, res) {
  try {
    const assignment = await WoAssignment.findByPk(req.params.id, {
      include: [
        {
          model: WorkOrder,
          as: 'workOrder',
          include: [
            { model: TenantUser, as: 'assignee', attributes: ['id', 'name', 'phone'] },
          ],
        },
        { model: TenantUser, as: 'assigner', attributes: ['id', 'name', 'phone'] },
        { model: TenantUser, as: 'assignee', attributes: ['id', 'name', 'phone', 'role'] },
      ],
    })

    if (!assignment) return error(res, '派单记录不存在', 404)

    return success(res, assignment)
  } catch (err) {
    console.error('getAssignment error:', err)
    return error(res, '获取派单详情失败')
  }
}

/**
 * PUT /api/v1/assignments/:id/receive - 测量员确认接收
 */
async function receiveAssignment(req, res) {
  try {
    const assignment = await WoAssignment.findByPk(req.params.id, {
      include: [{ model: WorkOrder, as: 'workOrder' }],
    })

    if (!assignment) return error(res, '派单记录不存在', 404)
    if (assignment.assigned_to !== req.user.user_id) {
      return error(res, '无权操作此派单', 403)
    }

    await assignment.update({ status: 'received' })

    // 更新工单状态
    if (assignment.workOrder) {
      await assignment.workOrder.update({
        current_stage: 'measurement',
        status: 'measuring',
      })
    }

    // 记录日志
    await createLog(
      assignment.work_order_id,
      req.user.user_id,
      'receive_assignment',
      'measurement',
      '测量员已确认接收派单',
      req.ip
    )

    return success(res, assignment, '已确认接收')
  } catch (err) {
    console.error('receiveAssignment error:', err)
    return error(res, '确认接收失败')
  }
}

// ==================== 测量任务 ====================

/**
 * GET /api/v1/measurements/tasks - 测量员任务列表
 * 管理员（role=admin/super_admin）可查看所有工单
 */
async function listMeasurementTasks(req, res) {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin'

    // 管理员看所有，测量员只看自己的
    const where = {
      current_stage: 'measurement',
    }

    if (!isAdmin) {
      where.assigned_tenant_user_id = req.user.user_id
    }

    if (status) where.status = status

    const { count, rows } = await WorkOrder.findAndCountAll({
      where,
      include: [
        { model: WoAssignment, as: 'assignment' },
        { model: WoMeasurement, as: 'measurements' },
        { model: WoDeclaration, as: 'declaration', attributes: ['full_address', 'project_type', 'contact_name', 'contact_phone', 'photos'], required: false },
      ],
      limit: parseInt(limit),
      offset,
      order: [['id', 'DESC']],
    })

    // 扁平化数据供 APP 使用
    const tasks = rows.map(row => {
      const obj = row.toJSON()
      obj.address = obj.declaration?.full_address || obj.custom_data?.address || ''
      obj.project_type = obj.declaration?.project_type || obj.custom_data?.project_type || ''
      obj.contact_name = obj.declaration?.contact_name || ''
      obj.contact_phone = obj.declaration?.contact_phone || ''
      obj.photos = obj.declaration?.photos || []
      return obj
    })

    return paginate(res, tasks, {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
    })
  } catch (err) {
    console.error('listMeasurementTasks error:', err)
    return error(res, '获取测量任务列表失败')
  }
}

/**
 * GET /api/v1/measurements/tasks/:workOrderId - 任务详情
 */
async function getMeasurementTask(req, res) {
  try {
    const where = ensureWorkOrderOwnership(req, req.params.workOrderId)
    const workOrder = await WorkOrder.findOne({
      where,
      include: [
        { model: WoAssignment, as: 'assignment' },
        { model: WoMeasurement, as: 'measurements', order: [['id', 'DESC']], limit: 1 },
      ],
    })

    if (!workOrder) return error(res, '工单不存在', 404)

    return success(res, workOrder)
  } catch (err) {
    console.error('getMeasurementTask error:', err)
    return error(res, '获取任务详情失败')
  }
}

/**
 * POST /api/v1/measurements/:workOrderId - 提交测量数据
 */
async function submitMeasurement(req, res) {
  try {
    const { workOrderId } = req.params
    const { basic_info, materials, signature_path } = req.body

    if (!workOrderId) return error(res, '工单ID不能为空', 400)
    if (!basic_info) return error(res, '基本信息不能为空', 400)

    // 验证工单存在
    const where = ensureWorkOrderOwnership(req, workOrderId)
    const workOrder = await WorkOrder.findOne({ where })
    if (!workOrder) return error(res, '工单不存在', 404)

    // 自动计算面积
    if (materials && Array.isArray(materials)) {
      for (const material of materials) {
        if (material.faces && Array.isArray(material.faces)) {
          for (const face of material.faces) {
            if (face.width != null && face.height != null && face.area == null) {
              face.area = Number((face.width * face.height).toFixed(4))
            }
          }
        }
      }
    }

    // 1. 创建或更新测量记录（同一工单只保留最新一条）
    let measurement = await WoMeasurement.findOne({ where: { work_order_id: workOrderId } })

    const measurementData = {
      work_order_id: workOrderId,
      measurer_id: req.user.user_id,
      basic_info,
      materials: materials || null,
      signature_path: signature_path || null,
      status: 'measured',
      measured_at: new Date().toISOString().slice(0, 10),
    }

    if (measurement) {
      await measurement.update(measurementData)
    } else {
      measurement = await WoMeasurement.create(measurementData)
    }

    // 2. 更新工单状态
    await workOrder.update({
      current_stage: 'measurement',
      status: 'measured',
    })

    // 3. 记录日志
    const materialSummary = materials
      ? materials.map(m => `${m.type}: ${m.faces?.length || 0}个面`).join('; ')
      : ''
    await createLog(
      workOrderId,
      req.user.user_id,
      'submit_measurement',
      'measurement',
      `提交测量数据，材料: ${materialSummary}`,
      req.ip
    )

    // 4. 发送通知给设计师（工单流转到设计环节）
    // 通知派单员/管理员测量已完成
    if (workOrder.assigned_tenant_user_id) {
      await sendNotification(
        workOrder.assigned_tenant_user_id,
        '测量完成通知',
        `工单 ${workOrder.work_order_no} 的测量数据已提交，等待审核`,
        'measurement_complete',
        workOrderId
      )
    }

    return success(res, measurement, '测量数据提交成功', 201)
  } catch (err) {
    console.error('submitMeasurement error:', err)
    return error(res, '提交测量数据失败')
  }
}

/**
 * POST /api/v1/measurements/:workOrderId/proxy-submit - 后台代录测量数据
 */
async function proxySubmitMeasurement(req, res) {
  try {
    const { workOrderId } = req.params
    const proxyData = req.body

    if (!workOrderId) return error(res, '工单ID不能为空', 400)

    const where = ensureWorkOrderOwnership(req, workOrderId)
    const workOrder = await WorkOrder.findOne({ where })
    if (!workOrder) return error(res, '工单不存在', 404)

    // 将代录数据转为测量数据格式
    const basic_info = {
      weather: proxyData.measure_date ? '未知' : '未知',
      access: '',
      vehicle_access: false,
      environment_flags: [],
      notes: proxyData.site_remark || proxyData.remark || '',
      // 保存代录原始数据
      proxy_data: proxyData,
      proxy_submitted_by: req.user.user_id,
      proxy_submitted_at: new Date().toISOString(),
    }

    // 单位换算辅助：将数值按单位转换为米
    const UNIT_TO_METER = { m: 1, cm: 0.01, mm: 0.001 }
    function toMeters(val, unit) {
      const num = Number(val) || 0
      const factor = UNIT_TO_METER[unit] || 1
      return num * factor
    }

    // 加载租户模板配置
    let projectTemplates = []
    try {
      const tenant = await Tenant.findByPk(req.user.tenant_id, { attributes: ['settings'] })
      const raw = tenant?.settings
      const settings = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {})
      projectTemplates = settings.project_templates || []
    } catch (e) {
      // 解析失败，使用默认值
    }

    // 获取项目名称
    const projectTmpl = projectTemplates.find(t => t.id === proxyData.template_id)
    const projectName = projectTmpl?.name || null

    // 从模板中查找字段的单位定义
    function getFieldUnit(adTypeKey, fieldKey) {
      const tmpl = projectTemplates.find(t => t.id === proxyData.template_id)
      const adType = tmpl?.ad_types?.find(a => a.key === adTypeKey)
      const field = adType?.face_fields?.find(f => f.field_key === fieldKey)
      return field?.field_unit || 'm'
    }

    // 构建面数据：按 field_role 或字段顺序映射 width/height
    function buildFaces(faces, adTypeKey) {
      return faces.map((face, idx) => {
        // 如果前端已经传了标准化后的 width/height，直接使用（保持原始值不变）
        if (face.width !== undefined && face.height !== undefined) {
          const w = Number(face.width) || 0
          const h = Number(face.height) || 0
          const area = face.area !== undefined ? Number(face.area) : 0
          const wM = face._widthM !== undefined ? Number(face._widthM) : w
          const hM = face._heightM !== undefined ? Number(face._heightM) : h
          const result = {
            width: w,
            height: h,
            _widthM: wM,
            _heightM: hM,
            unit: face.unit || 'm',
            direction: face.direction || '',
            area: area || Number((wM * hM).toFixed(4)),
            photos: face.photos || [],
            notes: face.notes || '',
            label: face.label || face.direction || `第${idx + 1}面`,
            special_flag: !!face.special_flag,
            group_name: face.group_name || '',
            is_unified: !!face.is_unified,
          }
          // 保留额外字段
          const reservedKeys = ['width', 'height', '_widthM', '_heightM', 'unit', 'direction', 'area', 'photos', 'notes', 'label', 'special_flag', 'group_name', 'is_unified']
          for (const [k, v] of Object.entries(face)) {
            if (!reservedKeys.includes(k) && !k.endsWith('_meter')) {
              result[k] = v
            }
          }
          return result
        }
        // 否则按模板字段 role 或顺序提取数值（兼容旧格式）
        const tmpl = projectTemplates.find(t => t.id === proxyData.template_id)
        const adType = tmpl?.ad_types?.find(a => a.key === adTypeKey)
        const numFields = (adType?.face_fields || []).filter(f => f.field_type === 'number')

        // 优先使用 field_role 映射
        let widthMeter = 0, heightMeter = 0
        let widthOrig = 0, heightOrig = 0
        const extraNumFields = {}

        for (const field of numFields) {
          const key = field.field_key
          const val = Number(face[key]) || 0
          const unit = field.field_unit || 'm'
          const meterVal = unit === 'cm' ? val / 100 : (unit === 'mm' ? val / 1000 : val)
          const role = field.field_role || ''

          if (role === 'width') {
            widthOrig = val
            widthMeter = meterVal
          } else if (role === 'height') {
            heightOrig = val
            heightMeter = meterVal
          } else {
            extraNumFields[key] = val
            extraNumFields[key + '_meter'] = meterVal
          }
        }

        // 如果没有通过 role 找到，按顺序回退
        if (widthMeter === 0 && heightMeter === 0 && numFields.length >= 2) {
          const f1 = numFields[0]
          const v1 = Number(face[f1.field_key]) || 0
          const u1 = f1.field_unit || 'm'
          widthOrig = v1
          widthMeter = u1 === 'cm' ? v1 / 100 : (u1 === 'mm' ? v1 / 1000 : v1)

          const f2 = numFields[1]
          const v2 = Number(face[f2.field_key]) || 0
          const u2 = f2.field_unit || 'm'
          heightOrig = v2
          heightMeter = u2 === 'cm' ? v2 / 100 : (u2 === 'mm' ? v2 / 1000 : v2)
        }

        // 查找 label 字段
        const labelField = (adType?.face_fields || []).find(f => f.field_role === 'label' && f.field_type === 'select')
        const labelVal = labelField ? (face[labelField.field_key] || '') : ''

        const result = {
          width: Number(widthOrig.toFixed(4)),
          height: Number(heightOrig.toFixed(4)),
          _widthM: Number(widthMeter.toFixed(4)),
          _heightM: Number(heightMeter.toFixed(4)),
          unit: 'm',
          direction: face.direction || '',
          area: Number((widthMeter * heightMeter).toFixed(4)),
          photos: face.photos || [],
          notes: face.note || face.notes || '',
          label: labelVal || face.label || face.direction || `第${idx + 1}面`,
          special_flag: false,
          group_name: face.group_name || '',
          is_unified: !!face.is_unified,
        }

        // 合并额外数字字段
        Object.assign(result, extraNumFields)

        // 保留非数字额外字段
        const reservedKeys = ['width', 'height', '_widthM', '_heightM', 'unit', 'direction', 'area', 'photos', 'notes', 'label', 'special_flag', 'group_name', 'is_unified']
        for (const field of (adType?.face_fields || [])) {
          if (!reservedKeys.includes(field.field_key) && field.field_type !== 'number') {
            result[field.field_key] = face[field.field_key]
          }
        }

        return result
      })
    }

    // 转换测量数据：支持四种格式
    let materials = []

    // 格式1：多广告类型格式 { template_id, faces: [{ ad_type, length, ... }] }
    if (proxyData.template_id && Array.isArray(proxyData.faces) && !proxyData.ad_type && proxyData.faces.some(f => f.ad_type)) {
      const groupBy = (arr, key) => arr.reduce((acc, item) => {
        const k = item[key] || 'unknown'
        if (!acc[k]) acc[k] = []
        acc[k].push(item)
        return acc
      }, {})
      const grouped = groupBy(proxyData.faces, 'ad_type')
      for (const [adType, faces] of Object.entries(grouped)) {
        materials.push({
          material_type: adType,
          template_id: proxyData.template_id,
          faces: buildFaces(faces, adType),
        })
      }
    }
    // 格式2：项目模板格式 { template_id, ad_type, faces: [...] }
    else if (proxyData.template_id && proxyData.ad_type && Array.isArray(proxyData.faces)) {
      materials.push({
        material_type: proxyData.ad_type,
        template_id: proxyData.template_id,
        faces: buildFaces(proxyData.faces, proxyData.ad_type),
      })
    }
    // 格式2：materials 嵌套结构 [{ material_type, material_note, faces: [{ length, width, ... }] }]
    else if (proxyData.materials && Array.isArray(proxyData.materials)) {
      materials = proxyData.materials.map(mat => ({
        material_type: mat.material_type,
        template_id: proxyData.template_id || mat.template_id,
        material_note: mat.material_note,
        faces: buildFaces(mat.faces, mat.material_type),
      }))
    }
    // 格式3：旧扁平格式 { length, width, material_type, photos, remark }
    else if (proxyData.length && proxyData.width) {
      materials.push({
        type: proxyData.material_type || 'other',
        faces: [{
          label: 'A面',
          length: Number(proxyData.length),
          width: Number(proxyData.width || proxyData.height),
          height: Number(proxyData.height_from_ground) || 0,
          area: proxyData.area || Number((proxyData.length * (proxyData.width || proxyData.height)).toFixed(2)),
          photos: proxyData.photos || [],
          notes: proxyData.remark || '',
          special_flag: false,
        }],
      })
    }

    // 自动计算面积（支持新旧两种格式）
    if (materials && Array.isArray(materials)) {
      for (const material of materials) {
        if (material.faces && Array.isArray(material.faces)) {
          for (const face of material.faces) {
            const w = face.width
            const h = face.height
            if (w != null && h != null && face.area == null) {
              face.area = Number((w * h).toFixed(4))
            }
          }
        }
      }
    }

    let measurement = await WoMeasurement.findOne({ where: { work_order_id: workOrderId } })

    const measurementData = {
      work_order_id: workOrderId,
      measurer_id: req.user.user_id,
      basic_info: { ...basic_info, project_name: projectName },
      materials,
      signature_path: null,
      sketch_path: null,
      status: 'measured',
      measured_at: new Date().toISOString().slice(0, 10),
      is_proxy: true,
    }

    if (measurement) {
      await measurement.update(measurementData)
    } else {
      measurement = await WoMeasurement.create(measurementData)
    }

    // 解析已有 custom_data
    let existingCustomData = {}
    try {
      if (workOrder.custom_data) {
        existingCustomData = typeof workOrder.custom_data === 'string'
          ? JSON.parse(workOrder.custom_data)
          : workOrder.custom_data
      }
    } catch (e) {
      // 解析失败，使用默认值
    }

    await workOrder.update({
      current_stage: 'measurement',
      status: 'measured',
      custom_data: JSON.stringify({ ...existingCustomData, project_name: projectName }),
    })

    await createLog(
      workOrderId,
      req.user,
      'proxy_submit_measurement',
      'measurement',
      '后台代录测量数据',
      req.ip
    )

    return success(res, measurement, '代录测量数据已提交', 201)
  } catch (err) {
    console.error('proxySubmitMeasurement error:', err)
    return error(res, '代录测量数据提交失败')
  }
}

/**
 * PUT /api/v1/measurements/:workOrderId - 更新测量数据（审核前修改）
 */
async function updateMeasurement(req, res) {
  try {
    const { workOrderId } = req.params
    const { materials } = req.body

    if (!workOrderId) return error(res, '工单ID不能为空', 400)

    const where = ensureWorkOrderOwnership(req, workOrderId)
    const workOrder = await WorkOrder.findOne({ where })
    if (!workOrder) return error(res, '工单不存在', 404)

    const measurement = await WoMeasurement.findOne({
      where: { work_order_id: workOrderId },
      order: [['id', 'DESC']],
    })

    if (!measurement) return error(res, '测量记录不存在', 404)

    // 自动计算面积
    if (materials && Array.isArray(materials)) {
      for (const material of materials) {
        if (material.faces && Array.isArray(material.faces)) {
          for (const face of material.faces) {
            if (face.width != null && face.height != null && face.area == null) {
              face.area = Number((face.width * face.height).toFixed(4))
            }
          }
        }
      }
    }

    await measurement.update({ materials })

    await createLog(
      workOrderId,
      req.user.user_id,
      'update_measurement',
      'measurement',
      '审核前修改了测量数据',
      req.ip
    )

    return success(res, measurement, '数据已保存')
  } catch (err) {
    console.error('updateMeasurement error:', err)
    return error(res, '保存测量数据失败')
  }
}

/**
 * POST /api/v1/measurements/:workOrderId/review - 审核测量结果
 */
async function reviewMeasurement(req, res) {
  try {
    const { workOrderId } = req.params
    const { action, reason } = req.body

    if (!action || !['approve', 'reject', 'resubmit'].includes(action)) {
      return error(res, '操作类型无效，必须为 approve 或 reject', 400)
    }
    if (action === 'reject' && !reason) {
      return error(res, '驳回时必须填写原因', 400)
    }

    // 验证工单存在
    const where = ensureWorkOrderOwnership(req, workOrderId)
    const workOrder = await WorkOrder.findOne({ where })
    if (!workOrder) return error(res, '工单不存在', 404)

    // 查找测量记录
    const measurement = await WoMeasurement.findOne({
      where: { work_order_id: workOrderId },
      order: [['id', 'DESC']],
    })

    if (!measurement) return error(res, '测量记录不存在', 404)

    if (action === 'approve') {
      // 通过：工单流转到设计环节
      await workOrder.update({
        current_stage: 'design',
        status: 'designing',
      })
      await measurement.update({ status: 'measured' })

      await createLog(
        workOrderId,
        req.user.user_id,
        'approve_measurement',
        'measurement',
        '测量结果审核通过，流转至设计环节',
        req.ip
      )

      // 通知测量员
      if (measurement.measurer_id) {
        await sendNotification(
          measurement.measurer_id,
          '测量审核通过',
          `工单 ${workOrder.work_order_no} 的测量数据已审核通过`,
          'measurement_approved',
          workOrderId
        )
      }
    } else if (action === 'reject') {
      // 驳回：工单状态回到测量环节
      await measurement.update({
        status: 'rejected',
        rejection_reason: reason,
      })
      await workOrder.update({
        current_stage: 'measurement',
        status: 'rejected',
      })

      await createLog(
        workOrderId,
        req.user.user_id,
        'measurement_rejected',
        'measurement',
        `测量结果被驳回：${reason}`,
        req.ip
      )

      // 通知测量员
      if (measurement.measurer_id) {
        await sendNotification(
          measurement.measurer_id,
          '测量审核驳回',
          `工单 ${workOrder.work_order_no} 的测量数据被驳回：${reason}`,
          'measurement_rejected',
          workOrderId
        )
      }
    } else if (action === 'resubmit') {
      // 重新提交：驳回后修改重新进入审核
      if (req.body.materials) {
        const mats = req.body.materials
        for (const mat of mats) {
          if (mat.faces && Array.isArray(mat.faces)) {
            for (const face of mat.faces) {
              // 如果前端没传 area，按后端已有的 area 保留；前端如果改了 width/height 需要同时传 area
              if (face.area == null) {
                face.area = Number(((face.width || 0) * (face.height || 0)).toFixed(4))
              }
            }
          }
        }
        await measurement.update({ materials: mats, status: 'measured', rejection_reason: null })
      } else {
        await measurement.update({ status: 'measured', rejection_reason: null })
      }
      await workOrder.update({
        current_stage: 'measurement',
        status: 'measured',
      })

      await createLog(
        workOrderId,
        req.user.user_id,
        'resubmit_measurement',
        'measurement',
        '驳回后修改并重新提交测量数据',
        req.ip
      )

      // 通知审核人
      await sendNotification(
        req.user.user_id,
        '测量数据重新提交',
        `工单 ${workOrder.work_order_no} 的测量数据已重新提交，请审核`,
        'measurement_resubmitted',
        workOrderId
      )
    }

    const messages = { approve: '审核通过', reject: '已驳回', resubmit: '修改已提交' }
    return success(res, { workOrder, measurement }, messages[action] || '操作成功')
  } catch (err) {
    console.error('reviewMeasurement error:', err)
    return error(res, '审核失败')
  }
}

/**
 * GET /api/v1/measurements/:workOrderId/history - 同地址历史工单
 */
async function getMeasurementHistory(req, res) {
  try {
    const { workOrderId } = req.params

    const currentWhere = ensureWorkOrderOwnership(req, workOrderId)
    const currentOrder = await WorkOrder.findOne({
      where: currentWhere,
      include: [{ model: WoAssignment, as: 'assignment' }],
    })

    if (!currentOrder) return error(res, '工单不存在', 404)

    const historyOrders = await WorkOrder.findAll({
      where: {
        id: { [Op.ne]: workOrderId },
        tenant_id: currentOrder.tenant_id,
        status: {
          [Op.in]: ['completed', 'accepted', 'archived', 'measured'],
        },
      },
      include: [
        { model: WoMeasurement, as: 'measurements', limit: 1 },
        { model: WoAssignment, as: 'assignment' },
      ],
      limit: 20,
      order: [['id', 'DESC']],
    })

    return success(res, historyOrders)
  } catch (err) {
    console.error('getMeasurementHistory error:', err)
    return error(res, '获取历史工单失败')
  }
}

/**
 * GET /api/v1/assignments/recommended-measurers - 推荐测量员
 */
async function getRecommendedMeasurers(req, res) {
  try {
    const tenantId = req.user.tenant_id

    const measurers = await TenantUser.findAll({
      where: { tenant_id: tenantId, role: 'measurer', status: 'active' },
      attributes: ['id', 'name', 'phone', 'role'],
    })

    const counts = await WorkOrder.findAll({
      where: { tenant_id: tenantId, current_stage: 'measurement' },
      attributes: ['assigned_tenant_user_id', [fn('COUNT', col('id')), 'task_count']],
      group: ['assigned_tenant_user_id'],
      raw: true,
    })

    const taskMap = {}
    for (const c of counts) {
      taskMap[c.assigned_tenant_user_id] = parseInt(c.task_count, 10)
    }

    const result = measurers.map(m => {
      const taskCount = taskMap[m.id] || 0
      let loadLevel = 'free'
      if (taskCount >= 3) loadLevel = 'busy'
      else if (taskCount >= 1) loadLevel = 'moderate'

      return {
        ...m.toJSON(),
        task_count: taskCount,
        load_level: loadLevel,
        load_label: loadLevel === 'free' ? '空闲' : loadLevel === 'moderate' ? `${taskCount}个任务` : '繁忙',
      }
    })

    const order = { free: 0, moderate: 1, busy: 2 }
    result.sort((a, b) => order[a.load_level] - order[b.load_level])

    return success(res, result)
  } catch (err) {
    console.error('getRecommendedMeasurers error:', err)
    return error(res, '获取推荐测量员失败')
  }
}

/**
 * POST /api/v1/tenant/measurements/batch-review - 批量审核
 */
async function batchReviewMeasurements(req, res) {
  try {
    const { ids, action, reason } = req.body
    if (!ids?.length) return error(res, '工单ID列表不能为空', 400)
    if (!['approve', 'reject'].includes(action)) return error(res, '操作类型无效', 400)
    if (action === 'reject' && !reason) return error(res, '驳回时必须填写原因', 400)

    const t = await sequelize.transaction()
    try {
      const results = { approved: [], rejected: [], failed: [] }

      for (const woId of ids) {
        try {
          const measurement = await WoMeasurement.findOne({
            where: { work_order_id: woId },
            order: [['id', 'DESC']],
            transaction: t,
          })
          if (!measurement) { results.failed.push({ id: woId, reason: '无测量记录' }); continue }

          const workOrder = await WorkOrder.findByPk(woId, { transaction: t })
          if (!workOrder) { results.failed.push({ id: woId, reason: '工单不存在' }); continue }

          // 租户隔离验证
          if (workOrder.tenant_id !== req.tenantId) {
            results.failed.push({ id: woId, reason: '无权操作此工单' })
            continue
          }

          if (action === 'approve') {
            await workOrder.update({ current_stage: 'design', status: 'designing' }, { transaction: t })
            await measurement.update({ status: 'measured' }, { transaction: t })
            results.approved.push(woId)
          } else {
            await workOrder.update({ current_stage: 'measurement', status: 'rejected' }, { transaction: t })
            await measurement.update({ status: 'rejected', rejection_reason: reason }, { transaction: t })
            results.rejected.push(woId)
          }
        } catch (e) {
          results.failed.push({ id: woId, reason: e.message })
        }
      }

      // 全部失败时才回滚，部分成功则提交
      if (results.approved.length === 0 && results.rejected.length === 0 && results.failed.length > 0) {
        await t.rollback()
      } else {
        await t.commit()
      }

      return success(res, results, `通过 ${results.approved.length} 个，驳回 ${results.rejected.length} 个`)
    } catch (err) {
      await t.rollback()
      throw err
    }
  } catch (err) {
    console.error('batchReviewMeasurements error:', err)
    return error(res, '批量审核失败')
  }
}

module.exports = {
  listAssignments,
  createAssignment,
  getAssignment,
  receiveAssignment,
  listMeasurementTasks,
  getMeasurementTask,
  submitMeasurement,
  updateMeasurement,
  proxySubmitMeasurement,
  reviewMeasurement,
  getMeasurementHistory,
  getRecommendedMeasurers,
  batchReviewMeasurements,
}
