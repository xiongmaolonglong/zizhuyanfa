# 广告工程全流程管理系统 - 开发规范

> 本文档用于指导 Claude Code 在本项目中编写代码。所有新代码必须遵循本规范。

## 项目结构

```
1.0/
├── backend/                  # Express + Sequelize 后端
│   ├── src/
│   │   ├── app.js            # 入口，中间件注册，路由挂载
│   │   ├── config/
│   │   │   └── database.js   # Sequelize 实例化，全局模型配置
│   │   ├── controllers/      # 请求处理，不含业务逻辑（仅编排）
│   │   ├── middleware/       # 认证、验证、错误处理等中间件
│   │   ├── models/           # Sequelize 模型 + 关联关系
│   │   │   └── index.js      # 统一导出 + 模型关联
│   │   ├── routes/           # Express 路由定义
│   │   │   └── index.js      # 路由聚合
│   │   ├── services/         # 可复用业务逻辑
│   │   ├── utils/            # 工具函数（纯函数，无副作用）
│   │   └── uploads/          # 文件上传目录
│   ├── tests/                # Jest 测试
│   └── package.json
├── admin-web/                # 管理后台（Vue 3 + Vite，待创建）
├── client-web/               # 客户端网页（Vue 3 + Vite，待创建）
├── miniprogram/              # 微信小程序（待创建）
└── docs/                     # 设计文档、规格说明
```

## 后端开发规范

### 1. 代码风格

- **使用 CommonJS**（`require` / `module.exports`），不用 ESM
- **2 空格缩进**
- **单引号**，末尾分号
- **函数命名**：`camelCase`，动词开头（`getUser`、`createOrder`）
- **常量命名**：`UPPER_SNAKE_CASE`
- **文件命名**：`camelCase.js`（控制器用 `xxxController.js`，模型用 `PascalCase.js`）

### 2. 模型规范（Sequelize）

```javascript
// models/Example.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('Example', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  // 字段用 snake_case（数据库列名），由 underscored: true 自动转换
  title: { type: DataTypes.STRING(200), allowNull: false },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'completed'),
    defaultValue: 'draft',
  },
}, {
  tableName: 'examples',         // 复数表名
  underscored: true,             // 自动 camelCase → snake_case
  paranoid: true,                // 软删除（deletedAt）
  freezeTableName: true,         // 禁止 Sequelize 自动复数化
  charset: 'utf8mb4',
});
```

**规则**：
- 所有模型在 `models/index.js` 中统一定义关联关系
- 不在单个模型文件里写 `hasOne/hasMany/belongsTo`
- 软删除用 `paranoid: true`，不用物理删除
- 时间戳字段由 Sequelize 自动管理（`createdAt`, `updatedAt`, `deletedAt`）

### 3. Controller 规范

- Controller 只做请求编排，不含业务逻辑
- 业务逻辑放到 `services/`
- 所有响应必须通过 `utils/response.js` 的工具函数

```javascript
// controllers/exampleController.js
const Example = require('../models/Example');
const { success, error, paginate } = require('../utils/response');

async function getList(req, res) {
  try {
    const { page = 1, pageSize = 20, keyword } = req.query;
    const offset = (page - 1) * pageSize;

    const where = {};
    if (keyword) {
      where.title = { [require('sequelize').Op.like]: `%${keyword}%` }
    }

    const { rows, count } = await Example.findAndCountAll({
      where,
      limit: parseInt(pageSize),
      offset,
      order: [['created_at', 'DESC']],
    });

    return paginate(res, rows, {
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (err) {
    console.error('Get list error:', err);
    return error(res, '获取列表失败，请稍后重试');
  }
}

module.exports = { getList };
```

**规则**：
- 每个方法独立 try-catch
- 错误不暴露内部细节，返回通用提示
- 错误日志用 `console.error` + 描述性前缀
- 参数校验用 `middleware/validate.js`，不在 controller 里手写校验

### 4. 路由规范

```javascript
// routes/example.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/exampleController');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(requireAuth);

router.get('/', ctrl.getList);
router.post('/', validate({
  title: { required: true, type: 'string', max: 200 },
  status: { type: 'string', enum: ['draft', 'active', 'completed'] },
}), ctrl.create);

module.exports = router;
```

