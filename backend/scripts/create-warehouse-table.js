require('dotenv').config();
const sequelize = require('../src/config/database');

async function run() {
  await sequelize.authenticate();
  console.log('Database connected');

  const queries = [
    `CREATE TABLE IF NOT EXISTS wo_warehouse (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenant_id INT NOT NULL,
      work_order_id INT,
      production_id INT,
      type ENUM('inbound', 'outbound') NOT NULL,
      source ENUM('production', 'pickup', 'return') DEFAULT 'production',
      material_type VARCHAR(100),
      spec VARCHAR(200),
      quantity DECIMAL(10,2) NOT NULL,
      unit VARCHAR(20) DEFAULT '件',
      warehouse_location VARCHAR(100) COMMENT '库位/仓库名称',
      operator_id INT COMMENT '操作人ID',
      operator_name VARCHAR(50) COMMENT '操作人姓名',
      constructor_id INT COMMENT '施工队ID',
      constructor_name VARCHAR(100) COMMENT '施工队名称',
      notes TEXT,
      receipt_no VARCHAR(50) COMMENT '出入库单号',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME,
      INDEX idx_tenant (tenant_id),
      INDEX idx_type (type),
      INDEX idx_work_order (work_order_id),
      INDEX idx_receipt_no (receipt_no)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  ];

  for (const q of queries) {
    await sequelize.query(q);
    console.log('Executed:', q.substring(0, 80) + '...');
  }

  console.log('wo_warehouse table created successfully');
  process.exit(0);
}

run().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
