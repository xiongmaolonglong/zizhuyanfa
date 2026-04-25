# 广告工程详情页与模块细化设计文档

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在现有 admin-web 基础上，按业务链路细化 7 个模块的 18 个功能点，提升广告工程管理系统的实用性和专业性。

**架构：** 所有功能在现有 Express + Vue 3 + MySQL 架构上扩展。新增 4 张表（变更日志、施工日志、质保期、生产进度），修改 1 张表（work_orders 新增质保期字段）。所有前端页面复用现有布局和设计系统。

**技术栈：** Express.js + Sequelize ORM + MySQL 8.0 | Vue 3 + Element Plus | Element Plus Image 预览组件

---

## 数据库变更总览

### 新增表

| 表名 | 用途 | 关键字段 |
|------|------|---------|
| `wo_change_logs` | 工单变更/增项记录 | work_order_id, change_type, description, cost_impact, approved_by |
| `wo_construction_logs` | 施工日志（按天记录） | work_order_id, log_date, content, labor_count, problem_description, photos |
| `wo_production_progress` | 生产进度跟踪 | work_order_id, step_name, progress_pct, updated_at |

### 修改表

| 表 | 变更 |
|----|------|
| `work_orders` | 新增 `warranty_end_date`（质保到期日）, `warranty_days`（质保天数，租户配置） |

---

## 功能 1：操作日志增强

**文件：**
- 修改：`admin-web/src/views/WorkOrderDetail.vue:76-83`（日志展示区）
- 修改：`backend/src/controllers/workOrderController.js`（返回增强的日志字段）
- 修改：`backend/src/models/WorkOrderLog.js`（新增字段）

### 数据库变更

`work_order_logs` 表新增字段：
- `log_type` ENUM('create', 'stage_change', 'dispatch', 'submit', 'approve', 'reject', 'edit', 'delete') — 操作类型
- `field_name` VARCHAR(50) — 变更字段名（stage_change 时使用）
- `old_value` TEXT — 变更前的值
- `new_value` TEXT — 变更后的值
- `amount_change` DECIMAL(10,2) — 金额变化

### 前端改动

日志时间线增强：
- 每种操作类型对应不同图标和颜色：
  - `create` → 绿色 + 图标
  - `stage_change` → 蓝色 + 箭头图标（显示 旧值 → 新值）
  - `dispatch` → 紫色 + 人员图标
  - `submit` → 橙色 + 提交图标
  - `approve` → 绿色 + 对勾图标
  - `reject` → 红色 + 叉号图标
  - `amount_change` → 金额变化用绿色（+）/红色（-）高亮显示
- 金额类变更用 `<el-tag>` 高亮

### 后端改动

- `workOrderController.logAction()` 增加 log_type、old_value、new_value 参数
- 工单阶段变更、编辑、派单、审核时，自动写入对应类型的日志
- 查询日志时按 created_at DESC 排序

---

## 功能 2：变更记录（简单模式）

**文件：**
- 创建：`backend/src/models/WoChangeLog.js`
- 修改：`backend/src/models/index.js`（关联）
- 创建：`backend/src/controllers/changeLogController.js`
- 创建：`backend/src/routes/changeLog.js`
- 修改：`backend/src/routes/index.js`（挂载路由）
- 修改：`admin-web/src/views/WorkOrderDetail.vue`（新增 Tab/区块展示变更记录）

### 数据库

`wo_change_logs` 表：
- `id` INT PK AUTO_INCREMENT
- `work_order_id` INT FK → work_orders.id
- `change_type` ENUM('material_change', 'size_change', 'add_item', 'remove_item', 'other') — 变更类型
- `description` TEXT — 变更内容描述
- `reason` TEXT — 变更原因
- `cost_impact` DECIMAL(10,2) — 费用影响（正=增加，负=减少）
- `approved_by` VARCHAR(50) — 批准人
- `created_by` INT — 创建人
- `created_at` DATETIME
- `updated_at` DATETIME
- `deleted_at` DATETIME（软删除）

