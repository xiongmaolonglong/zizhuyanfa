<template>
  <div>
    <div class="page-header flex-between">
      <h1 class="page-title">审核中心</h1>
      <div class="page-actions">
        <el-button @click="loadData" :loading="loading">
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
        <el-button :type="viewMode === 'list' ? '' : 'primary'" @click="viewMode = viewMode === 'kanban' ? 'list' : 'kanban'">
          {{ viewMode === 'kanban' ? '列表视图' : '看板视图' }}
        </el-button>
      </div>
    </div>

    <!-- Kanban View -->
    <div v-if="viewMode === 'kanban'">
      <StatsPanel />
      <div class="kanban-wrap">
        <!-- 测量审核列 -->
        <div class="kanban-col">
          <div class="kanban-header">
            <span class="col-title">测量审核</span>
            <span class="col-count">{{ measurements.length }}</span>
          </div>
          <div class="kanban-body">
            <div v-for="item in measurements" :key="item.work_order_id" class="kanban-card-wrap"
              @click="$router.push(`/audit/${item.work_order_id}`)">
              <el-card shadow="hover" class="kanban-card">
                <div class="card-tags">
                  <el-tag size="small" type="success" effect="plain">测量</el-tag>
                </div>
                <div class="card-title">{{ item.title }}</div>
                <div class="card-meta">
                  <span>测量员: {{ item.measurer_name || '—' }}</span>
                </div>
                <div class="card-meta">
                  <span>面积: {{ calcArea(item) }}m²</span>
                  <span>截止: {{ item.deadline || '—' }}</span>
                </div>
                <div class="card-actions">
                  <el-button link type="success" size="small" @click.stop="approveMeasurement(item)">通过</el-button>
                  <el-button link type="danger" size="small" @click.stop="openRejectDialog(item, 'measurement')">驳回</el-button>
                </div>
              </el-card>
            </div>
            <el-empty v-if="!measurements.length" :image-size="40" description="暂无待审核测量" />
          </div>
        </div>

        <!-- 设计审核列 -->
        <div class="kanban-col">
          <div class="kanban-header">
            <span class="col-title">设计审核</span>
            <span class="col-count">{{ designs.length }}</span>
          </div>
          <div class="kanban-body">
            <div v-for="item in designs" :key="item.work_order_id" class="kanban-card-wrap"
              @click="$router.push(`/audit/${item.work_order_id}`)">
              <el-card shadow="hover" class="kanban-card">
                <div class="card-tags">
                  <el-tag size="small" type="primary" effect="plain">设计</el-tag>
                  <el-tag v-if="item.project_type" size="small" effect="plain">{{ projectTypeLabel(item.project_type) }}</el-tag>
                  <el-tag size="small" type="info">v{{ item.version }}</el-tag>
                </div>
                <div class="card-title">{{ item.title }}</div>
                <div class="card-meta">
                  <span>设计师: {{ item.designer_name || '—' }}</span>
                </div>
                <div class="card-meta">
                  <span>提交: {{ item.submitted_at?.slice(0, 16) || '—' }}</span>
                </div>
                <div class="card-actions">
                  <el-button link type="success" size="small" @click.stop="approveDesign(item)">通过</el-button>
                  <el-button link type="danger" size="small" @click.stop="openRejectDialog(item, 'design')">驳回</el-button>
                </div>
              </el-card>
            </div>
            <el-empty v-if="!designs.length" :image-size="40" description="暂无待审核设计" />
          </div>
        </div>

        <!-- 施工验收列 -->
        <div class="kanban-col">
          <div class="kanban-header">
            <span class="col-title">施工验收</span>
            <span class="col-count">{{ internalVerifications.length }}</span>
          </div>
          <div class="kanban-body">
            <div v-for="item in internalVerifications" :key="item.work_order_id" class="kanban-card-wrap"
              @click="$router.push(`/audit/${item.work_order_id}`)">
              <el-card shadow="hover" class="kanban-card">
                <div class="card-tags">
                  <el-tag size="small" type="warning" effect="plain">施工验收</el-tag>
                </div>
                <div class="card-title">{{ item.title }}</div>
                <div class="card-meta">
                  <span>施工员: {{ item.constructor_name || '—' }}</span>
                </div>
                <div class="card-meta">
                  <span>完工: {{ item.constructed_at || '—' }}</span>
                </div>
                <div class="card-actions">
                  <el-button link type="success" size="small" @click.stop="internalVerify(item, true)">通过</el-button>
                  <el-button link type="danger" size="small" @click.stop="openRejectDialog(item, 'construction')">退回</el-button>
                </div>
              </el-card>
            </div>
            <el-empty v-if="!internalVerifications.length" :image-size="40" description="暂无待验收施工" />
          </div>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else>
      <StatsPanel />

      <!-- Filter Bar -->
      <el-card class="filter-card">
        <el-form :inline="true">
          <el-form-item>
            <el-input v-model="keyword" placeholder="搜索工单号/店铺名" clearable style="width:220px">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-select v-model="filterType" placeholder="全部类型" clearable style="width:120px">
              <el-option label="测量" value="measurement" />
              <el-option label="设计" value="design" />
              <el-option label="施工验收" value="construction" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadData">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- Table -->
      <el-card>
        <el-table :data="filteredTableData" stripe v-loading="loading">
          <el-table-column label="类型" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="row._type === 'measurement' ? 'success' : row._type === 'design' ? 'primary' : 'warning'" effect="plain">
                {{ row._type === 'measurement' ? '测量' : row._type === 'design' ? '设计' : '施工验收' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="工单号" width="160">
            <template #default="{ row }">
              <router-link :to="`/audit/${row.work_order_id}`" class="wo-link">{{ row.work_order_no }}</router-link>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="店铺名字" min-width="150" show-overflow-tooltip />
          <el-table-column label="元素" width="100">
            <template #default="{ row }">{{ projectTypeLabel(row.project_type) }}</template>
          </el-table-column>
          <el-table-column label="负责人" width="100">
            <template #default="{ row }">{{ row.measurer_name || row.designer_name || row.constructor_name || '—' }}</template>
          </el-table-column>
          <el-table-column label="截止/提交" width="120">
            <template #default="{ row }">
              {{ row.deadline || row.submitted_at?.slice(0, 16) || row.constructed_at || '—' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="260" fixed="right">
            <template #default="{ row }">
              <div class="action-group">
                <router-link :to="`/audit/${row.work_order_id}`" class="action-link">
                  <el-icon><View /></el-icon>查看
                </router-link>
                <template v-if="row._type === 'measurement'">
                  <el-button link type="success" size="small" @click="approveMeasurement(row)">
                    <el-icon><Check /></el-icon>通过
                  </el-button>
                  <el-button link type="danger" size="small" @click="openRejectDialog(row, 'measurement')">驳回</el-button>
                </template>
                <template v-else-if="row._type === 'design'">
                  <el-button link type="success" size="small" @click="approveDesign(row)">
                    <el-icon><Check /></el-icon>通过
                  </el-button>
                  <el-button link type="danger" size="small" @click="openRejectDialog(row, 'design')">驳回</el-button>
                </template>
                <template v-else-if="row._type === 'construction'">
                  <el-button link type="success" size="small" @click="internalVerify(row, true)">
                    <el-icon><Check /></el-icon>通过
                  </el-button>
                  <el-button link type="danger" size="small" @click="openRejectDialog(row, 'construction')">退回</el-button>
                </template>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrap">
          <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
            :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" />
        </div>
      </el-card>
    </div>

    <!-- 驳回对话框 -->
    <el-dialog v-model="showRejectDialog" :title="rejectTitle" width="480px">
      <el-descriptions :column="1" border class="mb-16">
        <el-descriptions-item label="工单号">{{ rejectRow?.work_order_no }}</el-descriptions-item>
        <el-descriptions-item label="店铺名字">{{ rejectRow?.title }}</el-descriptions-item>
      </el-descriptions>
      <el-form>
        <el-form-item label="驳回原因" required>
          <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请详细说明驳回原因及修改要求" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmReject" :loading="submitting">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh, Search, View, Check } from '@element-plus/icons-vue'
import { useNotificationStore } from '../store/notification'
import StatsPanel from '../components/StatsPanel.vue'
import api from '../api'
import { useElementOptions } from '../composables/useElementOptions'

const router = useRouter()
const notif = useNotificationStore()

const viewMode = ref('list')
const loading = ref(false)
const submitting = ref(false)

// Filters
const keyword = ref('')
const filterType = ref('')

// Data
const measurements = computed(() => notif.measurements)
const designs = computed(() => notif.designs)
const internalVerifications = computed(() => notif.internalVerifications)

// Table data (flattened)
const page = ref(1)
const pageSize = ref(20)

const allTableData = computed(() => {
  const data = []
  for (const m of measurements.value) {
    data.push({ ...m, _type: 'measurement' })
  }
  for (const d of designs.value) {
    data.push({ ...d, _type: 'design' })
  }
  for (const c of internalVerifications.value) {
    data.push({ ...c, _type: 'construction' })
  }
  // Sort by time descending
  return data.sort((a, b) => {
    const ta = a.deadline || a.submitted_at || a.constructed_at || ''
    const tb = b.deadline || b.submitted_at || b.constructed_at || ''
    return tb.localeCompare(ta)
  })
})

const filteredTableData = computed(() => {
  let data = allTableData.value
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    data = data.filter(item =>
      (item.work_order_no || '').toLowerCase().includes(kw) ||
      (item.title || '').toLowerCase().includes(kw)
    )
  }
  if (filterType.value) {
    data = data.filter(item => item._type === filterType.value)
  }
  const start = (page.value - 1) * pageSize.value
  return data.slice(start, start + pageSize.value)
})

const total = computed(() => {
  let data = allTableData.value
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    data = data.filter(item =>
      (item.work_order_no || '').toLowerCase().includes(kw) ||
      (item.title || '').toLowerCase().includes(kw)
    )
  }
  if (filterType.value) {
    data = data.filter(item => item._type === filterType.value)
  }
  return data.length
})

function resetFilters() {
  keyword.value = ''
  filterType.value = ''
  page.value = 1
}

// Area calculation
function calcArea(row) {
  const m = row.measurement
  if (!m?.materials) return '0.00'
  const materials = typeof m.materials === 'string' ? JSON.parse(m.materials) : m.materials
  if (!Array.isArray(materials)) return '0.00'
  let total = 0
  for (const mat of materials) {
    for (const face of (mat.faces || [])) {
      const storedArea = Number(face.area) || 0
      if (storedArea > 0) total += storedArea
    }
  }
  return total.toFixed(2)
}

async function loadData() {
  loading.value = true
  try {
    await notif.fetchAll()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '加载失败')
  } finally {
    loading.value = false
  }
}

