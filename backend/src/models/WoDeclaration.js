const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('WoDeclaration', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  work_order_id: { type: DataTypes.INTEGER, unique: true, allowNull: false },
  project_type: { type: DataTypes.STRING(50) },
  province_code: { type: DataTypes.STRING(20) },
  city_code: { type: DataTypes.STRING(20) },
  district_code: { type: DataTypes.STRING(20) },
  street_code: { type: DataTypes.STRING(20) },
  detail_address: { type: DataTypes.STRING(500) },
  address: { type: DataTypes.TEXT, comment: '原始地址（用户填写或解析后的完整地址）' },
  full_address: { type: DataTypes.STRING(1000) },
  contact_name: { type: DataTypes.STRING(50) },
  contact_phone: { type: DataTypes.STRING(20) },
  photos: { type: DataTypes.JSON },
  attachments: { type: DataTypes.JSON },
  created_by: { type: DataTypes.INTEGER },
  received_at: { type: DataTypes.DATE, comment: '广告商接收时间' },
}, {
  tableName: 'wo_declarations',
  underscored: true,
  paranoid: true,
  freezeTableName: true,
  charset: 'utf8mb4',
  hooks: {
    beforeSave: async (declaration) => {
      const parts = []
      if (declaration.province_code) parts.push(declaration.province_code)
      if (declaration.city_code) parts.push(declaration.city_code)
      if (declaration.district_code) parts.push(declaration.district_code)
      if (declaration.street_code) parts.push(declaration.street_code)
      if (declaration.detail_address) parts.push(declaration.detail_address)
      declaration.full_address = parts.join('')
    },
  },
})
