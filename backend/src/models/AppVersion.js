const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('AppVersion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  app_name: { type: DataTypes.STRING(50), allowNull: false, comment: '应用标识，如 measure-app' },
  platform: { type: DataTypes.ENUM('ios', 'android'), allowNull: false },
  version: { type: DataTypes.STRING(20), allowNull: false, comment: '版本号，如 1.2.0' },
  build_number: { type: DataTypes.INTEGER, allowNull: false, comment: '构建号' },
  min_required_version: { type: DataTypes.STRING(20), comment: '最低兼容版本' },
  force_update: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '是否强制更新' },
  update_type: { type: DataTypes.ENUM('none', 'recommended', 'required'), defaultValue: 'recommended', comment: '更新类型' },
  download_url: { type: DataTypes.STRING(500), comment: '安装包下载地址' },
  changelog: { type: DataTypes.JSON, comment: '更新日志，字符串数组' },
  status: { type: DataTypes.ENUM('draft', 'published', 'archived'), defaultValue: 'draft', comment: '版本状态' },
  published_at: { type: DataTypes.DATE, comment: '发布时间' },
}, {
  tableName: 'app_versions',
  underscored: true,
  paranoid: true,
  freezeTableName: true,
  charset: 'utf8mb4',
  indexes: [
    { fields: ['app_name', 'platform', 'status'] },
    { fields: ['app_name', 'platform', 'build_number'], unique: true },
  ],
})
