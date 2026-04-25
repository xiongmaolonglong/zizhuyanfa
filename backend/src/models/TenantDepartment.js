const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('TenantDepartment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenant_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  manager_id: { type: DataTypes.INTEGER },
  region_codes: { type: DataTypes.JSON },
}, { tableName: 'tenant_departments' })
