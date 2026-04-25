const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('ad_workflow', 'root', '', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false,
});

async function migrate() {
  const queryInterface = sequelize.getQueryInterface();

  try {
    const tableInfo = await queryInterface.describeTable('form_configs');

    if (!tableInfo.parent_key) {
      await queryInterface.addColumn('form_configs', 'parent_key', {
        type: 'VARCHAR(50)',
        allowNull: true,
        comment: '父级字段 key（用于 subform 子项关联）',
      });
      console.log('✓ 添加 parent_key 字段');
    } else {
      console.log('- parent_key 字段已存在');
    }

    if (!tableInfo.subform_template) {
      await queryInterface.addColumn('form_configs', 'subform_template', {
        type: 'JSON',
        allowNull: true,
        comment: '子表单模板定义（JSON）',
      });
      console.log('✓ 添加 subform_template 字段');
    } else {
      console.log('- subform_template 字段已存在');
    }

    console.log('✓ 迁移完成');
  } catch (err) {
    console.error('迁移失败:', err.message);
  } finally {
    await sequelize.close();
  }
}

migrate();
