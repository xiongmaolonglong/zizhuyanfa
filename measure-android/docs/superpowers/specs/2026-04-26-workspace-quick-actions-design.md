# 工作台快捷操作功能设计

## 目标

为工作台的 6 个快捷按钮（量尺、施工、设计、生产、审批、财务）设计对应的功能页面。第一阶段优先实现审批中心、量尺任务列表、施工任务列表。同时为测量员和安装员提供简化版工作台。

## 背景

### 当前实现状态

| 按钮 | 状态 | 说明 |
|------|------|------|
| 量尺 | 完整 | 4步向导已实现，但按钮直接进入向导而非列表 |
| 施工 | 半成品 | 向导 UI 有，需工单 ID 才能工作 |
| 审批 | 半成品 | 能通过/驳回，列表待完善 |
| 设计 | 空壳 | 只有骨架 UI |
| 生产 | 空壳 | 只有骨架 UI |
| 财务 | 空壳 | 只有占位卡片 |

### 业务流程（10 阶段）

```
申报 → 审批 → 派单 → 量尺 → 设计 → 生产 → 施工 → 财务 → 归档 → 售后
```

### 阶段枚举

```kotlin
// WorkOrderStage
measurement, design, production, construction, completed

// STAGE_ORDER (StageConstants.kt)
declaration, approval, assignment, measurement,
design, production, construction, finance, archive, aftersale
```

## 设计决策

### 决策 1：角色与工作台

管理员、测量员、安装员看到不同的工作台内容。

| 角色 | 统计卡片 | 快捷按钮 |
|------|---------|---------|
| 管理员 | 待处理/进行中/已完成/已逾期 | 量尺、施工、设计、生产、审批、财务 |
| 测量员 | 我的待量尺、今日已完成、待审核 | 量尺（仅1个） |
| 安装员 | 我的待施工、施工中、今日已完成 | 施工（仅1个） |

### 决策 2：按钮点击行为

每个按钮进入"该阶段的任务列表页"，而非直接操作页面。列表页统一结构：统计摘要 + Tab 筛选 + 卡片列表 + 处理菜单。

量尺列表页额外提供 FAB 按钮进入新建量尺向导。

### 决策 3：卡片交互

每个工单卡片右侧有"处理"按钮，点击弹出菜单。菜单选项按工单阶段动态变化。

### 决策 4：实现优先级

第一阶段：审批中心 + 量尺任务列表 + 施工任务列表
后续阶段：设计、生产、财务

## 页面设计

### 1. 审批中心 (ReviewCenterScreen)

**统计摘要（顶部）：**
- 待审批数量 / 已通过数量 / 已驳回数量

**Tab 筛选：**
- 待审批 (approval 阶段)
- 已通过
- 已驳回

**卡片字段：**
- 工单号、标题、客户名称、提交时间

**处理菜单（待审批状态下）：**
- 通过
- 驳回
- 查看详情

**已有基础：** ReviewCenterScreen.kt、ReviewCenterViewModel.kt 已部分实现，需要完善列表展示和菜单交互。

### 2. 量尺任务列表 (MeasurementTaskListScreen)

**统计摘要（顶部）：**
- 待量尺数量 / 已提交数量 / 已完成数量

**Tab 筛选：**
- 待量尺 (measurement 阶段，状态 pending)
- 已提交 (measurement 阶段，状态 submitted)
- 已完成 (measurement 阶段，状态 completed)

**卡片字段：**
- 工单号、标题、地址、截止时间、派工状态

**处理菜单（按状态不同）：**
- 待量尺：开始量尺 / 查看详情 / 联系客户
- 已提交：审核量尺 / 查看详情
- 已完成：查看详情

**FAB 按钮：** 新建量尺 → 导航到 MeasurementWizard

**已有基础：** MeasurementRepository、MeasurementApi 已实现。需要新建列表页面。

### 3. 施工任务列表 (ConstructionTaskListScreen)

**统计摘要（顶部）：**
- 待施工数量 / 施工中数量 / 已完成数量

