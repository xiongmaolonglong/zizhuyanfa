const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

/**
 * 表单字段配置（租户级别）
 * 每个广告商可以自定义工单创建表单的字段
 */
module.exports = sequelize.define('FormConfig', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenant_id: { type: DataTypes.INTEGER, allowNull: false },

  // 表单类型：work_order_create（工单创建表单）
  form_type: { type: DataTypes.STRING(50), allowNull: false },

  // 字段标识（唯一键）
  field_key: { type: DataTypes.STRING(50), allowNull: false },

  // 显示名称
  field_label: { type: DataTypes.STRING(50), allowNull: false },

  // 字段类型：text/textarea/number/date/select/checkbox/image/file/client_select/approver_select
  field_type: { type: DataTypes.STRING(30), allowNull: false },

  // 是否必填
  required: { type: DataTypes.BOOLEAN, defaultValue: false },

  // 是否显示
  visible: { type: DataTypes.BOOLEAN, defaultValue: true },

  // 排序权重（越小越靠前）
  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },

  // 默认值
  default_value: { type: DataTypes.JSON },

  // 下拉选项（用于 select 类型）
  options: { type: DataTypes.JSON },

  // 占位提示
  placeholder: { type: DataTypes.STRING(200) },

  // 验证规则（正则/最小值/最大值等）
  validation_rules: { type: DataTypes.JSON },

  // 帮助说明
  help_text: { type: DataTypes.STRING(500) },

  // 是否启用地图解析（仅 address 类型有效）
  enable_parse: { type: DataTypes.BOOLEAN, defaultValue: true },

  // 父级字段 key（用于 subform 子项关联父容器）
  parent_key: { type: DataTypes.STRING(50), allowNull: true },

  // 子表单模板定义（仅 field_type = 'subform' 时有效）
  // 结构: { children: [{ field_key, field_label, field_type, ... }] }
  subform_template: { type: DataTypes.JSON },
}, {
  tableName: 'form_configs',
  paranoid: false,
  indexes: [
    { fields: ['tenant_id', 'form_type'] },
    { fields: ['tenant_id', 'form_type', 'field_key'], unique: true },
  ],
})
