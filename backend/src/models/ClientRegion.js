const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('ClientRegion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  client_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER },
  province_code: { type: DataTypes.STRING(20), allowNull: false },
  city_code: { type: DataTypes.STRING(20), allowNull: false },
  district_code: { type: DataTypes.STRING(20) },
  street_code: { type: DataTypes.STRING(20) },
}, { tableName: 'client_regions' })
