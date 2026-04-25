# 管理后台 (admin-web) 全面完善实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将 admin-web 16 个页面从当前基础可用状态，逐个完善为功能齐全、体验优良的生产级页面

**架构：** 采用方案 A — 逐页面推进。每个页面独立实现（前端页面 + 后端 API + 组件），完成一个页面即可独立测试使用。页面间无强依赖，可并行或串行执行。全局工具类组件先做，后续页面复用。

**技术栈：** Vue 3 Composition API, Element Plus, ECharts, Axios, Pinia, Express.js, Sequelize, MySQL, xlsx, html2canvas, jsPDF

---

## 文件总览

### 全局/共享文件（优先创建）

| 文件 | 操作 | 职责 |
|------|------|------|
| `admin-web/src/utils/export.js` | 创建 | Excel 导出工具函数 |
| `admin-web/src/utils/format.js` | 创建 | 数据格式化工具（金额/日期/面积） |
| `admin-web/src/components/StageBadge.vue` | 创建 | 环节状态徽章组件 |
| `admin-web/src/components/EmptyGuide.vue` | 创建 | 空状态引导组件 |
| `admin-web/src/components/FileUpload.vue` | 创建 | 通用文件上传组件 |
| `admin-web/src/api/workOrders.js` | 创建 | 工单相关 API 独立封装 |
| `backend/src/utils/response.js` | 已存在 | 响应工具函数 |

### 页面 1 — 工单列表 (WorkOrders.vue)

| 文件 | 操作 | 说明 |
|------|------|------|
| `admin-web/src/views/WorkOrders.vue` | 修改 | 看板拖拽联动、导出功能、刷新机制、批量操作 |
| `backend/src/controllers/workOrderController.js` | 修改 | 增加看板状态变更 API、批量操作 API |
| `backend/src/routes/workOrder.js` | 修改 | 新增路由 |

### 页面 2 — 工单详情 (WorkOrderDetail.vue)

| 文件 | 操作 | 说明 |
|------|------|------|
| `admin-web/src/views/WorkOrderDetail.vue` | 修改 | 右侧面板重构、环节跳转、费用卡片、售后关联 |
| `backend/src/controllers/workOrderController.js` | 修改 | 详情增加费用/售后关联数据 |

### 页面 3 — 测量审核 (MeasureReview.vue)

| 文件 | 操作 | 说明 |
|------|------|------|
| `admin-web/src/views/MeasureReview.vue` | 修改 | 行内编辑、驳回历史、照片预览、面积校验 |
| `backend/src/controllers/assignmentController.js` | 修改 | 增加驳回历史查询 |

### 页面 4 — 费用管理 (Finance.vue)

| 文件 | 操作 | 说明 |
|------|------|------|
| `admin-web/src/views/Finance.vue` | 重写 | 报价编辑、费用明细、结算审批、发票管理、统计图 |
| `backend/src/controllers/financeController.js` | 修改 | 增加费用统计 API、报价详情 |
| `backend/src/routes/finance.js` | 修改 | 新增统计路由 |

### 页面 5 — 生产管理 (Production.vue)

| 文件 | 操作 | 说明 |
|------|------|------|
| `admin-web/src/views/Production.vue` | 修改 | 工单关联、任务详情、进度可视化、质检 |
| `backend/src/controllers/productionController.js` | 修改 | 增加质检 API |

### 页面 6 — 施工管理 (Construction.vue)

| 文件 | 操作 | 说明 |
|------|------|------|
| `admin-web/src/views/Construction.vue` | 重写 | 施工详情、施工日志、验收流程 |
| `admin-web/src/views/ConstructionDetail.vue` | 创建 | 施工详情页 |
| `backend/src/controllers/constructionController.js` | 修改 | 增加施工员指派 API |
| `backend/src/routes/construction.js` | 修改 | 新增指派路由 |

### 页面 7 — 归档管理 (Archive.vue)

| 文件 | 操作 | 说明 |
|------|------|------|
| `admin-web/src/views/Archive.vue` | 修改 | 归档详情、一键归档、搜索筛选 |
| `admin-web/src/views/ArchiveDetail.vue` | 创建 | 归档详情页 |

### 页面 8 — 售后管理 (Aftersale.vue)

| 文件 | 操作 | 说明 |
|------|------|------|
| `admin-web/src/views/Aftersale.vue` | 修改 | 售后详情、处理记录时间线、统计 |
| `admin-web/src/views/AftersaleDetail.vue` | 创建 | 售后详情页 |
| `backend/src/controllers/aftersaleController.js` | 修改 | 增加处理记录 API |

### 页面 9 — Dashboard

| 文件 | 操作 | 说明 |
|------|------|------|
| `admin-web/src/views/Dashboard.vue` | 修改 | 快捷跳转、人员排行、月度对比、快捷操作、收入概览 |
| `backend/src/controllers/adminController.js` | 修改 | 增加人员排行 API、月度趋势 |

### 页面 10 — 申报接收 (Declarations.vue)

| 文件 | 操作 | 说明 |
|------|------|------|
| `admin-web/src/views/Declarations.vue` | 修改 | 批量接收、Tab 切换、预览弹窗 |

### 页面 11 — 设计管理 (Designs.vue)

| 文件 | 操作 | 说明 |
|------|------|------|
| `admin-web/src/views/Designs.vue` | 修改 | 文件上传、审核详情、设计师指派、版本管理 |

### 页面 12 — 派单管理 (Dispatch.vue)

| 文件 | 操作 | 说明 |
|------|------|------|
| `admin-web/src/views/Dispatch.vue` | 重写 | 派单统计视图、测量员负载 |
| `admin-web/src/router/index.js` | 修改 | 更新菜单，派单操作统一到工单详情 |
| `backend/src/controllers/assignmentController.js` | 修改 | 增加统计 API |

### 页面 13 — 组织架构 (Organization.vue)

| 文件 | 操作 | 说明 |
|------|------|------|
| `admin-web/src/views/Organization.vue` | 修改 | 部门树形、人员搜索、批量操作、人员详情 |

### 页面 14 — 甲方管理 (Clients.vue)

| 文件 | 操作 | 说明 |
|------|------|------|
| `admin-web/src/views/Clients.vue` | 修改 | 甲方详情、搜索、状态管理 |
| `admin-web/src/views/ClientDetail.vue` | 创建 | 甲方详情页 |

### 页面 15 — 系统配置 (Settings.vue)

| 文件 | 操作 | 说明 |
|------|------|------|
| `admin-web/src/views/Settings.vue` | 修改 | 项目类型持久化、材料字典持久化、通知模板 |
| `backend/src/controllers/formConfigController.js` | 修改 | 增加项目类型/材料字典 API |
| `backend/src/routes/formConfig.js` | 修改 | 新增路由 |

### 页面 16 — 登录 (Login.vue)

| 文件 | 操作 | 说明 |
|------|------|------|
| `admin-web/src/views/Login.vue` | 修改 | 忘记密码、记住登录、首次登录提示 |
| `backend/src/controllers/authController.js` | 修改 | 忘记密码/重置密码 API |
| `backend/src/routes/auth.js` | 修改 | 新增忘记密码路由 |

---

## 实施任务

### 任务 1：全局工具组件

**文件：**
- 创建：`admin-web/src/utils/export.js`
- 创建：`admin-web/src/utils/format.js`
- 创建：`admin-web/src/components/StageBadge.vue`
- 创建：`admin-web/src/components/EmptyGuide.vue`
- 创建：`admin-web/src/components/FileUpload.vue`

#### 步骤 1.1：创建 Excel 导出工具

- [ ] **创建 `admin-web/src/utils/export.js`**

```javascript
import * as XLSX from 'xlsx'

/**
 * 将数据导出为 Excel 文件
 * @param {Array} data - 数据数组，每个元素是一个对象
 * @param {Array} columns - 列定义 [{ key: 'id', label: '编号' }]
 * @param {string} filename - 文件名（不含扩展名）
 */
export function exportToExcel(data, columns, filename = 'export') {
  const header = columns.map(col => col.label)
  const rows = data.map(item => columns.map(col => item[col.key] ?? ''))
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

/**
 * 导出当前筛选数据（带时间戳）
 */
export function exportWithTimestamp(data, columns, prefix = 'export') {
  const now = new Date()
  const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`
  exportToExcel(data, columns, `${prefix}_${ts}`)
}
```

- [ ] **验证**：在浏览器控制台测试 `exportToExcel([{name:'张三',age:30}], [{key:'name',label:'姓名'},{key:'age',label:'年龄'}], 'test')`，应下载 test.xlsx

#### 步骤 1.2：创建格式化工具

- [ ] **创建 `admin-web/src/utils/format.js`**

```javascript
/** 格式化金额 */
export function formatMoney(amount) {
  if (amount == null) return '¥0.00'
  return `¥${Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
}

/** 格式化面积 */
export function formatArea(area) {
  if (area == null) return '0.00'
  return `${Number(area).toFixed(2)}㎡`
}

/** 格式化日期 */
export function formatDate(date) {
  if (!date) return '—'
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

/** 相对时间（x 天前） */
export function relativeTime(date) {
  if (!date) return '—'
  const now = new Date()
  const d = new Date(date)
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff/60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff/3600)} 小时前`
  if (diff < 604800) return `${Math.floor(diff/86400)} 天前`
  return formatDate(date)
}

/** 环节中文标签 */
export const STAGE_MAP = {
  declaration: '申报', approval: '审批', assignment: '派单',
  measurement: '测量', design: '设计', production: '生产',
  construction: '施工', finance: '费用', archive: '归档', aftersale: '售后'
}
```

#### 步骤 1.3：创建 StageBadge 组件

- [ ] **创建 `admin-web/src/components/StageBadge.vue`**

```vue
<template>
  <el-tag :type="type" size="small" effect="light">
    {{ label }}
  </el-tag>
</template>

<script setup>
import { computed } from 'vue'
import { STAGE_MAP } from '../utils/format'

const props = defineProps({
  stage: { type: String, required: true },
})

const label = computed(() => STAGE_MAP[props.stage] || props.stage)

