// 临时迁移：为 wo_productions 表添加质检字段
const sequelize = require('../config/database')

async function migrate() {
  try {
    await sequelize.query('USE ad_workflow')
    await sequelize.query(`
      ALTER TABLE wo_productions
      ADD COLUMN IF NOT EXISTS quality_result ENUM('合格','不合格','待复检') NULL COMMENT '质检结果' AFTER status,
      ADD COLUMN IF NOT EXISTS quality_inspector VARCHAR(50) NULL COMMENT '检验员' AFTER quality_result,
      ADD COLUMN IF NOT EXISTS quality_date DATE NULL COMMENT '检验日期' AFTER quality_inspector
    `)
    console.log('质检字段迁移成功')
    process.exit(0)
  } catch (err) {
    console.error('迁移失败:', err)
    process.exit(1)
  }
}

migrate()