### API

- `POST /api/v1/work-orders/:id/change-logs` — 新增变更
- `GET /api/v1/work-orders/:id/change-logs` — 查询变更列表
- `PUT /api/v1/work-orders/change-logs/:logId` — 编辑变更
- `DELETE /api/v1/work-orders/change-logs/:logId` — 删除变更

### 前端

在工单详情页，操作日志卡片下方新增「变更记录」卡片：
- 列表形式展示（类型标签 | 描述 | 费用影响 | 批准人 | 时间）
- 费用影响用颜色区分：正数绿色、负数红色
- 「添加变更」按钮，弹出对话框填写：变更类型、描述、原因、费用影响、批准人

---

## 功能 3：材料清单 BOM

**文件：**
- 创建：`backend/src/models/WoMaterial.js`
- 修改：`backend/src/models/index.js`
- 创建：`backend/src/controllers/materialController.js`
- 创建：`backend/src/routes/material.js`
- 修改：`backend/src/routes/index.js`
- 修改：`admin-web/src/views/WorkOrderDetail.vue`（新增材料区块）

### 数据库

`wo_materials` 表：
- `id` INT PK AUTO_INCREMENT
- `work_order_id` INT FK → work_orders.id
- `category` VARCHAR(50) — 材料分类（从材料字典选择）
- `name` VARCHAR(100) — 材料名称
- `spec` VARCHAR(100) — 规格
- `unit` VARCHAR(20) — 单位（㎡、个、套、米）
- `quantity` DECIMAL(10,2) — 数量
- `unit_price` DECIMAL(10,2) — 单价
- `total_price` DECIMAL(10,2) — 总价（= quantity × unit_price，前端自动算）
- `notes` TEXT — 备注
- `created_at` DATETIME
- `updated_at` DATETIME
- `deleted_at` DATETIME（软删除）

### API

- `POST /api/v1/work-orders/:id/materials` — 添加材料
- `GET /api/v1/work-orders/:id/materials` — 查询材料列表
- `PUT /api/v1/work-orders/materials/:materialId` — 编辑材料
- `DELETE /api/v1/work-orders/materials/:materialId` — 删除材料
- `GET /api/v1/work-orders/:id/materials/summary` — 材料汇总（总项数、总金额）

### 前端

在工单详情页，基本信息卡片下方新增「材料清单」卡片：
- 表格展示（分类 | 名称 | 规格 | 数量 | 单位 | 单价 | 总价 | 操作）
- 底部显示汇总行（共 X 项，材料总价 ¥XXX）
- 「添加材料」按钮，弹出对话框填写
- 支持从系统配置的材料字典快速选择（弹出一个下拉选择材料）
- 行内编辑：数量、单价可直接修改，总价自动重算

---

## 功能 4：施工日志

**文件：**
- 创建：`backend/src/models/WoConstructionLog.js`
- 修改：`backend/src/models/index.js`
- 创建：`backend/src/controllers/constructionLogController.js`
- 创建：`backend/src/routes/constructionLog.js`
- 修改：`backend/src/routes/index.js`
- 修改：`admin-web/src/views/ConstructionDetail.vue`
- 修改：`admin-web/src/views/Construction.vue`

### 数据库

`wo_construction_logs` 表：
- `id` INT PK AUTO_INCREMENT
- `work_order_id` INT FK → work_orders.id
- `log_date` DATE — 施工日期
- `content` TEXT — 施工内容
- `labor_count` INT — 人工数量
- `labor_hours` DECIMAL(5,1) — 工时
- `problem_description` TEXT — 遇到的问题
- `photos` JSON — 现场照片 URL 数组
- `weather` VARCHAR(20) — 天气（晴/阴/雨/雪）
- `created_by` INT
- `created_at` DATETIME
- `updated_at` DATETIME
- `deleted_at` DATETIME

### API

