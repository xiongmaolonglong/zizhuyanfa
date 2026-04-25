const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('WoAssignment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  work_order_id: { type: DataTypes.INTEGER, unique: true, allowNull: false },
  assigned_by: { type: DataTypes.INTEGER, allowNull: false },
  assigned_to: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'assigned', 'received'), defaultValue: 'pending' },
  deadline: { type: DataTypes.DATEONLY },
  notes: { type: DataTypes.TEXT },
}, {
  tableName: 'wo_assignments',
  underscored: true,
  paranoid: true,
  freezeTableName: true,
  charset: 'utf8mb4',
})
