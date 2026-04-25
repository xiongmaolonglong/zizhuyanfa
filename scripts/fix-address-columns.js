/**
 * 修复 wo_declarations 表字段长度不足问题
 * full_address: VARCHAR(500) → VARCHAR(1000)
 * detail_address: VARCHAR(200) → VARCHAR(500)
 */
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('ad_workflow', 'root', '', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: console.log,
});

async function migrate() {
  console.log('开始修复 wo_declarations 字段长度...');
  try {
    await sequelize.query(
      'ALTER TABLE `wo_declarations` MODIFY COLUMN `full_address` VARCHAR(1000);'
    );
    console.log('  full_address → VARCHAR(1000)');

    await sequelize.query(
      'ALTER TABLE `wo_declarations` MODIFY COLUMN `detail_address` VARCHAR(500);'
    );
    console.log('  detail_address → VARCHAR(500)');

    console.log('修复完成');
  } catch (err) {
    console.error('修复失败:', err.message);
  } finally {
    await sequelize.close();
  }
}

migrate();
