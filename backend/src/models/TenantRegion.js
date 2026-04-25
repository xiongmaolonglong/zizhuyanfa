const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('TenantRegion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenant_id: { type: DataTypes.INTEGER, allowNull: false },
  province_code: { type: DataTypes.STRING(20), allowNull: false },
  city_code: { type: DataTypes.STRING(20), allowNull: false },
  district_code: { type: DataTypes.STRING(20) },
  street_code: { type: DataTypes.STRING(20) },
}, { tableName: 'tenant_regions' })
