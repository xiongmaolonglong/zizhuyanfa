# 广告工程全流程管理系统 - 后端 API 文档

> Base URL: `/api/v1`  
> 认证方式: JWT Bearer Token (`Authorization: Bearer <token>`)  
> 响应格式: 统一 JSON 信封 `{ code, message, data }`

---

## 通用说明

### 响应格式

```json
{ "code": 200, "message": "success", "data": { ... } }
```

### 分页响应

```json
{ "code": 200, "message": "success", "data": [...], "total": 100, "page": 1, "limit": 20 }
```

### 错误响应

```json
{ "code": 400, "message": "错误描述", "data": null }
```

---

## 1. 认证 `/auth`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/auth/tenant/login` | 租户员工登录 | 无 |
| POST | `/auth/client/login` | 客户员工登录 | 无 |
| POST | `/auth/admin/login` | 超级管理员登录 | 无 |
| POST | `/auth/forgot-password` | 忘记密码 | 无 |
| POST | `/auth/sms/send` | 发送短信验证码 | 无 |
| POST | `/auth/sms/login` | 短信验证码登录 | 无 |
| POST | `/auth/change-password` | 修改密码 | 需要 |
| GET | `/auth/me` | 获取当前用户 | 需要 |

### 1.1 租户员工登录 `POST /auth/tenant/login`

**请求体:**
```json
{ "phone": "13800138000", "password": "password123" }
```

**响应:**
```json
{
  "code": 200,
  "data": {
    "token": "eyJhbGci...",
    "user": { "id": 1, "name": "张三", "role": "admin", "phone": "13800138000" }
  }
}
```

### 1.2 客户员工登录 `POST /auth/client/login`

同租户登录，返回格式一致。

### 1.3 超级管理员登录 `POST /auth/admin/login`

同租户登录，返回格式一致。

### 1.4 忘记密码 `POST /auth/forgot-password`

**请求体:**
```json
{ "phone": "13800138000", "code": "123456", "new_password": "newpass123" }
```

### 1.5 发送短信 `POST /auth/sms/send`

**请求体:** `{ "phone": "13800138000" }`

### 1.6 短信登录 `POST /auth/sms/login`

**请求体:** `{ "phone": "13800138000", "code": "123456" }`

### 1.7 修改密码 `POST /auth/change-password`

**请求体:** `{ "old_password": "old123", "new_password": "new456" }`

### 1.8 获取当前用户 `GET /auth/me`

返回当前登录用户信息（不含密码）。

---

## 2. 地址字典 `/addresses`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/addresses` | 地址列表 `?parent_code=&level=` | 无 |
| GET | `/addresses/tree` | 完整层级树 | 无 |
| GET | `/addresses/:code` | 单个地址详情 | 无 |
| GET | `/addresses/:code/children` | 子级地址列表 | 无 |
| GET | `/addresses/:code/path` | 从根到节点的完整路径 | 无 |

---

## 3. 租户管理 `/tenant`

### 3.1 租户信息

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/tenant/info` | 当前租户信息 | 需要租户登录 |
| PUT | `/tenant/info` | 更新租户信息 | 需要超管 |
| GET | `/tenant/stats` | 租户统计（部门/用户/角色） | 需要租户登录 |

### 3.2 部门管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/tenant/departments` | 部门列表 |
| POST | `/tenant/departments` | 创建部门 `{ "name": "设计部", "manager_id": 1, "region_codes": ["110000"] }` |
| GET | `/tenant/departments/:id` | 部门详情 |
| PUT | `/tenant/departments/:id` | 更新部门 |
| DELETE | `/tenant/departments/:id` | 删除部门（需为空） |

### 3.3 用户管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/tenant/users` | 用户列表 `?role=&status=&department_id=&page=&limit=` |
| POST | `/tenant/users` | 创建用户 `{ "name": "李四", "phone": "13900139000", "password": "pwd123", "role": "designer", "department_id": 1 }` |
| GET | `/tenant/users/:id` | 用户详情 |
| PUT | `/tenant/users/:id` | 更新用户 |
| DELETE | `/tenant/users/:id` | 软删除用户 |
| PUT | `/tenant/users/:id/status` | 启用/禁用 `{ "status": "active" | "disabled" }` |

**角色枚举:** `admin`, `dispatcher`, `measurer`, `designer`, `producer`, `constructor`, `finance`

