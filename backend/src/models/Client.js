const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('Client', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenant_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  contact_name: { type: DataTypes.STRING(50) },
  contact_phone: { type: DataTypes.STRING(20) },
  email: { type: DataTypes.STRING(100) },
  address: { type: DataTypes.STRING(200) },
  status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
  approval_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'clients' })
