# 外勤APP角色分流实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将 measure-app 按角色分为管理员端和外勤端，并实现测量的两种模式（后台派单 / 现场自主创建）

**架构：** 登录页判断 JWT 中的 role 字段，admin 跳现有 HomeScreen，其他角色跳新建的 FieldHomeScreen。后端新增工单审核接口和 source 字段。测量向导支持现场自主创建（工单表单+测量表单两步提交）。

**技术栈：** Flutter (Dart 3+) + Express.js + Sequelize + MySQL + Provider 状态管理 + http 网络请求

---

## 文件结构

### 新建

| 文件 | 职责 |
|------|------|
| `measure-app/lib/screens/field_home_screen.dart` | 外勤首页，底部两个 Tab：我的任务 + 我的 |
| `measure-app/lib/screens/measurement_wizard.dart` | 现场自主创建向导（两步：工单信息 → 测量数据） |
| `measure-app/lib/services/form_config_service.dart` | 动态表单配置服务，获取/解析后端 form-config |
| `measure-app/lib/widgets/dynamic_form_builder.dart` | 动态表单渲染组件，根据 FieldConfig 生成对应 Widget |
| `backend/src/controllers/workOrderReviewController.js` | 工单审核控制器（新增文件） |

### 修改

| 文件 | 改动 |
|------|------|
| `measure-app/lib/screens/login_screen.dart:60-75` | 登录成功后按 role 跳转不同首页 |
| `measure-app/lib/screens/tasks_screen.dart` | 增加 `myOnly` 参数 |
| `measure-app/lib/screens/measurement_screen.dart:119-130` | 面编辑拍照/手绘功能补全 |
| `measure-app/lib/screens/construction_screen.dart` | 照片删除 + 照片全屏滑动 |
| `backend/src/models/WorkOrder.js` | 新增 source 字段 |
| `backend/src/models/index.js` | 更新模型定义 |
| `backend/src/routes/workOrder.js` | 注册审核路由 |
| `measure-app/lib/services/sync_service.dart` | 新增 field_wizard 同步类型 |

---

### 任务 1：后端 — WorkOrder 模型增加 source 字段

**文件：**
- 修改：`backend/src/models/WorkOrder.js:44-45`

- [ ] **步骤 1：修改 WorkOrder 模型**

在 `WorkOrder.js` 的 `remarks` 字段后面、`custom_data` 前面添加：

```javascript
source: {
  type: DataTypes.ENUM('admin_created', 'field_created', 'declaration'),
  defaultValue: 'admin_created',
  comment: '工单来源：管理员创建/现场创建/申报导入'
},
```

- [ ] **步骤 2：Commit**

```bash
git add backend/src/models/WorkOrder.js
git commit -m "feat: 新增工单 source 字段区分创建来源"
```

---

### 任务 2：后端 — 工单审核接口

**文件：**
- 创建：`backend/src/controllers/workOrderReviewController.js`
- 修改：`backend/src/routes/workOrder.js:24-28`（注册路由）

- [ ] **步骤 1：创建审核控制器**

创建 `backend/src/controllers/workOrderReviewController.js`：

```javascript
const { WorkOrder, WoChangeLog } = require('../models');
const { success, error } = require('../utils/response');

/**
 * POST /api/v1/work-orders/:id/review
 * 管理员审核现场创建的工单
 * body: { action: 'approve' | 'reject', reject_reason?: string }
 */
async function reviewWorkOrder(req, res) {
  try {
    const { id } = req.params;
    const { action, reject_reason } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return error(res, 'action 必须为 approve 或 reject', 400);
    }

    const wo = await WorkOrder.findByPk(id);
    if (!wo) {
      return error(res, '工单不存在', 404);
    }

    if (wo.source !== 'field_created') {
      return error(res, '此接口仅审核现场创建的工单', 400);
    }

    if (wo.status !== 'submitted') {
      return error(res, '工单状态不是待审核', 400);
    }

    if (action === 'approve') {
      // 审核通过，进入正常流程
      wo.status = 'approved';
      wo.current_stage = 'measurement';
      await wo.save();
      return success(res, { work_order_no: wo.work_order_no }, '工单已审核通过');
    } else {
      // 驳回
      wo.status = 'rejected';
      wo.remarks = JSON.stringify([{ reason: reject_reason || '未通过审核', time: new Date().toISOString() }]);
      await wo.save();
      return success(res, null, '工单已驳回');
    }
  } catch (err) {
    console.error('reviewWorkOrder error:', err);
    return error(res, '审核失败');
  }
}

module.exports = { reviewWorkOrder };
```

