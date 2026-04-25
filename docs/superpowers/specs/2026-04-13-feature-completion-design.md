# 功能补全设计文档

**日期**: 2026-04-13
**目标**: 补全广告工程管理系统各模块缺失的前端功能，后端 API 已全部存在

## 跳过项

- **费用管理** — 用户明确表示不需要补全

## 1. 施工管理（Construction.vue）

**文件**: `admin-web/src/views/Construction.vue`

### 补全内容

- **提交施工记录** — "提交"按钮弹窗：施工前/中/后照片上传（对接 `/api/v1/files`）、备注、耗时（分钟）
  - 调用 `POST /construction/:workOrderId`
- **内部验收** — "验收"按钮弹窗：通过/驳回单选、意见文本框
  - 调用 `POST /construction/:workOrderId/internal-verify`
- **上报异常** — "异常上报"按钮弹窗：类型下拉（尺寸变更/现场条件变化/材料不匹配/其他）、描述、照片上传、紧急程度（普通/紧急）
  - 调用 `POST /construction/:workOrderId/exception`
- **操作列动态化** — 根据 `row.status` 显示：`待施工`→提交、`已完工`→内部验收、任意状态→异常上报

## 2. 归档管理（Archive.vue）

**文件**: `admin-web/src/views/Archive.vue`

### 补全内容

- **创建归档** — "创建归档"按钮弹窗：工单选择器（仅显示 `status=completed` 的工单）、归档备注
  - 调用 `POST /archives/:workOrderId`
- **归档详情** — 点击"查看"弹出归档信息弹窗，展示归档时间、操作人、备注

## 3. 售后管理（Aftersale.vue）

**文件**: `admin-web/src/views/Aftersale.vue`

### 补全内容

- **创建售后工单** — "新建售后"按钮弹窗：关联工单选择（已完成/已验收工单）、问题类型（质量问题/尺寸问题/安装问题/其他）、问题描述、照片上传、紧急程度
  - 调用 `POST /aftersales`
- **处理售后** — 现有功能保留，补充处理后状态回传
  - 调用 `POST /aftersales/:id/handle`

## 4. 看板趋势图（Dashboard.vue）

**文件**: `admin-web/src/views/Dashboard.vue`

### 补全内容

- **后端新增趋势 API** — `GET /api/v1/work-orders/trend?days=7`
  - 返回近 N 天每天的新建数 + 完成数
  - 数据源：按 `created_at` 和 `completed_at` 分组统计
- **前端替换模拟数据** — Dashboard 趋势图调用真实 API

## 5. 消息提醒角标（client-web Layout）

**文件**: `client-web/src/components/Layout.vue`（或对应侧边栏/顶部组件）

### 补全内容

- 导航栏"消息通知"旁添加红色数字角标，显示未读数量
- 调用 `GET /api/v1/notifications/unread-count`
- 进入通知页面后自动重置角标

## 6. 合并生产任务（Production.vue）

**文件**: `admin-web/src/views/Production.vue`

### 补全内容

- **合并弹窗增加工单选择** — 多选下拉框，从当前 `current_stage=production` 的工单中选择
- 提交时携带选中的 `work_order_ids` 列表，不再传空数组

## 实现顺序

1. 施工管理（核心流转环节）
2. 归档管理
3. 售后管理
4. 看板趋势图
5. 消息提醒角标
6. 合并生产任务