### 3.4 租户设置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/tenant/settings` | 获取租户设置 |
| PUT | `/tenant/settings` | 更新设置 |
| PATCH | `/tenant/settings/:key` | 更新单个设置项 |
| GET | `/tenant/settings/project-templates` | 获取项目模板 |
| GET | `/tenant/settings/material-type-map` | 获取材料类型映射 |

---

## 4. 客户端管理 `/clients`

### 4.1 客户企业 CRUD

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/clients` | 客户列表 `?page=&limit=&status=&name=` |
| POST | `/clients` | 创建客户 |
| GET | `/clients/:id` | 客户详情 |
| PUT | `/clients/:id` | 更新客户 |
| DELETE | `/clients/:id` | 软删除客户 |

### 4.2 客户部门管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/clients/:clientId/departments` | 部门列表 |
| POST | `/clients/:clientId/departments` | 创建部门 |
| PUT | `/clients/:clientId/departments/:id` | 更新部门 |
| DELETE | `/clients/:clientId/departments/:id` | 删除部门 |

### 4.3 客户用户管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/clients/:clientId/users` | 用户列表 `?role=&status=&department_id=` |
| POST | `/clients/:clientId/users` | 创建用户 |
| PUT | `/clients/:clientId/users/:id` | 更新用户 |
| DELETE | `/clients/:clientId/users/:id` | 删除用户 |

### 4.4 管辖区域

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/clients/:clientId/users/:userId/regions` | 获取管辖区域 |
| POST | `/clients/:clientId/users/:userId/regions` | 设置管辖区域（替换全部） |
| DELETE | `/clients/:clientId/users/:userId/regions/:id` | 删除区域 |

### 4.5 默认客户

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/clients/default` | 获取默认客户 |
| PUT | `/clients/default` | 设置默认客户 `{ "client_id": 1 }` |

### 4.6 客户端组织管理 `/client-organization`

客户登录后自我管理所属企业。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/client-organization/departments` | 我的部门列表 |
| POST | `/client-organization/departments` | 创建部门 |
| PUT | `/client-organization/departments/:id` | 更新部门 |
| DELETE | `/client-organization/departments/:id` | 删除部门 |
| GET | `/client-organization/users` | 用户列表 |
| POST | `/client-organization/users` | 创建用户 |
| PUT | `/client-organization/users/:id` | 更新用户 |
| DELETE | `/client-organization/users/:id` | 删除用户 |
| PUT | `/client-organization/users/:id/reset-password` | 重置密码 |

---

## 5. 工单管理 `/work-orders`

### 5.1 工单 CRUD

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/work-orders` | 创建工单 |
| GET | `/work-orders` | 工单列表 `?stage=&status=&client_id=&project_type=&page=&limit=&keyword=` |
| GET | `/work-orders/:id` | 工单详情（含所有阶段数据） |
| PUT | `/work-orders/:id` | 编辑工单（仅限派单阶段） |
| DELETE | `/work-orders/:id` | 软删除（已归档不可删） |

### 5.2 工单统计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/work-orders/stats` | 各阶段/状态统计 |
| GET | `/work-orders/finance-overview` | 财务概览 |
| GET | `/work-orders/trend` | N天趋势 `?days=7` |
| GET | `/work-orders/staff-workload` | 员工工作量报表 |
| GET | `/work-orders/element-options` | 项目类型下拉选项 |

### 5.3 工单操作

| 方法 | 路径 | 说明 |
|------|------|------|
| PUT | `/work-orders/:id/advance` | 推进到目标阶段 `{ "target_stage": "measurement" }` |
| PUT | `/work-orders/:id/stage` | 看板拖拽变更（最多跨越2步） |
| POST | `/work-orders/batch-advance` | 批量推进 `{ "work_order_ids": [1,2,3], "target_stage": "design" }` |
| POST | `/work-orders/:id/remark` | 添加备注 `{ "content": "备注" }` |
| PUT | `/work-orders/:id/assign` | 重新指派 |
| PUT | `/work-orders/:id/tags` | 更新标签 |
| PUT | `/work-orders/:id/priority` | 设置优先级 `high/normal/low` |
| PUT | `/work-orders/:id/deadline` | 设置截止日期 |