- [ ] **步骤 2：注册路由**

在 `backend/src/routes/workOrder.js` 中，在 `router.use(requireAuth, injectTenant);` 之后、`router.post('/', ...)` 之前添加：

```javascript
const reviewController = require('../controllers/workOrderReviewController');

// ... 在 router.use(requireAuth, injectTenant); 之后 ...

// 审核现场创建的工单（必须在 /:id 之前）
router.post('/:id/review', reviewController.reviewWorkOrder);
```

> 注意：`post('/:id/review')` 必须在 `get('/:id')` 之前，但当前 `/:id/review` 已经在所有 `/:id` 子路由之前定义，所以只要放在文件顶部即可。

- [ ] **步骤 3：验证路由注册正确**

运行后端并测试：

```bash
cd backend && npm run dev
```

- [ ] **步骤 4：Commit**

```bash
git add backend/src/controllers/workOrderReviewController.js backend/src/routes/workOrder.js
git commit -m "feat: 新增工单审核接口用于现场创建工单"
```

---

### 任务 3：前端 — AuthProvider 暴露 role

**文件：**
- 修改：`measure-app/lib/providers/auth_provider.dart`

`AuthProvider` 目前只有 `user` 和 `isLoggedIn`，`user.role` 已经可以从 `UserModel` 获取。但 `AuthProvider.login()` 不返回 role，需要在 `AuthProvider` 中加一个 getter。

- [ ] **步骤 1：在 AuthProvider 中添加 role getter**

在 `auth_provider.dart` 的 `isLoggedIn` getter 后面添加：

```dart
String get role => _user?.role ?? '';
```

- [ ] **步骤 2：Commit**

```bash
git add measure-app/lib/providers/auth_provider.dart
git commit -m "feat: AuthProvider 暴露 role getter 用于登录跳转"
```

---

### 任务 4：前端 — 登录页角色判断跳转

**文件：**
- 修改：`measure-app/lib/screens/login_screen.dart:60-75`（`_doPasswordLogin` 方法）

- [ ] **步骤 1：修改登录成功后的跳转逻辑**

将 `_doPasswordLogin` 中的：

```dart
if (ok) {
  Navigator.pushReplacementNamed(context, '/home');
} else {
  context.read<AuthProvider>().login('demo', 'demo', remember: _remember);
  if (mounted) Navigator.pushReplacementNamed(context, '/home');
}
```

替换为：

```dart
if (ok) {
  if (!mounted) return;
  final auth = context.read<AuthProvider>();
  if (auth.role == 'admin') {
    Navigator.pushReplacement(context,
        MaterialPageRoute(builder: (_) => const HomeScreen()));
  } else {
    Navigator.pushReplacement(context,
        MaterialPageRoute(builder: (_) => const FieldHomeScreen()));
  }
}
```

> 注意：`HomeScreen` 需要 import。删除 `pushReplacementNamed(context, '/home')` 这行。

- [ ] **步骤 2：Commit**

```bash
git add measure-app/lib/screens/login_screen.dart
git commit -m "feat: 登录后按角色跳转不同首页"
```

---

### 任务 5：前端 — 外勤首页

**文件：**
- 创建：`measure-app/lib/screens/field_home_screen.dart`

- [ ] **步骤 1：创建 FieldHomeScreen**

