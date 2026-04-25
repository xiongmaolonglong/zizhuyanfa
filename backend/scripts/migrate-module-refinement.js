// 运行一次：为模块细化功能创建新表和字段
// 使用方式：node scripts/migrate-module-refinement.js
require('dotenv').config();
const sequelize = require('../src/config/database');

async function run() {
  console.log('开始数据库迁移...');

  // work_order_logs 新增字段
  await sequelize.query(`
    ALTER TABLE work_order_logs
    ADD COLUMN IF NOT EXISTS log_type VARCHAR(30) DEFAULT NULL COMMENT '操作类型',
    ADD COLUMN IF NOT EXISTS field_name VARCHAR(50) DEFAULT NULL COMMENT '变更字段名',
    ADD COLUMN IF NOT EXISTS old_value TEXT DEFAULT NULL COMMENT '变更前值',
    ADD COLUMN IF NOT EXISTS new_value TEXT DEFAULT NULL COMMENT '变更后值',
    ADD COLUMN IF NOT EXISTS amount_change DECIMAL(10,2) DEFAULT NULL COMMENT '金额变化'
  `).catch(err => console.log('work_order_logs ALTER:', err.message));

  // work_orders 新增质保期字段
  await sequelize.query(`
    ALTER TABLE work_orders
    ADD COLUMN IF NOT EXISTS warranty_end_date DATE DEFAULT NULL COMMENT '质保到期日'
  `).catch(err => console.log('work_orders ALTER:', err.message));

  // 新增 wo_change_logs 表
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS wo_change_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      work_order_id INT NOT NULL,
      change_type ENUM('material_change','size_change','add_item','remove_item','other') NOT NULL,
      description TEXT,
      reason TEXT,
      cost_impact DECIMAL(10,2) DEFAULT 0,
      approved_by VARCHAR(50),
      created_by INT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME DEFAULT NULL,
      INDEX idx_wo (work_order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `).catch(err => console.log('wo_change_logs CREATE:', err.message));

  // 新增 wo_materials 表
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS wo_materials (
      id INT AUTO_INCREMENT PRIMARY KEY,
      work_order_id INT NOT NULL,
      category VARCHAR(50),
      name VARCHAR(100) NOT NULL,
      spec VARCHAR(100),
      unit VARCHAR(20),
      quantity DECIMAL(10,2) NOT NULL,
      unit_price DECIMAL(10,2),
      total_price DECIMAL(10,2),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME DEFAULT NULL,
      INDEX idx_wo (work_order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `).catch(err => console.log('wo_materials CREATE:', err.message));

  // 新增 wo_construction_logs 表
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS wo_construction_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      work_order_id INT NOT NULL,
      log_date DATE NOT NULL,
      content TEXT,
      labor_count INT,
      labor_hours DECIMAL(5,1),
      problem_description TEXT,
      photos JSON,
      weather VARCHAR(20),
      created_by INT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME DEFAULT NULL,
      INDEX idx_wo (work_order_id),
      INDEX idx_date (log_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `).catch(err => console.log('wo_construction_logs CREATE:', err.message));

  // 新增 wo_production_progress 表
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS wo_production_progress (
      id INT AUTO_INCREMENT PRIMARY KEY,
      work_order_id INT NOT NULL,
      step_name VARCHAR(50) NOT NULL,
      progress_pct INT DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_wo (work_order_id),
      INDEX idx_step (step_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `).catch(err => console.log('wo_production_progress CREATE:', err.message));

  console.log('数据库迁移完成！');
  process.exit(0);
}

run().catch(err => {
  console.error('迁移失败:', err.message);
  process.exit(1);
});
