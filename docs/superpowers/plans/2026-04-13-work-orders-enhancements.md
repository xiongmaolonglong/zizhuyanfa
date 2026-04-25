# 工单管理增强功能 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 为工单管理页面添加增强功能：批量操作、工单编辑、工单删除、导出 Excel、扩展筛选、快捷操作、看板拖拽、统计面板、超时提醒

**架构：** 所有功能集中在 `WorkOrders.vue` 列表/看板页面和 `WorkOrderDetail.vue` 详情页，新增 `BatchOpsDialog.vue` 组件和 `StatsPanel.vue` 组件。后端新增工单更新、删除、阶段推进接口。

**技术栈：** Vue 3 + Element Plus + Vite, Express.js + Sequelize, xlsx (SheetJS)

**项目分类常量（全局复用，不要重复定义）：**

```javascript
const PROJECT_CATEGORIES = [
  { label: '日常', value: 'daily' },
  { label: '门头招牌', value: 'storefront' },
  { label: '室内广告', value: 'indoor_ad' },
  { label: 'LED大屏', value: 'led_screen' },
  { label: '520', value: '520' },
  { label: '国庆', value: 'national_day' },
  { label: '春节', value: 'spring_festival' },
]
```

---

## 文件结构

| 文件 | 职责 | 创建/修改 |
|------|------|-----------|
| `admin-web/src/views/WorkOrders.vue` | 主页面 — 批量操作、编辑、删除、筛选、导出、拖拽、快捷操作 | 修改 |
| `admin-web/src/views/WorkOrderDetail.vue` | 详情页 — 编辑、删除按钮 | 修改 |
| `admin-web/src/components/BatchOpsDialog.vue` | 批量操作对话框（批量派单、批量删除） | 创建 |
| `admin-web/src/components/StatsPanel.vue` | 统计面板组件（ECharts 图表） | 创建 |
| `backend/src/routes/workOrder.js` | 工单路由 | 修改（加 PUT、DELETE） |
| `backend/src/controllers/workOrderController.js` | 工单控制器 | 修改（加 update、delete、advance） |

---

### 任务 1：后端 — 工单更新、删除、阶段推进接口

**文件：**
- 修改：`backend/src/controllers/workOrderController.js`
- 修改：`backend/src/routes/workOrder.js`

**关键注意：** 补录工单（`createWorkOrder`）不会创建 `WoDeclaration` 记录，因此 `updateWorkOrder` 中涉及 `project_type` 和 `address` 的字段需要改为直接存到 `WorkOrder` 表上，而不是通过 `declaration` 关联。但 `WorkOrder` 模型没有这些字段，所以**编辑功能只允许修改 `title`、`project_category`、`description`**（这三个字段直接存在 WorkOrder 表上）。`project_type` 和 `address` 是申报环节的数据，补录工单没有，不在编辑范围内。

- [ ] **步骤 1：实现 updateWorkOrder**

在 `workOrderController.js` 中，`createWorkOrder` 函数之后添加：

```javascript
/**
 * PUT /api/v1/work-orders/:id
 * 编辑工单（仅限 assignment 阶段且未派单）
 */
async function updateWorkOrder(req, res) {
  const { id } = req.params;
  const tenantId = req.tenantId || req.user.tenant_id;
  const { title, project_category, description } = req.body;

  const wo = await WorkOrder.findOne({
    where: { id: parseInt(id, 10), tenant_id: tenantId },
  });
  if (!wo) return error(res, '工单不存在', 404);

  if (wo.current_stage !== 'assignment' || wo.assigned_tenant_user_id) {
    return error(res, '该工单已进入后续环节，无法编辑', 400);
  }

  if (title !== undefined) wo.title = title;
  if (project_category !== undefined) wo.project_category = project_category;
  if (description !== undefined) wo.description = description;

  await wo.save();
  await createLog(wo.id, req.user, 'work_order_updated', 'assignment', '编辑工单信息');

  return success(res, flattenWorkOrder(wo), '更新成功');
}
```