// Approve measurement
async function approveMeasurement(row) {
  submitting.value = true
  try {
    await api.post(`/measurements/${row.work_order_id}/review`, { action: 'approve' })
    ElMessage.success('审核通过')
    await loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  } finally {
    submitting.value = false
  }
}

// Approve design
async function approveDesign(row) {
  submitting.value = true
  try {
    await api.post(`/designs/${row.work_order_id}/review`, { action: 'approve' })
    ElMessage.success('审核通过')
    await loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  } finally {
    submitting.value = false
  }
}

// Internal verify
async function internalVerify(row, verified) {
  submitting.value = true
  try {
    await api.post(`/construction/${row.work_order_id}/internal-verify`, { verified, notes: '' })
    ElMessage.success(verified ? '验收通过' : '已退回')
    await loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  } finally {
    submitting.value = false
  }
}

// Reject
const showRejectDialog = ref(false)
const rejectReason = ref('')
const rejectRow = ref(null)
const rejectType = ref('')

const REJECT_TITLE_MAP = {
  measurement: '驳回测量数据',
  design: '驳回设计稿',
  construction: '退回施工',
}
const rejectTitle = computed(() => REJECT_TITLE_MAP[rejectType.value] || '驳回')

function openRejectDialog(row, type) {
  rejectRow.value = row
  rejectType.value = type
  rejectReason.value = ''
  showRejectDialog.value = true
}

