const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('WoAftersale', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  work_order_id: { type: DataTypes.INTEGER, allowNull: false },
  client_user_id: { type: DataTypes.INTEGER, allowNull: false },
  description: { type: DataTypes.TEXT },
  photos: { type: DataTypes.JSON },
  status: { type: DataTypes.ENUM('pending', 'processing', 'resolved', 'closed'), defaultValue: 'pending' },
  handler_id: { type: DataTypes.INTEGER },
  handler_notes: { type: DataTypes.TEXT },
  handler_photos: { type: DataTypes.JSON },
  rating: { type: DataTypes.INTEGER },
  resolved_at: { type: DataTypes.DATEONLY },
}, {
  tableName: 'wo_aftersales',
  underscored: true,
  paranoid: true,
  freezeTableName: true,
  charset: 'utf8mb4',
})