```dart
import 'package:flutter/material.dart';
import 'tasks_screen.dart';
import 'profile_screen.dart';
import '../providers/auth_provider.dart';
import 'package:provider/provider.dart';

class FieldHomeScreen extends StatefulWidget {
  const FieldHomeScreen({super.key});

  @override
  State<FieldHomeScreen> createState() => _FieldHomeScreenState();
}

class _FieldHomeScreenState extends State<FieldHomeScreen> {
  int _index = 0;

  late final List<Widget> _pages;

  @override
  void initState() {
    super.initState();
    _pages = [
      TasksScreen(myOnly: true),
      const ProfileScreen(),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: const Color(0xFFE2E8F0),
        title: Text('我的任务'),
        actions: [
          Text(
            auth.user?.name ?? '',
            style: const TextStyle(color: Color(0xFF60A5FA), fontSize: 14),
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: IndexedStack(
        index: _index,
        children: _pages,
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildBottomNav() {
    const items = [
      _TabData(icon: Icons.task_alt_outlined, active: Icons.task_alt, label: '我的任务'),
      _TabData(icon: Icons.person_outline, active: Icons.person, label: '我的'),
    ];
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        border: Border(
          top: BorderSide(color: const Color(0xFF1E293B), width: 1),
        ),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).padding.bottom,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: List.generate(items.length, (i) {
          final item = items[i];
          final selected = _index == i;
          return GestureDetector(
            onTap: () => setState(() => _index = i),
            behavior: HitTestBehavior.opaque,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    selected ? item.active : item.icon,
                    size: 22,
                    color: selected ? const Color(0xFF3B82F6) : const Color(0xFF64748B),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    item.label,
                    style: TextStyle(
                      color: selected ? const Color(0xFF3B82F6) : const Color(0xFF64748B),
                      fontSize: 10,
                      fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _TabData {
  final IconData icon;
  final IconData active;
  final String label;
  const _TabData({required this.icon, required this.active, required this.label});
}
```

- [ ] **步骤 2：验证编译**

```bash
cd measure-app && flutter analyze lib/screens/field_home_screen.dart
```

- [ ] **步骤 3：Commit**

```bash
git add measure-app/lib/screens/field_home_screen.dart
git commit -m "feat: 外勤首页，两个 Tab：我的任务 + 我的"
```

---

### 任务 6：前端 — TasksScreen 增加 myOnly 参数

**文件：**
- 修改：`measure-app/lib/screens/tasks_screen.dart`

- [ ] **步骤 1：添加 myOnly 构造函数参数**

在 `TasksScreen` 类中添加参数：

```dart
class TasksScreen extends StatefulWidget {
  final bool myOnly;
  const TasksScreen({super.key, this.myOnly = false});
  // ...
```

- [ ] **步骤 2：加载任务时加参数**

在 `_loadTasks()` 方法中，构造请求时：

```dart
final result = await _svc.getList(
  status: statusFilter,
  keyword: keyword,
  my: widget.myOnly,  // 新增
);
```

> 注意：`_svc.getList` 是 `WorkOrderService.getList()`，需要加 `my` 参数支持。

- [ ] **步骤 3：修改 WorkOrderService**

在 `measure-app/lib/services/work_order_service.dart` 中找到 `getList` 方法，添加可选参数 `bool my = false`，请求时加到 query 参数中：

```dart
Future<List<WorkOrder>> getList({
  String? status,
  String? keyword,
  bool my = false,
}) async {
  // ...
  final queryParams = {
    // 现有参数...
    if (my) 'my': 'true',
  };
  // ...
}
```

- [ ] **步骤 4：隐藏新建工单按钮**

在 `TasksScreen.build()` 中，FAB 按钮改为：

```dart
floatingActionButton: widget.myOnly
    ? null
    : FloatingActionButton(
        // 原有代码...
      ),
```

- [ ] **步骤 5：验证编译**

```bash
cd measure-app && flutter analyze lib/screens/tasks_screen.dart
```

- [ ] **步骤 6：Commit**

```bash
git add measure-app/lib/screens/tasks_screen.dart measure-app/lib/services/work_order_service.dart
git commit -m "feat: TasksScreen 支持 myOnly 参数过滤自己的任务"
```

---

### 任务 7：前端 — 动态表单配置服务

**文件：**
- 创建：`measure-app/lib/services/form_config_service.dart`
- 创建：`measure-app/lib/widgets/dynamic_form_builder.dart`

- [ ] **步骤 1：创建 FormConfigService**

