# 后端 API 实现计划

> **面向 AI 代理的工作者：** 使用 superpowers:subagent-driven-development 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 构建广告工程全流程系统的核心后端 API，包括多租户架构、认证、工单流转及全部业务接口

**架构：** Express.js + MySQL + Sequelize ORM，中间件实现多租户隔离和 JWT 认证，所有业务表通过 `tenant_id` 区分租户

**技术栈：** Express.js 4.x, Sequelize 6.x, MySQL 8.0, JWT, bcrypt, multer, jest, supertest

**测试约定：** 后端测试用 jest + supertest，测试文件放在 `tests/` 目录，命名格式 `<module>.test.js`。每个 API 端点写集成测试。前端测试用 vitest + vue-test-utils。

---

## 任务 1：项目初始化

**文件：**
- 创建：`backend/package.json`
- 创建：`backend/.env.example`
- 创建：`backend/.gitignore`
- 创建：`backend/jest.config.js`
- 创建：`backend/src/app.js`
- 创建：`backend/src/config/database.js`

- [ ] **步骤 1：创建 package.json**

```bash
cd backend && npm init -y
```

```bash
npm install express mysql2 sequelize dotenv bcrypt jsonwebtoken multer cors morgan helmet express-rate-limit uuid
npm install -D jest supertest nodemon
```

更新 `package.json` 的 scripts:
```json
{
  "scripts": {
    "dev": "nodemon src/app.js",
    "start": "node src/app.js",
    "test": "jest --runInBand --forceExit",
    "test:watch": "jest --watch"
  }
}
```

- [ ] **步骤 2：创建 .env.example**

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ad_workflow
DB_USER=root
DB_PASSWORD=
JWT_SECRET=change-me-to-random-string
JWT_EXPIRES_IN=24h
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

- [ ] **步骤 3：创建 .gitignore**

```
node_modules/
.env
uploads/
coverage/
*.log
.DS_Store
```

- [ ] **步骤 4：创建 jest.config.js**

```js
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/app.js'],
  coverageDirectory: 'coverage',
};
```

- [ ] **步骤 5：创建 src/config/database.js**

```js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true,
    },
  }
);

module.exports = sequelize;
```

- [ ] **步骤 6：创建 src/app.js**

```js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const sequelize = require('./config/database');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Database synced');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

module.exports = app;
if (require.main === module) start();
```

- [ ] **步骤 7：编写健康检查测试**

创建 `tests/app.test.js`:
```js
const request = require('supertest');
const app = require('../src/app');

describe('App', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
```

- [ ] **步骤 8：运行测试验证**

```bash
cd backend && npm test
```
预期：PASS（需先配置测试数据库或 mock sequelize）

- [ ] **步骤 9：Commit**

```bash
git add backend/
git commit -m "feat: 初始化后端项目，Express + Sequelize 基础架构"
```

---

## 任务 2：数据库模型 - 租户与用户

**文件：**
- 创建：`backend/src/models/index.js`
- 创建：`backend/src/models/Tenant.js`
- 创建：`backend/src/models/TenantRegion.js`
- 创建：`backend/src/models/TenantDepartment.js`
- 创建：`backend/src/models/TenantUser.js`
- 创建：`backend/src/models/Client.js`
- 创建：`backend/src/models/ClientUser.js`
- 创建：`backend/src/models/ClientDepartment.js`
- 创建：`backend/src/models/ClientRegion.js`
- 创建：`backend/src/models/AddressDict.js`

- [ ] **步骤 1：创建 models/index.js（模型关联入口）**

