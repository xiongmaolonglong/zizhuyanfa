# 任务 4：施工任务列表页面

**文件：**
- 创建：`presentation/construction/ConstructionTaskListViewModel.kt`
- 创建：`presentation/construction/ConstructionTaskListScreen.kt`

- [ ] **步骤 1：创建 ConstructionTaskListViewModel**

功能：
- Tab 筛选（待施工/施工中/已完成/已验收）
- 统计数据
- 分页加载
- 下拉刷新

- [ ] **步骤 2：创建 ConstructionTaskListScreen**

结构：
- TopAppBar（标题"施工任务"）
- 统计摘要行
- TabRow（四个 Tab）
- PullToRefreshBox 包裹 LazyColumn
- 卡片显示：工单号、标题、地址、截止时间

- [ ] **步骤 3：Commit**

```bash
git add presentation/construction/ConstructionTaskListViewModel.kt presentation/construction/ConstructionTaskListScreen.kt
git commit -m "feat: add ConstructionTaskListScreen with stats and tabs"
```