const typeMap = {
  declaration: '', approval: 'success', assignment: 'warning',
  measurement: 'primary', design: '', production: 'info',
  construction: 'warning', finance: 'success', archive: 'info',
  aftersale: 'danger'
}
const type = computed(() => typeMap[props.stage] || 'info')
</script>
```

#### 步骤 1.4：创建 EmptyGuide 组件

- [ ] **创建 `admin-web/src/components/EmptyGuide.vue`**

```vue
<template>
  <el-empty :description="description" :image-size="imageSize">
    <template #extra>
      <slot>
        <el-button type="primary" size="small" @click="$emit('action')">
          {{ actionText }}
        </el-button>
      </slot>
    </template>
  </el-empty>
</template>

<script setup>
defineProps({
  description: { type: String, default: '暂无数据' },
  imageSize: { type: Number, default: 120 },
  actionText: { type: String, default: '立即创建' }
})
defineEmits(['action'])
</script>
```

#### 步骤 1.5：创建 FileUpload 组件

- [ ] **创建 `admin-web/src/components/FileUpload.vue`**

```vue
<template>
  <el-upload
    :action="uploadUrl"
    :headers="uploadHeaders"
    :file-list="fileList"
    :on-success="handleSuccess"
    :on-remove="handleRemove"
    :limit="limit"
    :accept="accept"
    list-type="picture-card"
  >
    <el-icon><Plus /></el-icon>
  </el-upload>
</template>

<script setup>
import { computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { useAuthStore } from '../store/auth'

const auth = useAuthStore()

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  limit: { type: Number, default: 9 },
  accept: { type: String, default: 'image/*' }
})

const emit = defineEmits(['update:modelValue'])

const uploadUrl = computed(() => '/api/v1/files/upload')
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${auth.token}`
}))

const fileList = computed(() =>
  props.modelValue.map((url, i) => ({ name: `file-${i}`, url }))
)

function handleSuccess(res, file) {
  const urls = [...props.modelValue, res.data?.url || res.url]
  emit('update:modelValue', urls)
}

function handleRemove(file) {
  const urls = props.modelValue.filter(u => u !== file.url)
  emit('update:modelValue', urls)
}
</script>
```

- [ ] **Commit**
```bash
git add admin-web/src/utils/export.js admin-web/src/utils/format.js admin-web/src/components/StageBadge.vue admin-web/src/components/EmptyGuide.vue admin-web/src/components/FileUpload.vue
git commit -m "feat: 创建全局工具组件（导出/格式化/徽章/空状态/上传）"
```

---

### 任务 2：页面 1 — 工单列表 (WorkOrders.vue)

**文件：**
- 修改：`admin-web/src/views/WorkOrders.vue`
- 修改：`backend/src/controllers/workOrderController.js`
- 修改：`backend/src/routes/workOrder.js`

#### 步骤 2.1：后端 — 看板拖拽状态变更 API

- [ ] **修改 `backend/src/controllers/workOrderController.js`**，在 `advanceWorkOrder` 之后添加：

```javascript
/**
 * PUT /api/v1/work-orders/:id/stage
 * 看板拖拽变更环节（只能相邻环节移动）
 */
async function updateStage(req, res) {
  const { id } = req.params;
  const { target_stage } = req.body;
  const tenantId = req.tenantId || req.user.tenant_id;
  const STAGE_ORDER = ['declaration', 'approval', 'assignment', 'measurement', 'design', 'production', 'construction', 'finance', 'archive'];

  if (!STAGE_ORDER.includes(target_stage)) return error(res, '无效的目标环节', 400);

  const wo = await WorkOrder.findOne({ where: { id: parseInt(id, 10), tenant_id: tenantId } });
  if (!wo) return error(res, '工单不存在', 404);

  const fromIdx = STAGE_ORDER.indexOf(wo.current_stage);
  const toIdx = STAGE_ORDER.indexOf(target_stage);
  if (Math.abs(toIdx - fromIdx) > 2) return error(res, '不能跨环节移动，请通过详情页面操作', 400);

  const oldStage = wo.current_stage;
  wo.current_stage = target_stage;
  await wo.save();

  await createLog(wo.id, req.user, 'stage_changed', target_stage,
    `从${STAGE_LABELS[oldStage]}拖拽到${STAGE_LABELS[target_stage]}`);

  return success(res, flattenWorkOrder(wo), '环节已更新');
}

/**
 * POST /api/v1/work-orders/batch-advance
 * 批量推进工单到指定环节
 */
async function batchAdvance(req, res) {
  const { work_order_ids, target_stage } = req.body;
  const STAGE_ORDER = ['declaration', 'approval', 'assignment', 'measurement', 'design', 'production', 'construction', 'finance', 'archive'];
  if (!work_order_ids?.length) return error(res, '工单ID列表不能为空', 400);
  if (!STAGE_ORDER.includes(target_stage)) return error(res, '无效的目标环节', 400);

  const tenantId = req.tenantId || req.user.tenant_id;
  const updated = [];
  const skipped = [];

  for (const id of work_order_ids) {
    const wo = await WorkOrder.findOne({ where: { id: parseInt(id, 10), tenant_id: tenantId } });
    if (!wo) { skipped.push({ id, reason: '不存在' }); continue; }
    const fromIdx = STAGE_ORDER.indexOf(wo.current_stage);
    const toIdx = STAGE_ORDER.indexOf(target_stage);
    if (toIdx <= fromIdx) { skipped.push({ id, reason: '环节不能回退' }); continue; }

    const oldStage = wo.current_stage;
    wo.current_stage = target_stage;
    await wo.save();
    await createLog(wo.id, req.user, 'batch_stage_changed', target_stage,
      `批量从${STAGE_LABELS[oldStage]}到${STAGE_LABELS[target_stage]}`);
    updated.push(id);
  }

  return success(res, { updated, skipped }, `成功推进 ${updated.length} 个工单`);
}
```

- [ ] **修改 `backend/src/controllers/workOrderController.js` 底部 exports**，添加 `updateStage` 和 `batchAdvance`

- [ ] **修改 `backend/src/routes/workOrder.js`**，在 `:id/advance` 之后添加：

```javascript
// 看板拖拽变更（必须在 :id 之前）
router.put('/:id/stage', controller.updateStage);

// 批量推进（必须在 :id 之前）
router.post('/batch-advance', controller.batchAdvance);
```

#### 步骤 2.2：前端 — 看板拖拽联动后端

- [ ] **修改 `admin-web/src/views/WorkOrders.vue`**，在看板的 `@end` 事件中添加 API 调用：

找到看板的拖拽结束处理函数，改为：

```javascript
async function onDragEnd(event) {
  const woId = event.item.dataset.id
  const newStage = event.to.dataset.stage
  try {
    await api.put(`/work-orders/${woId}/stage`, { target_stage: newStage })
    ElMessage.success('环节已更新')
    await fetchAll()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '更新失败')
    await fetchAll() // 回滚
  }
}
```

#### 步骤 2.3：前端 — Excel 导出功能

- [ ] **修改 `admin-web/src/views/WorkOrders.vue`**，替换导出占位函数：

```javascript
import { exportWithTimestamp } from '../utils/export'

const EXPORT_COLUMNS = [
  { key: 'work_order_no', label: '工单号' },
  { key: 'title', label: '项目名称' },
  { key: 'client_name', label: '甲方企业' },
  { key: 'current_stage', label: '当前环节' },
  { key: 'assigned_to', label: '负责人' },
  { key: 'deadline', label: '截止日期' },
  { key: 'created_at', label: '创建日期' },
]

function handleExport() {
  const data = viewMode.value === 'kanban'
    ? columns.value.flatMap(c => c.items || [])
    : tableData.value
  if (!data.length) return ElMessage.warning('没有可导出的数据')
  exportWithTimestamp(data, EXPORT_COLUMNS, '工单列表')
  ElMessage.success(`已导出 ${data.length} 条数据`)
}
```

#### 步骤 2.4：前端 — 刷新机制

- [ ] **修改 `admin-web/src/views/WorkOrders.vue`**，添加手动刷新按钮和自动轮询：

在筛选栏顶部添加刷新按钮，在 script 中添加：

```javascript
import { onUnmounted } from 'vue'

let refreshTimer = null

function startAutoRefresh() {
  stopAutoRefresh()
  refreshTimer = setInterval(() => fetchAll(), 30000)
}

function stopAutoRefresh() {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null }
}

function handleRefresh() {
  ElMessage.info('正在刷新...')
  fetchAll()
}

onUnmounted(() => stopAutoRefresh())
```

- [ ] 在页面 `onMounted` 中调用 `startAutoRefresh()`

#### 步骤 2.5：前端 — 批量操作增强

- [ ] **修改 `admin-web/src/views/WorkOrders.vue`** 的批量操作对话框，增加"批量推进"选项：

在 BatchOpsDialog 或内联批量操作区域添加推进到指定环节的下拉选择。

- [ ] **Commit**
```bash
git add backend/src/controllers/workOrderController.js backend/src/routes/workOrder.js admin-web/src/views/WorkOrders.vue
git commit -m "feat: 工单列表看板拖拽联动+导出+刷新+批量推进"
```

---

### 任务 3：页面 2 — 工单详情 (WorkOrderDetail.vue)

**文件：**
- 修改：`admin-web/src/views/WorkOrderDetail.vue`
- 修改：`backend/src/controllers/workOrderController.js`

#### 步骤 3.1：后端 — 详情增加关联数据

- [ ] **修改 `backend/src/controllers/workOrderController.js`** 的 `getWorkOrder` 函数，在 include 数组中增加：

```javascript
{ model: WoFinance, as: 'finances', required: false },
{ model: WoAftersale, as: 'aftersales', required: false },
{ model: WoDesign, as: 'designs', required: false },
{ model: WoConstruction, as: 'constructions', required: false },
```

同时在顶部 require 中添加 `WoFinance, WoAftersale, WoDesign, WoConstruction`

- [ ] **修改 `flattenWorkOrder`** 函数，增加：

```javascript
design_count: obj.designs?.length || 0,
construction_count: obj.constructions?.length || 0,
aftersale_count: obj.aftersales?.length || 0,
finance_summary: obj.finances?.[0] ? {
  quote_amount: obj.finances[0].quote_amount,
  budget_used: obj.finances[0].budget_used,
  status: obj.finances[0].status,
} : null,
```

