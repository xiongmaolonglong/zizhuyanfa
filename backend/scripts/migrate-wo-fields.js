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
    const tableInfo = await queryInterface.describeTable('work_orders');

    if (!tableInfo.custom_data) {
      await queryInterface.addColumn('work_orders', 'custom_data', {
        type: 'TEXT',
        comment: '自定义表单字段数据 JSON',
        after: 'remarks',
      });
      console.log('✓ 添加 custom_data 字段');
    } else {
      console.log('- custom_data 字段已存在');
    }

    console.log('✓ 迁移完成');
  } catch (err) {
    console.error('迁移失败:', err.message);
  } finally {
    await sequelize.close();
  }
}

migrate();
