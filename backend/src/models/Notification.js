const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  user_type: { type: DataTypes.ENUM('tenant', 'client'), allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  content: { type: DataTypes.TEXT },
  type: { type: DataTypes.STRING(50) },
  work_order_id: { type: DataTypes.INTEGER },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  read_at: { type: DataTypes.DATE },
}, {
  tableName: 'notifications',
  underscored: true,
  paranoid: true,
  freezeTableName: true,
  charset: 'utf8mb4',
})
