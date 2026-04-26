# 工作台快捷操作功能实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 实现工作台快捷按钮对应的任务列表页面（审批、量尺、施工）以及按角色显示不同内容的工作台。

**架构：** 复用现有 TaskListScreen 的列表模式，统一页面结构（统计摘要 + Tab 筛选 + 卡片列表 + 处理菜单）。新建通用 ActionMenu 组件用于卡片操作。DashboardScreen 根据 User.role 动态渲染不同统计和快捷按钮。

**技术栈：** Kotlin + Jetpack Compose + Material3 + StateFlow + Navigation Compose

---

## 文件结构

### 新建文件

| 文件 | 职责 |
|------|------|
| `presentation/common/ActionMenu.kt` | 通用下拉菜单组件，显示操作选项 |
| `presentation/measurement/MeasurementTaskListScreen.kt` | 量尺任务列表页面 |
| `presentation/measurement/MeasurementTaskListViewModel.kt` | 量尺任务列表状态管理 |
| `presentation/construction/ConstructionTaskListScreen.kt` | 施工任务列表页面 |
| `presentation/construction/ConstructionTaskListViewModel.kt` | 施工任务列表状态管理 |

### 修改文件

| 文件 | 修改内容 |
|------|---------|
| `presentation/admin/review/ReviewCenterScreen.kt` | 添加统计摘要、Tab 筛选、处理菜单 |
| `presentation/admin/review/ReviewCenterViewModel.kt` | 添加 Tab 筛选状态、分页、统计数据 |
| `presentation/dashboard/DashboardScreen.kt` | 按角色显示不同统计和快捷按钮 |
| `presentation/dashboard/DashboardViewModel.kt` | 按角色加载统计数据，新增导航回调 |
| `presentation/dashboard/DashboardActions.kt` | QuickActionsRow 支持动态按钮列表 |
| `presentation/admin/AdminHome.kt` | 添加新路由，修改导航回调 |
| `presentation/worker/WorkerHome.kt` | 添加简化版工作台入口 |

---

## 任务清单

- [ ] 任务 1：创建 ActionMenu 通用组件 (`docs/superpowers/plans/task-01-action-menu.md`)
- [ ] 任务 2：完善审批中心页面 (`docs/superpowers/plans/task-02-review-center.md`)
- [ ] 任务 3：量尺任务列表页面 (`docs/superpowers/plans/task-03-measurement-list.md`)
- [ ] 任务 4：施工任务列表页面 (`docs/superpowers/plans/task-04-construction-list.md`)
- [ ] 任务 5：更新导航和 Dashboard (`docs/superpowers/plans/task-05-navigation.md`)
- [ ] 任务 6：按角色显示工作台内容 (`docs/superpowers/plans/task-06-role-dashboard.md`)
- [ ] 任务 7：更新 WorkerHome 简化工作台入口 (`docs/superpowers/plans/task-07-worker-home.md`)
- [ ] 任务 8：验证构建

---

## 验收标准

- [ ] 审批中心有统计摘要、Tab 筛选、处理菜单
- [ ] 量尺任务列表有统计、Tab、卡片、FAB
- [ ] 施工任务列表有统计、Tab、卡片
- [ ] 量尺按钮导航到列表页，FAB 进入向导
- [ ] 施工按钮导航到列表页
- [ ] 管理员工作台显示 6 个快捷按钮
- [ ] 测量员工作台显示 1 个量尺按钮
- [ ] 安装员工作台显示 1 个施工按钮
- [ ] 构建成功无错误