### 5.4 工单日志

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/work-orders/:id/logs` | 单个工单操作日志 |
| GET | `/work-orders/logs` | 全局操作日志 |
| GET | `/work-orders/:id/change-logs` | 变更记录 |
| POST | `/work-orders/:id/change-logs` | 新增变更记录 |
| PUT | `/work-orders/change-logs/:logId` | 修改变更记录 |
| DELETE | `/work-orders/change-logs/:logId` | 删除变更记录 |

### 5.5 审核中心

```
GET /work-orders/reviews/tasks
```

返回待审核的量尺、设计、内部验收列表。

---

## 6. 申报审批 `/declarations`

### 6.1 客户端申报

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/declarations` | 创建申报（自动生成工单） |
| GET | `/declarations` | 我的申报列表 `?status=&stage=&page=&limit=` |
| GET | `/declarations/:id` | 申报详情 |
| PUT | `/declarations/:id` | 编辑申报（草稿/驳回状态） |
| DELETE | `/declarations/:id` | 软删除 |

### 6.2 审批

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/declarations/my-approvals` | 我的审批任务 |
| POST | `/declarations/:id/approve` | 审批通过 |
| POST | `/declarations/:id/reject` | 审批驳回 |

### 6.3 租户端管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/tenant/declarations` | 租户收到的申报列表 |
| GET | `/tenant/declarations/:id` | 租户查看申报详情 |
| POST | `/tenant/declarations/:id/receive` | 租户接收申报 |
| POST | `/tenant/declarations/:id/reject` | 租户驳回 |
| GET | `/tenant/declarations/stream` | SSE 实时推送 |

---

## 7. 派单与量尺 `/assignments` `/measurements`

### 7.1 派单管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/assignments` | 派单列表 |
| POST | `/assignments` | 创建派单 `{ "work_order_id": 1, "assigned_to": 3, "deadline": "2026-05-10" }` |
| GET | `/assignments/:id` | 派单详情 |
| PUT | `/assignments/:id/receive` | 量尺员确认接单 |
| GET | `/assignments/recommended-measurers` | 推荐量尺员（按负载排序） |

### 7.2 量尺任务

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/measurements/tasks` | 量尺员任务列表 |
| GET | `/measurements/tasks/:workOrderId` | 任务详情 |
| POST | `/measurements/:workOrderId` | 提交量尺数据 |
| PUT | `/measurements/:workOrderId` | 修改量尺数据（审核前） |
| POST | `/measurements/:workOrderId/proxy-submit` | 后台代录量尺数据 |
| POST | `/measurements/:workOrderId/review` | 审核量尺 `{ "action": "approve|reject|resubmit" }` |
| GET | `/measurements/:workOrderId/history` | 同地址历史工单 |
| POST | `/tenant/measurements/batch-review` | 批量审核 `{ "ids": [], "action": "approve|reject" }` |

---

## 8. 设计管理 `/designs`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/designs/tasks` | 设计师任务列表 |
| GET | `/designs/tasks/:workOrderId` | 任务详情 |
| GET | `/designs/:workOrderId/detail` | 完整设计页面数据 |
| GET | `/designs/:workOrderId` | 获取最新设计 |
| POST | `/designs/:workOrderId` | 上传设计 |
| PUT | `/designs/:workOrderId` | 修改被驳回的设计 |
| POST | `/designs/:workOrderId/review` | 审核设计 `{ "action": "approve|reject", "comment": "" }` |
| POST | `/designs/:workOrderId/submit-review` | 提交审核 |
| POST | `/designs/:workOrderId/withdraw` | 撤回审核 |
| POST | `/designs/:workOrderId/materials` | 材料数量变更 |
| POST | `/designs/:workOrderId/assign` | 指派设计师 |
| POST | `/designs/:workOrderId/confirm` | 确认设计定稿 |
| GET | `/designs/:workOrderId/auto-materials` | 根据量尺自动生成材料清单 |
| GET | `/designs/:workOrderId/export` | 导出设计报告数据 |
| GET | `/designs/designers` | 所有设计师列表 |

---

## 9. 生产管理 `/production`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/production/tasks` | 生产任务列表 |
| GET | `/production/tasks/:id` | 任务详情（含量尺/设计） |
| POST | `/production/tasks/:id/status` | 更新状态 |
| POST | `/production/tasks/merge` | 合并同类材料任务 |
| POST | `/production/tasks/:id/merge` | 合并已有生产任务 |
| POST | `/production/groups/complete` | 标记材料组完成 |
| GET | `/production/pending-groups` | 待处理任务按材料分组 |
| GET | `/production/view/:material_type` | 生产列表视图（含设计图） |
| POST | `/production/material-pickup` | 施工队领料 |
| POST | `/production/batches` | 创建生产批次 |
| GET | `/production/batches` | 批次列表 |
| GET | `/production/batches/:id` | 批次详情 |
| POST | `/production/exports` | 创建导出记录 |
| GET | `/production/exports` | 导出记录列表 |
| GET | `/production/exports/by-wo` | 按工单批量查询导出 |

