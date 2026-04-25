const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')
const bcrypt = require('bcrypt')

module.exports = sequelize.define('ClientUser', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  client_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(50), allowNull: false },
  phone: { type: DataTypes.STRING(20), unique: true },
  real_name: { type: DataTypes.STRING(50) },
  wechat_openid: { type: DataTypes.STRING(100), unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('staff', 'manager'), defaultValue: 'staff' },
  department_id: { type: DataTypes.INTEGER },
  status: { type: DataTypes.ENUM('active', 'disabled'), defaultValue: 'active' },
}, {
  tableName: 'client_users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) user.password_hash = await bcrypt.hash(user.password_hash, 10)
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) user.password_hash = await bcrypt.hash(user.password_hash, 10)
    },
  },
})