```dart
import 'dart:convert';
import 'api_service.dart';

class FieldConfig {
  final String fieldKey;
  final String fieldLabel;
  final String fieldType;
  final bool required;
  final String? placeholder;
  final String? defaultValue;
  final List<FieldOption>? options;
  final Map<String, dynamic>? subformTemplate;

  FieldConfig({
    required this.fieldKey,
    required this.fieldLabel,
    required this.fieldType,
    this.required = false,
    this.placeholder,
    this.defaultValue,
    this.options,
    this.subformTemplate,
  });

  factory FieldConfig.fromJson(Map<String, dynamic> json) => FieldConfig(
        fieldKey: json['field_key'] ?? '',
        fieldLabel: json['field_label'] ?? '',
        fieldType: json['field_type'] ?? 'text',
        required: json['required'] ?? false,
        placeholder: json['placeholder'],
        defaultValue: json['default_value'],
        options: (json['options'] as List?)
            ?.map((o) => FieldOption.fromJson(o))
            .toList(),
        subformTemplate: json['subform_template']
            as Map<String, dynamic>?,
      );
}

class FieldOption {
  final String label;
  final String value;
  const FieldOption({required this.label, required this.value});
  factory FieldOption.fromJson(Map<String, dynamic> json) =>
      FieldOption(label: json['label'] ?? '', value: json['value'] ?? '');
}

class FormConfigService {
  final ApiService _api = ApiService();

  Future<List<FieldConfig>> getFormConfig(String formType) async {
    try {
      final res = await _api.get('/api/v1/tenant/form-config/$formType');
      final data = res['data'] as Map<String, dynamic>;
      final fields = data['fields'] as List;
      return fields.map((f) => FieldConfig.fromJson(f as Map<String, dynamic>)).toList();
    } catch (e) {
      // 返回空列表，上层回退到默认值
      return [];
    }
  }
}
```

- [ ] **步骤 2：创建 DynamicFormBuilder 基础渲染**