- `POST /api/v1/construction/:workOrderId/logs` — 添加施工日志
- `GET /api/v1/construction/:workOrderId/logs` — 查询施工日志
- `PUT /api/v1/construction/logs/:logId` — 编辑日志
- `DELETE /api/v1/construction/logs/:logId` — 删除日志

### 前端

在 ConstructionDetail 页面，施工信息卡片下方新增「施工日志」区域：
- 时间线形式展示（日期 | 天气图标 | 施工内容 | 人工数 | 问题 | 照片缩略图）
- 「添加日志」按钮，弹出对话框：日期（默认今天）、天气（下拉）、施工内容（文本域）、人工数、工时、问题描述、照片 URL
- 照片缩略图可点击预览
- 同一天多条日志合并显示

---

## 功能 5：施工前后对比

**文件：**
- 修改：`admin-web/src/views/ConstructionDetail.vue`
- 修改：`backend/src/controllers/constructionController.js`

### 前端

在 ConstructionDetail 页面新增「前后对比」Tab：
- 左右两列布局：左=施工前照片，右=施工后照片
- 支持多组对比（同一位置的 Before/After）
- 每组对比可加标题（如"正立面"、"侧立面"）
- 点击图片可放大预览
- 使用 Element Plus 的 el-image 组件 + CSS grid 实现

### 数据来源

施工前后的照片字段存在 `wo_constructions` 表中（before_photos / after_photos）。
如果表里没有这两个字段，需要 ALTER TABLE 添加。

---

## 功能 6：施工进度跟踪

**文件：**
- 创建：`backend/src/models/WoProductionProgress.js`
- 修改：`backend/src/models/index.js`
- 创建：`backend/src/controllers/productionProgressController.js`
- 创建：`backend/src/routes/productionProgress.js`
- 修改：`backend/src/routes/index.js`
- 修改：`admin-web/src/views/Production.vue`

### 数据库

`wo_production_progress` 表：
- `id` INT PK AUTO_INCREMENT
- `work_order_id` INT FK → work_orders.id
- `step_name` VARCHAR(50) — 工序名称（如：下料、制作、组装、质检）
- `progress_pct` INT — 完成百分比 0-100
- `updated_at` DATETIME

默认 4 个工序步骤：下料、制作、组装、质检

### API

- `GET /api/v1/production/:workOrderId/progress` — 查询进度
- `PUT /api/v1/production/:workOrderId/progress` — 更新进度（批量更新所有步骤）

### 前端

在 Production 列表页，每行新增「进度条」列：
- 显示当前整体进度百分比（各步骤加权平均）
- 点击可展开查看各工序步骤的进度

---

## 功能 7：质保期管理

**文件：**
- 修改：`backend/src/models/WorkOrder.js`（新增字段）
- 修改：`backend/src/models/Tenant.js`（新增默认质保天数配置）
- 修改：`admin-web/src/views/Aftersale.vue`
- 修改：`admin-web/src/views/AftersaleDetail.vue`

### 数据库

`work_orders` 表新增：
- `warranty_end_date` DATE — 质保到期日
- `warranty_days` INT — 质保天数（从租户配置的默认值继承）

`tenants` 表（已有 settings JSON 字段）：
- 在 settings 中新增 `warranty_days` 字段，默认 365 天

质保到期日自动计算：
- 工单进入 archive 阶段时，`warranty_end_date` = 归档日期 + warranty_days

### 前端

Aftersale 列表页：
- 新增「质保状态」列：
  - 质保期内：绿色标签，显示"剩余 X 天"
  - 已过期：红色标签，显示"已过期 X 天"
  - 未归档：灰色标签，显示"—"
- 筛选增加「质保状态」选项（全部 / 质保期内 / 已过期）

AftersaleDetail 页面：
- 显示原工单的质保到期日
- 显示关联的原工单链接（点击跳转）

---

## 功能 8：关联原工单（售后）

**文件：**
- 修改：`admin-web/src/views/AftersaleDetail.vue`

