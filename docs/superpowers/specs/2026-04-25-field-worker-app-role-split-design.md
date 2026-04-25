# 外勤APP角色分流设计

## 概述

将现有的 measure-app 按角色分为管理员端和外勤端，两者使用同一个 APP，登录后根据角色跳转到不同的首页。同时优化测量页面的两种模式（后台派单测量 / 现场自主创建）。

---

## 一、角色分流

### 角色定义

| 角色 | 类型 | 跳转页面 |
|------|------|----------|
| `admin` | 管理员 | 现有 HomeScreen（仪表盘） |
| 其他所有角色（measurer/constructor/dispatcher 等） | 外勤 | 新建 FieldHomeScreen |

### 登录页改动

文件：`lib/screens/login_screen.dart`

登录成功后，后端返回的 JWT payload 中已有 `role` 字段（`admin`/`measurer`/`constructor` 等）。
现有 `AuthProvider.login()` 解码 JWT 并存入 `auth_provider.dart`，直接使用 `auth.role` 即可。

```dart
final auth = context.read<AuthProvider>();
if (auth.role == 'admin') {
  Navigator.pushReplacement(context,
    MaterialPageRoute(builder: (_) => const HomeScreen()));
} else {
  Navigator.pushReplacement(context,
    MaterialPageRoute(builder: (_) => const FieldHomeScreen()));
}
```

---

## 二、外勤首页

### 新建文件：`lib/screens/field_home_screen.dart`

底部导航两个 Tab：

| Tab | 内容 |
|-----|------|
| 我的任务 | 复用 TasksScreen，但调用 `GET /measurements/tasks?my=true` 只显示分配给自己的任务 |
| 我的 | 复用 ProfileScreen |

### 外勤任务列表

改动文件：`lib/screens/tasks_screen.dart`

后端 `listMeasurementTasks` 已有按用户过滤的逻辑（非 admin 只看 `assigned_tenant_user_id` 匹配自己的任务）。
所以外勤端的"我的任务"直接复用现有接口，**不需要**改后端加 `my` 参数。

前端改动：
- 增加 `myOnly` 参数，但仅在管理员端用（管理员加 `my=true` 看自己的任务）
- 外勤端不加参数，后端自动只返回自己的任务
- 隐藏管理相关操作：新建工单按钮、看板视图中的派单入口

### 外勤任务详情

改动文件：`lib/screens/task_detail_screen.dart`

当前 APP 端任务详情只有"开始测量/开始施工"按钮，没有管理操作按钮（派单/审核等在 admin-web 网页端）。
所以任务详情页**不需要改动**，外勤和管理员看到的是同一个页面。

> 如果后续 APP 增加了管理功能按钮，再按角色隐藏即可。

---

## 三、测量页面两种模式

### 模式一：后台派单测量

流程：

```
管理员在后台创建工单并派单
→ 测量员APP收到任务（出现在"我的任务"列表）
→ 点进任务详情
→ 直接填写"项目模版动态表单"（formType: measurement）
→ 提交，状态变为"已测量，待审核"
→ 管理员审核 → 通过则进入设计环节 → 驳回则重新测量
```

任务详情页中，当任务状态为"待测量"时显示"开始测量"按钮，点击跳转到 `MeasurementScreen`。

### 模式二：现场自主创建

流程：

```
测量员在工地现场，打开APP
→ 点"新建测量"
→ 第1步：填写工单创建表单（formType: work_order_create）
   字段：甲方企业、店铺名字、活动项目、广告类型、项目地址、需求描述、截止日期
→ 校验通过后进入第2步
→ 第2步：填写项目模版动态表单（formType: measurement）
   字段：材料、面、尺寸、照片等（动态加载）
→ 点击"提交"
→ 提交时两步合并为一个请求处理：
   1. POST /api/v1/work-orders 提交工单创建数据
      后端自动设置：source='field_created'，status='submitted'，current_stage='measurement'
   2. 拿到返回的 workOrderId
   3. POST /api/v1/measurements/{workOrderId} 提交测量数据
   4. 成功后返回任务列表
→ 管理员在后台审核工单
→ 通过后工单进入正常流程（设计→生产→施工→结算→归档）
→ 驳回后工单状态变为 'rejected'，外勤仍可在任务列表看到，显示驳回原因
```

### 测量向导（新建文件）

文件：`lib/screens/measurement_wizard.dart`

```
第1步：工单创建
  - 调用 GET /api/v1/tenant/form-config/work_order_create 获取动态字段
  - 渲染动态表单
  - 必填项校验（甲方、标题等 required 字段）
  - 校验通过才能点"下一步"
  - 数据暂存本地（不请求后端）

第2步：项目模版动态表单
  - 调用 GET /api/v1/tenant/form-config/measurement 获取动态字段
  - 渲染动态表单（含材料、面、照片等子表单）
  - 必填项校验
  - 校验通过才能点"提交"

提交逻辑：
  - 两个步骤的数据一次性提交
  - 如果网络断开，整个向导数据存入离线队列（包含工单数据+测量数据）
  - 离线队列条目标记类型 'field_wizard'，联网后先创建工单再提交测量
```