```dart
import 'package:flutter/material.dart';
import '../services/form_config_service.dart';

class DynamicFormBuilder extends StatefulWidget {
  final List<FieldConfig> fields;
  final Map<String, dynamic> initialData;
  final ValueChanged<Map<String, dynamic>> onChanged;

  const DynamicFormBuilder({
    super.key,
    required this.fields,
    this.initialData = const {},
    required this.onChanged,
  });

  @override
  State<DynamicFormBuilder> createState() => _DynamicFormBuilderState();
}

class _DynamicFormBuilderState extends State<DynamicFormBuilder> {
  late final Map<String, dynamic> _data;
  final Map<String, TextEditingController> _controllers = {};

  @override
  void initState() {
    super.initState();
    _data = Map.from(widget.initialData);
    for (final field in widget.fields) {
      _controllers[field.fieldKey] = TextEditingController(
        text: _data[field.fieldKey]?.toString() ?? field.defaultValue?.toString() ?? '',
      );
    }
  }

  @override
  void dispose() {
    for (final c in _controllers.values) c.dispose();
    super.dispose();
  }

  void _update(String key, dynamic value) {
    _data[key] = value;
    widget.onChanged(Map.from(_data));
  }

  Widget _buildField(FieldConfig field) {
    return switch (field.fieldType) {
      'text' => _buildText(field),
      'textarea' => _buildTextarea(field),
      'number' => _buildNumber(field),
      'date' => _buildDate(field),
      'select' => _buildSelect(field),
      'image' => _buildImage(field),
      'address' => _buildAddress(field),
      'client_select' => _buildClientSelect(field),
      'subform' => _buildSubform(field),
      _ => const SizedBox.shrink(),
    };
  }

  Widget _buildText(FieldConfig field) {
    final ctrl = _controllers[field.fieldKey]!;
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextField(
        controller: ctrl,
        style: const TextStyle(color: Color(0xFFCBD5E1)),
        decoration: InputDecoration(
          labelText: field.fieldLabel,
          labelStyle: const TextStyle(color: Color(0xFF64748B)),
          border: const OutlineInputBorder(),
          enabledBorder: OutlineInputBorder(
            borderSide: const BorderSide(color: Color(0xFF334155)),
          ),
          focusedBorder: OutlineInputBorder(
            borderSide: const BorderSide(color: Color(0xFF3B82F6)),
          ),
          hintText: field.placeholder,
          hintStyle: const TextStyle(color: Color(0xFF475569)),
        ),
        onChanged: (v) => _update(field.fieldKey, v),
      ),
    );
  }

  Widget _buildTextarea(FieldConfig field) {
    final ctrl = _controllers[field.fieldKey]!;
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextField(
        controller: ctrl,
        maxLines: 3,
        style: const TextStyle(color: Color(0xFFCBD5E1)),
        decoration: InputDecoration(
          labelText: field.fieldLabel,
          labelStyle: const TextStyle(color: Color(0xFF64748B)),
          border: const OutlineInputBorder(),
          enabledBorder: OutlineInputBorder(
            borderSide: const BorderSide(color: Color(0xFF334155)),
          ),
          focusedBorder: OutlineInputBorder(
            borderSide: const BorderSide(color: Color(0xFF3B82F6)),
          ),
          hintText: field.placeholder,
          hintStyle: const TextStyle(color: Color(0xFF475569)),
        ),
        onChanged: (v) => _update(field.fieldKey, v),
      ),
    );
  }

  Widget _buildNumber(FieldConfig field) {
    final ctrl = _controllers[field.fieldKey]!;
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextField(
        controller: ctrl,
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
        style: const TextStyle(color: Color(0xFFCBD5E1)),
        decoration: InputDecoration(
          labelText: field.fieldLabel,
          labelStyle: const TextStyle(color: Color(0xFF64748B)),
          border: const OutlineInputBorder(),
          enabledBorder: OutlineInputBorder(
            borderSide: const BorderSide(color: Color(0xFF334155)),
          ),
          focusedBorder: OutlineInputBorder(
            borderSide: const BorderSide(color: Color(0xFF3B82F6)),
          ),
          hintText: field.placeholder,
          hintStyle: const TextStyle(color: Color(0xFF475569)),
        ),
        onChanged: (v) => _update(field.fieldKey, double.tryParse(v)),
      ),
    );
  }

  Widget _buildDate(FieldConfig field) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: () async {
          final picked = await showDatePicker(
            context: context,
            initialDate: DateTime.now(),
            firstDate: DateTime(2020),
            lastDate: DateTime(2030),
            builder: (context, child) => Theme(
              data: Theme.of(context).copyWith(
                colorScheme: const ColorScheme.dark(
                  primary: Color(0xFF3B82F6),
                ),
              ),
              child: child!,
            ),
          );
          if (picked != null) {
            _update(field.fieldKey, picked.toIso8601String().split('T').first);
          }
        },
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFF334155)),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _data[field.fieldKey] ?? field.placeholder ?? field.fieldLabel,
                style: TextStyle(
                  color: _data[field.fieldKey] != null
                      ? const Color(0xFFCBD5E1)
                      : const Color(0xFF475569),
                ),
              ),
              const Icon(Icons.calendar_today, size: 18, color: Color(0xFF64748B)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSelect(FieldConfig field) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: DropdownButtonFormField<String>(
        value: _data[field.fieldKey]?.toString(),
        dropdownColor: const Color(0xFF1E293B),
        items: (field.options ?? [])
            .map((o) => DropdownMenuItem(
                  value: o.value,
                  child: Text(o.label,
                      style: const TextStyle(color: Color(0xFFE2E8F0))),
                ))
            .toList(),
        onChanged: (v) => _update(field.fieldKey, v),
        decoration: InputDecoration(
          labelText: field.fieldLabel,
          labelStyle: const TextStyle(color: Color(0xFF64748B)),
          border: const OutlineInputBorder(),
        ),
        style: const TextStyle(color: Color(0xFFE2E8F0)),
      ),
    );
  }

  Widget _buildImage(FieldConfig field) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(field.fieldLabel,
              style: const TextStyle(
                  color: Color(0xFFE2E8F0),
                  fontSize: 14,
                  fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Row(
            children: [
              OutlinedButton.icon(
                onPressed: () {
                  // 拍照逻辑 — 由父组件处理
                },
                icon: const Icon(Icons.camera_alt, size: 18),
                label: const Text('拍照'),
              ),
              const SizedBox(width: 8),
              OutlinedButton.icon(
                onPressed: () {
                  // 相册选择 — 由父组件处理
                },
                icon: const Icon(Icons.photo_library, size: 18),
                label: const Text('相册'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAddress(FieldConfig field) {
    // 简化版：文本输入框
    return _buildText(field);
  }

  Widget _buildClientSelect(FieldConfig field) {
    // 简化版：文本输入框，后续可改为甲方选择器
    return _buildText(field);
  }

  Widget _buildSubform(FieldConfig field) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(field.fieldLabel,
              style: const TextStyle(
                  color: Color(0xFFE2E8F0),
                  fontSize: 16,
                  fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          const Text('(子表单功能待实现)',
              style: TextStyle(color: Color(0xFF475569))),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: widget.fields.map(_buildField).toList(),
    );
  }
}
```

> 注意：`DynamicFormBuilder` 中的 `image` 类型和 `subform` 类型先给占位实现，后续在测量向导中完善。`client_select` 和 `address` 类型先用 text 渲染。

- [ ] **步骤 3：验证编译**

```bash
cd measure-app && flutter analyze lib/services/form_config_service.dart lib/widgets/dynamic_form_builder.dart
```