### 前端

在 AftersaleDetail 页面顶部，新增「关联原工单」卡片：
- 显示原工单号（可点击跳转详情）、项目名称、项目类型
- 显示原工单的测量数据（面积、材料）
- 显示原工单的施工记录摘要
- 显示原工单的材料清单（如果做了功能3）

数据来源：售后表已有 `work_order_id` 字段，通过关联查询即可。

---

## 功能 9：设计稿在线预览

**文件：**
- 修改：`admin-web/src/views/Designs.vue`
- 修改：`admin-web/src/views/WorkOrderDetail.vue`

### 前端

在 Designs 页面，待审核 Tab：
- 点击「查看」按钮弹出对话框，使用 el-image 组件展示设计稿
- 支持多张图片预览（左右箭头切换）
- 支持放大、缩小、旋转

在 WorkOrderDetail 页面：
- 如果工单有设计稿（effect_images），在对应区域展示缩略图网格
- 点击可预览大图

---

## 功能 10：设计版本对比

**文件：**
- 修改：`backend/src/controllers/designController.js`（返回版本号）
- 修改：`admin-web/src/views/Designs.vue`

### 前端

在 Designs 页面已完成 Tab：
- 每个工单显示版本号（v1、v2、v3...）
- 点击「对比」按钮，弹出对比对话框
- 左右分栏显示两个版本的设计稿
- 顶部显示版本信息（提交时间、设计师）

### 版本管理

wo_designs 表已有 `version` 字段（如果不存在需添加）。
每次上传新设计稿时，version 自动 +1。

---

## 功能 11：测量数据可视化（设计师视角）

**文件：**
- 修改：`admin-web/src/views/Designs.vue`（待设计 Tab）
- 修改：`admin-web/src/views/WorkOrderDetail.vue`

### 前端

在 Designs 待设计 Tab，每个工单增加「查看测量数据」按钮：
- 弹出对话框，展示：
  - 材料类型分组（喷绘布、亚克力板等）
  - 每种材料下列出所有面（label | 宽 | 高 | 面积 | 照片数）
  - 总面积汇总
  - 现场照片网格（点击预览）
- 哪些面属于一组（同一面墙的不同部分），用颜色/边框标注

---

## 功能 12：照片标注位置

**文件：**
- 修改：`backend/src/models/WoMeasurement.js`（新增字段）
- 修改：`backend/src/controllers/measurementController.js`
- 修改：`admin-web/src/views/Designs.vue`
- 修改：`admin-web/src/views/MeasureReview.vue`

### 数据库

`wo_measurements` 表的 faces 数组中每个 face 新增：
- `position_label` VARCHAR(50) — 位置标注（如"正立面"、"左侧面"、"右侧面"、"顶面"）
- `is_group` BOOLEAN — 是否属于一组
- `group_id` INT — 组编号

### 前端

测量代录/审核时：
- 每个面增加位置标注选择（下拉：正立面/左侧面/右侧面/顶面/其他）
- 可选择此面属于哪个组（同一组的面用相同颜色边框标注）
- 在设计师查看测量数据时，按组分组展示

---

## 功能 13：数据与设计对照

**文件：**
- 修改：`admin-web/src/views/Designs.vue`
- 修改：`admin-web/src/views/WorkOrderDetail.vue`

### 前端

在上传设计稿对话框或设计审核页面：
- 左右分栏布局：
  - 左侧：测量数据（各面尺寸、面积、照片）
  - 右侧：设计稿预览
- 可以切换查看不同面的数据

---

## 功能 14：智能推荐测量员

**文件：**
- 修改：`admin-web/src/views/Dispatch.vue`
- 修改：`backend/src/controllers/assignmentController.js`

### 后端

assignmentController 新增接口：
- `GET /api/v1/assignments/recommended-measurers` — 返回推荐的测量员列表
- 推荐逻辑：
  1. 只返回 role = 'measurer' 且 status = 'active' 的用户
  2. 按当前任务数排序（任务少的排前面）
  3. 标记空闲（0 任务）、适中（1-2 任务）、繁忙（3+ 任务）

