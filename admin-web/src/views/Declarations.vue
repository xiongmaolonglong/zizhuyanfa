<template>
  <div>
    <div class="page-header flex-between">
      <div>
        <h1 class="page-title">申报接收</h1>
        <p class="page-desc">接收甲方企业提交的申报工单</p>
      </div>
      <div>
        <el-button @click="fetchList" :icon="Refresh" circle title="刷新" />
        <el-button type="primary" :disabled="!selectedRows.length" @click="batchReceive">
          批量接收（{{ selectedRows.length }}）
        </el-button>
      </div>
    </div>

    <!-- 统计 -->
    <el-row :gutter="16" class="mb-20">
      <el-col :span="6" v-for="stat in statCards" :key="stat.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-body">
            <div class="stat-number" :style="{ color: stat.color }">{{ stat.count }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选 -->
    <el-card class="filter-card mb-20">
      <el-form :inline="true" :model="filters">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 140px" @change="fetchList">
            <el-option label="全部" value="" />
            <el-option label="待接收" value="submitted" />
            <el-option label="甲方审批中" value="approval" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filters.projectType" placeholder="全部" clearable style="width: 120px" @change="fetchList">
            <el-option v-for="opt in elementOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="工单号/项目名/甲方" clearable style="width: 200px" @keyup.enter="fetchList" @clear="fetchList">
            <template #suffix><el-button text @click="fetchList"><el-icon><Search /></el-icon></el-button></template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表 -->
    <el-card>
      <el-table :data="list" stripe v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" :selectable="(row) => canReceive(row)" />
        <el-table-column label="工单号" width="160">
          <template #default="{ row }">
            <router-link :to="`/work-orders/${row.work_order?.id}`" class="wo-link">{{ row.work_order?.work_order_no || '—' }}</router-link>
          </template>
        </el-table-column>
        <el-table-column label="项目名" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.work_order?.title || '—' }}</template>
        </el-table-column>
        <el-table-column label="甲方企业" width="140">
          <template #default="{ row }">{{ row.work_order?.client?.name || '—' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="130">
          <template #default="{ row }">
            <el-tag v-if="row.work_order?.current_stage === 'approval' && row.work_order?.status === 'submitted'" type="warning" size="small" effect="plain">
              <el-icon class="tag-icon"><Clock /></el-icon>
              甲方审批中
            </el-tag>
            <el-tag v-else-if="row.work_order?.status === 'approved'" type="success" size="small" effect="plain">
              <el-icon class="tag-icon"><Check /></el-icon>
              审批已通过
            </el-tag>
            <el-tag v-else-if="row.work_order?.status === 'rejected'" type="danger" size="small" effect="plain">已驳回</el-tag>
            <el-tag v-else type="info" size="small" effect="plain">待接收</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template #default="{ row }">{{ projectTypeText(row.project_type) }}</template>
        </el-table-column>
        <el-table-column label="需求摘要" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.work_order?.description || '—' }}</template>
        </el-table-column>
        <el-table-column label="申报时间" width="180">
          <template #default="{ row }">{{ formatDate(row.work_order?.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <template v-if="canReceive(row)">
              <el-button type="primary" size="small" :loading="receiving[row.id]" @click="openReceiveDialog(row)">接收</el-button>
              <el-button type="danger" size="small" @click="openRejectDialog(row)">驳回</el-button>
              <el-button size="small" @click="openDetail(row)">详情</el-button>
            </template>
            <span v-else class="action-hint">
              <el-button size="small" @click="openDetail(row)">查看</el-button>
            </span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !list.length" description="暂无申报记录" />

      <!-- 分页 -->
      <div class="pagination-box">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="fetchList"
          @size-change="fetchList"
        />
      </div>
    </el-card>

    <!-- 申报详情抽屉 -->
    <el-drawer v-model="detailVisible" title="申报详情" size="600px">
      <template v-if="detailData.work_order">
        <!-- 基本信息 -->
        <el-descriptions :column="2" border>
          <el-descriptions-item label="工单号">{{ detailData.work_order.work_order_no }}</el-descriptions-item>
          <el-descriptions-item label="项目类型">{{ projectTypeText(detailData.project_type) }}</el-descriptions-item>
          <el-descriptions-item label="项目名" :span="2">{{ detailData.work_order.title }}</el-descriptions-item>
          <el-descriptions-item label="甲方企业">{{ detailData.work_order.client?.name || '—' }}</el-descriptions-item>
          <el-descriptions-item label="申报人">{{ detailData.creator?.name || '—' }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ detailData.contact_name || '—' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ detailData.contact_phone || '—' }}</el-descriptions-item>
          <el-descriptions-item label="申报时间" :span="2">{{ formatDate(detailData.work_order.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag v-if="detailData.work_order.current_stage === 'approval' && detailData.work_order.status === 'submitted'" type="warning" size="small">甲方审批中</el-tag>
            <el-tag v-else-if="detailData.work_order.status === 'approved'" type="success" size="small">审批已通过</el-tag>
            <el-tag v-else-if="detailData.work_order.status === 'rejected'" type="danger" size="small">已驳回</el-tag>
            <el-tag v-else type="info" size="small">待接收</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审批状态">
            <el-tag v-if="detailData.work_order?.approval?.[0]?.status === 'pending'" type="warning" size="small">待审批</el-tag>
            <el-tag v-else-if="detailData.work_order?.approval?.[0]?.status === 'approved'" type="success" size="small">已通过</el-tag>
            <el-tag v-else-if="detailData.work_order?.approval?.[0]?.status === 'rejected'" type="danger" size="small">已驳回</el-tag>
            <el-tag v-else type="info" size="small">无需审批</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 需求描述 -->
        <div v-if="detailData.work_order.description" class="detail-section">
          <h4 class="detail-title">需求描述</h4>
          <p class="detail-text">{{ detailData.work_order.description }}</p>
        </div>

        <!-- 地址信息 -->
        <div v-if="detailData.detail_address" class="detail-section">
          <h4 class="detail-title">项目地址</h4>
          <p class="detail-text">{{ detailData.detail_address }}</p>
        </div>

        <!-- 现场照片 -->
        <div v-if="detailData.photos && detailData.photos.length" class="detail-section">
          <h4 class="detail-title">现场照片（{{ detailData.photos.length }}）</h4>
          <div class="photo-grid">
            <el-image
              v-for="(photo, idx) in detailData.photos"
              :key="idx"
              :src="photo"
              :preview-src-list="detailData.photos"
              :initial-index="idx"
              fit="cover"
              class="photo-item"
            />
          </div>
        </div>

        <!-- 附件 -->
        <div v-if="detailData.attachments && detailData.attachments.length" class="detail-section">
          <h4 class="detail-title">附件（{{ detailData.attachments.length }}）</h4>
          <div class="attachment-list">
            <el-link v-for="(att, idx) in detailData.attachments" :key="idx" :href="att" target="_blank" type="primary">
              {{ getFileName(att) }}
            </el-link>
          </div>
        </div>
      </template>
    </el-drawer>

    <!-- 接收确认对话框 -->
    <el-dialog v-model="receiveDialogVisible" title="确认接收申报" width="500px">
      <div v-if="receiveData.work_order" class="receive-summary">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="工单号">{{ receiveData.work_order.work_order_no }}</el-descriptions-item>
          <el-descriptions-item label="项目名">{{ receiveData.work_order.title }}</el-descriptions-item>
          <el-descriptions-item label="甲方企业">{{ receiveData.work_order.client?.name || '—' }}</el-descriptions-item>
          <el-descriptions-item label="项目类型">{{ projectTypeText(receiveData.project_type) }}</el-descriptions-item>
          <el-descriptions-item label="地址">{{ receiveData.detail_address || '—' }}</el-descriptions-item>
        </el-descriptions>
        <p class="receive-hint">接收后，工单将流转到 <strong>派单测量</strong> 环节。</p>
      </div>
      <template #footer>
        <el-button @click="receiveDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="receiving[receiveData.id]" @click="confirmReceive">确认接收</el-button>
      </template>
    </el-dialog>

    <!-- 驳回对话框 -->
    <el-dialog v-model="rejectDialogVisible" title="驳回申报" width="500px">
      <el-form label-width="80px">
        <el-form-item label="工单号">
          <span>{{ rejectData.work_order?.work_order_no }}</span>
        </el-form-item>
        <el-form-item label="驳回原因" required>
          <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请输入驳回原因，甲方将看到此信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="rejectLoading" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search, Check, Clock } from '@element-plus/icons-vue'
import { useElementOptions } from '../composables/useElementOptions'
import { useDeclarationSSE } from '../composables/useDeclarationSSE'
import { useNotificationStore } from '../store/notification'
import api from '../api'

const notif = useNotificationStore()
import { tenantRejectDeclaration } from '../api/declarations'

const list = ref([])
const loading = ref(false)
const receiving = ref({})
const selectedRows = ref([])
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })
const statCards = reactive([])