- [ ] **步骤 4：Commit**

```bash
git add measure-app/lib/services/form_config_service.dart measure-app/lib/widgets/dynamic_form_builder.dart
git commit -m "feat: 动态表单配置服务和渲染组件"
```

---

### 任务 8：前端 — 测量向导（现场自主创建）

**文件：**
- 创建：`measure-app/lib/screens/measurement_wizard.dart`

- [ ] **步骤 1：创建 MeasurementWizard**

```dart
import 'package:flutter/material.dart';
import '../services/form_config_service.dart';
import '../services/work_order_service.dart';
import '../services/api_service.dart';
import '../services/db_service.dart';
import '../services/sync_service.dart';
import '../widgets/dynamic_form_builder.dart';
import 'measurement_screen.dart';

class MeasurementWizard extends StatefulWidget {
  const MeasurementWizard({super.key});

  @override
  State<MeasurementWizard> createState() => _MeasurementWizardState();
}

class _MeasurementWizardState extends State<MeasurementWizard> {
  int _step = 0;
  final _formConfigSvc = FormConfigService();
  final _woSvc = WorkOrderService();

  List<FieldConfig> _workOrderFields = [];
  List<FieldConfig> _measurementFields = [];
  Map<String, dynamic> _workOrderData = {};
  Map<String, dynamic> _measurementData = {};
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadConfigs();
  }

  Future<void> _loadConfigs() async {
    setState(() { _loading = true; _error = null; });
    try {
      final results = await Future.wait([
        _formConfigSvc.getFormConfig('work_order_create'),
        _formConfigSvc.getFormConfig('measurement'),
      ]);
      if (!mounted) return;
      setState(() {
        _workOrderFields = results[0];
        _measurementFields = results[1];
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  bool _validateWorkOrder() {
    for (final f in _workOrderFields) {
      if (f.required) {
        final val = _workOrderData[f.fieldKey];
        if (val == null || val.toString().isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('请填写必填项: ${f.fieldLabel}')),
          );
          return false;
        }
      }
    }
    return true;
  }

  bool _validateMeasurement() {
    // 至少添加一种材料
    final materials = _measurementData['materials'];
    if (materials == null || (materials is List && materials.isEmpty)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请至少添加一种材料')),
      );
      return false;
    }
    return true;
  }

  Future<void> _submit() async {
    final api = ApiService();
    final sync = SyncService();
    final online = await api.isOnline;

    final payload = {
      'work_order': _workOrderData,
      'measurement': _measurementData,
    };

    if (online) {
      try {
        // 1. 创建工单
        final woRes = await api.post('/api/v1/work-orders', _workOrderData);
        final woId = woRes['data']['id'];

        // 2. 提交测量数据
        await api.post('/api/v1/measurements/$woId', _measurementData);

        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('测量数据已提交')),
        );
        Navigator.popUntil(context, (route) => route.isFirst);
      } catch (e) {
        if (!mounted) return;
        await sync.enqueue('field_wizard', 0, payload);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('提交失败，已存入离线队列: $e')),
        );
      }
    } else {
      await sync.enqueue('field_wizard', 0, payload);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('离线保存成功，网络恢复后自动同步')),
      );
      Navigator.popUntil(context, (route) => route.isFirst);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: const Color(0xFFE2E8F0),
        title: const Text('新建测量'),
      ),
      body: Column(
        children: [
          // Step indicator
          _buildStepIndicator(),
          // Content
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF3B82F6)))
                : _error != null
                    ? Center(child: Text(_error!, style: const TextStyle(color: Color(0xFF94A3B8))))
                    : IndexedStack(
                        index: _step,
                        children: [
                          ListView(
                            padding: const EdgeInsets.all(16),
                            children: _workOrderFields.isNotEmpty
                                ? [
                                    DynamicFormBuilder(
                                      fields: _workOrderFields,
                                      onChanged: (data) => _workOrderData = data,
                                    ),
                                  ]
                                : [const Center(child: Text('暂无工单表单配置', style: TextStyle(color: Color(0xFF475569))))],
                          ),
                          MeasurementScreen(
                            orderId: 0,
                            orderNo: '新建',
                            title: '现场测量',
                            wizardMode: true,
                            onSubmitData: (data) => _measurementData = data,
                          ),
                        ],
                      ),
          ),
          // Bottom bar
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 8)],
            ),
            child: Row(
              children: [
                if (_step > 0)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => setState(() => _step--),
                      child: const Text('上一步'),
                    ),
                  ),
                if (_step > 0) const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      if (_step == 0) {
                        if (_validateWorkOrder()) setState(() => _step++);
                      } else {
                        if (_validateMeasurement()) _submit();
                      }
                    },
                    child: Text(_step == 0 ? '下一步' : '提交'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      color: const Color(0xFF1E293B),
      child: Row(
        children: [
          _stepItem(0, '工单信息'),
          _stepItem(1, '测量数据'),
        ],
      ),
    );
  }

  Widget _stepItem(int index, String label) {
    final active = _step == index;
    return Expanded(
      child: Row(
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: active ? const Color(0xFF1565C0) : const Color(0xFF334155),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text('${index + 1}',
                  style: TextStyle(
                      color: active ? Colors.white : const Color(0xFF64748B),
                      fontSize: 12)),
            ),
          ),
          const SizedBox(width: 6),
          Text(label,
              style: TextStyle(
                  fontSize: 12,
                  color: active ? const Color(0xFF1565C0) : const Color(0xFF64748B))),
        ],
      ),
    );
  }
}
```