- [ ] **步骤 2：实现 deleteWorkOrder**

```javascript
/**
 * DELETE /api/v1/work-orders/:id
 * 软删除工单（仅限 assignment 阶段且未派单）
 */
async function deleteWorkOrder(req, res) {
  const { id } = req.params;
  const tenantId = req.tenantId || req.user.tenant_id;

  const wo = await WorkOrder.findOne({
    where: { id: parseInt(id, 10), tenant_id: tenantId },
  });
  if (!wo) return error(res, '工单不存在', 404);

  if (wo.current_stage !== 'assignment' || wo.assigned_tenant_user_id) {
    return error(res, '该工单已进入后续环节，无法删除', 400);
  }

  await wo.destroy();
  await createLog(wo.id, req.user, 'work_order_deleted', 'assignment', '删除工单');

  return success(res, null, '删除成功');
}
```

- [ ] **步骤 3：实现 advanceWorkOrder（阶段推进）**

```javascript
const STAGE_ORDER = ['declaration', 'approval', 'assignment', 'measurement', 'design', 'production', 'construction', 'finance', 'archive'];
const STAGE_LABELS = {
  declaration: '申报', approval: '审批', assignment: '派单', measurement: '测量',
  design: '设计', production: '生产', construction: '施工', finance: '费用', archive: '归档'
};

/**
 * PUT /api/v1/work-orders/:id/advance
 * 推进工单到指定环节（只能向后推进）
 */
async function advanceWorkOrder(req, res) {
  const { id } = req.params;
  const { target_stage } = req.body;
  const tenantId = req.tenantId || req.user.tenant_id;

  if (!STAGE_ORDER.includes(target_stage)) return error(res, '无效的目标环节', 400);

  const wo = await WorkOrder.findOne({ where: { id: parseInt(id, 10), tenant_id: tenantId } });
  if (!wo) return error(res, '工单不存在', 404);

  const fromIdx = STAGE_ORDER.indexOf(wo.current_stage);
  const toIdx = STAGE_ORDER.indexOf(target_stage);
  if (toIdx <= fromIdx) return error(res, '只能向后推进', 400);

  wo.current_stage = target_stage;
  await wo.save();
  await createLog(wo.id, req.user, 'stage_advanced', target_stage, `推进到${STAGE_LABELS[target_stage]}`);

  return success(res, flattenWorkOrder(wo), '推进成功');
}
```

- [ ] **步骤 4：添加路由**

在 `backend/src/routes/workOrder.js` 中，在 GET `/:id/logs` 之后、GET `/:id` 之前添加：

```javascript
// 编辑工单（必须在 :id 之前）
router.put('/:id', controller.updateWorkOrder);
// 删除工单（必须在 :id 之前）
router.delete('/:id', controller.deleteWorkOrder);
// 阶段推进（必须在 :id 之前）
router.put('/:id/advance', controller.advanceWorkOrder);
```

- [ ] **步骤 5：导出新增函数**

在 `module.exports` 中添加：`updateWorkOrder, deleteWorkOrder, advanceWorkOrder`。

- [ ] **步骤 6：Commit**

```bash
git add backend/src/controllers/workOrderController.js backend/src/routes/workOrder.js
git commit -m "feat: 添加工单更新、删除、阶段推进接口"
```

---

### 任务 2：前端 — 工单编辑和删除（详情页 + 列表页）

**文件：**
- 修改：`admin-web/src/views/WorkOrderDetail.vue`
- 修改：`admin-web/src/views/WorkOrders.vue`

- [ ] **步骤 1：详情页添加导入和 computed**

在 WorkOrderDetail.vue 的 import 行，添加 `ElMessageBox`：

```javascript
import { ElMessage, ElMessageBox } from 'element-plus'
```

在 `const logs = ref([])` 之后添加：

```javascript
const canEdit = computed(() =>
  detail.value.current_stage === 'assignment' && !detail.value.assigned_tenant_user_id
)
```

