const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('WoChangeLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  work_order_id: { type: DataTypes.INTEGER, allowNull: false },
  change_type: {
    type: DataTypes.ENUM('material_change', 'size_change', 'add_item', 'remove_item', 'other'),
    allowNull: false,
  },
  description: { type: DataTypes.TEXT },
  reason: { type: DataTypes.TEXT },
  cost_impact: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  approved_by: { type: DataTypes.STRING(50) },
  created_by: { type: DataTypes.INTEGER },
}, {
  tableName: 'wo_change_logs',
  underscored: true,
  paranoid: true,
  freezeTableName: true,
  charset: 'utf8mb4',
})
