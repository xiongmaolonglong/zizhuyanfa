const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('WoProductionProgress', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  work_order_id: { type: DataTypes.INTEGER, allowNull: false },
  step_name: { type: DataTypes.STRING(50), allowNull: false },
  progress_pct: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'wo_production_progress',
  underscored: true,
  timestamps: false,
  paranoid: false,
  freezeTableName: true,
  charset: 'utf8mb4',
})