- [ ] **步骤 2：详情页 header 添加编辑/删除按钮**

在 header 区域，"导出 PDF" 和 "打印" 按钮之间添加编辑，"打印" 按钮之后添加删除：

```vue
<el-button v-if="canEdit" @click="showEditDialog = true">编辑</el-button>
<el-button @click="handleExport">导出 PDF</el-button>
<el-button type="primary" @click="handlePrint">打印</el-button>
<el-button v-if="canEdit" type="danger" @click="deleteWorkOrder">删除</el-button>
```

- [ ] **步骤 3：详情页添加编辑对话框**

在 `</div>`（外层容器结束前）和 `</template>` 之间添加：

```vue
    <!-- 编辑工单对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑工单" width="480px">
      <el-form :model="editForm" label-width="80px" ref="editFormRef" :rules="editRules">
        <el-form-item label="项目名称" prop="title">
          <el-input v-model="editForm.title" />
        </el-form-item>
        <el-form-item label="项目分类">
          <el-select v-model="editForm.project_category" style="width:100%">
            <el-option v-for="c in PROJECT_CATEGORIES" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="需求描述">
          <el-input v-model="editForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="submitEdit" :loading="editing">保存</el-button>
      </template>
    </el-dialog>
```

- [ ] **步骤 4：详情页添加编辑/删除逻辑**

在 `const logs = ref([])` 之后、`canEdit` computed 之前添加：

```javascript
const showEditDialog = ref(false)
const editing = ref(false)
const editFormRef = ref(null)
const editForm = reactive({ title: '', project_category: '', description: '' })
const editRules = {
  title: [{ required: true, message: '项目名称为必填项', trigger: 'blur' }]
}
const PROJECT_CATEGORIES = [
  { label: '日常', value: 'daily' },
  { label: '门头招牌', value: 'storefront' },
  { label: '室内广告', value: 'indoor_ad' },
  { label: 'LED大屏', value: 'led_screen' },
  { label: '520', value: '520' },
  { label: '国庆', value: 'national_day' },
  { label: '春节', value: 'spring_festival' },
]

watch(showEditDialog, (val) => {
  if (val) {
    editForm.title = detail.value.title || ''
    editForm.project_category = detail.value.project_category || ''
    editForm.description = detail.value.description || ''
  }
})

async function submitEdit() {
  const valid = await editFormRef.value.validate().catch(() => false)
  if (!valid) return
  editing.value = true
  try {
    await api.put(`/work-orders/${id}`, editForm)
    ElMessage.success('更新成功')
    showEditDialog.value = false
    const woRes = await api.get(`/work-orders/${id}`)
    detail.value = woRes.data || {}
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '更新失败')
  } finally {
    editing.value = false
  }
}

async function deleteWorkOrder() {
  try {
    await ElMessageBox.confirm('确定删除此工单吗？此操作不可恢复。', '提示', { type: 'warning' })
    await api.delete(`/work-orders/${id}`)
    ElMessage.success('已删除')
    router.back()
  } catch {}
}
```

- [ ] **步骤 5：列表页添加编辑/删除操作列**

在 WorkOrders.vue 表格操作列中，在现有的 "查看"、"派单"、"代录" 按钮后面添加：

```vue
<el-button v-if="row.current_stage === 'assignment' && !row.assigned_tenant_user_id" link type="primary" @click.stop="openEdit(row)">编辑</el-button>
<el-button v-if="row.current_stage === 'assignment' && !row.assigned_tenant_user_id" link type="danger" @click.stop="deleteWorkOrder(row)">删除</el-button>
```

- [ ] **步骤 6：列表页编辑/删除逻辑**

在 WorkOrders.vue 的 `resetFilters` 函数之后添加：

```javascript
function openEdit(row) {
  router.push(`/work-orders/${row.id}`)
}

async function deleteWorkOrder(row) {
  try {
    await ElMessageBox.confirm(`确定删除工单「${row.work_order_no}」吗？`, '提示', { type: 'warning' })
    await api.delete(`/work-orders/${row.id}`)
    ElMessage.success('已删除')
    loadWorkOrders()
  } catch {}
}
```

