const { Tenant } = require('../models')
const { success, error } = require('../utils/response')

/**
 * GET /api/v1/tenant/settings
 * 获取租户系统配置（项目类型、材料字典等）
 */
async function getSettings(req, res) {
  try {
    const tenant = await Tenant.findByPk(req.user.tenant_id, {
      attributes: ['id', 'settings'],
    })

    // MariaDB may return JSON column as string, ensure parsed
    const rawSettings = tenant.settings
    const settings = (typeof rawSettings === 'string') ? JSON.parse(rawSettings || '{}') : (rawSettings || {
      project_templates: [
        {
          id: 'tmpl_520',
          name: '520项目',
          enabled: true,
          ad_types: [
            {
              key: 'signboard',
              label: '门头招牌',
              face_fields: [
                { field_key: 'width', field_label: '宽度', field_type: 'number', field_unit: 'm', field_role: 'width', required: true, placeholder: '请输入宽度' },
                { field_key: 'height', field_label: '高度', field_type: 'number', field_unit: 'm', field_role: 'height', required: true, placeholder: '请输入高度' },
                { field_key: 'direction', field_label: '朝向', field_type: 'select', field_role: 'label', required: false,
                  options: [{ label: '东', value: '东' }, { label: '南', value: '南' }, { label: '西', value: '西' }, { label: '北', value: '北' }, { label: '左侧', value: '左侧' }, { label: '右侧', value: '右侧' }, { label: '正面', value: '正面' }, { label: '背面', value: '背面' }]
                },
                { field_key: 'note', field_label: '备注', field_type: 'textarea', required: false, placeholder: '该面特殊情况' },
              ]
            },
            {
              key: 'led_screen',
              label: 'LED大屏',
              face_fields: [
                { field_key: 'width', field_label: '宽度', field_type: 'number', field_unit: 'm', field_role: 'width', required: true, placeholder: '请输入宽度' },
                { field_key: 'height', field_label: '高度', field_type: 'number', field_unit: 'm', field_role: 'height', required: true, placeholder: '请输入高度' },
                { field_key: 'height_from_ground', field_label: '离地高度', field_type: 'number', field_unit: 'm', field_role: 'extra', required: false, placeholder: '可选' },
                { field_key: 'note', field_label: '备注', field_type: 'textarea', required: false, placeholder: '该面特殊情况' },
              ]
            },
          ]
        },
      ],
      material_dict: [],
      map_api_key: '',
    })

    return success(res, settings)
  } catch (err) {
    console.error('getSettings error:', err)
    return error(res, '获取配置失败')
  }
}

/**
 * PUT /api/v1/tenant/settings
 * 更新租户系统配置
 */
async function updateSettings(req, res) {
  try {
    const { project_types, material_dict } = req.body

    const tenant = await Tenant.findByPk(req.user.tenant_id)
    const rawSettings = tenant.settings
    // 深拷贝，避免引用相同导致 Sequelize 检测不到 JSON 变化
    const currentSettings = JSON.parse(JSON.stringify(typeof rawSettings === 'string' ? JSON.parse(rawSettings || '{}') : (rawSettings || {})))
    const updates = { ...currentSettings }
    if (project_types !== undefined) updates.project_types = project_types
    if (material_dict !== undefined) updates.material_dict = material_dict

    await tenant.update({ settings: updates })

    return success(res, updates, '配置更新成功')
  } catch (err) {
    console.error('updateSettings error:', err)
    return error(res, '更新配置失败')
  }
}

/**
 * PATCH /api/v1/tenant/settings/:key
 * 更新单个配置项
 */
