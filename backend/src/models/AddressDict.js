const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('AddressDict', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(20), unique: true, allowNull: false },
  parent_code: { type: DataTypes.STRING(20) },
  level: { type: DataTypes.ENUM('province', 'city', 'district', 'street'), allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
}, { tableName: 'address_dict' })
