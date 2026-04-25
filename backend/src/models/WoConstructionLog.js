const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('WoConstructionLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  work_order_id: { type: DataTypes.INTEGER, allowNull: false },
  log_date: { type: DataTypes.DATEONLY, allowNull: false },
  content: { type: DataTypes.TEXT },
  labor_count: { type: DataTypes.INTEGER },
  labor_hours: { type: DataTypes.DECIMAL(5, 1) },
  problem_description: { type: DataTypes.TEXT },
  photos: { type: DataTypes.JSON },
  weather: { type: DataTypes.STRING(20) },
  created_by: { type: DataTypes.INTEGER },
}, {
  tableName: 'wo_construction_logs',
  underscored: true,
  paranoid: true,
  freezeTableName: true,
  charset: 'utf8mb4',
})
