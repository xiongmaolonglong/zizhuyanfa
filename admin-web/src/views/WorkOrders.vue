<template>
  <div>
    <div class="page-header flex-between">
      <h1 class="page-title">工单管理</h1>
      <div class="page-actions">
        <el-button :type="viewMode === 'list' ? '' : 'primary'" @click="viewMode = viewMode === 'kanban' ? 'list' : 'kanban'; page = 1">
          {{ viewMode === 'kanban' ? '列表视图' : '看板视图' }}
        </el-button>
        <el-button v-if="viewMode === 'kanban'" type="success" @click="exportKanbanExcel">
          <el-icon><Download /></el-icon>导出
        </el-button>
        <el-button v-if="viewMode === 'kanban'" @click="printKanban">
          <el-icon><Printer /></el-icon>打印
        </el-button>
        <el-button v-if="viewMode === 'kanban'" @click="showKanbanSettings = true">
          <el-icon><Setting /></el-icon>列设置
        </el-button>
        <el-button type="primary" @click="showCreate = true">
          <el-icon><Plus /></el-icon>补录工单
        </el-button>
      </div>
    </div>

    <!-- Kanban View -->
    <div v-if="viewMode === 'kanban'">
      <div class="kanban-toolbar">
        <el-input v-model="kanbanSearch" placeholder="搜索工单号/店铺名/甲方" clearable style="width:280px">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <div class="toolbar-actions">
          <el-button @click="exportKanbanExcel"><el-icon><Download /></el-icon>导出</el-button>
          <el-button @click="printKanban"><el-icon><Printer /></el-icon>打印</el-button>
          <el-button @click="showKanbanSettings = true"><el-icon><Setting /></el-icon>列设置</el-button>
        </div>
      </div>

      <div class="kanban-wrap">
        <KanbanColumn
          v-for="col in visibleKanbanCols" :key="col.key"
          :col="col"
          :items="col.items"
          :ad-types="elementOptions"
          :is-drag-over="dragOverCol === col.key"
          @card-dragstart="onDragStart"
          @dragover="onDragOverCol($event, col.key)"
          @dragleave="onDragLeaveCol($event, col.key)"
          @drop="onDropOnCol($event, col.key)"
        />
      </div>
    </div>

    <!-- List View -->
    <div v-else>
      <StatsPanel />
      <el-card class="filter-card">
        <div class="quick-filters">
          <el-button :type="quickFilter === 'all' ? 'primary' : ''" size="small" plain @click="applyQuickFilter('all')">全部</el-button>
          <el-button :type="quickFilter === 'timeout' ? 'danger' : ''" size="small" plain @click="applyQuickFilter('timeout')">
            <el-icon><Clock /></el-icon>超时
          </el-button>
          <el-button :type="quickFilter === 'unassigned' ? 'warning' : ''" size="small" plain @click="applyQuickFilter('unassigned')">
            未派单<el-badge v-if="unassignedCount" :value="unassignedCount" :max="99" style="margin-left:4px" />
          </el-button>
          <el-button :type="quickFilter === 'today' ? 'primary' : ''" size="small" plain @click="applyQuickFilter('today')">今日截止</el-button>
          <el-button :type="quickFilter === 'week' ? 'primary' : ''" size="small" plain @click="applyQuickFilter('week')">本周截止</el-button>
        </div>
        <el-form :inline="true" :model="filters">
          <el-form-item>
            <el-input v-model="filters.keyword" placeholder="搜索工单号/甲方/项目名" clearable style="width:240px">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-select v-model="filters.stage" placeholder="全部环节" clearable style="width:120px">
              <el-option v-for="s in stageOptions" :key="s.key" :label="s.label" :value="s.key" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="filters.status" placeholder="全部状态" clearable style="width:100px">
              <el-option label="正常" value="normal" />
              <el-option label="超时" value="timeout" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="filters.project_type" placeholder="全部元素" clearable style="width:120px">
              <el-option v-for="t in elementOptions" :key="t.value" :label="t.label" :value="t.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="filters.activity_name" placeholder="全部活动" clearable style="width:130px">
              <el-option v-for="a in activities" :key="a.value" :label="a.label" :value="a.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="filters.assigned_to" placeholder="全部负责人" clearable style="width:120px">
              <el-option v-for="u in userOptions" :key="u.id" :label="u.name" :value="u.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
              start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width:240px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadWorkOrders">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
            <el-button @click="exportExcel"><el-icon><Download /></el-icon>导出 Excel</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card>
        <el-table ref="tableRef" :data="sortedTableData" stripe v-loading="loading" @selection-change="handleSelectionChange" :row-class-name="getRowClassName">
          <el-table-column type="selection" width="40" />
          <el-table-column prop="work_order_no" label="工单号" width="160">
            <template #default="{ row }">
              <router-link :to="`/work-orders/${row.id}`" class="wo-link">{{ row.work_order_no }}</router-link>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="店铺名字" min-width="150" show-overflow-tooltip />
          <el-table-column label="地址" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ row.address || '-' }}</template>
          </el-table-column>
          <el-table-column label="元素" width="100">
            <template #default="{ row }">
              <el-tag size="small" effect="plain">{{ adTypeLabel(row.project_type) || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="当前环节" width="110">
            <template #default="{ row }">
              <el-tag size="small" :type="displayStageTagType(row)">{{ displayStageLabel(row) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="派单" width="100">
            <template #default="{ row }">
              <el-tag v-if="getDispatchType(row)" size="small" :type="getDispatchType(row).type">{{ getDispatchType(row).label }}</el-tag>
              <span v-else class="text-muted">已派</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag size="small" :type="row.is_timeout ? 'danger' : 'success'" effect="plain">
                {{ row.is_timeout ? '超时' : '正常' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="assigned_to" label="负责人" width="90" />
          <el-table-column prop="deadline" label="截止日期" width="110" sortable />
          <el-table-column label="操作" width="340" fixed="right">
            <template #default="{ row }">
              <div class="action-group">
                <router-link :to="`/work-orders/${row.id}`" class="action-link">
                  <el-icon><View /></el-icon>查看
                </router-link>
                <el-tooltip v-if="row.remarks?.length" :content="row.remarks[row.remarks.length - 1]?.content" placement="top">
                  <el-tag size="small" type="primary" effect="light" style="cursor:pointer;margin:0 2px">
                    <el-icon><ChatDotRound /></el-icon>
                  </el-tag>
                </el-tooltip>
                <el-button link type="primary" size="small" @click.stop="openRemarkDialog(row)">
                  <el-icon><ChatDotRound /></el-icon>备注
                </el-button>
                <el-button v-if="row.current_stage !== 'archive'" v-permission="'admin'" link type="danger" size="small" @click.stop="deleteWorkOrder(row)">
                  <el-icon><Delete /></el-icon>删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="selectedRows.length" class="batch-bar">
          <span>已选 {{ selectedRows.length }} 项</span>
          <el-button size="small" type="primary" @click="showBatchOps = true">批量操作</el-button>
          <el-button size="small" @click="clearSelection">取消选择</el-button>
        </div>

        <div class="pagination-wrap">
          <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
            :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next"
            @size-change="loadWorkOrders" @current-change="loadWorkOrders" />
        </div>
      </el-card>
    </div>

    <!-- Create Dialog -->
    <CreateDialog v-model="showCreate" :clients="clients" @done="loadWorkOrders" />

    <!-- Batch Ops Dialog -->
    <BatchOpsDialog v-model="showBatchOps" :count="selectedRows.length" :selections="selectedRows"
      :user-options="userOptions" @done="loadWorkOrders" />

    <!-- Kanban Settings Dialog -->
    <el-dialog v-model="showKanbanSettings" title="看板列设置" width="420px">
      <el-alert title="拖拽可调整列顺序，开关可显示/隐藏列" type="info" :closable="false" show-icon style="margin-bottom: 16px" />
      <draggable v-model="allKanbanCols" item-key="key" :animation="200" handle=".drag-handle">
        <template #item="{ element }">
          <div class="col-setting-row">
            <el-icon class="drag-handle"><Rank /></el-icon>
            <span>{{ element.label }}</span>
            <el-switch v-model="element.visible" active-text="显示" />
          </div>
        </template>
      </draggable>
      <template #footer>
        <el-button @click="showKanbanSettings = false">关闭</el-button>
        <el-button type="primary" @click="saveKanbanSettings">保存</el-button>
      </template>
    </el-dialog>

    <!-- Dialogs -->
    <WorkOrderDialogs
      :wo-id="currentWoId"
      :wo="currentWo"
      :dialog-type="dialogType"
      :user-options="userOptions"
      @close="closeDialog"
      @refresh="loadWorkOrders"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Download, Setting, Printer, View, Rank, Document, Delete, ChatDotRound, Clock } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import { exportWithTimestamp } from '../utils/export'
import { useAuthStore } from '../store/auth'
import api from '../api'
import { logger } from '../utils/logger'
import { STAGE_MAP } from '../utils/format'
import StatsPanel from '../components/StatsPanel.vue'
import BatchOpsDialog from '../components/BatchOpsDialog.vue'
import KanbanColumn from '../components/workorder/KanbanColumn.vue'
import CreateDialog from '../components/workorder/CreateDialog.vue'
import WorkOrderDialogs from '../components/workorder/WorkOrderDialogs.vue'
const router = useRouter()
const auth = useAuthStore()
const isAdmin = computed(() => auth.user?.role === 'admin')

// View state
const viewMode = ref('list')
const loading = ref(false)
const tableData = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const showCreate = ref(false)
const clients = ref([])
const userOptions = ref([])

// Filters
const filters = reactive({ keyword: '', stage: '', status: '', project_type: '', activity_name: '', assigned_to: '' })
const dateRange = ref(null)

// Quick filters
const quickFilter = ref('all')
function applyQuickFilter(type) {
  quickFilter.value = type
  Object.assign(filters, { keyword: '', stage: '', status: '', project_type: '', activity_name: '', assigned_to: '' })
  if (type === 'timeout') {
    filters.status = 'timeout'
    dateRange.value = null
  } else if (type === 'unassigned') {
    filters.status = ''
    dateRange.value = null
    // 未派单通过前端过滤
  } else if (type === 'today') {
    filters.status = ''
    const today = new Date().toISOString().slice(0, 10)
    dateRange.value = [today, today]
  } else if (type === 'week') {
    filters.status = ''
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    dateRange.value = [weekStart.toISOString().slice(0, 10), weekEnd.toISOString().slice(0, 10)]
  } else {
    dateRange.value = null
  }
  page.value = 1
  loadWorkOrders()
}

// Batch selection
const tableRef = ref(null)
const selectedRows = ref([])
const showBatchOps = ref(false)

// Kanban
const kanbanSearch = ref('')
const kanbanFilterStatus = ref('')

const KANBAN_COLUMNS = [
  { key: 'declaration', label: '申报接收' },
  { key: 'approval', label: '待审批' },
  { key: 'assignment', label: '待派单' },
  { key: 'measurement', label: '测量中' },
  { key: 'design', label: '设计中' },
  { key: 'production', label: '生产中' },
  { key: 'construction', label: '施工中' },
  { key: 'finance', label: '待财务' }
]

const stageOptions = [
  { key: 'declaration', label: '申报接收' },
  { key: 'assignment', label: '待派单' },
  { key: 'measurement', label: '测量中' },
  { key: 'design', label: '设计中' },
  { key: 'production', label: '生产中' },
  { key: 'construction', label: '施工中' },
  { key: 'finance', label: '费用' },
]

const allKanbanCols = ref(KANBAN_COLUMNS.map(c => ({ ...c, items: [], visible: true })))
const visibleKanbanCols = computed(() => allKanbanCols.value.filter(c => c.visible))

const showKanbanSettings = ref(false)

// Drag state
const dragData = ref(null)
const dragOverCol = ref(null)

const STAGE_ORDER = ['declaration', 'approval', 'assignment', 'measurement', 'design', 'production', 'construction', 'finance', 'archive']

// Dynamic data
const activities = ref([])
const elementOptions = ref([])

function stageLabel(s) { return STAGE_MAP[s] || s }

function displayStageLabel(row) {
  if (row.current_stage === 'measurement') {
    if (row.measurement?.status === 'measured' || row.status === 'measured') return '待审核'
    if (row.measurement?.status === 'rejected') return '驳回重测'
    return stageLabel('measurement')
  }
  return stageLabel(row.current_stage)
}

function displayStageTagType(row) {
  if (row.current_stage === 'measurement') {
    if (row.measurement?.status === 'measured' || row.status === 'measured') return 'success'
    if (row.measurement?.status === 'rejected') return 'danger'
    return 'warning'
  }
  const map = { declaration: '', assignment: 'info', measurement: 'warning', design: 'primary', production: 'success' }
  return map[row.current_stage] || 'info'
}

// 派单类型：返回 { label, type } 或 null
function getDispatchType(row) {
  const stage = row.current_stage
  if (stage === 'assignment' && !row.assigned_tenant_user_id) return { label: '待派测量', type: 'warning' }
  if ((stage === 'design' || stage === 'production') && !row.designer_id) return { label: '待派设计', type: 'primary' }
  if (stage === 'construction' && !row.constructor_id) return { label: '待派施工', type: 'success' }
  return null
}

// 判断是否未派单（用于筛选和排序）
function isUnassigned(row) {
  return !!getDispatchType(row)
}

// 未派单总数
const unassignedCount = computed(() => tableData.value.filter(isUnassigned).length)

// 排序后的数据：未派单置顶，内部按超时优先 + 截止日期
const sortedTableData = computed(() => {
  const sorted = [...tableData.value]
  const deadline = (wo) => wo.deadline ? new Date(wo.deadline).getTime() : Infinity
  sorted.sort((a, b) => {
    const aU = isUnassigned(a) ? 0 : 1
    const bU = isUnassigned(b) ? 0 : 1
    if (aU !== bU) return aU - bU
    if (a.is_timeout && !b.is_timeout) return -1
    if (!a.is_timeout && b.is_timeout) return 1
    return deadline(a) - deadline(b)
  })
  return sorted
})

function adTypeLabel(v) {
  const item = elementOptions.value.find(t => t.value === v)
  return item ? item.label : v || ''
}

function daysToDeadline(wo) {
  if (!wo.deadline) return Infinity
  return Math.ceil((new Date(wo.deadline) - new Date()) / (1000 * 60 * 60 * 24))
}

// Load functions
async function loadWorkOrders() {
  loading.value = true
  try {
    const params = { ...filters }
    // 列表视图的 status 筛选 'normal'/'timeout' 是前端概念，后端不识别
    if (params.status === 'normal' || params.status === 'timeout') {
      delete params.status
    }
    if (viewMode.value === 'kanban') {
      params.page = 1
      params.limit = 500
    } else {
      params.page = page.value
      params.limit = pageSize.value
    }
    if (dateRange.value) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    const res = await api.get('/work-orders', { params })
    let allList = Array.isArray(res.data) ? res.data : (res.data?.list || res.data?.data || [])
    allList = allList.filter(w => w.current_stage !== 'approval')

    // 列表视图的 status 前端过滤
    if (viewMode.value === 'list' && filters.status === 'timeout') {
      allList = allList.filter(w => w.is_timeout)
    } else if (viewMode.value === 'list' && filters.status === 'normal') {
      allList = allList.filter(w => !w.is_timeout)
    }

    // 快捷筛选"未派单"前端过滤：三种待派单都显示
    if (quickFilter.value === 'unassigned') {
      allList = allList.filter(isUnassigned)
    }

    if (viewMode.value !== 'kanban') {
      tableData.value = allList
      total.value = res.data?.total ?? allList.length
    } else {
      tableData.value = allList.slice(0, pageSize.value)
      total.value = allList.length
    }

    // Apply kanban filters
    if (kanbanSearch.value) {
      const kw = kanbanSearch.value.toLowerCase()
      allList = allList.filter(w => (w.work_order_no || '').toLowerCase().includes(kw) || (w.client_name || '').toLowerCase().includes(kw) || (w.title || '').toLowerCase().includes(kw))
    }
    if (kanbanFilterStatus.value === 'timeout') allList = allList.filter(w => w.is_timeout)
    else if (kanbanFilterStatus.value === 'expiring') allList = allList.filter(w => !w.is_timeout && daysToDeadline(w) <= 3 && daysToDeadline(w) > 0)
    else if (kanbanFilterStatus.value === 'normal') allList = allList.filter(w => !w.is_timeout)

    allKanbanCols.value.forEach(col => {
      const preserved = {}
      col.items?.forEach(wo => { preserved[wo.id] = wo._selected || false })
      col.items = allList.filter(w => w.current_stage === col.key).map(w => {
        const ddl = daysToDeadline(w)
        w._daysToDeadline = ddl
        w._deadlineLabel = ddl === Infinity ? (w.deadline || '无截止') : ddl < 0 ? `已超 ${Math.abs(ddl)} 天` : ddl === 0 ? '今天' : `${w.deadline} (${ddl}天)`
        w._deadlineClass = ddl < 0 ? 'deadline-overdue' : ddl <= 3 ? 'deadline-warning' : ''
        w._selected = preserved[w.id] || false
        return w
      }).sort((a, b) => {
        if (a.is_timeout && !b.is_timeout) return -1
        if (!a.is_timeout && b.is_timeout) return 1
        return daysToDeadline(a) - daysToDeadline(b)
      })
    })
  } catch (err) {
    logger.error('加载工单失败:', err)
    ElMessage.error('加载工单失败：' + (err.response?.data?.message || err.message))
    tableData.value = []
    total.value = 0
    allKanbanCols.value.forEach(col => { col.items = [] })
  } finally {
    loading.value = false
  }
}

async function loadSettings() {
  try {
    const res = await api.get('/tenant/settings')
    const settings = res.data || {}
    if (settings.activity_names?.length) activities.value = settings.activity_names
    if (settings.project_templates?.length) {
      activities.value = settings.project_templates
        .filter(tmpl => tmpl.enabled !== false)
        .map(tmpl => ({ label: tmpl.name, value: tmpl.id }))
    }
  } catch {}
}

async function loadElementOptions() {
  try {
    const res = await api.get('/work-orders/element-options')
    elementOptions.value = res.data || []
  } catch {}
}

async function loadUserOptions() {
  try {
    const res = await api.get('/tenants/users')
    const payload = res.data || {}
    userOptions.value = (Array.isArray(payload) ? payload : (payload.list || [])).filter(u => u.status === 'active')
  } catch (e) {
    logger.error('加载人员列表失败:', e)
  }
}

function loadKanbanSettings() {
  try {
    const saved = localStorage.getItem('kanban_col_settings')
    if (saved) {
      JSON.parse(saved).forEach(s => {
        const col = allKanbanCols.value.find(c => c.key === s.key)
        if (col) { col.visible = s.visible; col.collapsed = s.collapsed || false }
      })
    }
  } catch {}
}

function saveKanbanSettings() {
  localStorage.setItem('kanban_col_settings', JSON.stringify(allKanbanCols.value.map(c => ({ key: c.key, visible: c.visible, collapsed: c.collapsed }))))
  ElMessage.success('列设置已保存')
}

function resetFilters() {
  Object.assign(filters, { keyword: '', stage: '', status: '', project_type: '', activity_name: '', assigned_to: '' })
  dateRange.value = null
  quickFilter.value = 'all'
  loadWorkOrders()
}

function handleSelectionChange(rows) { selectedRows.value = rows }
function clearSelection() { tableRef.value?.clearSelection() }
function getRowClassName({ row }) {
  const dt = getDispatchType(row)
  if (dt) {
    if (dt.label === '待派测量') return 'row-dispatch-measure'
    if (dt.label === '待派设计') return 'row-dispatch-design'
    if (dt.label === '待派施工') return 'row-dispatch-install'
  }
  return row.is_timeout ? 'row-timeout' : ''
}

function closeDialog() { dialogType.value = '' }

// Dialogs
function openRemarkDialog(wo) { currentWoId.value = wo.id; currentWo.value = wo; dialogType.value = 'remark' }

// Drag and drop
function onDragStart(e, wo) { dragData.value = wo }
function onDragOverCol(e, colKey) { dragOverCol.value = colKey }
function onDragLeaveCol(e, colKey) { dragOverCol.value = null }

async function onDropOnCol(e, targetStage) {
  dragOverCol.value = null
  if (!dragData.value) return
  const wo = dragData.value
  dragData.value = null
  if (wo.current_stage === targetStage) return
  const fromIdx = STAGE_ORDER.indexOf(wo.current_stage)
  const toIdx = STAGE_ORDER.indexOf(targetStage)
  if (toIdx <= fromIdx) return ElMessage.warning('只能向后推进环节')
  if (Math.abs(toIdx - fromIdx) > 2) return ElMessage.warning('不能跨环节移动')
  try {
    await ElMessageBox.confirm(`将工单「${wo.work_order_no}」从 ${stageLabel(wo.current_stage)} 推进到 ${stageLabel(targetStage)}？`, '确认推进', { type: 'warning' })
  } catch { return }
  try {
    await api.put(`/work-orders/${wo.id}/stage`, { target_stage: targetStage })
    ElMessage.success(`已推进：${stageLabel(wo.current_stage)} → ${stageLabel(targetStage)}`)
    loadWorkOrders()
  } catch (err) { ElMessage.error(err.response?.data?.error || '推进失败') }
}

// Export
function exportExcel() {
  const data = viewMode.value === 'kanban' ? allKanbanCols.value.flatMap(c => c.items || []) : tableData.value
  if (!data.length) return ElMessage.warning('没有可导出的数据')
  exportWithTimestamp(data, [
    { key: 'work_order_no', label: '工单号' }, { key: 'title', label: '店铺名字' },
    { key: 'client_name', label: '甲方企业' }, { key: 'current_stage', label: '当前环节' },
    { key: 'assigned_to', label: '负责人' }, { key: 'deadline', label: '截止日期' },
  ], '工单列表')
  ElMessage.success(`已导出 ${data.length} 条数据`)
}

function exportKanbanExcel() {
  const allData = allKanbanCols.value.flatMap(c => c.items || [])
  if (!allData.length) return ElMessage.warning('没有可导出的数据')
  exportWithTimestamp(allData, [
    { key: 'work_order_no', label: '工单号' }, { key: 'title', label: '店铺名字' },
    { key: 'client_name', label: '甲方企业' }, { key: 'current_stage', label: '当前环节' },
    { key: 'assigned_to', label: '负责人' }, { key: 'deadline', label: '截止日期' },
  ], '看板工单')
  ElMessage.success(`已导出 ${allData.length} 条数据`)
}

function printKanban() { window.print() }

// CRUD
async function deleteWorkOrder(row) {
  try {
    await ElMessageBox.confirm(`确定删除工单「${row.work_order_no}」吗？`, '提示', { type: 'warning' })
    await api.delete(`/work-orders/${row.id}`)
    ElMessage.success('已删除')
    loadWorkOrders()
  } catch (err) {
    if (err !== 'cancel' && err !== 'close') {
      ElMessage.error(err.response?.data?.error || '删除失败')
    }
  }
}

// Auto refresh
let refreshTimer = null
function startAutoRefresh() { stopAutoRefresh(); refreshTimer = setInterval(() => loadWorkOrders(), 120000) }
function stopAutoRefresh() { if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null } }

onMounted(() => {
  loadSettings()
  loadElementOptions()
  loadKanbanSettings()
  loadUserOptions() // 筛选和编辑都需要
  // 并行加载核心数据
  Promise.all([
    loadWorkOrders(),
    api.get('/clients').then(res => { clients.value = res.data?.list ?? (Array.isArray(res.data) ? res.data : res.data?.data ?? []) }).catch(() => {}),
  ])
  startAutoRefresh()
})

onUnmounted(() => { stopAutoRefresh() })
</script>

<style scoped>
.page-header { margin-bottom: 24px; }
.page-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.filter-card { margin-bottom: 16px; }
.quick-filters { display: flex; gap: 8px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb; }
.kanban-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.toolbar-actions { display: flex; gap: 8px; }
.kanban-wrap { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 16px; }
.batch-bar { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #e6f7ff; border-radius: 4px; margin-bottom: 12px; font-size: 12px; }
.action-group { display: inline-flex; align-items: center; gap: 8px; }
.action-group .action-link { display: inline-flex; align-items: center; gap: 3px; font-size: 13px; color: #2563eb; text-decoration: none; padding: 2px 4px; border-radius: 4px; cursor: pointer; }
.action-group .action-link:hover { background: rgba(37, 99, 235, 0.08); }
.action-group :deep(.el-button) { font-size: 13px; padding: 2px 4px; height: auto; }
.col-setting-row { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 4px; margin-bottom: 4px; }
.col-setting-row:hover { background: #f5f5f5; }
.drag-handle { cursor: grab; color: #9ca3af; }
:deep(.el-pagination) { padding-top: 16px; }
.text-muted { color: #9ca3af; font-size: 12px; }
:deep(.el-table .row-timeout) { background-color: #fef2f2 !important; }
:deep(.el-table .row-timeout:hover td) { background-color: #fee2e2 !important; }
:deep(.el-table .row-dispatch-measure) { background-color: #fffbeb !important; border-left: 3px solid #f59e0b; }
:deep(.el-table .row-dispatch-measure:hover td) { background-color: #fef3c7 !important; }
:deep(.el-table .row-dispatch-design) { background-color: #eff6ff !important; border-left: 3px solid #2563eb; }
:deep(.el-table .row-dispatch-design:hover td) { background-color: #dbeafe !important; }
:deep(.el-table .row-dispatch-install) { background-color: #f5f3ff !important; border-left: 3px solid #7c3aed; }
:deep(.el-table .row-dispatch-install:hover td) { background-color: #ede9fe !important; }
@media print { .page-actions, .filter-card, .batch-bar { display: none !important; } }
</style>
