const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('WoDesign', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  work_order_id: { type: DataTypes.INTEGER, allowNull: false },
  designer_id: { type: DataTypes.INTEGER, allowNull: false },
  version: { type: DataTypes.INTEGER, defaultValue: 1, comment: '设计版本号' },
  effect_images: { type: DataTypes.JSON },
  source_files: { type: DataTypes.JSON },
  material_list: { type: DataTypes.JSON },
  face_mapping: { type: DataTypes.JSON },
  internal_notes: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('designing', 'reviewing', 'approved', 'rejected', 'confirmed'), defaultValue: 'designing' },
  reviewer_id: { type: DataTypes.INTEGER },
  review_comment: { type: DataTypes.TEXT },
  reviewed_at: { type: DataTypes.DATEONLY },
}, {
  tableName: 'wo_designs',
  underscored: true,
  paranoid: true,
  freezeTableName: true,
  charset: 'utf8mb4',
})