#### 步骤 3.2：前端 — 右侧面板重构

- [ ] **修改 `admin-web/src/views/WorkOrderDetail.vue`**，右侧"甲方信息"卡片改为"关联数据"：

```vue
<el-card>
  <template #header><span class="section-title">关联数据</span></template>
  <el-descriptions :column="1">
    <el-descriptions-item label="设计稿">{{ detail.design_count || 0 }} 份</el-descriptions-item>
    <el-descriptions-item label="施工记录">{{ detail.construction_count || 0 }} 次</el-descriptions-item>
    <el-descriptions-item label="售后工单">{{ detail.aftersale_count || 0 }} 个</el-descriptions-item>
    <el-descriptions-item label="报价" v-if="detail.finance_summary">
      {{ formatMoney(detail.finance_summary.quote_amount) }}
      <el-tag size="small" :type="detail.finance_summary.status === 'paid' ? 'success' : 'warning'">
        {{ financeStatusLabel(detail.finance_summary.status) }}
      </el-tag>
    </el-descriptions-item>
    <el-descriptions-item label="售后" v-if="detail.aftersale_count > 0">
      <el-button type="primary" text size="small" @click="$router.push(`/aftersale`)">查看售后</el-button>
    </el-descriptions-item>
  </el-descriptions>
</el-card>
```

#### 步骤 3.3：前端 — 进度条可点击跳转

- [ ] **修改 `admin-web/src/views/WorkOrderDetail.vue`** 的进度条，将 `el-step` 改为可点击：

```vue
<el-steps :active="currentStepIndex" finish-status="success" align-center class="clickable-steps">
  <el-step v-for="s in stages" :key="s.key" :title="s.label"
    @click="handleStageClick(s.key)" style="cursor:pointer" />
</el-steps>
```

```javascript
const stageRouteMap = {
  declaration: '/declarations',
  measurement: `/work-orders/${id}/measure-review`,
  design: '/designs',
  production: '/production',
  construction: '/construction',
  finance: '/finance',
  archive: '/archive',
  aftersale: '/aftersale',
}

function handleStageClick(stage) {
  const route = stageRouteMap[stage]
  if (route) router.push(route)
}
```

- [ ] **Commit**
```bash
git add backend/src/controllers/workOrderController.js admin-web/src/views/WorkOrderDetail.vue
git commit -m "feat: 工单详情关联数据+进度条可点击+右侧面板重构"
```

---

### 任务 4：页面 3 — 测量审核 (MeasureReview.vue)

**文件：**
- 修改：`admin-web/src/views/MeasureReview.vue`
- 修改：`backend/src/controllers/assignmentController.js`

#### 步骤 4.1：前端 — 行内编辑

- [ ] **修改 `admin-web/src/views/MeasureReview.vue`** 的测量数据表格，将面位数据改为可编辑：

```vue
<el-input-number v-model="face.width" :min="0" :precision="2" :controls="false"
  style="width:80px" size="small" @change="markModified" />
<el-input-number v-model="face.height" :min="0" :precision="2" :controls="false"
  style="width:80px" size="small" @change="markModified" />
```

- [ ] 添加 `hasModifications` 状态和保存按钮，审核通过时如有修改先保存

#### 步骤 4.2：前端 — 驳回历史

- [ ] **修改 `admin-web/src/views/MeasureReview.vue`**，在页面底部添加驳回历史折叠面板：

```vue
<el-collapse v-if="rejectHistory.length" style="margin-top:20px">
  <el-collapse-item title="驳回历史">
    <el-timeline>
      <el-timeline-item v-for="(r, i) in rejectHistory" :key="i"
        :timestamp="r.created_at" placement="top">
        <el-tag type="danger" size="small">驳回</el-tag>
        <p>{{ r.reason }}</p>
        <span class="text-muted">— {{ r.rejected_by }}</span>
      </el-timeline-item>
    </el-timeline>
  </el-collapse-item>
</el-collapse>
```

- [ ] 在 `onMounted` 中加载驳回历史（调用后端 API 获取测量记录的驳回历史）

#### 步骤 4.3：前端 — 面积校验

- [ ] **修改 `admin-web/src/views/MeasureReview.vue`**，在 `grandTotal` computed 中添加校验：

```javascript
const areaWarning = computed(() => {
  const total = parseFloat(grandTotal.value)
  if (total > 500) return '总面积超过 500㎡，请确认数据准确性'
  if (total < 1) return '总面积小于 1㎡，数据可能不完整'
  return ''
})
```

- 在总面积下方显示 `<el-alert v-if="areaWarning" :title="areaWarning" type="warning" :closable="false" />`

- [ ] **Commit**
```bash
git add admin-web/src/views/MeasureReview.vue
git commit -m "feat: 测量审核行内编辑+驳回历史+面积校验"
```

---

### 任务 5：页面 4 — 费用管理 (Finance.vue)

**文件：**
- 修改：`admin-web/src/views/Finance.vue`
- 修改：`backend/src/controllers/financeController.js`
- 修改：`backend/src/routes/finance.js`

#### 步骤 5.1：前端 — 重写费用管理页面

- [ ] **修改 `admin-web/src/views/Finance.vue`**，从简单列表改为完整的费用管理页面：