```js
const sequelize = require('../config/database');
const Tenant = require('./Tenant');
const TenantRegion = require('./TenantRegion');
const TenantDepartment = require('./TenantDepartment');
const TenantUser = require('./TenantUser');
const Client = require('./Client');
const ClientUser = require('./ClientUser');
const ClientDepartment = require('./ClientDepartment');
const ClientRegion = require('./ClientRegion');
const AddressDict = require('./AddressDict');
const WorkOrder = require('./WorkOrder');
const WorkOrderLog = require('./WorkOrderLog');
const WoDeclaration = require('./WoDeclaration');
const WoApproval = require('./WoApproval');
const WoAssignment = require('./WoAssignment');
const WoMeasurement = require('./WoMeasurement');
const WoDesign = require('./WoDesign');
const WoProduction = require('./WoProduction');
const WoConstruction = require('./WoConstruction');
const WoFinance = require('./WoFinance');
const WoArchive = require('./WoArchive');
const WoAftersale = require('./WoAftersale');
const Notification = require('./Notification');

// 租户关联
Tenant.hasMany(TenantRegion, { foreignKey: 'tenant_id', as: 'regions' });
TenantRegion.belongsTo(Tenant, { foreignKey: 'tenant_id' });

Tenant.hasMany(TenantDepartment, { foreignKey: 'tenant_id', as: 'departments' });
TenantDepartment.belongsTo(Tenant, { foreignKey: 'tenant_id' });

Tenant.hasMany(TenantUser, { foreignKey: 'tenant_id', as: 'users' });
TenantUser.belongsTo(Tenant, { foreignKey: 'tenant_id' });
TenantUser.belongsTo(TenantDepartment, { foreignKey: 'department_id', as: 'department' });

Tenant.hasMany(Client, { foreignKey: 'tenant_id', as: 'clients' });
Client.belongsTo(Tenant, { foreignKey: 'tenant_id' });

Client.hasMany(ClientUser, { foreignKey: 'client_id', as: 'users' });
ClientUser.belongsTo(Client, { foreignKey: 'client_id' });

Client.hasMany(ClientDepartment, { foreignKey: 'client_id', as: 'departments' });
ClientDepartment.belongsTo(Client, { foreignKey: 'client_id' });

ClientDepartment.hasMany(ClientUser, { foreignKey: 'department_id', as: 'members' });
ClientUser.belongsTo(ClientDepartment, { foreignKey: 'department_id', as: 'department' });

Client.hasMany(ClientRegion, { foreignKey: 'client_id', as: 'regions' });
ClientRegion.belongsTo(Client, { foreignKey: 'client_id' });
ClientRegion.belongsTo(ClientUser, { foreignKey: 'user_id', as: 'user' });

// 工单关联
Tenant.hasMany(WorkOrder, { foreignKey: 'tenant_id', as: 'workOrders' });
WorkOrder.belongsTo(Tenant, { foreignKey: 'tenant_id' });

WorkOrder.hasMany(WorkOrderLog, { foreignKey: 'work_order_id', as: 'logs' });
WorkOrderLog.belongsTo(WorkOrder, { foreignKey: 'work_order_id' });

WorkOrder.hasOne(WoDeclaration, { foreignKey: 'work_order_id', as: 'declaration' });
WoDeclaration.belongsTo(WorkOrder, { foreignKey: 'work_order_id' });

WorkOrder.hasOne(WoApproval, { foreignKey: 'work_order_id', as: 'approval' });
WoApproval.belongsTo(WorkOrder, { foreignKey: 'work_order_id' });

WorkOrder.hasOne(WoAssignment, { foreignKey: 'work_order_id', as: 'assignment' });
WoAssignment.belongsTo(WorkOrder, { foreignKey: 'work_order_id' });
WoAssignment.belongsTo(TenantUser, { foreignKey: 'assignee_id', as: 'assignee' });

WorkOrder.hasOne(WoMeasurement, { foreignKey: 'work_order_id', as: 'measurement' });
WoMeasurement.belongsTo(WorkOrder, { foreignKey: 'work_order_id' });

WorkOrder.hasOne(WoDesign, { foreignKey: 'work_order_id', as: 'design' });
WoDesign.belongsTo(WorkOrder, { foreignKey: 'work_order_id' });

WorkOrder.hasOne(WoProduction, { foreignKey: 'work_order_id', as: 'production' });
WoProduction.belongsTo(WorkOrder, { foreignKey: 'work_order_id' });

WorkOrder.hasOne(WoConstruction, { foreignKey: 'work_order_id', as: 'construction' });
WoConstruction.belongsTo(WorkOrder, { foreignKey: 'work_order_id' });

WorkOrder.hasOne(WoFinance, { foreignKey: 'work_order_id', as: 'finance' });
WoFinance.belongsTo(WorkOrder, { foreignKey: 'work_order_id' });

WorkOrder.hasOne(WoArchive, { foreignKey: 'work_order_id', as: 'archive' });
WoArchive.belongsTo(WorkOrder, { foreignKey: 'work_order_id' });

WorkOrder.hasMany(WoAftersale, { foreignKey: 'work_order_id', as: 'aftersales' });
WoAftersale.belongsTo(WorkOrder, { foreignKey: 'work_order_id' });

module.exports = {
  sequelize,
  Tenant, TenantRegion, TenantDepartment, TenantUser,
  Client, ClientUser, ClientDepartment, ClientRegion,
  AddressDict, WorkOrder, WorkOrderLog,
  WoDeclaration, WoApproval, WoAssignment, WoMeasurement,
  WoDesign, WoProduction, WoConstruction, WoFinance,
  WoArchive, WoAftersale, Notification,
};
```

- [ ] **步骤 2：创建所有模型文件**

