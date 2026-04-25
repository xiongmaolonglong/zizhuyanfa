'use strict';

/**
 * 系统默认配置种子
 * 部署新站点时运行：npx sequelize-cli db:seed:all
 * 这会为所有现有租户填充默认设置
 */

const {
  defaultProjectTemplates,
  defaultMaterialDict,
  defaultDesignColorRules,
  defaultSizeCheckConfig,
  defaultColorCheckConfig,
  defaultFormFields,
} = require('../src/utils/defaultSettings');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    // 获取所有租户
    const tenants = await queryInterface.sequelize.query(
      'SELECT id, settings FROM tenants',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!tenants || tenants.length === 0) {
      console.log('没有找到租户，跳过配置种子');
      return;
    }

    // 为每个租户更新配置（保留用户已修改的值）
    for (const tenant of tenants) {
      let settings = tenant.settings;

      // 解析现有设置
      if (typeof settings === 'string') {
        try { settings = JSON.parse(settings || '{}'); } catch { settings = {}; }
      } else if (!settings) {
        settings = {};
      }

      // 合并默认配置（保留用户已修改的值）
      const newSettings = {
        project_templates: settings.project_templates || JSON.parse(JSON.stringify(defaultProjectTemplates)),
        material_dict: settings.material_dict || JSON.parse(JSON.stringify(defaultMaterialDict)),
        map_api_key: settings.map_api_key || '',
        design_color_rules: settings.design_color_rules || JSON.parse(JSON.stringify(defaultDesignColorRules)),
        size_check_config: settings.size_check_config || { ...defaultSizeCheckConfig },
        color_check_config: settings.color_check_config || { ...defaultColorCheckConfig },
      };

      await queryInterface.sequelize.query(
        'UPDATE tenants SET settings = ? WHERE id = ?',
        { replacements: [JSON.stringify(newSettings), tenant.id] }
      );

      console.log(`租户 ${tenant.id} 配置已更新`);
    }

    // 创建表单配置表（如果不存在）
    const tableExists = await queryInterface.showAllTables();
    if (!tableExists.some(t => t.table_name === 'form_configs' || t === 'form_configs')) {
      await queryInterface.createTable('form_configs', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        tenant_id: { type: Sequelize.INTEGER, allowNull: false },
        config_type: { type: Sequelize.STRING(50), allowNull: false },
        fields: { type: Sequelize.JSON },
        created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    }

    // 为每个租户创建默认表单配置
    for (const tenant of tenants) {
      // 先检查是否已存在
      const existing = await queryInterface.sequelize.query(
        'SELECT id FROM form_configs WHERE tenant_id = ? AND config_type = ?',
        { replacements: [tenant.id, 'work_order_create'], type: Sequelize.QueryTypes.SELECT }
      );

      if (existing.length === 0) {
        await queryInterface.sequelize.query(
          `INSERT INTO form_configs (tenant_id, config_type, fields, created_at, updated_at)
           VALUES (?, 'work_order_create', ?, ?, ?)`,
          { replacements: [tenant.id, JSON.stringify(defaultFormFields), now, now] }
        );
        console.log(`租户 ${tenant.id} 表单配置已创建`);
      } else {
        console.log(`租户 ${tenant.id} 表单配置已存在，跳过`);
      }
    }

    console.log('默认配置种子执行完成');
  },

  down: async (queryInterface, Sequelize) => {
    // 清空配置（谨慎使用）
    const tenants = await queryInterface.sequelize.query(
      'SELECT id FROM tenants',
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const tenant of tenants) {
      await queryInterface.sequelize.query(
        'UPDATE tenants SET settings = NULL WHERE id = ?',
        { replacements: [tenant.id] }
      );
    }

    await queryInterface.bulkDelete('form_configs', null, {});
    console.log('配置种子已回滚');
  }
};