// 筛选
const filters = reactive({ status: '', projectType: '', keyword: '' })

function resetFilters() {
  filters.status = ''
  filters.projectType = ''
  filters.keyword = ''
  fetchList()
}

// 详情
const detailVisible = ref(false)
const detailData = ref({})

function openDetail(row) {
  detailData.value = row
  detailVisible.value = true
}

function getFileName(url) {
  if (!url) return '附件'
  return url.split('/').pop() || '附件'
}

// 接收确认
const receiveDialogVisible = ref(false)
const receiveData = ref({})

function openReceiveDialog(row) {
  receiveData.value = row
  receiveDialogVisible.value = true
}

async function confirmReceive() {
  receiving.value[receiveData.value.id] = true
  try {
    await api.post(`/tenant/declarations/${receiveData.value.id}/receive`)
    ElMessage.success(`已接收工单 ${receiveData.value.work_order?.work_order_no}`)
    receiveDialogVisible.value = false
    await fetchList()
    notif.fetchAll()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '接收失败')
  } finally {
    receiving.value[receiveData.value.id] = false
  }
}

// 驳回
const rejectDialogVisible = ref(false)
const rejectData = ref({})
const rejectReason = ref('')
const rejectLoading = ref(false)

function openRejectDialog(row) {
  rejectData.value = row
  rejectReason.value = ''
  rejectDialogVisible.value = true
}