### 9.1 生产进度

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/production/:workOrderId/progress` | 获取进度步骤（下料/制作/组装/质检） |
| PUT | `/production/:workOrderId/progress` | 更新进度百分比 |

---

## 10. 施工管理 `/construction`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/construction/tasks` | 施工任务列表 |
| GET | `/construction/tasks/:workOrderId` | 任务详情 |
| POST | `/construction/:workOrderId` | 提交施工记录 |
| POST | `/construction/:workOrderId/assign` | 指派施工人员 |
| POST | `/construction/:workOrderId/internal-verify` | 内部审核/验收 |
| POST | `/construction/:workOrderId/verify` | 客户验收（含签名） |
| POST | `/construction/:workOrderId/exception` | 上报异常 |
| GET | `/construction/:workOrderId/logs` | 施工日志列表 |
| POST | `/construction/:workOrderId/logs` | 新增施工日志 |
| PUT | `/construction/logs/:logId` | 修改施工日志 |
| DELETE | `/construction/logs/:logId` | 删除施工日志 |

---

## 11. 财务管理 `/finance`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/finance/:workOrderId/quote` | 生成报价 |
| GET | `/finance/quotes` | 报价列表 |
| POST | `/finance/:workOrderId/payment` | 记录付款 |
| POST | `/finance/:workOrderId/invoice` | 记录发票 |
| POST | `/finance/:workOrderId/settlement` | 提交结算 |
| GET | `/finance/settlement-template/:workOrderId` | 获取结算模板数据（Excel） |
| POST | `/finance/:workOrderId/settlement/reject` | 驳回结算 |

---

## 12. 档案管理 `/archives`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/archives` | 档案列表 `?page=&limit=&keyword=` |
| GET | `/archives/:workOrderId` | 档案详情 |
| POST | `/archives/:workOrderId` | 归档工单 |
| GET | `/archives/:workOrderId/export` | 导出归档数据 |

---

## 13. 售后管理 `/aftersales`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/aftersales` | 提交售后申请 |
| GET | `/aftersales` | 售后列表 `?status=&work_order_id=` |
| GET | `/aftersales/:id` | 售后详情 |
| POST | `/aftersales/:id/handle` | 处理售后 |
| POST | `/aftersales/:id/rate` | 评价售后（1-5星） |

---

## 14. 通知管理 `/notifications`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/notifications` | 通知列表 |
| GET | `/notifications/unread-count` | 未读数量 |
| GET | `/notifications/:id` | 通知详情（自动标记已读） |
| POST | `/notifications/:id/read` | 标记已读 |
| POST | `/notifications/read-all` | 全部标记已读 |

---

## 15. 文件管理 `/files`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/files` | 单文件上传（multipart） |
| POST | `/files/batch` | 批量上传（最多9个） |
| DELETE | `/files/:filename` | 删除文件 |

---

## 16. 表单配置 `/tenant/form-config`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/tenant/form-config/:formType` | 获取表单配置 |
| PUT | `/tenant/form-config/:formType` | 批量更新（全量替换） |
| POST | `/tenant/form-config/:formType/fields` | 添加自定义字段 |
| POST | `/tenant/form-config/:formType/reset` | 重置为默认配置 |

**表单类型:** `measurement`（量尺代录）、`work_order`（工单创建）

---

## 17. 微信集成 `/wechat`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/wechat/login` | 小程序登录 |
| POST | `/wechat/bind` | 绑定微信 openid |
| POST | `/wechat/subscribe` | 记录订阅偏好 |
| POST | `/wechat/test-message` | 测试发送订阅消息（开发环境） |

---

## 18. 超级管理员 `/admin`

全部接口需要 `requireAdmin` 权限。

### 18.1 租户管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/tenants` | 租户列表（含统计） |
| POST | `/admin/tenants` | 创建租户（含默认管理员） |
| GET | `/admin/tenants/:id` | 租户详情 |
| PUT | `/admin/tenants/:id` | 更新租户 |
| PUT | `/admin/tenants/:id/status` | 启用/暂停/删除 |

### 18.2 全局仪表盘

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/dashboard` | 全局仪表盘数据 |
| GET | `/admin/dashboard/trend` | 趋势数据 `?period=day|week|month` |

### 18.3 全局工单

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/work-orders` | 跨租户工单搜索 |
| GET | `/admin/work-orders/:id` | 任意工单详情 |
| GET | `/admin/work-orders/:id/logs` | 工单操作日志 |