**Tab 筛选：**
- 待施工 (construction 阶段，状态 pending)
- 施工中 (construction 阶段，状态 in_progress)
- 已完成 (construction 阶段，状态 completed)
- 已验收 (construction 阶段，状态 accepted)

**卡片字段：**
- 工单号、标题、地址、截止时间、施工员姓名

**处理菜单（按状态不同）：**
- 待施工：开始施工 / 查看详情 / 联系客户
- 施工中：标记完工 / 上报异常 / 查看详情
- 已完成：查看详情

**已有基础：** ConstructionRepository、ConstructionApi、ConstructionWizardScreen 已部分实现。需要新建列表页面。

### 4. 简化版工作台（测量员/安装员）

**统计卡片：**

测量员：
- 我的待量尺（分配给我且 pending 的工单数）
- 今日已完成（今天提交的量尺数）
- 待审核（已提交但等待审核的数量）

安装员：
- 我的待施工（分配给我且 pending 的工单数）
- 施工中（分配给我且 in_progress 的工单数）
- 今日已完成（今天完工的数量）

**快捷按钮：**

测量员：只显示"量尺"按钮 → 进入量尺任务列表
安装员：只显示"施工"按钮 → 进入施工任务列表

**实现方式：** 复用 DashboardScreen，根据用户角色动态渲染不同内容。判断角色字段来自 User 模型。

## 统一交互模式

### 页面结构（所有任务列表页一致）

```
┌─────────────────────────┐
│  页面标题              │
├─────────────────────────┤
│  统计摘要（横向3个数字）│
├─────────────────────────┤
│  [Tab1] [Tab2] [Tab3]  │
├─────────────────────────┤
│  ┌───────────────────┐  │
│  │ 工单号  标题   [处理]│  │
│  │ 地址    截止时间   │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 工单号  标题   [处理]│  │
│  │ 地址    截止时间   │  │
│  └───────────────────┘  │
│           ...            │
│                    [FAB] │
└─────────────────────────┘
```

### 处理菜单交互

1. 点击"处理"按钮
2. 弹出 DropdownMenu，选项按工单当前阶段动态生成
3. 选择操作后执行对应逻辑（API 调用 + UI 反馈）
4. 刷新列表

### 下拉刷新 + 分页

- 下拉刷新：重新加载当前 Tab 数据
- 分页：滚动到底部加载更多（复用现有 TaskListViewModel 的分页模式）

## 数据依赖

### API 接口

**审批相关（已有）：**
- GET /api/v1/tasks?stage=approval&status=pending — 审批列表
- PUT /api/v1/tasks/{id}/approve — 通过审批
- PUT /api/v1/tasks/{id}/reject — 驳回审批

**量尺相关（已有）：**
- GET /api/v1/measurement/tasks — 量尺任务列表
- POST /api/v1/measurement/submit — 提交量尺数据

**施工相关（已有）：**
- GET /api/v1/construction/tasks — 施工任务列表
- POST /api/v1/construction/submit — 提交施工数据
- POST /api/v1/construction/report-issue — 上报异常

### 角色判断

从 User 模型获取角色字段，根据角色控制工作台显示内容。需要确认 User 模型中角色字段的具体名称和取值。

## 文件变更清单

### 新建文件
- `presentation/review/ReviewTaskListScreen.kt` — 审批列表页面（完善现有）
- `presentation/measurement/MeasurementTaskListScreen.kt` — 量尺任务列表
- `presentation/construction/ConstructionTaskListScreen.kt` — 施工任务列表
- `presentation/common/StageTaskListScreen.kt` — 通用阶段任务列表组件（可复用）
- `presentation/common/ActionMenu.kt` — 处理菜单组件

### 修改文件
- `DashboardActions.kt` — 量尺按钮导航改为列表页而非向导
- `DashboardScreen.kt` — 支持角色判断，简化版工作台
- `DashboardViewModel.kt` — 加载角色信息，按角色返回不同统计
- `AppNavGraph.kt` — 添加量尺列表、施工列表路由
- `Screen.kt` — 添加新页面常量
- `AdminHome.kt` — 更新量尺导航目标
- `WorkerHome.kt` — 添加简化工作台入口
