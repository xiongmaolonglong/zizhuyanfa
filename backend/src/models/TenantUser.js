const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')
const bcrypt = require('bcrypt')

module.exports = sequelize.define('TenantUser', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenant_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(50), allowNull: false },
  phone: { type: DataTypes.STRING(20), unique: true },
  wechat_openid: { type: DataTypes.STRING(100), unique: true },
  email: { type: DataTypes.STRING(100) },
  real_name: { type: DataTypes.STRING(50) },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'dispatcher', 'measurer', 'designer', 'producer', 'constructor', 'finance'), defaultValue: 'admin' },
  department_id: { type: DataTypes.INTEGER },
  status: { type: DataTypes.ENUM('active', 'disabled'), defaultValue: 'active' },
}, {
  tableName: 'tenant_users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) user.password_hash = await bcrypt.hash(user.password_hash, 10)
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) user.password_hash = await bcrypt.hash(user.password_hash, 10)
    },
  },
})