async function updateSettingKey(req, res) {
  try {
    const { key } = req.params
    const value = req.body.value

    const tenant = await Tenant.findByPk(req.user.tenant_id)
    const rawSettings = tenant.settings
    // 深拷贝，避免引用相同导致 Sequelize 检测不到 JSON 变化
    const currentSettings = JSON.parse(JSON.stringify(typeof rawSettings === 'string' ? JSON.parse(rawSettings || '{}') : (rawSettings || {})))
    currentSettings[key] = value

    await tenant.update({ settings: currentSettings })

    return success(res, { [key]: value }, '配置更新成功')
  } catch (err) {
    console.error('updateSettingKey error:', err)
    return error(res, '更新配置失败')
  }
}

/**
 * GET /api/v1/tenant/settings/project-templates
 * 获取项目模板（测量代录/APP测量专用）
 */
async function getProjectTemplates(req, res) {
  try {
    const tenant = await Tenant.findByPk(req.user.tenant_id, {
      attributes: ['id', 'settings'],
    })

    const rawSettings = tenant.settings
    const settings = (typeof rawSettings === 'string') ? JSON.parse(rawSettings || '{}') : (rawSettings || {})
    const templates = settings.project_templates || [
      {
        id: 'tmpl_520',
        name: '520项目',
        enabled: true,
        ad_types: [
          {
            key: 'signboard',
            label: '门头招牌',
            face_fields: [
              { field_key: 'width', field_label: '宽度', field_type: 'number', field_unit: 'm', field_role: 'width', required: true, placeholder: '请输入宽度' },
              { field_key: 'height', field_label: '高度', field_type: 'number', field_unit: 'm', field_role: 'height', required: true, placeholder: '请输入高度' },
              { field_key: 'direction', field_label: '朝向', field_type: 'select', field_role: 'label', required: false,
                options: [{ label: '东', value: '东' }, { label: '南', value: '南' }, { label: '西', value: '西' }, { label: '北', value: '北' }, { label: '左侧', value: '左侧' }, { label: '右侧', value: '右侧' }, { label: '正面', value: '正面' }, { label: '背面', value: '背面' }]
              },
              { field_key: 'note', field_label: '备注', field_type: 'textarea', required: false, placeholder: '该面特殊情况' },
            ]
          },
          {
            key: 'led_screen',
            label: 'LED大屏',
            face_fields: [
              { field_key: 'width', field_label: '宽度', field_type: 'number', field_unit: 'm', field_role: 'width', required: true, placeholder: '请输入宽度' },
              { field_key: 'height', field_label: '高度', field_type: 'number', field_unit: 'm', field_role: 'height', required: true, placeholder: '请输入高度' },
              { field_key: 'height_from_ground', field_label: '离地高度', field_type: 'number', field_unit: 'm', field_role: 'extra', required: false, placeholder: '可选' },
              { field_key: 'note', field_label: '备注', field_type: 'textarea', required: false, placeholder: '该面特殊情况' },
            ]
          },
        ]
      },
    ]

    return success(res, { templates })
  } catch (err) {
    console.error('getProjectTemplates error:', err)
    return error(res, '获取项目模板失败')
  }
}

/**
 * GET /api/v1/tenant/settings/material-type-map
 * 获取广告类型 key → label 映射（用于材料类型显示）
 */
async function getMaterialTypeMap(req, res) {
  try {
    const tenant = await Tenant.findByPk(req.user.tenant_id, {
      attributes: ['id', 'settings'],
    })

    const rawSettings = tenant.settings
    const settings = (typeof rawSettings === 'string') ? JSON.parse(rawSettings || '{}') : (rawSettings || {})
    const templates = settings.project_templates || []

    // 收集所有模板中的所有广告类型
    const typeMap = {}
    for (const tmpl of templates) {
      for (const adType of (tmpl.ad_types || [])) {
        if (adType.key && adType.label) {
          typeMap[adType.key] = adType.label
        }
      }
    }

    return success(res, { material_type_map: typeMap })
  } catch (err) {
    console.error('getMaterialTypeMap error:', err)
    return error(res, '获取材料类型映射失败')
  }
}

module.exports = { getSettings, getProjectTemplates, getMaterialTypeMap, updateSettings, updateSettingKey }