`backend/src/models/Tenant.js`:
```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('Tenant', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  contact_name: { type: DataTypes.STRING(50) },
  contact_phone: { type: DataTypes.STRING(20) },
  contact_email: { type: DataTypes.STRING(100) },
  status: { type: DataTypes.ENUM('active', 'suspended', 'expired'), defaultValue: 'active' },
  max_users: { type: DataTypes.INTEGER, defaultValue: 50 },
  order_code_prefix: { type: DataTypes.STRING(20), defaultValue: 'GG' },
  order_code_seq: { type: DataTypes.INTEGER, defaultValue: 0 },
  modules: { type: DataTypes.JSON, defaultValue: ['all'] },
}, {
  tableName: 'tenants',
});
```

`backend/src/models/TenantRegion.js`:
```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('TenantRegion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  province_code: { type: DataTypes.STRING(20), allowNull: false },
  city_code: { type: DataTypes.STRING(20), allowNull: false },
  district_code: { type: DataTypes.STRING(20) },
  street_code: { type: DataTypes.STRING(20) },
}, {
  tableName: 'tenant_regions',
});
```

`backend/src/models/TenantDepartment.js`:
```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('TenantDepartment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  manager_id: { type: DataTypes.INTEGER },
  region_codes: { type: DataTypes.JSON },
}, {
  tableName: 'tenant_departments',
});
```

`backend/src/models/TenantUser.js`:
```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

module.exports = sequelize.define('TenantUser', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(50), allowNull: false },
  phone: { type: DataTypes.STRING(20), unique: true },
  email: { type: DataTypes.STRING(100) },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'dispatcher', 'measurer', 'designer', 'producer', 'constructor', 'finance'), defaultValue: 'admin' },
  department_id: { type: DataTypes.INTEGER },
  status: { type: DataTypes.ENUM('active', 'disabled'), defaultValue: 'active' },
}, {
  tableName: 'tenant_users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) user.password_hash = await bcrypt.hash(user.password_hash, 10);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) user.password_hash = await bcrypt.hash(user.password_hash, 10);
    },
  },
});
```

`backend/src/models/Client.js`:
```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('Client', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  contact_name: { type: DataTypes.STRING(50) },
  contact_phone: { type: DataTypes.STRING(20) },
  address: { type: DataTypes.STRING(200) },
  status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
}, {
  tableName: 'clients',
});
```

`backend/src/models/ClientUser.js`:
```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

module.exports = sequelize.define('ClientUser', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(50), allowNull: false },
  phone: { type: DataTypes.STRING(20), unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('staff', 'manager'), defaultValue: 'staff' },
  department_id: { type: DataTypes.INTEGER },
  status: { type: DataTypes.ENUM('active', 'disabled'), defaultValue: 'active' },
}, {
  tableName: 'client_users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) user.password_hash = await bcrypt.hash(user.password_hash, 10);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) user.password_hash = await bcrypt.hash(user.password_hash, 10);
    },
  },
});
```

`backend/src/models/ClientDepartment.js`:
```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('ClientDepartment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  manager_id: { type: DataTypes.INTEGER },
}, {
  tableName: 'client_departments',
});
```

`backend/src/models/ClientRegion.js`:
```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('ClientRegion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  province_code: { type: DataTypes.STRING(20), allowNull: false },
  city_code: { type: DataTypes.STRING(20), allowNull: false },
  district_code: { type: DataTypes.STRING(20) },
  street_code: { type: DataTypes.STRING(20) },
}, {
  tableName: 'client_regions',
});
```

`backend/src/models/AddressDict.js`:
```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('AddressDict', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(20), unique: true, allowNull: false },
  parent_code: { type: DataTypes.STRING(20) },
  level: { type: DataTypes.ENUM('province', 'city', 'district', 'street'), allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  children: { type: DataTypes.JSON },
}, {
  tableName: 'address_dict',
});
```

- [ ] **步骤 3：Commit**

```bash
git add backend/src/models/
git commit -m "feat: 创建租户、用户、客户、地址数据库模型"
```

---

## 任务 3：数据库模型 - 工单及环节

**文件：**
- 创建：`backend/src/models/WorkOrder.js`
- 创建：`backend/src/models/WorkOrderLog.js`
- 创建：`backend/src/models/WoDeclaration.js`
- 创建：`backend/src/models/WoApproval.js`
- 创建：`backend/src/models/WoAssignment.js`
- 创建：`backend/src/models/WoMeasurement.js`
- 创建：`backend/src/models/WoDesign.js`
- 创建：`backend/src/models/WoProduction.js`
- 创建：`backend/src/models/WoConstruction.js`
- 创建：`backend/src/models/WoFinance.js`
- 创建：`backend/src/models/WoArchive.js`
- 创建：`backend/src/models/WoAftersale.js`
- 创建：`backend/src/models/Notification.js`

