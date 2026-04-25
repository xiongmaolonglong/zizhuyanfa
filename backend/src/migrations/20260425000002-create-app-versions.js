'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables()
    if (!tables.includes('app_versions')) {
      await queryInterface.createTable('app_versions', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        app_name: { type: Sequelize.STRING(50), allowNull: false, comment: '应用标识' },
        platform: { type: Sequelize.ENUM('ios', 'android'), allowNull: false },
        version: { type: Sequelize.STRING(20), allowNull: false, comment: '版本号' },
        build_number: { type: Sequelize.INTEGER, allowNull: false, comment: '构建号' },
        min_required_version: { type: Sequelize.STRING(20), comment: '最低兼容版本' },
        force_update: { type: Sequelize.BOOLEAN, defaultValue: false, comment: '是否强制更新' },
        update_type: { type: Sequelize.ENUM('none', 'recommended', 'required'), defaultValue: 'recommended', comment: '更新类型' },
        download_url: { type: Sequelize.STRING(500), comment: '安装包下载地址' },
        changelog: { type: Sequelize.JSON, comment: '更新日志' },
        status: { type: Sequelize.ENUM('draft', 'published', 'archived'), defaultValue: 'draft', comment: '版本状态' },
        published_at: { type: Sequelize.DATE, comment: '发布时间' },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: { type: Sequelize.DATE },
      })

      await queryInterface.addIndex('app_versions', ['app_name', 'platform', 'status'])
      await queryInterface.addIndex('app_versions', ['app_name', 'platform', 'build_number'], { unique: true, name: 'uniq_app_platform_build' })
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('app_versions')
  },
}