### 前端

在 Dispatch 页面和 WorkOrderDetail 的派单对话框：
- 测量员下拉列表增加推荐标签：
  - 空闲：绿色 + "空闲"
  - 适中：蓝色 + "X 个任务"
  - 繁忙：红色 + "繁忙"
- 空闲的测量员排在最前面

---

## 功能 15：测量可视化审核

**文件：**
- 修改：`admin-web/src/views/MeasureReview.vue`

### 前端

MeasureReview 页面增强：
- 每个工单的测量数据用卡片形式展示
- 左侧：材料类型 + 总面积 + 面数
- 右侧：现场照片缩略图
- 展开后显示每个面的详细数据（位置、尺寸、面积）
- 审核按钮（通过/驳回）放在卡片右上角
- 支持多选批量审核

---

## 功能 16：批量审核

**文件：**
- 修改：`admin-web/src/views/MeasureReview.vue`
- 修改：`backend/src/controllers/measurementController.js`

### API

- `POST /api/v1/tenant/measurements/batch-review` — 批量审核
  - body: `{ ids: [1,2,3], action: 'approve' | 'reject', comment?: string }`

### 前端

- 列表增加 checkbox 多选
- 顶部显示「批量通过」和「批量驳回」按钮
- 选择后点击批量操作，弹出确认对话框

---

## 功能 17：生产进度跟踪

已在功能 6 中描述。

---

## 实施顺序建议

按依赖关系和复杂度排列：

### 第一阶段：基础增强（无新表，改动小）
1. 操作日志增强
2. 设计稿在线预览
3. 施工前后对比
4. 关联原工单（售后）
5. 智能推荐测量员
6. 质保期管理

### 第二阶段：新表新功能
7. 变更记录
8. 材料清单 BOM
9. 施工日志
10. 生产进度跟踪
11. 设计版本对比

### 第三阶段：体验优化（设计视角）
12. 测量数据可视化
13. 照片标注位置
14. 数据与设计对照
15. 测量可视化审核
16. 批量审核

---

## 前端文件变更汇总

| 文件 | 变更类型 | 原因 |
|------|----------|------|
| `WorkOrderDetail.vue` | 大幅修改 | 操作日志增强 + 变更记录 + 材料清单 |
| `Designs.vue` | 大幅修改 | 在线预览 + 版本对比 + 测量可视化 |
| `ConstructionDetail.vue` | 修改 | 施工日志 + 前后对比 |
| `Aftersale.vue` | 修改 | 质保期展示 |
| `AftersaleDetail.vue` | 修改 | 关联原工单 |
| `Dispatch.vue` | 修改 | 智能推荐测量员 |
| `MeasureReview.vue` | 大幅修改 | 可视化审核 + 批量审核 |
| `Production.vue` | 修改 | 进度条 |

## 后端文件变更汇总

| 文件 | 变更类型 |
|------|----------|
| `models/WoChangeLog.js` | 新建 |
| `models/WoMaterial.js` | 新建 |
| `models/WoConstructionLog.js` | 新建 |
| `models/WoProductionProgress.js` | 新建 |
| `models/WorkOrderLog.js` | 修改（新增字段） |
| `models/WorkOrder.js` | 修改（质保期字段） |
| `models/WoMeasurement.js` | 修改（位置标注） |
| `models/index.js` | 修改（关联） |
| `controllers/changeLogController.js` | 新建 |
| `controllers/materialController.js` | 新建 |
| `controllers/constructionLogController.js` | 新建 |
| `controllers/productionProgressController.js` | 新建 |
| `controllers/assignmentController.js` | 修改 |
| `controllers/designController.js` | 修改 |
| `controllers/measurementController.js` | 修改 |
| `routes/` | 新增/修改对应路由 |