- [ ] **步骤 1：创建 WorkOrder.js（工单主表）**

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('WorkOrder', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  order_no: { type: DataTypes.STRING(30), unique: true, allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  project_type: { type: DataTypes.STRING(50) },
  status: { type: DataTypes.ENUM(
    'draft', 'submitted', 'pending_approval', 'approved',
    'received', 'assigned', 'measuring', 'measured',
    'designing', 'design_reviewing', 'design_approved', 'design_rejected', 'design_confirmed',
    'production_scheduled', 'producing', 'production_completed', 'shipped',
    'construction_scheduled', 'installing', 'construction_completed', 'accepted',
    'quoting', 'quoted', 'paid', 'invoiced',
    'archiving', 'archived',
    'aftersale_pending', 'aftersale_processing', 'aftersale_resolved', 'aftersale_closed'
  ), defaultValue: 'draft' },
  current_stage: { type: DataTypes.ENUM(
    'declaration', 'approval', 'assignment', 'measurement', 'design',
    'production', 'construction', 'finance', 'archive', 'aftersale'
  ), defaultValue: 'declaration' },
  province_code: { type: DataTypes.STRING(20) },
  city_code: { type: DataTypes.STRING(20) },
  district_code: { type: DataTypes.STRING(20) },
  street_code: { type: DataTypes.STRING(20) },
  address_detail: { type: DataTypes.STRING(500) },
  client_id: { type: DataTypes.INTEGER },
  client_user_id: { type: DataTypes.INTEGER },
  description: { type: DataTypes.TEXT },
  deadline: { type: DataTypes.DATE },
}, {
  tableName: 'work_orders',
});
```

- [ ] **步骤 2：创建 WorkOrderLog.js**

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('WorkOrderLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  action: { type: DataTypes.STRING(50), allowNull: false },
  stage: { type: DataTypes.STRING(30), allowNull: false },
  operator_type: { type: DataTypes.ENUM('tenant', 'client', 'system') },
  operator_id: { type: DataTypes.INTEGER },
  operator_name: { type: DataTypes.STRING(50) },
  remark: { type: DataTypes.TEXT },
}, {
  tableName: 'work_order_logs',
});
```

- [ ] **步骤 3：创建 WoDeclaration.js（申报单）**

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('WoDeclaration', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  photos: { type: DataTypes.JSON },
  attachments: { type: DataTypes.JSON },
  submitter_id: { type: DataTypes.INTEGER },
  submitter_name: { type: DataTypes.STRING(50) },
}, {
  tableName: 'wo_declarations',
});
```

- [ ] **步骤 4：创建 WoApproval.js**

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('WoApproval', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  approver_id: { type: DataTypes.INTEGER },
  approver_name: { type: DataTypes.STRING(50) },
  action: { type: DataTypes.ENUM('approved', 'rejected') },
  comment: { type: DataTypes.TEXT },
  approved_at: { type: DataTypes.DATE },
}, {
  tableName: 'wo_approvals',
});
```

- [ ] **步骤 5：创建 WoAssignment.js**

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('WoAssignment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  assignee_id: { type: DataTypes.INTEGER },
  assignee_name: { type: DataTypes.STRING(50) },
  assigned_by: { type: DataTypes.INTEGER },
  assigned_at: { type: DataTypes.DATE },
  deadline: { type: DataTypes.DATE },
}, {
  tableName: 'wo_assignments',
});
```

- [ ] **步骤 6：创建 WoMeasurement.js**

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('WoMeasurement', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  data: { type: DataTypes.JSON },
  photos: { type: DataTypes.JSON },
  signature_url: { type: DataTypes.STRING(500) },
  measurer_id: { type: DataTypes.INTEGER },
  completed_at: { type: DataTypes.DATE },
  reviewer_id: { type: DataTypes.INTEGER },
  review_comment: { type: DataTypes.TEXT },
}, {
  tableName: 'wo_measurements',
});
```

- [ ] **步骤 7：创建 WoDesign.js**

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('WoDesign', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  images: { type: DataTypes.JSON },
  designer_id: { type: DataTypes.INTEGER },
  designer_name: { type: DataTypes.STRING(50) },
  reviewer_id: { type: DataTypes.INTEGER },
  review_comment: { type: DataTypes.TEXT },
  client_confirmed: { type: DataTypes.BOOLEAN, defaultValue: false },
  confirmed_at: { type: DataTypes.DATE },
}, {
  tableName: 'wo_designs',
});
```

- [ ] **步骤 8：创建 WoProduction.js**

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('WoProduction', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  material_list: { type: DataTypes.JSON },
  schedule_date: { type: DataTypes.DATE },
  quality_check: { type: DataTypes.JSON },
  shipped_at: { type: DataTypes.DATE },
  shipping_info: { type: DataTypes.JSON },
}, {
  tableName: 'wo_production',
});
```