列表页也需要导入 ElMessageBox，检查 import 行是否已有：

```javascript
import { ElMessage, ElMessageBox } from 'element-plus'
```

如果没有则添加。

- [ ] **步骤 7：Commit**

```bash
git add admin-web/src/views/WorkOrderDetail.vue admin-web/src/views/WorkOrders.vue
git commit -m "feat: 添加工单编辑和删除功能"
```

---

### 任务 3：前端 — 批量操作

**文件：**
- 创建：`admin-web/src/components/BatchOpsDialog.vue`
- 修改：`admin-web/src/views/WorkOrders.vue`

- [ ] **步骤 1：创建 BatchOpsDialog 组件**

```vue
<template>
  <el-dialog v-model="visible" :title="'批量操作（已选 ' + count + ' 项）'" width="480px">
    <el-radio-group v-model="batchAction" style="margin-bottom: 16px">
      <el-radio label="dispatch">批量派单</el-radio>
      <el-radio label="delete">批量删除</el-radio>
    </el-radio-group>

    <el-form v-if="batchAction === 'dispatch'" label-width="80px">
      <el-form-item label="负责人">
        <el-select v-model="batchForm.assigned_to" placeholder="选择人员" style="width:100%">
          <el-option v-for="u in userOptions" :key="u.id" :label="u.name" :value="u.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="截止日">
        <el-date-picker v-model="batchForm.deadline" type="date" value-format="YYYY-MM-DD" style="width:100%" />
      </el-form-item>
    </el-form>

    <el-alert v-if="batchAction === 'delete'" type="warning" show-icon :closable="false" style="margin-bottom: 16px">
      仅可删除处于「待派单」阶段且未派单的工单
    </el-alert>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="executeBatch" :loading="executing">执行</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const props = defineProps({ modelValue: Boolean, count: Number, selections: Array, userOptions: Array })
const emit = defineEmits(['update:modelValue', 'done'])

const visible = ref(false)
const batchAction = ref('dispatch')
const executing = ref(false)
const batchForm = reactive({ assigned_to: '', deadline: '' })

watch(() => props.modelValue, (val) => { visible.value = val })
watch(visible, (val) => { emit('update:modelValue', val) })

async function executeBatch() {
  if (batchAction.value === 'dispatch' && !batchForm.assigned_to) {
    return ElMessage.warning('请选择负责人')
  }
  executing.value = true
  const ids = props.selections.map(s => s.id)

  try {
    if (batchAction.value === 'dispatch') {
      await Promise.all(ids.map(id => api.post('/assignments', {
        work_order_id: id,
        assigned_to: batchForm.assigned_to,
        deadline: batchForm.deadline || null,
      })))
    } else if (batchAction.value === 'delete') {
      await Promise.all(ids.map(id => api.delete(`/work-orders/${id}`)))
    }
    ElMessage.success(`成功执行 ${ids.length} 项`)
    emit('done')
    visible.value = false
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '批量操作失败')
  } finally {
    executing.value = false
  }
}
</script>
```

- [ ] **步骤 2：列表页集成批量操作**

在 WorkOrders.vue 表格的 `</el-table>` 之后、分页组件之前添加：

```vue
<div v-if="selectedRows.length" class="batch-bar">
  <span>已选 {{ selectedRows.length }} 项</span>
  <el-button size="small" type="primary" @click="showBatchOps = true">批量操作</el-button>
  <el-button size="small" @click="clearSelection">取消选择</el-button>
</div>
```

给表格添加 ref 和 selection-change 事件：

```vue
<el-table ref="tableRef" :data="tableData" stripe v-loading="loading" @selection-change="handleSelectionChange">
```

在 script 中添加：

```javascript
const tableRef = ref(null)
const selectedRows = ref([])
const showBatchOps = ref(false)

function handleSelectionChange(rows) {
  selectedRows.value = rows
}
function clearSelection() {
  tableRef.value.clearSelection()
}
```