```vue
<template>
  <div>
    <div class="page-header flex-between">
      <h1 class="page-title">费用管理</h1>
      <el-button type="primary" @click="showStats = !showStats">
        {{ showStats ? '隐藏统计' : '费用统计' }}
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <div v-if="showStats" class="stats-row mb-20">
      <el-card>
        <template #header>报价总额</template>
        <div class="stat-value">{{ formatMoney(stats.totalQuote) }}</div>
      </el-card>
      <el-card>
        <template #header>已结清</template>
        <div class="stat-value success">{{ formatMoney(stats.totalPaid) }}</div>
      </el-card>
      <el-card>
        <template #header>未结清</template>
        <div class="stat-value warning">{{ formatMoney(stats.totalPending) }}</div>
      </el-card>
      <el-card>
        <template #header>月度趋势</template>
        <v-chart :option="chartOption" style="height:200px" />
      </el-card>
    </div>

    <!-- 筛选 -->
    <el-card class="mb-20">
      <el-form :inline="true">
        <el-form-item>
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width:120px" @change="fetchList">
            <el-option label="报价中" value="quoted" />
            <el-option label="已结清" value="paid" />
            <el-option label="已开票" value="invoiced" />
            <el-option label="结算完成" value="settlement_complete" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="filters.keyword" placeholder="搜索工单号" clearable style="width:200px" @change="fetchList" />
        </el-form-item>
        <el-form-item>
          <el-button @click="fetchList">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 费用列表 -->
    <el-card>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="workOrder.work_order_no" label="工单号" width="160">
          <template #default="{ row }">
            <router-link :to="`/work-orders/${row.work_order_id}`" class="wo-link">{{ row.workOrder?.work_order_no }}</router-link>
          </template>
        </el-table-column>
        <el-table-column label="项目名称" min-width="150">
          <template #default="{ row }">{{ row.workOrder?.title }}</template>
        </el-table-column>
        <el-table-column label="报价" width="120">
          <template #default="{ row }">{{ formatMoney(row.quote_amount) }}</template>
        </el-table-column>
        <el-table-column label="已用" width="120">
          <template #default="{ row }">
            <div>
              {{ formatMoney(row.budget_used) }}
              <el-progress :percentage="budgetPercent(row)" :stroke-width="4"
                :color="budgetColor(row)" style="margin-top:4px" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="剩余" width="120">
          <template #default="{ row }">
            <span :class="{ 'text-danger': (row.budget_remaining || (row.quote_amount - row.budget_used)) < 0 }">
              {{ formatMoney(row.budget_remaining || (row.quote_amount - row.budget_used)) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><el-tag size="small">{{ statusLabel(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button size="small" @click="openQuoteDialog(row)">报价</el-button>
            <el-button size="small" @click="openInvoiceDialog(row)">发票</el-button>
            <el-button size="small" @click="openSettlementDialog(row)">结算</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !list.length" description="暂无费用记录" />
    </el-card>

    <!-- 报价对话框 -->
    <el-dialog v-model="showQuoteDialog" title="编辑报价" width="520px">
      <el-form :model="quoteForm" label-width="80px">
        <el-form-item label="工单"><span class="wo-link">{{ quoteForm.work_order_no }}</span></el-form-item>
        <el-form-item label="报价金额" prop="total_amount">
          <el-input-number v-model="quoteForm.total_amount" :min="0" :precision="2"
            controls-position="right" style="width:100%" />
        </el-form-item>
        <el-form-item label="报价备注">
          <el-input v-model="quoteForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showQuoteDialog = false">取消</el-button>
        <el-button type="primary" @click="submitQuote" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- 发票对话框 -->
    <el-dialog v-model="showInvoiceDialog" title="开票记录" width="480px">
      <el-form :model="invoiceForm" label-width="80px">
        <el-form-item label="发票号">
          <el-input v-model="invoiceForm.invoice_number" placeholder="请输入发票号" />
        </el-form-item>
        <el-form-item label="发票金额">
          <el-input-number v-model="invoiceForm.amount" :min="0" :precision="2"
            controls-position="right" style="width:100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="invoiceForm.status" style="width:100%">
            <el-option label="已开票" value="invoiced" />
            <el-option label="未开票" value="not_invoiced" />
            <el-option label="已寄出" value="sent" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showInvoiceDialog = false">取消</el-button>
        <el-button type="primary" @click="submitInvoice" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- 结算对话框 -->
    <el-dialog v-model="showSettlementDialog" title="结算审批" width="520px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="工单">{{ settlementData.work_order_no }}</el-descriptions-item>
        <el-descriptions-item label="报价">{{ formatMoney(settlementData.quote_amount) }}</el-descriptions-item>
        <el-descriptions-item label="已用">{{ formatMoney(settlementData.budget_used) }}</el-descriptions-item>
        <el-descriptions-item label="剩余">{{ formatMoney(settlementData.budget_remaining) }}</el-descriptions-item>
      </el-descriptions>
      <div class="mt-16">
        <el-button type="success" @click="approveSettlement" :loading="submitting">确认结算</el-button>
        <el-button type="danger" @click="rejectSettlement" :loading="submitting">驳回</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'
import { formatMoney } from '../utils/format'

const list = ref([])
const loading = ref(false)
const showStats = ref(false)
const submitting = ref(false)

const filters = reactive({ status: '', keyword: '' })

// 统计
const stats = reactive({ totalQuote: 0, totalPaid: 0, totalPending: 0 })
const chartOption = ref({
  xAxis: { type: 'category', data: [] },
  yAxis: { type: 'value' },
  series: [{ type: 'bar', data: [] }],
})

const STATUS_MAP = {
  quoted: '已报价', paid: '已结清', invoiced: '已开票',
  settlement_complete: '结算完成', settlement_rejected: '结算驳回',
}
function statusLabel(s) { return STATUS_MAP[s] || '报价中' }

async function fetchList() {
  loading.value = true
  try {
    const params = { ...filters }
    const res = await api.get('/finance/quotes', { params })
    list.value = res.data || []
    // 计算统计
    stats.totalQuote = list.value.reduce((s, r) => s + (r.quote_amount || 0), 0)
    stats.totalPaid = list.value.filter(r => r.status === 'paid').reduce((s, r) => s + (r.quote_amount || 0), 0)
    stats.totalPending = stats.totalQuote - stats.totalPaid
  } catch { list.value = [] }
  finally { loading.value = false }
}

function budgetPercent(row) {
  const used = row.budget_used || 0
  const quote = row.quote_amount || 1
  return Math.min(Math.round((used / quote) * 100), 100)
}

function budgetColor(row) {
  const pct = budgetPercent(row)
  return pct > 90 ? '#dc2626' : pct > 70 ? '#ea580c' : '#16a34a'
}

// 报价
const showQuoteDialog = ref(false)
const quoteForm = reactive({ id: '', work_order_no: '', work_order_id: '', total_amount: 0, notes: '' })

function openQuoteDialog(row) {
  quoteForm.id = row.id
  quoteForm.work_order_id = row.work_order_id
  quoteForm.work_order_no = row.workOrder?.work_order_no
  quoteForm.total_amount = row.quote_amount || 0
  quoteForm.notes = row.quote_notes || ''
  showQuoteDialog.value = true
}

async function submitQuote() {
  if (!quoteForm.total_amount) return ElMessage.warning('报价金额不能为空')
  submitting.value = true
  try {
    await api.post(`/finance/${quoteForm.work_order_id}/quote`, {
      items: [{ description: '报价', amount: quoteForm.total_amount }],
      total_amount: quoteForm.total_amount,
      notes: quoteForm.notes,
    })
    ElMessage.success('报价已更新')
    showQuoteDialog.value = false
    await fetchList()
  } catch (e) { ElMessage.error(e.response?.data?.error || '操作失败') }
  finally { submitting.value = false }
}

// 发票
const showInvoiceDialog = ref(false)
const invoiceForm = reactive({ invoice_number: '', amount: 0, status: 'invoiced' })

function openInvoiceDialog(row) {
  invoiceForm.invoice_number = row.invoice_number || ''
  invoiceForm.amount = row.quote_amount || 0
  invoiceForm.status = row.status === 'invoiced' ? 'invoiced' : 'not_invoiced'
  invoiceForm._workOrderId = row.work_order_id
  showInvoiceDialog.value = true
}

async function submitInvoice() {
  if (!invoiceForm.invoice_number) return ElMessage.warning('发票号不能为空')
  submitting.value = true
  try {
    await api.post(`/finance/${invoiceForm._workOrderId}/invoice`, {
      invoice_number: invoiceForm.invoice_number,
      amount: invoiceForm.amount,
    })
    ElMessage.success('开票记录已添加')
    showInvoiceDialog.value = false
    await fetchList()
  } catch (e) { ElMessage.error(e.response?.data?.error || '操作失败') }
  finally { submitting.value = false }
}

// 结算
const showSettlementDialog = ref(false)
const settlementData = reactive({ work_order_no: '', quote_amount: 0, budget_used: 0, budget_remaining: 0, _workOrderId: '' })

function openSettlementDialog(row) {
  settlementData.work_order_no = row.workOrder?.work_order_no
  settlementData.quote_amount = row.quote_amount || 0
  settlementData.budget_used = row.budget_used || 0
  settlementData.budget_remaining = row.budget_remaining || (row.quote_amount - row.budget_used)
  settlementData._workOrderId = row.work_order_id
  showSettlementDialog.value = true
}

async function approveSettlement() {
  submitting.value = true
  try {
    await api.post(`/finance/${settlementData._workOrderId}/settlement`)
    ElMessage.success('结算已确认')
    showSettlementDialog.value = false
    await fetchList()
  } catch (e) { ElMessage.error(e.response?.data?.error || '操作失败') }
  finally { submitting.value = false }
}

async function rejectSettlement() {
  submitting.value = true
  try {
    await api.post(`/finance/${settlementData._workOrderId}/settlement/reject`, { reason: '结算驳回' })
    ElMessage.success('结算已驳回')
    showSettlementDialog.value = false
    await fetchList()
  } catch (e) { ElMessage.error(e.response?.data?.error || '操作失败') }
  finally { submitting.value = false }
}

onMounted(fetchList)
</script>

<style scoped>
.page-header { margin-bottom: var(--space-6); }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); }
.stat-value { font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); }
.stat-value.success { color: var(--color-success); }
.stat-value.warning { color: var(--color-warning); }
.mb-20 { margin-bottom: var(--space-5); }
.mt-16 { margin-top: var(--space-4); }
.text-danger { color: var(--color-danger); }
</style>
```

- [ ] **Commit**
```bash
git add admin-web/src/views/Finance.vue
git commit -m "feat: 费用管理重写（报价编辑/发票管理/结算审批/统计图表）"
```

---

### 任务 6：页面 5 — 生产管理 (Production.vue)

**文件：**
- 修改：`admin-web/src/views/Production.vue`

#### 步骤 6.1：前端 — 修复合并创建

- [ ] **修改 `admin-web/src/views/Production.vue`** 的合并创建对话框，增加工单选择：

在 `showMerge` 对话框中添加工单多选：

```vue
<el-form-item label="关联工单">
  <el-select v-model="mergeForm.work_order_ids" multiple filterable
    placeholder="选择要合并的工单" style="width:100%">
    <el-option v-for="wo in availableWorkOrders" :key="wo.id"
      :label="wo.work_order_no + ' - ' + wo.title" :value="wo.id" />
  </el-select>
</el-form-item>
```

```javascript
// 加载可选工单
async function fetchAvailableWorkOrders() {
  try {
    const res = await api.get('/work-orders', { params: { stage: 'design', limit: 100 } })
    availableWorkOrders.value = res.data || []
  } catch { availableWorkOrders.value = [] }
}
```

#### 步骤 6.2：前端 — 增加质检功能

- [ ] **修改状态更新对话框**，增加质检相关字段：

```vue
<el-form-item label="质检结果" v-if="newStatus === 'qualified'">
  <el-radio-group v-model="qualityResult">
    <el-radio value="pass">合格</el-radio>
    <el-radio value="fail">不合格</el-radio>
  </el-radio-group>
</el-form-item>
<el-form-item label="质检备注" v-if="qualityResult">
  <el-input v-model="qualityNotes" type="textarea" :rows="2" />
</el-form-item>
```

- [ ] **Commit**
```bash
git add admin-web/src/views/Production.vue
git commit -m "feat: 生产管理工单关联+质检功能"
```

---

### 任务 7：页面 6 — 施工管理 (Construction.vue)

**文件：**
- 创建：`admin-web/src/views/ConstructionDetail.vue`
- 修改：`admin-web/src/views/Construction.vue`
- 修改：`admin-web/src/router/index.js`

#### 步骤 7.1：创建施工详情页

- [ ] **创建 `admin-web/src/views/ConstructionDetail.vue`**

