const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('WoArchive', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  work_order_id: { type: DataTypes.INTEGER, unique: true, allowNull: false },
  archive_no: { type: DataTypes.STRING(50), unique: true },
  file_urls: { type: DataTypes.JSON },
  pdf_report_path: { type: DataTypes.STRING(500) },
  archive_status: { type: DataTypes.ENUM('archiving', 'archived'), defaultValue: 'archiving' },
  archived_at: { type: DataTypes.DATEONLY },
  archived_by: { type: DataTypes.INTEGER },
}, {
  tableName: 'wo_archives',
  underscored: true,
  paranoid: true,
  freezeTableName: true,
  charset: 'utf8mb4',
})
