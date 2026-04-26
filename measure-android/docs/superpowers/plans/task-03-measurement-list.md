# 任务 3：量尺任务列表页面

**文件：**
- 创建：`presentation/measurement/MeasurementTaskListViewModel.kt`
- 创建：`presentation/measurement/MeasurementTaskListScreen.kt`

- [ ] **步骤 1：创建 MeasurementTaskListViewModel**

功能：
- Tab 筛选（待量尺/已提交/已完成）
- 统计数据（各状态数量）
- 分页加载
- 下拉刷新

- [ ] **步骤 2：创建 MeasurementTaskListScreen**

结构：
- TopAppBar（标题"量尺任务"）
- 统计摘要行（三个 StatChip）
- TabRow（三个 Tab）
- PullToRefreshBox 包裹 LazyColumn
- 卡片显示：工单号、标题、地址、截止时间
- 右下角 FAB（新建量尺 → 进入向导）

- [ ] **步骤 3：Commit**

```bash
git add presentation/measurement/MeasurementTaskListViewModel.kt presentation/measurement/MeasurementTaskListScreen.kt
git commit -m "feat: add MeasurementTaskListScreen with stats, tabs and FAB"
```