- [ ] **步骤 9：创建 WoConstruction.js**

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('WoConstruction', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  records: { type: DataTypes.JSON },
  issues: { type: DataTypes.JSON },
  signature_url: { type: DataTypes.STRING(500) },
  constructor_id: { type: DataTypes.INTEGER },
  completed_at: { type: DataTypes.DATE },
  accepted_at: { type: DataTypes.DATE },
}, {
  tableName: 'wo_construction',
});
```

- [ ] **步骤 10：创建 WoFinance.js**

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('WoFinance', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  quote_amount: { type: DataTypes.DECIMAL(10, 2) },
  quote_detail: { type: DataTypes.JSON },
  payments: { type: DataTypes.JSON },
  invoices: { type: DataTypes.JSON },
}, {
  tableName: 'wo_finance',
});
```

- [ ] **步骤 11：创建 WoArchive.js**

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('WoArchive', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  summary: { type: DataTypes.JSON },
  report_url: { type: DataTypes.STRING(500) },
  archived_at: { type: DataTypes.DATE },
  archived_by: { type: DataTypes.INTEGER },
}, {
  tableName: 'wo_archives',
});
```

- [ ] **步骤 12：创建 WoAftersale.js**

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('WoAftersale', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  description: { type: DataTypes.TEXT, allowNull: false },
  photos: { type: DataTypes.JSON },
  handler_id: { type: DataTypes.INTEGER },
  handler_name: { type: DataTypes.STRING(50) },
  process_records: { type: DataTypes.JSON },
  satisfaction: { type: DataTypes.INTEGER },
  resolved_at: { type: DataTypes.DATE },
  closed_at: { type: DataTypes.DATE },
}, {
  tableName: 'wo_aftersales',
});
```

- [ ] **步骤 13：创建 Notification.js**

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_type: { type: DataTypes.ENUM('tenant', 'client') },
  user_id: { type: DataTypes.INTEGER },
  type: { type: DataTypes.ENUM('approval_pending', 'status_change', 'acceptance_request', 'aftersale_feedback') },
  title: { type: DataTypes.STRING(200), allowNull: false },
  content: { type: DataTypes.TEXT },
  work_order_id: { type: DataTypes.INTEGER },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  read_at: { type: DataTypes.DATE },
}, {
  tableName: 'notifications',
});
```

- [ ] **步骤 14：Commit**

```bash
git add backend/src/models/
git commit -m "feat: 创建工单全流程数据库模型"
```

---

## 任务 4：中间件 - 认证与多租户

**文件：**
- 创建：`backend/src/middleware/auth.js`
- 创建：`backend/src/middleware/tenant.js`
- 创建：`backend/src/middleware/errorHandler.js`
- 创建：`backend/src/middleware/validate.js`

- [ ] **步骤 1：创建 auth.js**

```js
const jwt = require('jsonwebtoken');

function authMiddleware(userType = 'tenant') {
  return (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: '未提供认证令牌' });

    try {
      const secret = userType === 'client'
        ? process.env.JWT_SECRET_CLIENT || process.env.JWT_SECRET
        : process.env.JWT_SECRET;
      const payload = jwt.verify(token, secret);
      req.user = { ...payload, type: userType };
      next();
    } catch (err) {
      res.status(401).json({ error: '认证令牌无效' });
    }
  };
}

function adminAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '未提供认证令牌' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET_ADMIN || process.env.JWT_SECRET);
    req.user = { ...payload, type: 'admin' };
    next();
  } catch (err) {
    res.status(401).json({ error: '认证令牌无效' });
  }
}

module.exports = { authMiddleware, adminAuth };
```

- [ ] **步骤 2：创建 tenant.js**

```js
function tenantMiddleware(req, res, next) {
  if (req.user && req.user.tenant_id) {
    req.tenantId = req.user.tenant_id;
  } else if (req.params.tenantId) {
    req.tenantId = parseInt(req.params.tenantId);
  } else if (req.user && req.user.type === 'client') {
    // 甲方用户通过 client_id 反查 tenant_id
    req.clientId = req.user.client_id;
  }
  next();
}

function requireTenant(req, res, next) {
  if (!req.tenantId) return res.status(403).json({ error: '租户信息缺失' });
  next();
}

module.exports = { tenantMiddleware, requireTenant };
```

- [ ] **步骤 3：创建 errorHandler.js**

```js
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ error: '数据验证失败', details: err.errors.map(e => e.message) });
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: '数据冲突', details: err.errors.map(e => e.message) });
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ error: '关联数据不存在' });
  }
  res.status(err.status || 500).json({ error: err.message || '服务器内部错误' });
}

