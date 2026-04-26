# 任务 5：更新导航和 Dashboard

**文件：**
- 修改：`presentation/dashboard/DashboardScreen.kt`
- 修改：`presentation/admin/AdminHome.kt`

- [ ] **步骤 1：更新 DashboardScreen 导航回调**

添加新参数：
- `onNavigateToMeasurementList: () -> Unit`
- `onNavigateToConstructionList: () -> Unit`

QuickActionsRow 调用改为使用新回调。

- [ ] **步骤 2：更新 AdminHome 路由配置**

NavHost 添加：
- `composable("measurement_list") { MeasurementTaskListScreen(...) }`
- `composable("construction_list") { ConstructionTaskListScreen(...) }`

DashboardScreen 回调改为：
- `onNavigateToMeasurementList = { navController.navigate("measurement_list") }`
- `onNavigateToConstructionList = { navController.navigate("construction_list") }`

- [ ] **步骤 3：Commit**

```bash
git add presentation/dashboard/DashboardScreen.kt presentation/admin/AdminHome.kt
git commit -m "feat: update navigation for measurement and construction list screens"
```