```vue
<template>
  <div v-loading="loading">
    <div class="flex-between mb-20">
      <div>
        <el-button @click="$router.back()" class="mb-8">&larr; 返回</el-button>
        <h1 class="page-title">施工详情 <span class="wo-no">{{ data.work_order?.work_order_no }}</span></h1>
      </div>
      <div>
        <el-button type="primary" @click="showAssignDialog = true" v-if="!data.constructions?.length">指派施工员</el-button>
      </div>
    </div>

    <!-- 基本信息 -->
    <el-card class="mb-20">
      <template #header><span class="section-title">基本信息</span></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="项目名称">{{ data.work_order?.title }}</el-descriptions-item>
        <el-descriptions-item label="项目地址">{{ data.work_order?.declaration?.full_address }}</el-descriptions-item>
        <el-descriptions-item label="测量面积">{{ totalArea }}㎡</el-descriptions-item>
        <el-descriptions-item label="施工员">{{ data.constructions?.[0]?.constructor?.real_name || '未指派' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 施工记录 -->
    <el-card class="mb-20" v-if="data.constructions?.length">
      <template #header><span class="section-title">施工记录</span></template>
      <el-timeline>
        <el-timeline-item v-for="(c, i) in data.constructions" :key="i"
          :timestamp="c.constructed_at || c.created_at" placement="top">
          <el-tag :type="statusType(c.status)">{{ statusLabel(c.status) }}</el-tag>
          <p class="mt-8">{{ c.notes || '暂无备注' }}</p>
          <div class="mt-8">
            <el-tag size="small" type="info">施工 {{ c.duration_minutes || 0 }} 分钟</el-tag>
          </div>
          <!-- 照片 -->
          <div class="photo-grid mt-8" v-if="c.after_photos?.length">
            <el-image v-for="(url, j) in c.after_photos" :key="j" :src="url"
              :preview-src-list="c.after_photos" fit="cover" class="photo-item" />
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- 验收 -->
    <el-card class="mb-20" v-if="data.constructions?.length">
      <template #header><span class="section-title">验收记录</span></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="内部验收">
          <el-tag v-if="data.constructions[0].internal_verified_at" type="success">通过 {{ data.constructions[0].internal_verified_at }}</el-tag>
          <el-tag v-else type="info">未验收</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="甲方验收">
          <el-tag v-if="data.constructions[0].client_verified_at" type="success">通过 {{ data.constructions[0].client_verified_at }}</el-tag>
          <el-tag v-else type="info">未验收</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <div class="mt-16" v-if="!data.constructions[0].internal_verified_at">
        <el-button type="success" @click="handleInternalVerify">内部验收通过</el-button>
      </div>
    </el-card>

    <!-- 指派对话框 -->
    <el-dialog v-model="showAssignDialog" title="指派施工员" width="400px">
      <el-form label-width="80px">
        <el-form-item label="施工员">
          <el-select v-model="assignForm.constructor_id" style="width:100%">
            <el-option v-for="u in constructors" :key="u.id" :label="u.name" :value="u.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAssignDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAssign">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const data = ref({})
const constructors = ref([])
const showAssignDialog = ref(false)
const assignForm = reactive({ constructor_id: '' })

const totalArea = computed(() => {
  const m = data.value.work_order?.measurement
  if (!m?.materials) return '0.00'
  return m.materials.reduce((s, mat) => s + mat.faces.reduce((ss, f) => ss + (f.area || (f.width * f.height)), 0), 0).toFixed(2)
})

const STATUS_MAP = {
  installing: '施工中', completed: '已完成', internally_verified: '内部验收通过', accepted: '甲方已验收'
}
function statusLabel(s) { return STATUS_MAP[s] || s }
function statusType(s) { return s === 'accepted' ? 'success' : s === 'completed' ? 'primary' : 'warning' }

async function fetchData() {
  loading.value = true
  try {
    const res = await api.get(`/construction/tasks/${route.params.id}`)
    data.value = res.data || {}
  } catch { data.value = { work_order: {}, constructions: [] } }
  finally { loading.value = false }
}

async function fetchConstructors() {
  try {
    const res = await api.get('/tenant/users', { params: { role: 'constructor' } })
    constructors.value = res.data || []
  } catch { constructors.value = [] }
}

async function submitAssign() {
  if (!assignForm.constructor_id) return ElMessage.warning('请选择施工员')
  try {
    await api.post(`/construction/${route.params.id}`, {
      constructor_id: assignForm.constructor_id,
      notes: '已指派',
    })
    ElMessage.success('施工员已指派')
    showAssignDialog.value = false
    await fetchData()
  } catch (e) { ElMessage.error(e.response?.data?.error || '操作失败') }
}

async function handleInternalVerify() {
  try {
    await api.post(`/construction/${route.params.id}/internal-verify`, { verified: true })
    ElMessage.success('内部验收通过')
    await fetchData()
  } catch (e) { ElMessage.error(e.response?.data?.error || '操作失败') }
}

onMounted(() => { fetchData(); fetchConstructors() })
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.mb-8 { margin-bottom: var(--space-2); }
.mb-20 { margin-bottom: var(--space-5); }
.mt-8 { margin-top: var(--space-2); }
.mt-16 { margin-top: var(--space-4); }
.section-title { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); }
.page-title { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); }
.wo-no { color: var(--color-text-tertiary); font-weight: var(--font-weight-normal); font-size: var(--font-size-md); }
.photo-grid { display: grid; grid-template-columns: repeat(5, 80px); gap: var(--space-2); }
.photo-item { width: 80px; height: 80px; border-radius: var(--radius-sm); cursor: pointer; }
</style>
```

#### 步骤 7.2：修改施工列表页

- [ ] **修改 `admin-web/src/views/Construction.vue`**，操作列改为跳转到详情页：

```vue
<el-table-column label="操作" width="150">
  <template #default="{ row }">
    <router-link :to="`/construction/${row.work_order_id}`">
      <el-button size="small">查看详情</el-button>
    </router-link>
    <el-button size="small" type="success" v-if="row.workOrder?.current_stage === 'construction'"
      @click="handleStartConstruction(row)">开始施工</el-button>
  </template>
</el-table-column>
```

#### 步骤 7.3：添加路由

- [ ] **修改 `admin-web/src/router/index.js`**，添加施工详情页路由：

```javascript
{
  path: 'construction/:id',
  name: 'ConstructionDetail',
  component: () => import('../views/ConstructionDetail.vue'),
  meta: { title: '施工详情' }
},
```

- [ ] **Commit**
```bash
git add admin-web/src/views/Construction.vue admin-web/src/views/ConstructionDetail.vue admin-web/src/router/index.js
git commit -m "feat: 施工管理详情页+验收流程+指派施工员"
```

---

### 任务 8：页面 7 — 归档管理 (Archive.vue)

**文件：**
- 创建：`admin-web/src/views/ArchiveDetail.vue`
- 修改：`admin-web/src/views/Archive.vue`
- 修改：`admin-web/src/router/index.js`

#### 步骤 8.1：创建归档详情页

- [ ] **创建 `admin-web/src/views/ArchiveDetail.vue`**

```vue
<template>
  <div v-loading="loading">
    <div class="mb-20">
      <el-button @click="$router.back()">&larr; 返回</el-button>
      <h1 class="page-title">归档详情 <span class="wo-no">{{ data.work_order_no }}</span></h1>
    </div>

    <!-- 工单时间线 -->
    <el-card class="mb-20">
      <template #header><span class="section-title">完整工单时间线</span></template>
      <el-timeline>
        <el-timeline-item v-for="(log, i) in logs" :key="i"
          :timestamp="log.created_at" placement="top">
          {{ log.detail }}
          <span class="text-muted">— {{ log.user_name }}</span>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- 费用汇总 -->
    <el-card class="mb-20" v-if="data.finance">
      <template #header><span class="section-title">费用汇总</span></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="报价">{{ formatMoney(data.finance.quote_amount) }}</el-descriptions-item>
        <el-descriptions-item label="已用">{{ formatMoney(data.finance.budget_used) }}</el-descriptions-item>
        <el-descriptions-item label="剩余">{{ formatMoney(data.finance.budget_remaining) }}</el-descriptions-item>
        <el-descriptions-item label="发票">{{ data.finance.invoice_number || '未开票' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 导出按钮 -->
    <el-button type="primary" @click="exportReport">导出归档报告</el-button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'
import { formatMoney } from '../utils/format'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const data = ref({})
const logs = ref([])

async function fetchData() {
  try {
    const res = await api.get(`/archives/${route.params.id}`)
    data.value = res.data || {}
  } catch { data.value = {} }
  finally { loading.value = false }
}

async function fetchLogs() {
  try {
    const res = await api.get(`/work-orders/${data.value.work_order_id}/logs`)
    logs.value = res.data || []
  } catch { logs.value = [] }
}

function exportReport() {
  window.print()
}

onMounted(async () => {
  await fetchData()
  if (data.value.work_order_id) await fetchLogs()
})
</script>

<style scoped>
.mb-20 { margin-bottom: var(--space-5); }
.section-title { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); }
.page-title { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); }
.wo-no { color: var(--color-text-tertiary); font-weight: var(--font-weight-normal); font-size: var(--font-size-md); }
.text-muted { color: var(--color-text-tertiary); font-size: var(--font-size-xs); }
</style>
```

#### 步骤 8.2：修改归档列表页

- [ ] **修改 `admin-web/src/views/Archive.vue`**，增加搜索筛选和跳转详情：

```vue
<el-form :inline="true" class="mb-20">
  <el-form-item>
    <el-input v-model="keyword" placeholder="搜索工单号/归档编号" clearable style="width:240px" @change="fetchList" />
  </el-form-item>
</el-form>

<!-- 操作列 -->
<el-table-column label="操作" width="150">
  <template #default="{ row }">
    <router-link :to="`/archive/${row.id}`">
      <el-button size="small">查看详情</el-button>
    </router-link>
  </template>
</el-table-column>
```

```javascript
const keyword = ref('')

async function fetchList() {
  loading.value = true
  try {
    const params = keyword.value ? { keyword: keyword.value } : {}
    const res = await api.get('/archives', { params })
    list.value = res.data || []
  } catch { list.value = [] }
  finally { loading.value = false }
}
```

#### 步骤 8.3：添加路由

- [ ] **修改 `admin-web/src/router/index.js`**：

```javascript
{
  path: 'archive/:id',
  name: 'ArchiveDetail',
  component: () => import('../views/ArchiveDetail.vue'),
  meta: { title: '归档详情' }
},
```

- [ ] **Commit**
```bash
git add admin-web/src/views/Archive.vue admin-web/src/views/ArchiveDetail.vue admin-web/src/router/index.js
git commit -m "feat: 归档管理详情页+搜索筛选"
```

---

### 任务 9：页面 8 — 售后管理 (Aftersale.vue)

**文件：**
- 创建：`admin-web/src/views/AftersaleDetail.vue`
- 修改：`admin-web/src/views/Aftersale.vue`
- 修改：`admin-web/src/router/index.js`

#### 步骤 9.1：创建售后详情页

- [ ] **创建 `admin-web/src/views/AftersaleDetail.vue`**

```vue
<template>
  <div v-loading="loading">
    <div class="mb-20">
      <el-button @click="$router.back()">&larr; 返回</el-button>
      <h1 class="page-title">售后详情</h1>
    </div>

    <el-card class="mb-20">
      <template #header><span class="section-title">问题描述</span></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="工单">{{ data.workOrder?.work_order_no }}</el-descriptions-item>
        <el-descriptions-item label="项目">{{ data.workOrder?.title }}</el-descriptions-item>
        <el-descriptions-item label="问题" :span="2">{{ data.description }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(data.status)">{{ statusLabel(data.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ data.created_at }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card>
      <template #header><span class="section-title">处理记录</span></template>
      <el-timeline>
        <el-timeline-item v-for="(record, i) in data.handle_records || []" :key="i"
          :timestamp="record.created_at" placement="top">
          <el-tag :type="recordType(record.status)">{{ record.status }}</el-tag>
          <p class="mt-4">{{ record.notes }}</p>
          <span class="text-muted">— {{ record.handler_name }}</span>
        </el-timeline-item>
        <el-timeline-item v-if="!data.handle_records?.length">
          <span class="text-muted">暂无处理记录</span>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api'

const route = useRoute()
const loading = ref(true)
const data = ref({})

const STATUS_MAP = { pending: '待处理', processing: '处理中', resolved: '已解决', closed: '已关闭' }
function statusLabel(s) { return STATUS_MAP[s] || s }
function statusType(s) { return s === 'resolved' ? 'success' : s === 'closed' ? 'info' : 'warning' }
function recordType(s) { return s === 'resolved' ? 'success' : 'warning' }

onMounted(async () => {
  try {
    const res = await api.get(`/aftersales/${route.params.id}`)
    data.value = res.data || {}
  } catch { data.value = {} }
  finally { loading.value = false }
})
</script>

<style scoped>
.mb-20 { margin-bottom: var(--space-5); }
.mt-4 { margin-top: var(--space-1); }
.section-title { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); }
.page-title { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); }
.text-muted { color: var(--color-text-tertiary); font-size: var(--font-size-xs); }
</style>
```

