# 任务 7：更新 WorkerHome 简化工作台入口

**文件：**
- 修改：`presentation/worker/WorkerHome.kt`

- [ ] **步骤 1：更新 WorkerHome 底部 Tab**

将 2 个 Tab（我的任务、我的）改为 3 个 Tab：
- 工作台（使用简化版 DashboardScreen）
- 我的任务
- 我的

- [ ] **步骤 2：添加工作台路由**

NavHost 添加 `composable("dashboard")` 使用 DashboardScreen。

- [ ] **步骤 3：Commit**

```bash
git add presentation/worker/WorkerHome.kt
git commit -m "feat: add simplified dashboard to WorkerHome for measurer/constructor"
```