### 步骤指示器

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ① 工单信息    ② 测量数据
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ↑ 第1步完成时高亮②
```

---

## 四、后端改动

### 任务列表过滤

后端 `listMeasurementTasks`（`assignmentController.js`）已有按用户过滤的逻辑：
非 admin 用户调用时，自动添加 `where: { assigned_tenant_user_id: req.user.user_id }`。

**所以外勤端的"我的任务"直接复用现有接口，不需要改后端。**

外勤端加载任务时，后端自动只返回分配给自己的任务。

### 工单来源字段

文件：`backend/src/models/WorkOrder.js`

新增字段：

```javascript
source: {
  type: DataTypes.ENUM('admin_created', 'field_created', 'declaration'),
  defaultValue: 'admin_created',
  comment: '工单来源'
}
```

### 审核新工单接口

文件：`backend/src/controllers/workOrderController.js`

新增接口：`POST /api/v1/work-orders/:id/review`（必须在 `/:id` 路由之前注册）

- 要求管理员权限（`requireTenant` 中间件）
- 审核通过：状态从 `submitted` 转为 `approved`，进入正常流程
- 审核驳回：状态转为 `rejected`，前端传 `reject_reason` 字段
- 外勤端任务列表显示 `rejected` 状态的工单，显示驳回原因

### 路由排序

注意：`POST /api/v1/work-orders/:id/review` 必须在 `PUT /api/v1/work-orders/:id` 之前注册，否则会被拦截。

---

## 五、错误处理

| 场景 | 处理 |
|------|------|
| 登录失败 | 显示"账号或密码错误" |
| 网络断开 | 显示"网络不可用，请检查网络" |
| 任务加载失败 | 卡片显示"加载失败，点击重试" |
| 没有任务 | 空状态"暂无任务，等待管理员分配" |
| 提交失败（有网） | 显示"提交失败"并返回原因，数据留在表单 |
| 提交失败（无网） | 测量向导整个数据（工单+测量）存入离线队列，标记类型 `field_wizard`，联网后先创建工单再提交测量；单独提交走原逻辑 |
| 工单已被他人提交 | 提示"该工单已被提交" |
| 必填项未填 | 表单校验标红，提交按钮禁用 |
| 工单被驳回 | 在任务列表显示"已驳回"状态，显示驳回原因。工单使用软删除，外勤仍可见 |

---

## 六、测试场景

1. 管理员账号登录 → 看到完整仪表盘
2. 测量员账号登录 → 只看到"我的任务"和"我的"
3. 外勤点进派给自己的任务 → 显示"开始测量" → 填写动态表单 → 提交
4. 外勤新建测量 → 第1步填工单表单 → 第2步填测量表单 → 提交
5. 管理员审核外勤创建的工单 → 通过/驳回
6. 外勤查看被驳回的工单 → 显示驳回原因，工单仍可见
7. 离线状态下提交测量 → 数据存入队列，联网后自动同步
8. 外勤第1步不填必填项 → 无法进入第2步
9. 外勤第2步不添加材料 → 提交按钮禁用

---

## 七、实现文件清单

### 新建

| 文件 | 内容 |
|------|------|
| `measure-app/lib/screens/field_home_screen.dart` | 外勤首页（我的任务 + 我的） |
| `measure-app/lib/screens/measurement_wizard.dart` | 现场自主创建测量向导 |
| `measure-app/lib/services/form_config_service.dart` | 动态表单配置获取/解析服务，接口定义：<br>`Future<List<FieldConfig>> getFormConfig(String formType)` — 调用 `GET /api/v1/tenant/form-config/{formType}`，返回字段列表。错误时抛出 `NetworkException` 或返回空列表（回退到默认值） |

### 改动

| 文件 | 改动内容 |
|------|----------|
| `measure-app/lib/screens/login_screen.dart` | 登录后角色判断跳转 |
| `measure-app/lib/screens/tasks_screen.dart` | 增加 `myOnly` 参数（仅管理员端用） |
| `measure-app/lib/screens/measurement_screen.dart` | 补全面编辑拍照/手绘功能 |
| `measure-app/lib/screens/construction_screen.dart` | 照片删除 + GPS 签到（附带优化） |
| `backend/src/models/WorkOrder.js` | 新增 source 字段 |
| `backend/src/controllers/workOrderController.js` | 新增审核工单接口 |
| `backend/src/routes/workOrder.js` | 注册审核路由 |

---

## 八、实现顺序

1. 后端：WorkOrder 模型增加 source 字段
2. 后端：工单审核接口（`POST /work-orders/:id/review`）
3. 前端：登录页加角色判断
4. 前端：外勤首页
5. 前端：任务列表加 `myOnly` 参数（仅管理员端用）
6. 前端：测量向导（现场自主创建）
7. 前端：测量页面补全拍照/手绘
8. 前端：施工页面照片删除 + GPS（附带优化）