在模板中添加批量操作组件（对话框区域底部）：

```vue
<BatchOpsDialog v-model="showBatchOps" :count="selectedRows.length" :selections="selectedRows"
  :user-options="userOptions" @done="loadWorkOrders" />
```

在 script 的 import 行添加：

```javascript
import BatchOpsDialog from '../components/BatchOpsDialog.vue'
```

在 `onMounted` 中确保 `userOptions` 已加载（用于批量派单选择人员），添加加载：

```javascript
// 确保已有加载人员的逻辑，如果没有则添加
async function loadUserOptions() {
  try {
    const res = await api.get('/tenant/users')
    const payload = res.data || {}
    userOptions.value = (Array.isArray(payload) ? payload : (payload.list || []))
      .filter(u => u.status === 'active')
  } catch (e) {
    console.error('加载人员列表失败:', e)
  }
}
```

在 `onMounted` 中调用 `loadUserOptions()`。

同时确保 script 中已声明 `userOptions`：

```javascript
const userOptions = ref([])
```

- [ ] **步骤 3：添加 batch-bar 样式**

```css
.batch-bar {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 16px; background: #e6f7ff; border-radius: 6px;
  margin-bottom: 12px; font-size: 13px;
}
```

- [ ] **步骤 4：Commit**

```bash
git add admin-web/src/components/BatchOpsDialog.vue admin-web/src/views/WorkOrders.vue
git commit -m "feat: 添加批量操作功能"
```

---

### 任务 4：前端 — 扩展筛选

**文件：**
- 修改：`admin-web/src/views/WorkOrders.vue`
- 修改：`backend/src/controllers/workOrderController.js`

- [ ] **步骤 1：后端加筛选条件**

在 `listWorkOrders` 函数中，现有 `if (client_id)` 行之后添加：

```javascript
if (req.query.project_category) where.project_category = req.query.project_category;
if (req.query.assigned_to) where.assigned_tenant_user_id = parseInt(req.query.assigned_to, 10);
if (req.query.start_date && req.query.end_date) {
  where.created_at = { [Op.between]: [req.query.start_date, req.query.end_date + ' 23:59:59'] };
}
```

关键词搜索加 client_name（已有 Client include，直接加）：

```javascript
if (keyword) {
  where[Op.or] = [
    { title: { [Op.like]: `%${keyword}%` } },
    { work_order_no: { [Op.like]: `%${keyword}%` } },
    { '$client.name$': { [Op.like]: `%${keyword}%` } },
  ];
}
```

- [ ] **步骤 2：前端加筛选条件**

在 WorkOrders.vue 筛选表单中，在现有的 keyword/stage/status 筛选之后添加：

```vue
<el-form-item>
  <el-select v-model="filters.client_id" placeholder="全部甲方" clearable>
    <el-option v-for="c in clients" :key="c.id" :label="c.name" :value="c.id" />
  </el-select>
</el-form-item>
<el-form-item>
  <el-select v-model="filters.project_category" placeholder="全部分类" clearable>
    <el-option v-for="c in PROJECT_CATEGORIES" :key="c.value" :label="c.label" :value="c.value" />
  </el-select>
</el-form-item>
<el-form-item>
  <el-select v-model="filters.assigned_to" placeholder="全部负责人" clearable>
    <el-option v-for="u in userOptions" :key="u.id" :label="u.name" :value="u.id" />
  </el-select>
</el-form-item>
<el-form-item>
  <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
    start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" />
</el-form-item>
```

filters 更新（注意 dateRange 单独声明，不放在 reactive 里避免被 spread 到 params）：

```javascript
const filters = reactive({ keyword: '', stage: '', status: '', client_id: '', project_category: '', assigned_to: '' })
const dateRange = ref(null)
```

loadWorkOrders 传递新参数：

