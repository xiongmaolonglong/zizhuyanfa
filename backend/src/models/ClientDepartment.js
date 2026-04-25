const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('ClientDepartment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  client_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  manager_id: { type: DataTypes.INTEGER },
}, { tableName: 'client_departments' })