#### 步骤 9.2：修改售后列表页

- [ ] **修改 `admin-web/src/views/Aftersale.vue`**，操作列增加"查看详情"：

```vue
<el-table-column label="操作" width="180">
  <template #default="{ row }">
    <router-link :to="`/aftersale/${row.id}`">
      <el-button size="small">查看详情</el-button>
    </router-link>
    <el-button v-if="row.status === 'pending'" size="small" type="primary"
      @click="handleAftersale(row)">处理</el-button>
    <span v-else class="text-muted">已处理</span>
  </template>
</el-table-column>
```

#### 步骤 9.3：添加路由

- [ ] **修改 `admin-web/src/router/index.js`**：

```javascript
{
  path: 'aftersale/:id',
  name: 'AftersaleDetail',
  component: () => import('../views/AftersaleDetail.vue'),
  meta: { title: '售后详情' }
},
```

- [ ] **Commit**
```bash
git add admin-web/src/views/Aftersale.vue admin-web/src/views/AftersaleDetail.vue admin-web/src/router/index.js
git commit -m "feat: 售后管理详情页+处理记录时间线"
```

---

### 任务 10：页面 9 — Dashboard

**文件：**
- 修改：`admin-web/src/views/Dashboard.vue`

#### 步骤 10.1：前端 — 快捷跳转 + 人员排行 + 月度对比 + 收入概览

- [ ] **修改 `admin-web/src/views/Dashboard.vue`**，在统计卡片上添加点击事件：

```vue
<el-card v-for="card in stats" :key="card.stage" class="stat-card"
  @click="handleCardClick(card.stage)" style="cursor:pointer">
  <div class="stat-icon">{{ card.icon }}</div>
  <div class="stat-content">
    <div class="stat-number">{{ card.count }}</div>
    <div class="stat-label">{{ card.label }}</div>
  </div>
</el-card>
```

```javascript
const stageRouteMap = {
  declaration: '/declarations',
  approval: '/work-orders?stage=approval',
  assignment: '/dispatch',
  measurement: '/work-orders?stage=measurement',
  design: '/designs',
  production: '/production',
  construction: '/construction',
  finance: '/finance',
  archive: '/archive',
}

function handleCardClick(stage) {
  const route = stageRouteMap[stage]
  if (route) router.push(route)
}

// 月度对比
const monthlyCompare = ref({ thisMonth: 0, lastMonth: 0 })

async function fetchMonthlyCompare() {
  try {
    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
    const lastMonth = now.getMonth() === 0
      ? `${now.getFullYear()-1}-12`
      : `${now.getFullYear()}-${String(now.getMonth()).padStart(2,'0')}`
    const [thisRes, lastRes] = await Promise.all([
      api.get('/work-orders', { params: { start_date: thisMonth+'-01', limit: 1000 } }),
      api.get('/work-orders', { params: { start_date: lastMonth+'-01', limit: 1000 } }),
    ])
    monthlyCompare.value = {
      thisMonth: (thisRes.data || []).length,
      lastMonth: (lastRes.data || []).length,
    }
  } catch {}
}
```

- 在 Dashboard 中添加月度对比卡片和收入概览卡片

- [ ] **Commit**
```bash
git add admin-web/src/views/Dashboard.vue
git commit -m "feat: Dashboard快捷跳转+月度对比+人员排行+收入概览"
```

---

### 任务 11：页面 10 — 申报接收 (Declarations.vue)

**文件：**
- 修改：`admin-web/src/views/Declarations.vue`

#### 步骤 11.1：前端 — 批量接收 + Tab 切换 + 预览弹窗

- [ ] **修改 `admin-web/src/views/Declarations.vue`**：

```vue
<template>
  <div>
    <div class="page-header"><h1 class="page-title">申报接收</h1></div>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" class="mb-20">
      <el-tab-pane label="待接收" name="pending">
        <el-checkbox v-model="selectAll" @change="toggleSelectAll" class="mb-8">全选</el-checkbox>
        <el-button type="primary" :disabled="!selectedIds.length" @click="handleBatchReceive" class="mb-16">
          批量接收 ({{ selectedIds.length }})
        </el-button>
        <el-table :data="list" stripe @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="50" />
          <el-table-column prop="work_order_no" label="工单号" width="160">
            <template #default="{ row }">
              <router-link :to="`/work-orders/${row.id}`" class="wo-link">{{ row.work_order_no }}</router-link>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="项目名称" min-width="150" />
          <el-table-column prop="client_name" label="甲方企业" width="140" />
          <el-table-column prop="project_type" label="类型" width="100" />
          <el-table-column prop="created_at" label="申报时间" width="120" />
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button type="primary" size="small" :loading="receiving[row.id]" @click="handleReceive(row)">接收</el-button>
              <el-button size="small" @click="previewDeclaration(row)">预览</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="已接收" name="received">
        <el-table :data="receivedList" stripe>
          <el-table-column prop="work_order_no" label="工单号" width="160" />
          <el-table-column prop="title" label="项目名称" min-width="150" />
          <el-table-column prop="received_at" label="接收时间" width="120" />
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 预览弹窗 -->
    <el-dialog v-model="showPreview" title="申报预览" width="560px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="项目名称">{{ previewData.title }}</el-descriptions-item>
        <el-descriptions-item label="甲方">{{ previewData.client_name }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ previewData.project_type }}</el-descriptions-item>
        <el-descriptions-item label="地址">{{ previewData.address }}</el-descriptions-item>
        <el-descriptions-item label="描述">{{ previewData.description }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ previewData.contact_name }} {{ previewData.contact_phone }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const activeTab = ref('pending')
const list = ref([])
const receivedList = ref([])
const receiving = ref({})
const selectedIds = ref([])
const selectAll = ref(false)
const showPreview = ref(false)
const previewData = ref({})

async function handleReceive(row) {
  receiving.value[row.id] = true
  try {
    await api.post(`/tenant/declarations/${row.id}/receive`)
    ElMessage.success(`已接收 ${row.work_order_no}`)
    list.value = list.value.filter(w => w.id !== row.id)
  } catch (e) { ElMessage.error(e.response?.data?.error || '接收失败') }
  finally { receiving.value[row.id] = false }
}

function handleSelectionChange(rows) {
  selectedIds.value = rows.map(r => r.id)
}

function toggleSelectAll() {
  // Element Plus table selectAll 需要通过 ref 操作
}

async function handleBatchReceive() {
  if (!selectedIds.value.length) return ElMessage.warning('请选择要接收的申报')
  try {
    for (const id of selectedIds.value) {
      await api.post(`/tenant/declarations/${id}/receive`)
    }
    ElMessage.success(`已批量接收 ${selectedIds.value.length} 条申报`)
    list.value = list.value.filter(w => !selectedIds.value.includes(w.id))
    selectedIds.value = []
  } catch (e) { ElMessage.error('批量接收失败') }
}

function previewDeclaration(row) {
  previewData.value = row
  showPreview.value = true
}

onMounted(async () => {
  try {
    const res = await api.get('/tenant/declarations', { params: { stage: 'declaration' } })
    list.value = res.data?.list || res.data || []
  } catch { list.value = [] }
})
</script>

<style scoped>
.page-header { margin-bottom: var(--space-6); }
.mb-8 { margin-bottom: var(--space-2); }
.mb-16 { margin-bottom: var(--space-4); }
.mb-20 { margin-bottom: var(--space-5); }
</style>
```

- [ ] **Commit**
```bash
git add admin-web/src/views/Declarations.vue
git commit -m "feat: 申报接收批量接收+Tab切换+预览弹窗"
```

---

### 任务 12：页面 11 — 设计管理 (Designs.vue)

**文件：**
- 修改：`admin-web/src/views/Designs.vue`

#### 步骤 12.1：前端 — 文件上传 + 设计师指派 + 版本管理

- [ ] **修改 `admin-web/src/views/Designs.vue`**，上传设计稿对话框改为文件上传：

```vue
<el-dialog v-model="showDesignDialog" title="上传设计稿" width="560px">
  <el-form label-width="80px">
    <el-form-item label="工单"><span class="wo-link">{{ currentWO.work_order_no }}</span></el-form-item>
    <el-form-item label="效果图">
      <el-upload action="/api/v1/files/upload" list-type="picture-card"
        :file-list="effectFileList" :on-success="handleFileSuccess" :headers="uploadHeaders"
        :limit="9">
        <el-icon><Plus /></el-icon>
      </el-upload>
    </el-form-item>
    <el-form-item label="备注">
      <el-input v-model="designForm.notes" type="textarea" :rows="2" />
    </el-form-item>
  </el-form>
  <template #footer>
    <el-button @click="showDesignDialog = false">取消</el-button>
    <el-button type="primary" @click="submitDesign" :loading="submitting">上传</el-button>
  </template>
</el-dialog>
```

```javascript
import { computed } from 'vue'
import { useAuthStore } from '../store/auth'
import { Plus } from '@element-plus/icons-vue'

const auth = useAuthStore()
const effectFileList = ref([])
const uploadedUrls = ref([])

const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${auth.token}`
}))

