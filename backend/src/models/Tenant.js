const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('Tenant', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  contact_name: { type: DataTypes.STRING(50) },
  contact_phone: { type: DataTypes.STRING(20) },
  contact_email: { type: DataTypes.STRING(100) },
  status: { type: DataTypes.ENUM('active', 'suspended', 'expired'), defaultValue: 'active' },
  max_users: { type: DataTypes.INTEGER, defaultValue: 50 },
  order_code_prefix: { type: DataTypes.STRING(20), defaultValue: 'GG' },
  order_code_seq: { type: DataTypes.INTEGER, defaultValue: 0 },
  default_client_id: { type: DataTypes.INTEGER },
  modules: { type: DataTypes.JSON, defaultValue: ['all'] },
  settings: { type: DataTypes.JSON },
}, { tableName: 'tenants' })