async function confirmReject() {
  if (!rejectReason.value.trim()) return ElMessage.warning('请填写驳回原因')
  submitting.value = true
  try {
    if (rejectType.value === 'measurement') {
      await api.post(`/measurements/${rejectRow.value.work_order_id}/review`, {
        action: 'reject', reason: rejectReason.value.trim(),
      })
    } else if (rejectType.value === 'design') {
      await api.post(`/designs/${rejectRow.value.work_order_id}/review`, {
        action: 'reject', comment: rejectReason.value.trim(),
      })
    } else if (rejectType.value === 'construction') {
      await api.post(`/construction/${rejectRow.value.work_order_id}/internal-verify`, {
        verified: false, notes: rejectReason.value.trim(),
      })
    }
    ElMessage.success('已驳回')
    showRejectDialog.value = false
    await loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  } finally {
    submitting.value = false
  }
}

const { labelOf: projectTypeLabel, load: loadElementOptions } = useElementOptions()

onMounted(() => { loadElementOptions(); loadData() })
</script>

<style scoped>
.page-header { margin-bottom: var(--space-6); }
.page-actions { display: flex; gap: var(--space-2); }
.filter-card { margin-bottom: var(--space-4); }
.wo-link { color: var(--color-primary); text-decoration: none; }
.wo-link:hover { text-decoration: underline; }
.mb-16 { margin-bottom: var(--space-4); }