function handleFileSuccess(res, file) {
  const url = res.data?.url || res.url
  uploadedUrls.value.push(url)
}
```

- 在 `submitDesign` 中使用 `uploadedUrls.value` 替代 URL 文本输入

- 在待审核列表中增加"版本"列和"查看历史"按钮

- [ ] **Commit**
```bash
git add admin-web/src/views/Designs.vue
git commit -m "feat: 设计管理文件上传+版本管理"
```

---

### 任务 13：页面 12 — 派单管理 (Dispatch.vue)

**文件：**
- 修改：`admin-web/src/views/Dispatch.vue`
- 修改：`admin-web/src/components/Layout.vue`

#### 步骤 13.1：前端 — 重写为统计视图

- [ ] **修改 `admin-web/src/views/Dispatch.vue`**：

```vue
<template>
  <div>
    <div class="page-header"><h1 class="page-title">派单统计</h1></div>

    <!-- 测量员负载 -->
    <el-card class="mb-20">
      <template #header><span class="section-title">测量员当前负载</span></template>
      <el-table :data="loadData" stripe v-loading="loading">
        <el-table-column prop="name" label="测量员" width="100" />
        <el-table-column prop="role" label="角色" width="80" />
        <el-table-column prop="active_tasks" label="进行中" width="100" />
        <el-table-column prop="completed" label="本月完成" width="100" />
        <el-table-column label="负载" width="200">
          <template #default="{ row }">
            <el-progress :percentage="loadPercent(row)"
              :color="loadColor(row)" :stroke-width="8" />
          </template>
        </el-table-column>
        <el-table-column prop="timeout_rate" label="超时率" width="100">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.timeout_rate > 20 }">{{ row.timeout_rate }}%</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 派单历史 -->
    <el-card>
      <template #header><span class="section-title">近期派单记录</span></template>
      <el-table :data="historyData" stripe v-loading="loading">
        <el-table-column prop="work_order_no" label="工单号" width="160" />
        <el-table-column prop="title" label="项目名称" min-width="150" />
        <el-table-column prop="assignee_name" label="测量员" width="100" />
        <el-table-column prop="deadline" label="截止日期" width="120" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="row.is_completed ? 'success' : 'warning'">
              {{ row.is_completed ? '已完成' : '进行中' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'

const loading = ref(false)
const loadData = ref([])
const historyData = ref([])

function loadPercent(row) {
  return Math.min(Math.round((row.active_tasks / 10) * 100), 100)
}
function loadColor(row) {
  return row.active_tasks > 7 ? '#dc2626' : row.active_tasks > 4 ? '#ea580c' : '#16a34a'
}

async function fetchData() {
  loading.value = true
  try {
    const [loadRes, histRes] = await Promise.all([
      api.get('/assignments/stats'),
      api.get('/assignments', { params: { page: 1, limit: 20 } }),
    ])
    loadData.value = loadRes.data?.load || []
    historyData.value = histRes.data || []
  } catch { loadData.value = []; historyData.value = [] }
  finally { loading.value = false }
}

onMounted(fetchData)
</script>

<style scoped>
.page-header { margin-bottom: var(--space-6); }
.mb-20 { margin-bottom: var(--space-5); }
.section-title { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); }
.text-danger { color: var(--color-danger); }
</style>
```

#### 步骤 13.2：更新菜单

- [ ] **修改 `admin-web/src/components/Layout.vue`**，将派单菜单改为"派单统计"（或考虑移除，由你判断）

- [ ] **Commit**
```bash
git add admin-web/src/views/Dispatch.vue admin-web/src/components/Layout.vue
git commit -m "feat: 派单管理改为统计视图（测量员负载/派单历史）"
```

---

### 任务 14：页面 13 — 组织架构 (Organization.vue)

**文件：**
- 修改：`admin-web/src/views/Organization.vue`

#### 步骤 14.1：前端 — 部门树形 + 人员搜索 + 人员详情

- [ ] **修改 `admin-web/src/views/Organization.vue`** 的部门 tab：

```vue
<!-- 部门树形展示 -->
<el-table :data="departments" stripe row-key="id" v-loading="deptLoading">
  <el-table-column prop="name" label="部门名称" min-width="150" />
  <el-table-column prop="manager_name" label="负责人" width="100" />
  <el-table-column prop="user_count" label="人员数" width="80" />
  <el-table-column label="操作" width="200">
    <template #default="{ row }">
      <el-button size="small" @click="openDeptDialog(row)">编辑</el-button>
      <el-button size="small" type="danger" @click="handleDeleteDept(row)">删除</el-button>
      <el-button size="small" type="info" @click="viewDeptUsers(row)">查看人员</el-button>
    </template>
  </el-table-column>
</el-table>
```

- [ ] **修改人员 tab**，增加搜索框：

```vue
<div class="toolbar mb-16">
  <el-input v-model="userSearch" placeholder="搜索姓名/手机号" clearable
    style="width:200px" class="mr-8" @change="fetchUsers" />
  <el-select v-model="userFilter.role" placeholder="全部角色" clearable
    class="mr-8" style="width:120px" @change="fetchUsers">
    ...
  </el-select>
  <el-checkbox v-if="selectedUsers.length" class="mr-8">已选 {{ selectedUsers.length }}</el-checkbox>
  <el-button v-if="selectedUsers.length" type="warning" size="small"
    @click="showBatchDialog = true">批量操作</el-button>
  <el-button type="primary" @click="openUserDialog()">+ 添加人员</el-button>
</div>
```

```javascript
const userSearch = ref('')
const selectedUsers = ref([])

async function fetchUsers() {
  userLoading.value = true
  try {
    const params = { page: userFilter.page, limit: userFilter.limit }
    if (userFilter.role) params.role = userFilter.role
    if (userSearch.value) params.keyword = userSearch.value
    const res = await api.get('/tenant/users', { params })
    users.value = res.data || res || []
    userTotal.value = res.pagination?.total || 0
  } catch { users.value = []; userTotal.value = 0 }
  finally { userLoading.value = false }
}
```

- [ ] **Commit**
```bash
git add admin-web/src/views/Organization.vue
git commit -m "feat: 组织架构人员搜索+批量操作+部门查看人员"
```

---

### 任务 15：页面 14 — 甲方管理 (Clients.vue)

**文件：**
- 创建：`admin-web/src/views/ClientDetail.vue`
- 修改：`admin-web/src/views/Clients.vue`
- 修改：`admin-web/src/router/index.js`

#### 步骤 15.1：创建甲方详情页

- [ ] **创建 `admin-web/src/views/ClientDetail.vue`**

```vue
<template>
  <div v-loading="loading">
    <div class="mb-20">
      <el-button @click="$router.back()">&larr; 返回</el-button>
      <h1 class="page-title">{{ client.name }} 详情</h1>
    </div>

    <!-- 基本信息 -->
    <el-card class="mb-20">
      <template #header><span class="section-title">基本信息</span></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="企业名称">{{ client.name }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ client.contact_name }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ client.contact_phone }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ client.contact_email }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="client.status === 'active' ? 'success' : 'danger'">
            {{ client.status === 'active' ? '正常' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 关联工单统计 -->
    <el-card class="mb-20">
      <template #header><span class="section-title">关联工单</span></template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="总数">{{ woStats.total }}</el-descriptions-item>
        <el-descriptions-item label="进行中">{{ woStats.active }}</el-descriptions-item>
        <el-descriptions-item label="已完成">{{ woStats.completed }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 费用汇总 -->
    <el-card class="mb-20">
      <template #header><span class="section-title">费用汇总</span></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="总报价">{{ formatMoney(financeStats.totalQuote) }}</el-descriptions-item>
        <el-descriptions-item label="已结清">{{ formatMoney(financeStats.totalPaid) }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 操作 -->
    <el-button :type="client.status === 'active' ? 'danger' : 'success'"
      @click="toggleStatus">
      {{ client.status === 'active' ? '禁用' : '启用' }}
    </el-button>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'
import { formatMoney } from '../utils/format'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const client = ref({})
const woStats = reactive({ total: 0, active: 0, completed: 0 })
const financeStats = reactive({ totalQuote: 0, totalPaid: 0 })

async function fetchData() {
  try {
    const res = await api.get(`/clients/${route.params.id}`)
    client.value = res.data || {}
  } catch { client.value = {} }
  finally { loading.value = false }
}

async function fetchWoStats() {
  try {
    const res = await api.get('/work-orders', { params: { client_id: route.params.id, limit: 1000 } })
    const list = res.data || []
    woStats.total = list.length
    woStats.active = list.filter(w => !['archived', 'cancelled'].includes(w.status)).length
    woStats.completed = list.filter(w => ['archived'].includes(w.status)).length
  } catch {}
}

async function toggleStatus() {
  const action = client.value.status === 'active' ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确定${action}该甲方吗？`, '提示', { type: 'warning' })
    await api.put(`/clients/${route.params.id}`, {
      status: client.value.status === 'active' ? 'disabled' : 'active'
    })
    ElMessage.success(`已${action}`)
    await fetchData()
  } catch {}
}

onMounted(() => { fetchData(); fetchWoStats() })
</script>

<style scoped>
.mb-20 { margin-bottom: var(--space-5); }
.section-title { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); }
.page-title { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); }
</style>
```

#### 步骤 15.2：修改甲方列表页

- [ ] **修改 `admin-web/src/views/Clients.vue`**，操作列增加"查看详情"：

```vue
<el-table-column label="操作" width="250">
  <template #default="{ row }">
    <router-link :to="`/clients/${row.id}`">
      <el-button size="small">查看详情</el-button>
    </router-link>
    <el-button size="small" @click="editClient(row)">编辑</el-button>
    <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
  </template>
</el-table-column>
```

#### 步骤 15.3：添加路由

- [ ] **修改 `admin-web/src/router/index.js`**：

```javascript
{
  path: 'clients/:id',
  name: 'ClientDetail',
  component: () => import('../views/ClientDetail.vue'),
  meta: { title: '甲方详情' }
},
```

- [ ] **Commit**
```bash
git add admin-web/src/views/Clients.vue admin-web/src/views/ClientDetail.vue admin-web/src/router/index.js
git commit -m "feat: 甲方管理详情页+状态管理"
```

---

### 任务 16：页面 15 — 系统配置 (Settings.vue)

**文件：**
- 修改：`admin-web/src/views/Settings.vue`
- 修改：`backend/src/controllers/formConfigController.js`
- 修改：`backend/src/routes/formConfig.js`

#### 步骤 16.1：后端 — 项目类型/材料字典持久化

- [ ] **修改 `backend/src/controllers/formConfigController.js`**，增加项目类型和材料字典的 API：

```javascript
// 项目类型配置
async function getProjectTypes(req, res) {
  const config = await FormConfig.findOne({
    where: { config_key: 'project_types', tenant_id: req.user.tenant_id }
  });
  const types = config?.config_value || [
    { label: '门头招牌', value: 'signboard', enabled: true, sort: 1 },
    { label: '室内广告', value: 'indoor', enabled: true, sort: 2 },
    { label: '灯箱', value: 'lightbox', enabled: true, sort: 3 },
    { label: 'LED显示屏', value: 'led', enabled: true, sort: 4 },
    { label: '其他', value: 'other', enabled: true, sort: 5 }
  ];
  return success(res, types);
}

async function saveProjectTypes(req, res) {
  const { types } = req.body;
  await FormConfig.upsert({
    config_key: 'project_types',
    tenant_id: req.user.tenant_id,
    config_value: types,
  });
  return success(res, types, '项目类型已保存');
}

// 材料字典配置
async function getMaterialDict(req, res) {
  const config = await FormConfig.findOne({
    where: { config_key: 'material_dict', tenant_id: req.user.tenant_id }
  });
  return success(res, config?.config_value || []);
}

async function saveMaterialDict(req, res) {
  const { categories } = req.body;
  await FormConfig.upsert({
    config_key: 'material_dict',
    tenant_id: req.user.tenant_id,
    config_value: categories,
  });
  return success(res, categories, '材料字典已保存');
}
```

- [ ] **修改 `backend/src/routes/formConfig.js`**，添加路由：

```javascript
// 项目类型
router.get('/project-types', controller.getProjectTypes);
router.put('/project-types', controller.saveProjectTypes);

// 材料字典
router.get('/material-dict', controller.getMaterialDict);
router.put('/material-dict', controller.saveMaterialDict);
```

#### 步骤 16.2：前端 — 项目类型/材料字典持久化

- [ ] **修改 `admin-web/src/views/Settings.vue`**，项目类型和材料字典的保存改为调用后端 API：

```javascript
// 项目类型保存
async function saveProjectTypes() {
  saving.value = true
  try {
    await api.put('/tenant/form-config/project-types', { types: projectTypes.value })
    ElMessage.success('项目类型已保存')
  } catch (e) { ElMessage.error('保存失败') }
  finally { saving.value = false }
}

// 材料字典保存
async function saveMaterialDict() {
  saving.value = true
  try {
    await api.put('/tenant/form-config/material-dict', { categories: materialCategories.value })
    ElMessage.success('材料字典已保存')
  } catch (e) { ElMessage.error('保存失败') }
  finally { saving.value = false }
}
```

- [ ] **修改项目类型 tab 的 header**，保存按钮改为调用 `saveProjectTypes`
- [ ] **修改材料字典 tab**，添加保存按钮调用 `saveMaterialDict`
- [ ] 在 `onMounted` 中加载后端数据：

```javascript
async function loadProjectTypes() {
  try {
    const res = await api.get('/tenant/form-config/project-types')
    if (res.data?.length) projectTypes.value = res.data
  } catch {}
}

async function loadMaterialDict() {
  try {
    const res = await api.get('/tenant/form-config/material-dict')
    if (res.data?.length) materialCategories.value = res.data
  } catch {}
}
```

- [ ] **Commit**
```bash
git add backend/src/controllers/formConfigController.js backend/src/routes/formConfig.js admin-web/src/views/Settings.vue
git commit -m "feat: 系统配置项目类型+材料字典后端持久化"
```

---

### 任务 17：页面 16 — 登录 (Login.vue)

**文件：**
- 修改：`admin-web/src/views/Login.vue`
- 修改：`admin-web/src/store/auth.js`

#### 步骤 17.1：前端 — 记住登录 + 忘记密码 + 首次登录提示

- [ ] **修改 `admin-web/src/store/auth.js`**，增加记住登录功能：

```javascript
function login(tokenData, userData, remember = false) {
  token.value = tokenData
  user.value = userData
  if (remember) {
    localStorage.setItem('token', tokenData)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('remember', 'true')
  } else {
    sessionStorage.setItem('token', tokenData)
    sessionStorage.setItem('user', JSON.stringify(userData))
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('remember')
  }
}

function logout() {
  token.value = ''
  user.value = null
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('remember')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
}

// 初始化时检查
const rememberMe = localStorage.getItem('remember') === 'true'
const storedToken = rememberMe
  ? (localStorage.getItem('token') || '')
  : (sessionStorage.getItem('token') || '')
const storedUser = rememberMe
  ? (localStorage.getItem('user') || 'null')
  : (sessionStorage.getItem('user') || 'null')

token.value = storedToken
user.value = JSON.parse(storedUser)
```

- [ ] **修改 `admin-web/src/views/Login.vue`**，添加记住登录复选框和忘记密码链接：

```vue
<el-checkbox v-model="rememberMe" class="mb-16">记住登录状态（7天）</el-checkbox>
<div class="flex-between mb-16">
  <span></span>
  <el-link type="primary" @click="showForgot = true">忘记密码？</el-link>
</div>
```

- [ ] **添加忘记密码对话框**：

```vue
<el-dialog v-model="showForgot" title="重置密码" width="400px">
  <el-form :model="forgotForm" label-width="80px">
    <el-form-item label="手机号">
      <el-input v-model="forgotForm.phone" placeholder="请输入注册手机号" />
    </el-form-item>
    <el-form-item label="新密码">
      <el-input v-model="forgotForm.password" type="password" placeholder="请输入新密码" />
    </el-form-item>
  </el-form>
  <template #footer>
    <el-button @click="showForgot = false">取消</el-button>
    <el-button type="primary" @click="handleForgotReset" :loading="resetting">重置</el-button>
  </template>
</el-dialog>
```

```javascript
const rememberMe = ref(false)
const showForgot = ref(false)
const resetting = ref(false)
const forgotForm = reactive({ phone: '', password: '' })

async function handleLogin() {
  try {
    const res = await api.post('/auth/login', form)
    auth.login(res.data.token, res.data.user, rememberMe.value)
    // 首次登录检查
    if (res.data.user.is_first_login) {
      ElMessage.warning('首次登录，请修改默认密码')
      showPasswordChange.value = true
    }
    ElMessage.success('登录成功')
    router.push('/')
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '登录失败')
  }
}

async function handleForgotReset() {
  if (!forgotForm.phone || !forgotForm.password) {
    return ElMessage.warning('请填写完整信息')
  }
  resetting.value = true
  try {
    await api.post('/auth/reset-password', forgotForm)
    ElMessage.success('密码已重置')
    showForgot.value = false
  } catch (e) { ElMessage.error(e.response?.data?.error || '重置失败') }
  finally { resetting.value = false }
}
```

- [ ] **Commit**
```bash
git add admin-web/src/views/Login.vue admin-web/src/store/auth.js
git commit -m "feat: 登录页记住登录+忘记密码+首次登录提示"
```

---

## 执行顺序总结

| 任务 | 页面 | 依赖 | 预计步骤 |
|------|------|------|---------|
| 任务 1 | 全局工具组件 | 无 | 6 步 |
| 任务 2 | 工单列表 | 任务 1 | 5 步 |
| 任务 3 | 工单详情 | 任务 2 | 3 步 |
| 任务 4 | 测量审核 | 无 | 3 步 |
| 任务 5 | 费用管理 | 任务 1 | 2 步 |
| 任务 6 | 生产管理 | 无 | 2 步 |
| 任务 7 | 施工管理 | 无 | 4 步 |
| 任务 8 | 归档管理 | 无 | 4 步 |
| 任务 9 | 售后管理 | 无 | 4 步 |
| 任务 10 | Dashboard | 无 | 2 步 |
| 任务 11 | 申报接收 | 无 | 2 步 |
| 任务 12 | 设计管理 | 任务 1 | 2 步 |
| 任务 13 | 派单统计 | 无 | 3 步 |
| 任务 14 | 组织架构 | 无 | 2 步 |
| 任务 15 | 甲方管理 | 无 | 4 步 |
| 任务 16 | 系统配置 | 无 | 3 步 |
| 任务 17 | 登录页 | 无 | 3 步 |

**总计约 55 个步骤，每个步骤 2-5 分钟，预计 2-4 小时完成。**

---

## 验证策略

每个任务完成后执行：
```bash
cd admin-web && npm run build
```

所有任务完成后完整验证：
```bash
cd admin-web && npm run build && echo "BUILD SUCCESS"
```

## TODO.md 更新

所有任务完成后，更新 `TODO.md`：

```markdown
## 当前任务

### 管理后台 UI 优化（全面完善）
- [x] 创建全局 CSS 变量设计系统 (global.css)
- [x] 创建全局工具组件（导出/格式化/徽章/空状态/上传）
- [x] 工单列表（看板拖拽+导出+刷新+批量推进）
- [x] 工单详情（关联数据+进度条跳转+费用卡片）
- [x] 测量审核（行内编辑+驳回历史+面积校验）
- [x] 费用管理（报价编辑+发票+结算+统计图）
- [x] 生产管理（工单关联+质检）
- [x] 施工管理（详情页+验收+指派）
- [x] 归档管理（详情页+搜索）
- [x] 售后管理（详情页+处理记录）
- [x] Dashboard（快捷跳转+月度对比+排行）
- [x] 申报接收（批量接收+Tab切换+预览）
- [x] 设计管理（文件上传+版本管理）
- [x] 派单统计（测量员负载+派单历史）
- [x] 组织架构（人员搜索+批量操作）
- [x] 甲方管理（详情页+状态管理）
- [x] 系统配置（项目类型+材料字典持久化）
- [x] 登录页（记住登录+忘记密码）
- [ ] 浏览器逐一验证所有页面
```
