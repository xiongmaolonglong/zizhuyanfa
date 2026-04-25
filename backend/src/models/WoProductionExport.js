const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

// 生产导出记录表：每次"导出完整包"生成一条记录
module.exports = sequelize.define('WoProductionExport', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  export_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  material_type: { type: DataTypes.STRING(50), allowNull: false },
  tenant_id: { type: DataTypes.INTEGER, allowNull: false },
  creator_id: { type: DataTypes.INTEGER, allowNull: false },
  creator_name: { type: DataTypes.STRING(50) },
  // 导出的工单列表（JSON数组，包含 work_order_id, work_order_no, title）
  work_orders: { type: DataTypes.JSON, allowNull: false },
  count: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'wo_production_exports',
  underscored: true,
  paranoid: true,
  freezeTableName: true,
  charset: 'utf8mb4',
})
