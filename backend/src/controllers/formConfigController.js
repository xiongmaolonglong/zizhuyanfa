const { FormConfig } = require('../models')
const { success, error } = require('../utils/response')

// ==================== 默认字段配置 ====================

// 测量代录表单默认字段（含子表单结构）
const DEFAULT_MEASUREMENT_FIELDS = [
  { field_key: 'measure_date', field_label: '测量日期', field_type: 'date', required: false, visible: true, sort_order: 1, placeholder: '测量日期' },
  { field_key: 'operator_name', field_label: '操作人', field_type: 'text', required: false, visible: true, sort_order: 2, placeholder: '测量员姓名' },
  // 广告材料子表单
  { field_key: 'materials', field_label: '广告材料', field_type: 'subform', required: true, visible: true, sort_order: 3,
    subform_template: {
      children: [
        { field_key: 'material_type', field_label: '材料类型', field_type: 'select', required: true, visible: true, sort_order: 1,
          options: [
            { label: '喷绘布', value: 'spray_cloth' },
            { label: '亚克力板', value: 'acrylic' },
            { label: '铝塑板', value: 'aluminum' },
            { label: '不锈钢', value: 'stainless' },
            { label: 'LED模组', value: 'led_module' },
            { label: '其他', value: 'other' },
          ]
        },
        { field_key: 'material_note', field_label: '材料备注', field_type: 'textarea', required: false, visible: true, sort_order: 2, placeholder: '如：三面连在一起' },
        // 面 子表单（嵌套在材料内）
        { field_key: 'faces', field_label: '面', field_type: 'subform', required: true, visible: true, sort_order: 3,
          subform_template: {
            children: [
              { field_key: 'length', field_label: '长(m)', field_type: 'number', required: true, visible: true, sort_order: 1, placeholder: '请输入长度' },
              { field_key: 'width', field_label: '宽(m)', field_type: 'number', required: true, visible: true, sort_order: 2, placeholder: '请输入宽度' },
              { field_key: 'direction', field_label: '朝向', field_type: 'select', required: false, visible: true, sort_order: 3,
                options: [
                  { label: '东', value: 'E' },
                  { label: '南', value: 'S' },
                  { label: '西', value: 'W' },
                  { label: '北', value: 'N' },
                  { label: '其他', value: 'other' },
                ]
              },
              { field_key: 'height_from_ground', field_label: '离地高度(m)', field_type: 'number', required: false, visible: true, sort_order: 4, placeholder: '可选' },
              { field_key: 'note', field_label: '面备注', field_type: 'textarea', required: false, visible: true, sort_order: 5, placeholder: '该面特殊情况说明' },
              { field_key: 'photos', field_label: '照片', field_type: 'image', required: false, visible: true, sort_order: 6 },
            ]
          }
        },
      ]
    }
  },
  // 现场情况
  { field_key: 'site_photos', field_label: '现场全景照片', field_type: 'image', required: false, visible: true, sort_order: 4 },
  { field_key: 'site_remark', field_label: '现场特殊情况说明', field_type: 'textarea', required: false, visible: true, sort_order: 5, placeholder: '现场特殊情况说明' },
]

// 工单创建表单默认字段（广告商可在系统配置中自定义）
const DEFAULT_WORK_ORDER_FIELDS = [
  { field_key: 'client_id', field_label: '甲方企业', field_type: 'client_select', required: true, visible: true, sort_order: 1, placeholder: '请选择甲方企业' },
  { field_key: 'title', field_label: '店铺名字', field_type: 'text', required: true, visible: true, sort_order: 2, placeholder: '例如：XX门店招牌' },
  { field_key: 'activity_name', field_label: '活动项目', field_type: 'select', required: false, visible: true, sort_order: 3,
    options: [
      { label: '520活动', value: 'activity_520' },
      { label: '台球城活动', value: 'billiard_city' },
      { label: '形象店活动', value: 'image_store' },
      { label: '国庆活动', value: 'national_day' },
      { label: '春节活动', value: 'spring_festival' },
    ]
  },
  { field_key: 'project_type', field_label: '元素类型', field_type: 'select', required: false, visible: true, sort_order: 4,
    options: [
      { label: '门头招牌', value: 'signboard' },
      { label: '室内广告', value: 'indoor' },
      { label: '灯箱', value: 'lightbox' },
      { label: 'LED显示屏', value: 'led' },
      { label: '其他', value: 'other' },
    ]
  },
  { field_key: 'address', field_label: '项目地址', field_type: 'address', required: false, visible: true, sort_order: 5, placeholder: '输入地址搜索自动解析', enable_parse: true },
  { field_key: 'description', field_label: '需求描述', field_type: 'textarea', required: false, visible: true, sort_order: 6, placeholder: '请描述项目需求' },
  { field_key: 'deadline', field_label: '截止日期', field_type: 'date', required: false, visible: true, sort_order: 7, placeholder: '选择项目截止日期' },
]

// ==================== 获取表单配置 ====================

/**
 * GET /api/v1/tenant/form-config/:formType
 * 获取指定表单的配置（返回渲染用的字段列表）
 */