```javascript
const params = { ...filters, page: page.value, limit: pageSize.value }
if (dateRange.value) {
  params.start_date = dateRange.value[0]
  params.end_date = dateRange.value[1]
}
```

- [ ] **步骤 3：Commit**

```bash
git add backend/src/controllers/workOrderController.js admin-web/src/views/WorkOrders.vue
git commit -m "feat: 扩展工单筛选条件"
```

---

### 任务 5：前端 — 导出 Excel

**文件：**
- 修改：`admin-web/src/views/WorkOrders.vue`

- [ ] **步骤 1：安装 xlsx**

```bash
cd admin-web && npm install xlsx
```

- [ ] **步骤 2：添加导出按钮和逻辑**

在筛选表单的查询/重置按钮之后添加：

```vue
<el-button @click="exportExcel">
  <el-icon><Download /></el-icon>导出 Excel
</el-button>
```

import 添加：

```javascript
import * as XLSX from 'xlsx'
import { Download } from '@element-plus/icons-vue'
```

逻辑添加（在 `resetFilters` 之后）：

```javascript
function exportExcel() {
  const headers = ['工单号', '项目名称', '甲方企业', '项目分类', '当前环节', '状态', '负责人', '截止日期']
  const rows = tableData.value.map(w => [
    w.work_order_no,
    w.title,
    w.client_name,
    categoryLabel(w.project_category),
    stageLabel(w.current_stage),
    w.is_timeout ? '超时' : '正常',
    w.assigned_to || '未分配',
    w.deadline || '',
  ])

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  // 设置列宽
  ws['!cols'] = headers.map(() => ({ wch: 16 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '工单列表')
  XLSX.writeFile(wb, `工单列表_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
```

注意：`categoryLabel` 和 `stageLabel` 函数应已存在（看板视图中的映射函数）。

- [ ] **步骤 3：Commit**

```bash
git add admin-web/package.json admin-web/package-lock.json admin-web/src/views/WorkOrders.vue
git commit -m "feat: 添加工单导出 Excel 功能"
```

---

### 任务 6：前端 — 看板拖拽

**文件：**
- 修改：`admin-web/src/views/WorkOrders.vue`

- [ ] **步骤 1：看板卡片添加 HTML5 拖拽**

看板卡片修改为：

```vue
<el-card v-for="wo in col.items" :key="wo.id" shadow="hover" class="kanban-card"
  :class="{ 'kanban-card-timeout': wo.is_timeout }"
  draggable="true"
  @dragstart="onDragStart($event, wo)"
  @click="$router.push(`/work-orders/${wo.id}`)">
```

看板列 body 添加 drop 事件：

```vue
<div class="kanban-body" @dragover.prevent @drop="onDropOnCol($event, col.key)">
```

- [ ] **步骤 2：拖拽逻辑**

在 script 中添加（确保已导入 `ElMessageBox`）：

```javascript
const STAGE_ORDER = ['declaration', 'approval', 'assignment', 'measurement', 'design', 'production', 'construction', 'finance', 'archive']
const dragData = ref(null)

function onDragStart(e, wo) {
  dragData.value = wo
  e.dataTransfer.effectAllowed = 'move'
  e.stopPropagation()
}