**规则**：
- 路由文件只定义路径 + 中间件 + 控制器绑定
- 不含任何业务逻辑
- 认证中间件在路由层挂载，不在 app.js 全局挂
- 路由聚合在 `routes/index.js`

### 5. Service 规范

- 纯业务逻辑，不接触 `req` / `res`
- 返回数据对象或抛出自定义错误
- 可被多个 controller 复用

```javascript
// services/workOrderNoService.js
const { v4: uuidv4 } = require('uuid');

function generateOrderNo() {
  const date = new Date();
  const prefix = `WO${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const suffix = uuidv4().slice(0, 8).toUpperCase();
  return `${prefix}-${suffix}`;
}

module.exports = { generateOrderNo };
```

### 6. 中间件规范

- 每个中间件单一职责
- 认证、验证、权限分离为不同文件
- 错误处理中间件必须在最后（已在 app.js 处理）

```javascript
// middleware/something.js
function something(req, res, next) {
  // 逻辑
  next();
}

module.exports = { something };
```

### 7. 错误处理

所有错误通过 `errorHandler.js` 统一处理：

```javascript
// 已知错误：在 controller 中直接 return error(res, message, status)
// 未知错误：throw / next(err)，由 errorHandler 兜底
```

**HTTP 状态码约定**：

| 状态码 | 含义 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未登录 / token 无效 |
| 403 | 已登录但无权限 |
| 404 | 资源不存在 |
| 409 | 数据冲突（如唯一约束） |
| 500 | 服务器内部错误 |

**响应格式**：

```json
// 成功
{ "code": 0, "message": "操作成功", "data": {...} }

// 成功（分页）
{ "code": 0, "message": "操作成功", "data": [...], "pagination": {...} }

// 错误
{ "code": 400, "error": "手机号或密码错误", "details": [...] }
```

### 8. 数据库

- 数据库：MySQL 8.0, `localhost:3306`, root, 空密码
- 开发环境用 `sequelize.sync({ alter: true })` 自动同步表结构
- 生产环境用 Sequelize migrations（待引入）
- 所有查询用 Sequelize ORM，不手写 SQL
- 复杂查询用 `sequelize.query()` 但需注释说明原因

### 9. 认证

- JWT 认证，token 放在 `Authorization: Bearer <token>`
- 三种认证中间件：
  - `requireAuth` — 任一类型用户登录即可
  - `requireTenant` — 仅广告商员工
  - `requireClient` — 仅甲方人员
- JWT 密钥通过环境变量 `JWT_SECRET` 配置

### 10. 文件上传

- 使用 multer
- 上传目录：`backend/uploads/`
- 静态文件服务：`/uploads` 路径映射到 `backend/uploads/`
- 文件名用 `uuid` 避免冲突

### 11. 测试

- Jest + Supertest
- 测试文件：`tests/`
- 运行：`npm test`
- 监听模式：`npm run test:watch`
- 每个 controller 至少有一个基础测试

### 12. 环境变量

```env
# .env（不提交到 git）
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ad_workflow
DB_USER=root
DB_PASSWORD=
JWT_SECRET=your-secret-here
JWT_EXPIRES_IN=7d
```

### 13. Git 规范

- 提交信息用中文
- 格式：`类型: 描述`
- 类型：`feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- 示例：`feat: 添加工单申报 API`

### 14. 新建模块的标准流程

添加一个新模块（如"合同管理"）：

1. **Model**: `models/Contract.js` → 在 `models/index.js` 定义关联
2. **Service**: `services/contractService.js`（如有可复用逻辑）
3. **Controller**: `controllers/contractController.js`
4. **Middleware**: `middleware/validate.js` 中加验证规则（或新建）
5. **Routes**: `routes/contract.js` → 在 `routes/index.js` 挂载
6. **Tests**: `tests/contract.test.js`

### 15. 禁止事项

- 不在 controller 里直接操作数据库（必须通过 model / service）
- 不在路由里写业务逻辑
- 不暴露密码、token 等敏感字段
- 不在代码中硬编码密钥（用环境变量）
- 不跳过参数校验
- 不用 `console.log` 打印敏感信息
- 不直接 `res.json()` 返回，统一用 `response.js` 工具
- 不物理删除数据（用软删除）

## 前端开发规范（待创建后补充）

## 小程序开发规范（待创建后补充）
