# 任务 6：按角色显示工作台内容

**文件：**
- 修改：`presentation/dashboard/DashboardViewModel.kt`
- 修改：`presentation/dashboard/DashboardScreen.kt`
- 修改：`presentation/dashboard/DashboardActions.kt`

- [ ] **步骤 1：更新 DashboardViewModel**

1. UiState 添加 `userRole: String = "admin"`
2. `loadUserName()` 同时加载角色
3. 统计加载逻辑按角色区分

- [ ] **步骤 2：更新 DashboardScreen**

1. 根据 userRole 判断是否为测量员/安装员
2. 动态构建 quickActions 列表
3. 传递动态列表给 QuickActionsRow

- [ ] **步骤 3：更新 QuickActionsRow**

支持接收 `actions: List<QuickAction>` 参数而非固定 6 个回调。

- [ ] **步骤 4：Commit**

```bash
git add presentation/dashboard/DashboardViewModel.kt presentation/dashboard/DashboardScreen.kt presentation/dashboard/DashboardActions.kt
git commit -m "feat: show role-based dashboard content for measurer and constructor"
```
