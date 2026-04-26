# 任务 2：完善审批中心页面

**文件：**
- 修改：`presentation/admin/review/ReviewCenterViewModel.kt`
- 修改：`presentation/admin/review/ReviewCenterScreen.kt`

- [ ] **步骤 1：更新 ReviewCenterViewModel**

添加 Tab 筛选（pending/approved/rejected）和统计数据。

主要变更：
1. 新增 `ReviewTab` 枚举
2. 新增 `ReviewStats` 数据类
3. 新增 `selectTab()` 方法
4. 修改 `loadTasks()` 支持按 Tab 筛选
5. 添加 `loadStats()` 方法

- [ ] **步骤 2：更新 ReviewCenterScreen**

添加统计摘要行、TabRow、卡片使用 ActionMenu。

主要变更：
1. 顶部添加三个 StatChip（待审批/已通过/已驳回）
2. 添加 TabRow 切换筛选状态
3. ReviewTaskCard 的通过/驳回按钮改为 ActionMenu
4. 保持驳回对话框功能

- [ ] **步骤 3：Commit**

```bash
git add presentation/admin/review/ReviewCenterViewModel.kt presentation/admin/review/ReviewCenterScreen.kt
git commit -m "feat: enhance ReviewCenter with stats, tabs and action menu"
```
