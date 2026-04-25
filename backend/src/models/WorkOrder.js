const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('WorkOrder', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  work_order_no: { type: DataTypes.STRING(30), unique: true, allowNull: false },
  tenant_id: { type: DataTypes.INTEGER, allowNull: false },
  client_id: { type: DataTypes.INTEGER, allowNull: false },
  client_user_id: { type: DataTypes.INTEGER },
  title: { type: DataTypes.STRING(200), allowNull: false },
  project_category: { type: DataTypes.STRING(50), comment: '已废弃，使用 activity_name' },
  activity_name: { type: DataTypes.STRING(100), comment: '所属活动项目，如 520活动、台球城活动等' },
  description: { type: DataTypes.TEXT },
  current_stage: {
    type: DataTypes.ENUM(
      'declaration', 'approval', 'assignment', 'measurement',
      'design', 'production', 'construction', 'finance', 'archive', 'aftersale'
    ),
    defaultValue: 'declaration',
  },
  status: {
    type: DataTypes.ENUM(
      'draft', 'submitted', 'approved', 'rejected',
      'assigned', 'measuring', 'measured',
      'designing', 'design_reviewed', 'design_confirmed',
      'producing', 'produced', 'shipped',
      'constructing', 'completed', 'accepted',
      'quoting', 'quoted', 'paid', 'invoiced',
      'archiving', 'archived',
      'aftersale_pending', 'aftersale_resolved', 'aftersale_closed'
    ),
    defaultValue: 'draft',
  },
  approval_enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
  budget_id: { type: DataTypes.INTEGER },
  assigned_tenant_user_id: { type: DataTypes.INTEGER },
  designer_id: { type: DataTypes.INTEGER, comment: '指派的设计师' },
  constructor_id: { type: DataTypes.INTEGER, comment: '指派的施工队/师傅' },
  construction_start_date: { type: DataTypes.DATEONLY, comment: '施工开始日期' },
  construction_end_date: { type: DataTypes.DATEONLY, comment: '施工结束日期' },
  deadline: { type: DataTypes.DATEONLY },
  completed_at: { type: DataTypes.DATEONLY },
  warranty_end_date: { type: DataTypes.DATEONLY, comment: '质保到期日' },
  priority: { type: DataTypes.ENUM('high', 'normal', 'low'), defaultValue: 'normal', comment: '优先级' },
  custom_tags: { type: DataTypes.TEXT, comment: '自定义标签 JSON 数组' },
  remarks: { type: DataTypes.TEXT, comment: '备注 JSON 数组' },
  source: {
    type: DataTypes.ENUM('admin_created', 'field_created', 'declaration'),
    defaultValue: 'admin_created',
    comment: '工单来源：管理员创建/现场创建/申报导入'
  },
  custom_data: {
    type: DataTypes.TEXT,
    comment: '自定义表单字段数据 JSON',
    get() {
      const val = this.getDataValue('custom_data')
      if (!val) return null
      try { return JSON.parse(val) } catch { return val }
    },
    set(val) {
      if (typeof val === 'object' && val !== null) {
        this.setDataValue('custom_data', JSON.stringify(val))
      } else {
        this.setDataValue('custom_data', val)
      }
    },
  },
}, {
  tableName: 'work_orders',
  underscored: true,
  paranoid: true,
  freezeTableName: true,
  charset: 'utf8mb4',
})