### 18.4 全局客户

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/clients` | 全局客户列表 |
| PUT | `/admin/clients/:id/admin` | 设置/取消客户管理员 |

### 18.5 全局申报与设置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/declarations` | 全局申报列表 |
| GET | `/admin/settings` | 系统配置 |
| PUT | `/admin/settings` | 更新系统配置 |

---

## 19. 工单审核

```
POST /work-orders/:id/review
```

管理员审核现场创建的工单。

**请求体:** `{ "action": "approve|reject", "reject_reason": "可选" }`
- `approve`: 工单进入量尺阶段
- `reject`: 工单状态变为 `rejected`

---

## 20. 客户端 API `/client`

客户登录后使用的只读 API（小程序/移动端）。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/client/dashboard` | 客户仪表盘数据 |
| GET | `/client/work-orders` | 我的工单列表 |
| GET | `/client/work-orders/:id` | 工单详情 |
| GET | `/client/work-orders/:id/design` | 查看设计 |
| GET | `/client/work-orders/:id/construction` | 查看施工信息 |
| GET | `/client/work-orders/:id/finance` | 查看财务信息 |
| GET | `/client/archives` | 我的归档列表 |
| GET | `/client/archives/:id` | 归档详情 |
| GET | `/client/notifications` | 通知列表 |
| GET | `/client/notifications/:id` | 通知详情 |
| PUT | `/client/notifications/:id` | 标记通知已读 |

---

## 21. 仓库管理 `/warehouse`

> 注：该模块路由已定义但未挂载到 `routes/index.js`，当前不可访问。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/warehouse/inventory` | 当前库存汇总 |
| POST | `/warehouse/inbound` | 生产入库 |
| POST | `/warehouse/outbound` | 施工出库 |
| GET | `/warehouse/records` | 出入库记录列表 |
| GET | `/warehouse/records/:id` | 单条记录详情 |
| DELETE | `/warehouse/records/:id` | 删除记录 |

---

## 数据模型

### 工单生命周期

```
申报(declaration) → 审批(approval) → 派单(assignment) → 量尺(measurement)
  → 设计(design) → 生产(production) → 施工(construction)
  → 财务(finance) → 归档(archive) → 售后(aftersale)
```

### 核心数据表

| 表名 | 说明 |
|------|------|
| `tenants` | 租户（广告公司） |
| `tenant_users` | 租户员工 |
| `clients` | 客户企业 |
| `client_users` | 客户员工 |
| `work_orders` | 工单（核心业务实体） |
| `wo_declarations` | 申报信息 |
| `wo_approvals` | 审批记录 |
| `wo_assignments` | 派单记录 |
| `wo_measurements` | 量尺数据 |
| `wo_designs` | 设计方案 |
| `wo_productions` | 生产任务 |
| `wo_constructions` | 施工记录 |
| `wo_finance` | 财务信息 |
| `wo_archives` | 归档记录 |
| `wo_aftersales` | 售后记录 |
| `notifications` | 通知消息 |
| `wo_change_logs` | 变更记录 |
| `wo_construction_logs` | 施工日志 |
| `wo_production_progress` | 生产进度 |
| `wo_production_batches` | 生产批次 |
| `wo_production_exports` | 导出记录 |
| `wo_warehouse` | 仓库出入库 |
| `form_configs` | 动态表单配置 |
| `address_dict` | 地址字典 |

### 角色枚举

- **租户员工:** `admin`, `dispatcher`, `measurer`, `designer`, `producer`, `constructor`, `finance`
- **客户员工:** `staff`, `manager`

### APP 版本管理

#### APP 端

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | `/api/v1/app/check-version` | 公开 | APP 检查更新 |

**请求体:**
```json
{ "platform": "android", "current_version": "1.0.0" }
```

#### 管理后台

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/v1/admin/app-versions` | 管理员 | 版本列表 |
| POST | `/api/v1/admin/app-versions` | 管理员 | 创建版本 |
| PUT | `/api/v1/admin/app-versions/:id` | 管理员 | 更新版本 |
| PUT | `/api/v1/admin/app-versions/:id/status` | 管理员 | 设置强制更新 |
| DELETE | `/api/v1/admin/app-versions/:id` | 管理员 | 删除版本 |

### 健康检查

```
GET /api/v1/health
```