.action-group { display: inline-flex; align-items: center; gap: 8px; flex-wrap: nowrap; white-space: nowrap; }
.action-group .action-link {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 13px; color: var(--color-primary);
  text-decoration: none; padding: 2px 4px;
  border-radius: 4px; transition: all 0.2s; cursor: pointer;
}
.action-group .action-link:hover { background: rgba(37, 99, 235, 0.08); text-decoration: none; }
.action-group .action-link .el-icon { font-size: 14px; }
.action-group :deep(.el-button) { font-size: 13px; padding: 2px 4px; height: auto; line-height: 1.5; }
.action-group :deep(.el-button .el-icon) { margin-right: 2px; font-size: 14px; }

/* Kanban */
.kanban-wrap { display: flex; gap: var(--space-3); overflow-x: auto; padding-bottom: var(--space-4); }
.kanban-col {
  min-width: 280px; flex: 1;
  border-radius: var(--radius-base);
  overflow: hidden;
  background: var(--color-bg-page);
  border: 1px solid var(--color-border-light);
}
.kanban-header {
  padding: var(--space-3) var(--space-4);
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 2px solid var(--color-border-base);
}
.col-title { font-weight: var(--font-weight-semibold); font-size: var(--font-size-sm); color: var(--color-text-secondary); }
.col-count {
  background: var(--color-border-light); color: var(--color-text-tertiary);
  font-size: var(--font-size-xs); padding: 2px var(--space-2);
  border-radius: 10px; font-weight: var(--font-weight-semibold);
}
.kanban-body { padding: var(--space-2); min-height: 200px; }
.kanban-card-wrap { margin-bottom: var(--space-2); cursor: pointer; }
.kanban-card { border: 1px solid var(--color-border-light); transition: box-shadow 0.2s; }
.kanban-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.kanban-card :deep(.el-card__body) { padding: var(--space-3); }
.card-tags { display: flex; gap: var(--space-1); margin-bottom: var(--space-2); flex-wrap: wrap; }
.card-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); margin-bottom: var(--space-1); }
.card-meta { font-size: var(--font-size-xs); color: var(--color-text-tertiary); display: flex; justify-content: space-between; margin-bottom: 2px; }
.card-actions { display: flex; gap: 4px; margin-top: 8px; }
.card-actions :deep(.el-button) { padding: 0 4px; font-size: 12px; }
</style>
