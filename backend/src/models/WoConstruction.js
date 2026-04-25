const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('WoConstruction', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  work_order_id: { type: DataTypes.INTEGER, allowNull: false },
  constructor_id: { type: DataTypes.INTEGER, allowNull: true },
  before_photos: { type: DataTypes.JSON },
  during_photos: { type: DataTypes.JSON },
  after_photos: { type: DataTypes.JSON },
  notes: { type: DataTypes.TEXT },
  duration_minutes: { type: DataTypes.INTEGER },
  signature_path: { type: DataTypes.STRING(500) },
  status: { type: DataTypes.ENUM('scheduled', 'installing', 'completed', 'accepted', 'internally_verified'), defaultValue: 'scheduled' },
  internal_verified_at: { type: DataTypes.DATEONLY },
  client_verified_at: { type: DataTypes.DATEONLY },
  auto_accept_days: { type: DataTypes.INTEGER, defaultValue: 3 },
  constructed_at: { type: DataTypes.DATEONLY },
}, {
  tableName: 'wo_constructions',
  underscored: true,
  paranoid: true,
  freezeTableName: true,
  charset: 'utf8mb4',
})