async function onDropOnCol(e, targetStage) {
  e.preventDefault()
  if (!dragData.value) return
  const wo = dragData.value
  dragData.value = null

  if (wo.current_stage === targetStage) return

  const fromIdx = STAGE_ORDER.indexOf(wo.current_stage)
  const toIdx = STAGE_ORDER.indexOf(targetStage)
  if (toIdx <= fromIdx) {
    return ElMessage.warning('只能向后推进环节')
  }

  try {
    await ElMessageBox.confirm(
      `将「${wo.title}」从「${stageLabel(wo.current_stage)}」推进到「${stageLabel(targetStage)}」？`,
      '推进环节', { type: 'warning' }
    )
    await api.put(`/work-orders/${wo.id}/advance`, { target_stage: targetStage })
    ElMessage.success('已推进')
    loadWorkOrders()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error(err.response?.data?.error || '操作失败')
  }
}
```

- [ ] **步骤 3：超时工单卡片样式**

在 style 中添加：

```css
.kanban-card-timeout { border-left: 3px solid #f5222d; }
```

- [ ] **步骤 4：超时工单 Badge**

在看板卡片外层包裹 Badge：

```vue
<el-badge :is-dot="wo.is_timeout" :offset="[-2, 2]" dot-class="timeout-dot">
  <el-card ...>...</el-card>
</el-badge>
```

添加样式：

```css
:deep(.timeout-dot) { background: #f5222d; }
```

- [ ] **步骤 5：超时工单排序（已存在 is_timeout，按超时优先排序）**

在 kanban 分组逻辑中，filter 后添加排序：

```javascript
kanbanCols.value.forEach(col => {
  col.items = allList
    .filter(w => w.current_stage === col.key)
    .sort((a, b) => {
      if (a.is_timeout && !b.is_timeout) return -1
      if (!a.is_timeout && b.is_timeout) return 1
      return 0
    })
})
```

- [ ] **步骤 6：Commit**

```bash
git add admin-web/src/views/WorkOrders.vue
git commit -m "feat: 添加看板拖拽推进环节和超时提醒"
```

---

### 任务 7：前端 — 统计面板

**文件：**
- 创建：`admin-web/src/components/StatsPanel.vue`
- 修改：`admin-web/src/views/WorkOrders.vue`

- [ ] **步骤 1：创建 StatsPanel 组件**

```vue
<template>
  <el-row :gutter="16" class="stats-panel">
    <el-col :span="6">
      <el-card shadow="hover">
        <div class="stat-card">
          <div class="stat-icon" style="background:#e6f7ff;color:#1890ff">
            <el-icon :size="24"><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">工单总数</div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card shadow="hover">
        <div class="stat-card">
          <div class="stat-icon" style="background:#f6ffed;color:#52c41a">
            <el-icon :size="24"><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.by_stage?.archive || 0 }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card shadow="hover">
        <div class="stat-card">
          <div class="stat-icon" style="background:#fff2e8;color:#fa541c">
            <el-icon :size="24"><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value" style="color:#fa541c">{{ stats.timeout_count }}</div>
            <div class="stat-label">超时工单</div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card shadow="hover">
        <div class="stat-card">
          <div class="stat-icon" style="background:#f9f0ff;color:#722ed1">
            <el-icon :size="24"><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ completionRate }}%</div>
            <div class="stat-label">完成率</div>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
  <div class="chart-row">
    <el-card style="flex:1">
      <v-chart class="chart" :option="stageChartOption" autoresize />
    </el-card>
    <el-card style="flex:1">
      <v-chart class="chart" :option="pieChartOption" autoresize />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { Document, CircleCheck, Clock, TrendCharts } from '@element-plus/icons-vue'
import 'echarts/lib/chart/bar'
import 'echarts/lib/chart/pie'
import 'echarts/lib/component/tooltip'
import 'echarts/lib/component/legend'
import 'echarts/lib/component/title'
import api from '../api'

const stats = ref({ total: 0, by_stage: {}, by_status: {}, timeout_count: 0 })

const completionRate = computed(() => {
  const total = stats.value.total || 0
  const done = stats.value.by_stage?.archive || 0
  return total ? ((done / total) * 100).toFixed(1) : '0'
})

const stageLabels = {
  declaration: '申报', approval: '审批', assignment: '派单', measurement: '测量',
  design: '设计', production: '生产', construction: '施工', finance: '费用', archive: '归档'
}
const statusLabels = {
  draft: '草稿', submitted: '已提交', assigned: '已派单', measuring: '测量中',
  measured: '已测量', designing: '设计中', producing: '生产中', constructing: '施工中',
  completed: '已完成', quoting: '报价中', archived: '已归档'
}