> 注意：MeasurementScreen 需要添加 `wizardMode` 和 `onSubmitData` 参数支持，见任务 9。

- [ ] **步骤 2：在 TasksScreen 中添加"新建测量"按钮**

在 `TasksScreen` 中，外勤端也需要一个"新建测量"入口（FAB 按钮已隐藏）。需要在 AppBar 或列表顶部添加按钮。

在 `field_home_screen.dart` 的 AppBar 中添加一个按钮：

```dart
actions: [
  IconButton(
    icon: const Icon(Icons.add),
    tooltip: '新建测量',
    onPressed: () {
      Navigator.push(context,
          MaterialPageRoute(builder: (_) => const MeasurementWizard()));
    },
  ),
  Text(
    auth.user?.name ?? '',
    style: const TextStyle(color: Color(0xFF60A5FA), fontSize: 14),
  ),
  const SizedBox(width: 16),
],
```

- [ ] **步骤 3：验证编译**

```bash
cd measure-app && flutter analyze lib/screens/measurement_wizard.dart
```

- [ ] **步骤 4：Commit**

```bash
git add measure-app/lib/screens/measurement_wizard.dart measure-app/lib/screens/field_home_screen.dart
git commit -m "feat: 现场自主创建测量向导"
```

---

### 任务 9：前端 — MeasurementScreen 适配向导模式

**文件：**
- 修改：`measure-app/lib/screens/measurement_screen.dart`

- [ ] **步骤 1：添加 wizardMode 和 onSubmitData 参数**

```dart
class MeasurementScreen extends StatefulWidget {
  final int orderId;
  final String orderNo;
  final String title;
  final bool wizardMode;
  final ValueChanged<Map<String, dynamic>>? onSubmitData;

  const MeasurementScreen({
    super.key,
    required this.orderId,
    required this.orderNo,
    required this.title,
    this.wizardMode = false,
    this.onSubmitData,
  });
  // ...
```

- [ ] **步骤 2：面编辑拍照功能补全**

在 `_editFace` 方法中，找到第 125 行的 `OutlinedButton.icon(onPressed: () {}, ...)` 拍照按钮，替换为：

```dart
OutlinedButton.icon(
  onPressed: () async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.camera, imageQuality: 80);
    if (image != null) {
      // 更新照片列表
      final existingPhotos = face.photos.isEmpty ? [] : List<String>.from(face.photos);
      existingPhotos.add(image.path);
      final updatedFace = MaterialFace(
        label: face.label,
        width: w,
        height: h,
        notes: faceNotesCtrl.text.isEmpty ? null : faceNotesCtrl.text,
        special: special,
        photos: existingPhotos,
      );
      // 更新到材料列表
      setState(() {
        final idx = _materials.indexOf(material);
        material.faces[faceIndex] = updatedFace;
      });
    }
  },
  icon: const Icon(Icons.camera_alt),
  label: const Text('拍照'),
),
```

- [ ] **步骤 3：手绘按钮关联当前面**

```dart
OutlinedButton.icon(
  onPressed: () async {
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(builder: (_) => const SketchScreen()),
    );
    if (result != null) {
      // 将手绘结果关联到当前面
    }
  },
  icon: const Icon(Icons.draw),
  label: const Text('手绘'),
),
```