async function getFormConfig(req, res) {
  try {
    const { formType } = req.params
    const tenantId = req.user.tenant_id

    // 查租户自定义配置
    const configs = await FormConfig.findAll({
      where: { tenant_id: tenantId, form_type: formType },
      order: [['sort_order', 'ASC']],
    })

    // 如果没有自定义配置，返回默认配置
    if (configs.length === 0) {
      const defaults = formType === 'work_order_create' ? DEFAULT_WORK_ORDER_FIELDS : DEFAULT_MEASUREMENT_FIELDS
      return success(res, { fields: defaults, is_default: true })
    }

    const fields = configs.map(c => {
      const opts = c.options
      const template = c.subform_template
      // Sequelize JSON field: should already be parsed object, but guard against string
      const parsedOpts = typeof opts === 'string' ? JSON.parse(opts || 'null') : opts
      const parsedTemplate = typeof template === 'string' ? JSON.parse(template || 'null') : template
      return {
        field_key: c.field_key,
        field_label: c.field_label,
        field_type: c.field_type,
        required: c.required,
        visible: c.visible,
        sort_order: c.sort_order,
        default_value: c.default_value,
        options: parsedOpts,
        placeholder: c.placeholder,
        validation_rules: c.validation_rules,
        help_text: c.help_text,
        enable_parse: c.enable_parse,
        parent_key: c.parent_key || null,
        subform_template: parsedTemplate || null,
      }
    })

    // Build hierarchical structure recursively
    function buildHierarchy(allFields, parentKey) {
      const children = allFields.filter(f => f.parent_key === parentKey)
      children.forEach(child => {
        if (child.field_type === 'subform') {
          // Recursively find grandchildren
          const grandchildren = buildHierarchy(allFields, child.field_key)
          if (!child.subform_template) child.subform_template = {}
          child.subform_template.children = grandchildren
        }
      })
      return children
    }

    const topLevel = buildHierarchy(fields, null)

    // Only return visible top-level fields
    const visibleFields = topLevel.filter(f => f.visible)

    return success(res, { fields: visibleFields, is_default: false })
  } catch (err) {
    console.error('getFormConfig error:', err)
    return error(res, '获取表单配置失败')
  }
}

// ==================== 更新字段配置 ====================

/**
 * PUT /api/v1/tenant/form-config/:formType
 * 批量更新表单配置（传入完整字段列表，全量覆盖）
 * body: { fields: [{ field_key, field_label, field_type, required, visible, sort_order, options?, placeholder?, default_value?, validation_rules?, help_text? }] }
 */
async function updateFormConfig(req, res) {
  try {
    const { formType } = req.params
    const { fields } = req.body

    if (!fields || !Array.isArray(fields)) {
      return error(res, 'fields 必须为数组', 400)
    }

    const tenantId = req.user.tenant_id

    // 先删除该租户此表单类型的旧配置
    await FormConfig.destroy({
      where: { tenant_id: tenantId, form_type: formType },
    })

    // 批量写入新配置
    const records = fields.map((f, index) => ({
      tenant_id: tenantId,
      form_type: formType,
      field_key: f.field_key,
      field_label: f.field_label,
      field_type: f.field_type,
      required: f.required || false,
      visible: f.visible !== false,
      sort_order: f.sort_order || index,
      default_value: f.default_value || null,
      options: (f.options && Array.isArray(f.options) && f.options.length > 0) ? f.options : null,
      placeholder: f.placeholder || null,
      validation_rules: f.validation_rules || null,
      help_text: f.help_text || null,
      enable_parse: !!f.enable_parse,
      parent_key: f.parent_key || null,
      subform_template: (f.subform_template && typeof f.subform_template === 'object') ? JSON.stringify(f.subform_template) : null,
    }))

    await FormConfig.bulkCreate(records)

    return success(res, { fields }, '表单配置已保存')
  } catch (err) {
    console.error('updateFormConfig error:', err)
    return error(res, '保存表单配置失败')
  }
}

// ==================== 添加自定义字段 ====================

/**
 * POST /api/v1/tenant/form-config/:formType/fields
 * 添加一个自定义字段
 */
async function addCustomField(req, res) {
  try {
    const { formType } = req.params
    const { field_key, field_label, field_type, required, visible, sort_order, options, placeholder, default_value, validation_rules, help_text, parent_key, subform_template } = req.body
    const tenantId = req.user.tenant_id

    if (!field_key || !field_label || !field_type) {
      return error(res, 'field_key、field_label、field_type 为必填项', 400)
    }

    // 检查字段 key 是否已存在
    const existing = await FormConfig.findOne({
      where: { tenant_id: tenantId, form_type: formType, field_key },
    })
    if (existing) {
      return error(res, '字段标识已存在', 400)
    }

    const config = await FormConfig.create({
      tenant_id: tenantId,
      form_type: formType,
      field_key,
      field_label,
      field_type,
      required: required || false,
      visible: visible !== false,
      sort_order: sort_order || 999,
      default_value: default_value || null,
      options: options || null,
      placeholder: placeholder || null,
      validation_rules: validation_rules || null,
      help_text: help_text || null,
      parent_key: parent_key || null,
      subform_template: subform_template ? JSON.stringify(subform_template) : null,
    })

    return success(res, config, '自定义字段已添加', 201)
  } catch (err) {
    console.error('addCustomField error:', err)
    return error(res, '添加自定义字段失败')
  }
}

// ==================== 重置为默认配置 ====================

/**
 * POST /api/v1/tenant/form-config/:formType/reset
 * 重置为系统默认配置
 */
async function resetFormConfig(req, res) {
  try {
    const { formType } = req.params
    const tenantId = req.user.tenant_id

    await FormConfig.destroy({
      where: { tenant_id: tenantId, form_type: formType },
    })

    const defaults = formType === 'work_order_create' ? DEFAULT_WORK_ORDER_FIELDS : DEFAULT_MEASUREMENT_FIELDS
    return success(res, { fields: defaults }, '已重置为默认配置')
  } catch (err) {
    console.error('resetFormConfig error:', err)
    return error(res, '重置失败')
  }
}

module.exports = {
  getFormConfig,
  updateFormConfig,
  addCustomField,
  resetFormConfig,
  DEFAULT_MEASUREMENT_FIELDS,
  DEFAULT_WORK_ORDER_FIELDS,
}
