# 全面修复实现计划

> **面向 AI 代理的工作者：** 逐任务实现此计划，步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 修复广告工程全流程管理系统中所有已发现的安全漏洞、功能缺陷、代码质量问题

**架构：** 分 4 个优先级批次修复：P0安全、P1数据完整性、P2前端UX、P3代码质量

**技术栈：** Node.js/Express/Sequelize（后端）+ Vue3/ElementPlus（前端）

---

## 文件清单

### 后端修复文件
| 文件 | 修复内容 |
|------|----------|
| `backend/.env` | JWT_SECRET 更新 |
| `backend/src/middleware/auth.js` | 超管登录逻辑修复 |
| `backend/src/controllers/authController.js` | 忘记密码验证、超管登录修复 |
| `backend/src/controllers/workOrderController.js` | findByPk+where 修复 |
| `backend/src/controllers/changeLogController.js` | 添加租户隔离 |
| `backend/src/controllers/materialController.js` | 添加租户隔离 |
| `backend/src/controllers/productionProgressController.js` | 添加租户隔离 |
| `backend/src/controllers/constructionLogController.js` | 添加租户隔离 |
| `backend/src/controllers/assignmentController.js` | 批量操作添加事务 |
| `backend/src/models/WoProductionProgress.js` | 移除 paranoid |
| `backend/src/models/TenantUser.js` | 添加 real_name 字段 |
| `backend/src/models/ClientUser.js` | 添加 real_name 字段 |
| `backend/src/routes/address.js` | 路由排序修复 |
| `backend/src/controllers/addressController.js` | 地址查询优化 |

### 前端修复文件
| 文件 | 修复内容 |
|------|----------|
| `admin-web/src/api/index.js` | 401 自动跳转 |
| `admin-web/src/router/index.js` | 添加 404 路由 |
| `admin-web/src/components/BatchOpsDialog.vue` | 删除二次确认 |
| `admin-web/src/components/StatsPanel.vue` | 使用 CSS 变量 |
| `admin-web/src/views/Dashboard.vue` | 真实数据、移除硬编码 |
| `admin-web/src/views/WorkOrderDetail.vue` | formatMoney 双重格式化 |
| `admin-web/src/views/Clients.vue` | catch 块显示错误提示 |
| `admin-web/src/views/Finance.vue` | 图表数据硬编码 |
| `admin-web/src/views/MeasureReview.vue` | catch 块修复 |

### 超管/其他修复文件
| 文件 | 修复内容 |
|------|----------|
| `super-admin/src/views/Login.vue` | 移除演示账号提示 |
| `super-admin/src/utils/request.js` | 删除死代码 |
| `backend/.env.example` | 创建示例文件 |

---

## P0: 安全漏洞修复

### 任务 1：JWT 密钥安全

- [ ] **修改 `backend/.env`**
  将 `JWT_SECRET` 从 `dev-secret-change-in-production` 改为强随机密钥
- [ ] **修改 `backend/src/middleware/auth.js`**
  移除默认值 fallback，改为抛出明确错误

### 任务 2：超管登录逻辑修复

- [ ] **修改 `backend/src/controllers/authController.js`**
  `superAdminLogin` 函数：验证用户必须是真实的超管（从环境变量或独立超管表），而非任意租户 admin

### 任务 3：忘记密码安全加固

- [ ] **修改 `backend/src/controllers/authController.js`**
  `forgotPassword`：添加短信验证码验证机制（当前阶段先做基础验证，如要求输入姓名+手机号匹配）

### 任务 4：控制器租户隔离

- [ ] **修改 `backend/src/controllers/changeLogController.js`** - 所有操作添加租户过滤
- [ ] **修改 `backend/src/controllers/materialController.js`** - 所有操作添加租户过滤
- [ ] **修改 `backend/src/controllers/productionProgressController.js`** - 所有操作添加租户过滤
- [ ] **修改 `backend/src/controllers/constructionLogController.js`** - 所有操作添加租户过滤

### 任务 5：findByPk+where bug 修复

- [ ] **修改 `backend/src/controllers/workOrderController.js`**
  将 `addRemark`、`reassign`、`updateTags`、`updatePriority`、`updateDeadline` 中的 `findByPk(id, { where })` 改为正确的 `findOne({ where: { id, tenant_id } })`

### 任务 6：前端 401 自动跳转

- [ ] **修改 `admin-web/src/api/index.js`**
  在 response interceptor 中添加 401 状态码自动跳转登录页逻辑

---

## P1: 数据完整性修复

### 任务 7：批量操作事务包裹

- [ ] **修改 `backend/src/controllers/assignmentController.js`**
  `batchReviewMeasurements` 函数用 `sequelize.transaction()` 包裹所有更新操作

### 任务 8：模型与表一致性

- [ ] **修改 `backend/src/models/TenantUser.js`** - 添加 `real_name` 字段
- [ ] **修改 `backend/src/models/ClientUser.js`** - 添加 `real_name` 字段
- [ ] **修改 `backend/src/models/WoProductionProgress.js`** - 移除 `paranoid: true`（表中无 deleted_at）

### 任务 9：地址路由排序

- [ ] **修改 `backend/src/routes/address.js`**
  将 `/path/:code` 路由移到 `/:code` 之前

### 任务 10：地址查询 N+1 优化

- [ ] **修改 `backend/src/controllers/addressController.js`**
  `getAddressTree` 一次性查出所有数据，在内存构建树

---

## P2: 前端 UX 修复

### 任务 11：批量删除二次确认

- [ ] **修改 `admin-web/src/components/BatchOpsDialog.vue`**
  执行删除前添加 `ElMessageBox.confirm`

### 任务 12：Dashboard 数据修复

- [ ] **修改 `admin-web/src/views/Dashboard.vue`**
  趋势图改为从后端获取真实数据，移除硬编码估算

### 任务 13：formatMoney 双重格式化

- [ ] **修改 `admin-web/src/views/WorkOrderDetail.vue`**
  移除多余的 `¥` 前缀

### 任务 14：catch 块显示错误

- [ ] **修改 `admin-web/src/views/Clients.vue`** - catch 块添加 ElMessage.error
- [ ] **修改 `admin-web/src/views/Finance.vue`** - 同上
- [ ] **修改 `admin-web/src/views/MeasureReview.vue`** - 同上
- [ ] **修改其他页面** - 所有空 catch 块添加错误提示

### 任务 15：StatsPanel 使用 CSS 变量

- [ ] **修改 `admin-web/src/components/StatsPanel.vue`**
  将硬编码颜色替换为 CSS 变量

### 任务 16：添加 404 路由

- [ ] **修改 `admin-web/src/router/index.js`**
  添加 catch-all 404 路由

---

## P3: 代码质量修复

### 任务 17：创建 .env.example

- [ ] **创建 `backend/.env.example`**

### 任务 18：清理超管死代码

- [ ] **删除 `super-admin/src/utils/request.js`**

### 任务 19：移除演示账号提示

- [ ] **修改 `super-admin/src/views/Login.vue`**
  移除演示账号密码提示

---