const stageChartOption = computed(() => ({
  title: { text: '各环节工单数', left: 'center', textStyle: { fontSize: 14 } },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: Object.keys(stats.value.by_stage).map(k => stageLabels[k] || k),
  },
  yAxis: { type: 'value' },
  series: [{
    type: 'bar',
    data: Object.values(stats.value.by_stage),
    itemStyle: { color: '#1890ff', borderRadius: [4, 4, 0, 0] },
  }],
}))

const pieChartOption = computed(() => ({
  title: { text: '状态分布', left: 'center', textStyle: { fontSize: 14 } },
  tooltip: { trigger: 'item' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    data: Object.entries(stats.value.by_status).map(([key, value]) => ({
      name: statusLabels[key] || key,
      value,
    })),
  }],
}))

onMounted(async () => {
  try {
    const res = await api.get('/work-orders/stats')
    stats.value = res.data || {}
  } catch (e) {
    console.error('加载统计失败:', e)
  }
})
</script>

<style scoped>
.stats-panel { margin-bottom: 16px; }
.stat-card { display: flex; align-items: center; gap: 12px; }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.stat-value { font-size: 24px; font-weight: 600; color: #1a1a1a; }
.stat-label { font-size: 12px; color: #8c8c8c; }
.chart-row { display: flex; gap: 16px; margin-bottom: 16px; }
.chart { height: 280px; }
</style>
```

- [ ] **步骤 2：集成到列表页**

在 WorkOrders.vue 筛选卡片上方添加：

```vue
<StatsPanel v-if="viewMode === 'list'" />
```

import 添加：

```javascript
import StatsPanel from '../components/StatsPanel.vue'
```

- [ ] **步骤 3：Commit**

```bash
git add admin-web/src/components/StatsPanel.vue admin-web/src/views/WorkOrders.vue
git commit -m "feat: 添加工单统计面板"
```

---

### 任务 8：前端 — 阶段快捷操作按钮

**文件：**
- 修改：`admin-web/src/views/WorkOrders.vue`

- [ ] **步骤 1：看板卡片添加快捷操作按钮**

在看板卡片的 `</el-card>` 之前（`</el-badge>` 之前），`card-meta` 之后添加：

```vue
            <div class="card-actions">
              <el-button v-if="wo.current_stage === 'assignment'" link type="primary" size="small"
                @click.stop="$router.push(`/work-orders/${wo.id}`)">派单</el-button>
              <el-button v-if="wo.current_stage === 'measurement'" link type="warning" size="small"
                @click.stop="openProxyMeasure(wo)">代录</el-button>
              <el-button v-if="wo.current_stage === 'measurement' && wo.measurement" link type="success" size="small"
                @click.stop="$router.push(`/work-orders/${wo.id}/measure-review`)">审核</el-button>
              <el-button v-if="wo.current_stage === 'design'" link type="primary" size="small"
                @click.stop="$router.push('/designs')">设计</el-button>
              <el-button v-if="wo.current_stage === 'production'" link type="primary" size="small"
                @click.stop="$router.push('/production')">生产</el-button>
              <el-button v-if="wo.current_stage === 'construction'" link type="primary" size="small"
                @click.stop="$router.push('/construction')">施工</el-button>
            </div>
```

添加样式：

```css
.card-actions { display: flex; gap: 4px; margin-top: 8px; flex-wrap: wrap; }
.card-actions :deep(.el-button) { padding: 0 4px; font-size: 12px; }
```

- [ ] **步骤 2：Commit**

```bash
git add admin-web/src/views/WorkOrders.vue
git commit -m "feat: 看板卡片添加阶段快捷操作按钮"
```

---

## 执行顺序

1. **任务 1**：后端更新/删除/推进接口（基础依赖，必须最先）
2. **任务 2**：前端编辑/删除
3. **任务 4**：扩展筛选（后端+前端）
4. **任务 5**：导出 Excel
5. **任务 3**：批量操作（依赖 userOptions 加载）
6. **任务 6**：看板拖拽 + 超时提醒
7. **任务 7**：统计面板
8. **任务 8**：快捷操作按钮
