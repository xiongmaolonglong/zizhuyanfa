const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('WorkOrderLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  work_order_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  user_type: { type: DataTypes.ENUM('tenant', 'client'), allowNull: false },
  action: { type: DataTypes.STRING(50), allowNull: false },
  stage: { type: DataTypes.STRING(50) },
  detail: { type: DataTypes.TEXT },
  ip_address: { type: DataTypes.STRING(50) },
  log_type: { type: DataTypes.STRING(30), comment: '操作类型' },
  field_name: { type: DataTypes.STRING(50), comment: '变更字段名' },
  old_value: { type: DataTypes.TEXT, comment: '变更前值' },
  new_value: { type: DataTypes.TEXT, comment: '变更后值' },
  amount_change: { type: DataTypes.DECIMAL(10, 2), comment: '金额变化' },
}, {
  tableName: 'work_order_logs',
  underscored: true,
  paranoid: true,
  freezeTableName: true,
  charset: 'utf8mb4',
})