async function confirmReject() {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请输入驳回原因')
    return
  }
  rejectLoading.value = true
  try {
    await tenantRejectDeclaration(rejectData.value.id, { comment: rejectReason.value })
    ElMessage.success(`已驳回工单 ${rejectData.value.work_order?.work_order_no}`)
    rejectDialogVisible.value = false
    await fetchList()
    notif.fetchAll()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '驳回失败')
  } finally {
    rejectLoading.value = false
  }
}

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

function canReceive(row) {
  const stageOk = row.work_order?.current_stage !== 'approval' || row.work_order?.status === 'approved'
  return stageOk && row.work_order?.status !== 'rejected' && !row.received_at
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
}

const { options: elementOptions, load: loadElementOptions, labelOf: projectTypeText } = useElementOptions()

function isPendingApproval(row) {
  return row.work_order?.current_stage === 'approval' && row.work_order?.status === 'submitted'
}

async function fetchList() {
  loading.value = true
  try {
    const params = { page: pagination.page, limit: pagination.pageSize }
    if (filters.status) params.status = filters.status
    if (filters.projectType) params.project_type = filters.projectType
    if (filters.keyword) params.keyword = filters.keyword
    const res = await api.get('/tenant/declarations', { params })
    const rows = res.data || []
    list.value = Array.isArray(rows) ? rows : []
    pagination.total = res.pagination?.total || list.value.length
    // 统计
    statCards.length = 0
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    statCards.push(
      { label: '待接收', count: list.value.filter(r => canReceive(r)).length, color: '#e6a23c' },
      { label: '审批中', count: list.value.filter(isPendingApproval).length, color: '#f59e0b' },
      { label: '今日申报', count: list.value.filter(r => {
        if (!r.work_order?.created_at) return false
        const d = new Date(r.work_order.created_at)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === todayStr
      }).length, color: '#2563eb' },
      { label: '甲方企业', count: [...new Set(list.value.map(r => r.work_order?.client?.id).filter(Boolean))].length, color: '#16a34a' },
    )
  } catch {
    list.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

async function batchReceive() {
  if (!selectedRows.value.length) return
  const selectable = selectedRows.value.filter(canReceive)
  if (!selectable.length) {
    ElMessage.warning('所选申报中没有可接收的项')
    return
  }
  try {
    await ElMessageBox.confirm(`确认批量接收 ${selectable.length} 个工单？`, '提示', { type: 'warning' })
  } catch {
    return
  }
  try {
    let successCount = 0
    for (const row of selectable) {
      try {
        await api.post(`/tenant/declarations/${row.id}/receive`)
        successCount++
      } catch (e) {
        ElMessage.error(`工单 ${row.work_order?.work_order_no || row.id} 接收失败：${e.response?.data?.error || e.message}`)
      }
    }
    if (successCount > 0) ElMessage.success(`${successCount} 个工单已接收`)
    selectedRows.value = []
    await fetchList()
    notif.fetchAll()
  } catch (e) {
    ElMessage.error('批量接收失败')
  }
}

onMounted(() => {
  loadElementOptions()
  fetchList()

  // SSE: auto-refresh on declaration events
  const { connect } = useDeclarationSSE((event) => {
    // 任何申报相关事件都触发列表刷新
    fetchList()
  })
  connect()
})
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.page-header { margin-bottom: var(--space-6); }
.page-desc { color: var(--color-text-tertiary); font-size: var(--font-size-sm); margin-top: var(--space-1); }
.mb-20 { margin-bottom: var(--space-5); }
.stat-card .stat-body { text-align: center; padding: var(--space-2) 0; }
.stat-number { font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); }
.stat-label { color: var(--color-text-tertiary); font-size: var(--font-size-sm); margin-top: var(--space-1); }
.pagination-box { display: flex; justify-content: flex-end; margin-top: var(--space-4); }
.wo-link { color: var(--color-primary); text-decoration: none; }
.wo-link:hover { text-decoration: underline; }
.tag-icon { margin-right: 4px; vertical-align: -2px; }
.action-hint { color: var(--color-text-tertiary); font-size: var(--font-size-sm); }

.filter-card :deep(.el-form-item) { margin-bottom: 0; }

.receive-summary { margin-top: 8px; }
.receive-hint { margin-top: 16px; color: var(--color-text-secondary); font-size: var(--font-size-sm); text-align: center; }

.detail-section { margin-top: 20px; }
.detail-title { font-size: 15px; font-weight: 600; margin-bottom: 8px; color: var(--color-text-primary); }
.detail-text { color: var(--color-text-regular); font-size: 14px; line-height: 1.6; white-space: pre-wrap; }

.photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.photo-item { width: 100%; height: 120px; border-radius: 6px; cursor: pointer; }

.attachment-list { display: flex; flex-direction: column; gap: 8px; }
</style>