module.exports = errorHandler;
```

- [ ] **步骤 4：创建 validate.js**

```js
function validate(schema) {
  return (req, res, next) => {
    const errors = [];
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} 为必填项`);
      }
      if (rules.type && value !== undefined && typeof value !== rules.type) {
        errors.push(`${field} 类型错误，期望 ${rules.type}`);
      }
      if (rules.max && value && value.length > rules.max) {
        errors.push(`${field} 长度不能超过 ${rules.max}`);
      }
    }
    if (errors.length > 0) return res.status(400).json({ error: '验证失败', details: errors });
    next();
  };
}

module.exports = { validate };
```

- [ ] **步骤 5：将中间件接入 app.js**

修改 `backend/src/app.js`，在路由挂载前添加：
```js
const errorHandler = require('./middleware/errorHandler');
// ... 在路由挂载之后 ...
app.use(errorHandler);
```

- [ ] **步骤 6：编写中间件测试**

创建 `tests/middleware.test.js`，测试认证拦截、tenant 注入、错误处理。

- [ ] **步骤 7：Commit**

```bash
git add backend/src/middleware/
git commit -m "feat: 实现 JWT 认证、多租户中间件、错误处理"
```

---

## 任务 5：工单编号生成服务

**文件：**
- 创建：`backend/src/utils/orderCode.js`

- [ ] **步骤 1：创建 orderCode.js**

```js
const { Tenant, WorkOrder } = require('../models');
const { Op } = require('sequelize');

async function generateOrderCode(tenantId) {
  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) throw new Error('租户不存在');

  const prefix = tenant.order_code_prefix || 'GG';
  const year = new Date().getFullYear();

  const count = await WorkOrder.count({
    where: {
      tenant_id: tenantId,
      order_no: { [Op.like]: `${prefix}-${year}-%` },
    },
  });

  const seq = (count + 1).toString().padStart(6, '0');
  return `${prefix}-${year}-${seq}`;
}

module.exports = { generateOrderCode };
```

- [ ] **步骤 2：编写测试**

创建 `tests/orderCode.test.js`

- [ ] **步骤 3：Commit**

```bash
git add backend/src/utils/orderCode.js backend/tests/orderCode.test.js
git commit -m "feat: 实现自定义工单编号生成器"
```

---

## 任务 6：认证 API

**文件：**
- 创建：`backend/src/routes/auth.js`
- 创建：`backend/src/controllers/authController.js`
- 修改：`backend/src/app.js`（挂载 /api/v1/auth 路由）

- [ ] **步骤 1：创建 authController.js**

实现以下接口：
- `POST /api/v1/auth/tenant/login` - 广告商登录
- `POST /api/v1/auth/client/login` - 甲方登录
- `POST /api/v1/auth/tenant/change-password` - 修改密码
- `POST /api/v1/auth/client/change-password` - 修改密码

- [ ] **步骤 2：创建 routes/auth.js**

```js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/tenant/login', authController.tenantLogin);
router.post('/client/login', authController.clientLogin);
router.post('/tenant/change-password', authMiddleware('tenant'), authController.tenantChangePassword);
router.post('/client/change-password', authMiddleware('client'), authController.clientChangePassword);

module.exports = router;
```

- [ ] **步骤 3：接入 app.js**

```js
const authRoutes = require('./routes/auth');
app.use('/api/v1/auth', authRoutes);
```

- [ ] **步骤 4：编写认证测试**

创建 `tests/auth.test.js`

- [ ] **步骤 5：Commit**

```bash
git add backend/src/routes/auth.js backend/src/controllers/authController.js backend/tests/auth.test.js
git commit -m "feat: 实现广告商和甲方 JWT 认证 API"
```

---

## 任务 7：租户管理 API（广告商后台）

**文件：**
- 创建：`backend/src/routes/tenants.js`
- 创建：`backend/src/controllers/tenantController.js`
- 创建：`backend/src/routes/departments.js`
- 创建：`backend/src/controllers/departmentController.js`
- 创建：`backend/src/routes/users.js`
- 创建：`backend/src/controllers/userController.js`

- [ ] **步骤 1：实现 tenantController.js**

实现 CRUD：
- `GET /api/v1/tenants/me` - 获取当前租户信息
- `PUT /api/v1/tenants/me` - 更新租户信息（含编号规则配置）

- [ ] **步骤 2：实现 departmentController.js**

- `GET /api/v1/departments` - 部门列表
- `POST /api/v1/departments` - 创建部门（含管辖区域）
- `PUT /api/v1/departments/:id` - 更新部门
- `DELETE /api/v1/departments/:id` - 删除部门

- [ ] **步骤 3：实现 userController.js**

- `GET /api/v1/users` - 用户列表（分页、筛选）
- `POST /api/v1/users` - 创建用户
- `PUT /api/v1/users/:id` - 更新用户
- `DELETE /api/v1/users/:id` - 禁用/启用用户

- [ ] **步骤 4：编写测试**

创建 `tests/tenant.test.js`, `tests/department.test.js`, `tests/user.test.js`

- [ ] **步骤 5：Commit**

```bash
git add backend/src/routes/tenants.js backend/src/controllers/tenantController.js backend/src/routes/departments.js backend/src/controllers/departmentController.js backend/src/routes/users.js backend/src/controllers/userController.js backend/tests/
git commit -m "feat: 实现租户、部门、用户管理 API"
```

---

## 任务 8：地址字典 API

**文件：**
- 创建：`backend/src/routes/addresses.js`
- 创建：`backend/src/controllers/addressController.js`
- 创建：`backend/seeders/addressDict.js`

- [ ] **步骤 1：实现 addressController.js**

- `GET /api/v1/addresses` - 根据 parent_code 查询子级
- `GET /api/v1/addresses/tree` - 获取完整地址树（缓存）
- `GET /api/v1/addresses/:code` - 根据编码查详情

- [ ] **步骤 2：创建地址种子数据**

`backend/seeders/addressDict.js` - 导入国家统计局地址数据

- [ ] **步骤 3：编写测试 + Commit**

```bash
git add backend/src/routes/addresses.js backend/src/controllers/addressController.js backend/seeders/
git commit -m "feat: 实现四级地址字典 API"
```

---

## 任务 9：甲方管理 API（广告商后台）

**文件：**
- 创建：`backend/src/routes/clients.js`
- 创建：`backend/src/controllers/clientController.js`

- [ ] **步骤 1：实现 clientController.js**

- `GET /api/v1/clients` - 甲方列表
- `POST /api/v1/clients` - 创建甲方（含部门、用户）
- `GET /api/v1/clients/:id` - 甲方详情（含用户列表）
- `PUT /api/v1/clients/:id` - 更新甲方
- `DELETE /api/v1/clients/:id` - 删除甲方

- [ ] **步骤 2：编写测试 + Commit**

---

## 任务 10：工单核心 API

**文件：**
- 创建：`backend/src/routes/workOrders.js`
- 创建：`backend/src/controllers/workOrderController.js`
- 创建：`backend/src/services/workOrderService.js`

- [ ] **步骤 1：实现 workOrderService.js**

核心业务逻辑：
- `createOrder(tenantId, data)` - 创建工单（含编号生成、日志记录）
- `transitionStage(orderId, fromStage, toStage, userId)` - 状态流转验证
- `matchTenantByRegion(provinceCode, cityCode, districtCode, streetCode)` - 根据地址匹配广告商
- `getOrderTimeline(orderId)` - 获取工单完整时间轴

- [ ] **步骤 2：实现 workOrderController.js**

- `GET /api/v1/work-orders` - 工单列表（分页、多条件筛选）
- `GET /api/v1/work-orders/:id` - 工单详情（含全流程数据）
- `POST /api/v1/work-orders` - 创建工单
- `GET /api/v1/work-orders/stats` - 工单统计（看板数据）

- [ ] **步骤 3：编写测试 + Commit**

---

## 任务 11：工单环节 API - 申报与审批

**文件：**
- 创建：`backend/src/controllers/declarationController.js`
- 创建：`backend/src/controllers/approvalController.js`
- 创建：`backend/src/routes/declarations.js`
- 创建：`backend/src/routes/approvals.js`

- [ ] **步骤 1：实现申报 API（甲方端）**

- `POST /api/v1/declarations` - 创建申报单（含地址、照片、附件）
- `GET /api/v1/declarations` - 甲方申报列表
- `GET /api/v1/declarations/:id` - 申报详情（含全流程进度）

- [ ] **步骤 2：实现审批 API（甲方领导）**

- `POST /api/v1/approvals/:orderId/submit` - 提交审批（通过/驳回）
- `GET /api/v1/approvals/pending` - 待审批列表

- [ ] **步骤 3：审批通过后自动匹配广告商并推送**

在 `workOrderService.js` 中添加 `pushToTenant(orderId)` 方法

- [ ] **步骤 4：编写测试 + Commit**

---

## 任务 12：工单环节 API - 派单与测量

**文件：**
- 创建：`backend/src/controllers/assignmentController.js`
- 创建：`backend/src/controllers/measurementController.js`
- 创建：`backend/src/routes/assignments.js`
- 创建：`backend/src/routes/measurements.js`

- [ ] **步骤 1：实现派单 API**

- `GET /api/v1/assignments/pending` - 待派单列表
- `POST /api/v1/assignments/:orderId/assign` - 分配测量员
- `GET /api/v1/assignments` - 派单记录

- [ ] **步骤 2：实现测量 API**

- `POST /api/v1/measurements/:orderId` - 提交测量数据（APP/后台）
- `GET /api/v1/measurements/:orderId` - 查看测量结果
- `PUT /api/v1/measurements/:orderId/review` - 审核测量（通过/重测）
- `POST /api/v1/measurements/:orderId/sync` - APP 离线数据同步

- [ ] **步骤 3：编写测试 + Commit**

---

## 任务 13：工单环节 API - 设计

**文件：**
- 创建：`backend/src/controllers/designController.js`
- 创建：`backend/src/routes/designs.js`

- [ ] **步骤 1：实现设计 API**

- `POST /api/v1/designs/:orderId` - 上传设计稿
- `GET /api/v1/designs/:orderId` - 查看设计
- `PUT /api/v1/designs/:orderId/review` - 内部审核
- `PUT /api/v1/designs/:orderId/confirm` - 甲方确认

- [ ] **步骤 2：编写测试 + Commit**

---

## 任务 14：工单环节 API - 生产、施工、费用、归档、售后

**文件：**
- 创建：`backend/src/controllers/productionController.js`
- 创建：`backend/src/controllers/constructionController.js`
- 创建：`backend/src/controllers/financeController.js`
- 创建：`backend/src/controllers/archiveController.js`
- 创建：`backend/src/controllers/aftersaleController.js`
- 创建：`backend/src/routes/production.js`
- 创建：`backend/src/routes/construction.js`
- 创建：`backend/src/routes/finance.js`
- 创建：`backend/src/routes/archives.js`
- 创建：`backend/src/routes/aftersales.js`

- [ ] **步骤 1：批量实现各环节 API**

每个环节实现：提交/更新/查看 三个基本操作

- [ ] **步骤 2：编写测试 + Commit**

---

## 任务 15：文件上传 API

**文件：**
- 创建：`backend/src/routes/files.js`
- 创建：`backend/src/controllers/fileController.js`
- 创建：`backend/src/middleware/upload.js`

- [ ] **步骤 1：实现 upload.js 中间件**

使用 multer 配置，按 tenant_id 分目录存储

- [ ] **步骤 2：实现 fileController.js**

- `POST /api/v1/files` - 上传文件
- `GET /api/v1/files/:id` - 获取文件信息
- `DELETE /api/v1/files/:id` - 删除文件

- [ ] **步骤 3：接入 app.js**

```js
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
```

- [ ] **步骤 4：编写测试 + Commit**

---

## 任务 16：通知 API

**文件：**
- 创建：`backend/src/routes/notifications.js`
- 创建：`backend/src/controllers/notificationController.js`
- 创建：`backend/src/services/notificationService.js`

- [ ] **步骤 1：实现 notificationService.js**

- `createNotification(userType, userId, type, title, content, workOrderId)` - 创建通知
- `getUnreadCount(userType, userId)` - 未读数量

- [ ] **步骤 2：实现 notificationController.js**

- `GET /api/v1/notifications` - 通知列表
- `PUT /api/v1/notifications/:id/read` - 标记已读
- `GET /api/v1/notifications/unread-count` - 未读数量

- [ ] **步骤 3：在工单状态变更时自动创建通知**

在 `workOrderService.js` 的 `transitionStage` 中调用 `createNotification`

- [ ] **步骤 4：编写测试 + Commit**

---

## 任务 17：超级管理后台 API

**文件：**
- 创建：`backend/src/routes/admin/tenants.js`
- 创建：`backend/src/routes/admin/dashboard.js`
- 创建：`backend/src/routes/admin/workOrders.js`
- 创建：`backend/src/controllers/adminController.js`

- [ ] **步骤 1：实现 adminController.js**

- `GET /api/v1/admin/tenants` - 租户列表
- `POST /api/v1/admin/tenants` - 创建租户
- `PUT /api/v1/admin/tenants/:id/status` - 变更租户状态
- `GET /api/v1/admin/dashboard` - 全局统计
- `GET /api/v1/admin/work-orders` - 全局工单搜索
- `GET /api/v1/admin/clients` - 全局甲方查看

- [ ] **步骤 2：编写测试 + Commit**

---

## 任务 18：完整集成测试

**文件：**
- 创建：`tests/workflow.test.js`

- [ ] **步骤 1：编写全流程集成测试**

测试完整工单流转：
创建申报 → 甲方审批 → 自动匹配租户 → 派单 → 测量 → 设计 → 生产 → 施工 → 费用 → 归档 → 售后

- [ ] **步骤 2：运行完整测试套件**

```bash
cd backend && npm test
```
预期：ALL PASS

- [ ] **步骤 3：Commit**

```bash
git add backend/tests/workflow.test.js
git commit -m "test: 添加工单全流程集成测试"
```

---

## 数据库初始化脚本

**文件：**
- 创建：`backend/init.sql`

包含：建表语句（由 Sequelize 自动生成）、地址库初始数据导入、默认超级管理员账号
