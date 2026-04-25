const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

// 生产批次表：记录每次"标记完成"产生的批次
module.exports = sequelize.define('WoProductionBatch', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  batch_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  material_type: { type: DataTypes.STRING(50), allowNull: false },
  tenant_id: { type: DataTypes.INTEGER, allowNull: false },
  creator_id: { type: DataTypes.INTEGER, allowNull: false },
  creator_name: { type: DataTypes.STRING(50) },
  // 核对清单（JSON数组）：每个工单的核对状态
  checklist: { type: DataTypes.JSON, allowNull: false },
  // 统计
  total_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  completed_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  notes: { type: DataTypes.TEXT },
}, {
  tableName: 'wo_production_batches',
  underscored: true,
  paranoid: true,
  freezeTableName: true,
  charset: 'utf8mb4',
})