- [ ] **步骤 4：非向导模式下保留原有行为**

在 `_submit` 方法中，添加判断：

```dart
Future<void> _submit() async {
  // 向导模式：只返回数据给父组件
  if (widget.wizardMode) {
    widget.onSubmitData?.call({
      'materials': _materials.map((m) => m.toJson()).toList(),
    });
    return;
  }
  // 原有逻辑保持不变...
```

- [ ] **步骤 5：Commit**

```bash
git add measure-app/lib/screens/measurement_screen.dart
git commit -m "fix: 测量页面补全面编辑拍照 + 支持向导模式"
```

---

### 任务 10：前端 — 施工页面优化

**文件：**
- 修改：`measure-app/lib/screens/construction_screen.dart`

- [ ] **步骤 1：照片添加删除功能**

在每个 `_photoSection` 的照片缩略图上添加删除按钮。修改 `_photoSection` 方法中的照片渲染部分：

```dart
...photos.asMap().entries.map((e) => Stack(
  children: [
    GestureDetector(
      onTap: () => _viewPhoto(context, photos[e.key]),
      child: Container(
        width: 100,
        height: 100,
        margin: const EdgeInsets.only(right: 8),
        // ... 原有 decoration
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.file(File(photos[e.key]), fit: BoxFit.cover),
        ),
      ),
    ),
    Positioned(
      right: 4,
      top: 4,
      child: GestureDetector(
        onTap: () => setState(() => photos.removeAt(e.key)),
        child: Container(
          padding: const EdgeInsets.all(2),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.6),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.close, size: 14, color: Colors.white),
        ),
      ),
    ),
  ],
)),
```

- [ ] **步骤 2：Commit**

```bash
git add measure-app/lib/screens/construction_screen.dart
git commit -m "feat: 施工页面照片可删除"
```

---

### 任务 11：前端 — SyncService 支持 field_wizard 类型

**文件：**
- 修改：`measure-app/lib/services/sync_service.dart:33-44`

- [ ] **步骤 1：在 switch 中添加 field_wizard 处理**

```dart
switch (item.type) {
  case 'measurement':
    endpoint = '/api/v1/measurements/${item.orderId}';
    break;
  case 'construction':
    endpoint = '/api/v1/construction/${item.orderId}';
    break;
  case 'exception':
    endpoint = '/api/v1/construction/${item.orderId}/exception';
    break;
  case 'field_wizard':
    // 现场创建：先建工单再提交测量
    final woData = payload['work_order'];
    final measureData = payload['measurement'];
    final woRes = await _api.post('/api/v1/work-orders', woData);
    final woId = woRes['data']['id'];
    endpoint = '/api/v1/measurements/$woId';
    // 重新 enqueue 测量数据
    await _db.insert('sync_queue', {
      'type': 'measurement',
      'order_id': woId,
      'payload': jsonEncode(measureData),
      'created_at': DateTime.now().toIso8601String(),
      'status': 'pending',
      'retry_count': 0,
    });
    break;
  default:
    throw Exception('未知同步类型: ${item.type}');
}
```

- [ ] **步骤 2：Commit**

```bash
git add measure-app/lib/services/sync_service.dart
git commit -m "feat: 同步服务支持现场创建向导离线队列"
```

---

## 实现注意事项

1. **路由排序**：后端 `POST /work-orders/:id/review` 必须在 `GET /work-orders/:id` 之前注册
2. **角色判断**：`AuthProvider.role` 来自登录返回的 `UserModel.role`
3. **动态表单**：`DynamicFormBuilder` 中的 image/subform 类型先用占位，后续可完善
4. **离线同步**：field_wizard 类型特殊处理，先创建工单拿到 ID 再提交测量
5. **YAGNI**：只实现 spec 中明确需要的功能，不添加额外抽象

## 验证检查清单

- [ ] 管理员登录 → 看到完整仪表盘
- [ ] 测量员登录 → 只看到"我的任务"和"我的"
- [ ] 外勤点进派给自己的任务 → 填写动态表单 → 提交
- [ ] 外勤新建测量 → 第1步填工单表单 → 第2步填测量表单 → 提交
- [ ] 管理员审核外勤创建的工单 → 通过/驳回
- [ ] 面编辑时可以拍照并关联到当前面
- [ ] 施工页面可以删除照片
- [ ] 离线提交 → 数据存入队列 → 联网后自动同步
