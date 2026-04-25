<template>
  <div>
    <div class="page-header flex-between">
      <h1 class="page-title">售后管理</h1>
      <div>
        <el-button @click="fetchList" :icon="Refresh" circle title="刷新" />
      </div>
    </div>

    <!-- 统计 -->
    <el-row :gutter="16" class="mb-20">
      <el-col :span="6" v-for="stat in statsCards" :key="stat.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-body">
            <div class="stat-number" :style="{ color: stat.color }">{{ stat.count }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选 -->
    <el-card class="mb-20">
      <el-form :inline="true">
        <el-form-item>
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width:120px" @change="fetchList">
            <el-option v-for="(label, val) in STATUS_MAP" :key="val" :label="label" :value="val" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="filters.keyword" placeholder="搜索工单号/项目/问题" clearable style="width:220px" @change="fetchList" />
        </el-form-item>
        <el-form-item>
          <el-button @click="fetchList">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表 -->
    <el-card>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="workOrder.work_order_no" label="工单号" width="160">
          <template #default="{ row }">
            <router-link :to="`/work-orders/${row.work_order_id}`" class="wo-link">{{ row.workOrder?.work_order_no }}</router-link>
          </template>
        </el-table-column>
        <el-table-column label="店铺名字" width="150">
          <template #default="{ row }">{{ row.workOrder?.title }}</template>
        </el-table-column>
        <el-table-column label="问题描述" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ row.description }}</template>
        </el-table-column>
        <el-table-column label="提交人" width="100">
          <template #default="{ row }">{{ row.clientRequester?.real_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="提交日期" width="110">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><el-tag size="small" :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
            <el-button v-if="row.status === 'pending' || row.status === 'processing'" size="small" type="primary" @click="handleAftersale(row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>

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

    <!-- 处理对话框 -->
    <el-dialog v-model="showHandleDialog" title="处理售后" width="520px">
      <el-descriptions :column="1" border class="mb-16">
        <el-descriptions-item label="工单号">{{ currentAftersale.workOrder?.work_order_no }}</el-descriptions-item>
        <el-descriptions-item label="问题">{{ currentAftersale.description }}</el-descriptions-item>
      </el-descriptions>
      <el-form label-width="80px">
        <el-form-item label="处理结果" required>
          <el-select v-model="handleStatus" style="width:100%">
            <el-option label="处理中" value="processing" />
            <el-option label="已解决" value="resolved" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input v-model="handleNotes" type="textarea" :rows="3" placeholder="填写处理详情" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showHandleDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmHandle" :loading="submitting">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { formatDate } from '../utils/format'
import api from '../api'

const router = useRouter()
const list = ref([])
const loading = ref(false)
const submitting = ref(false)

const pagination = reactive({ page: 1, pageSize: 20, total: 0 })
const filters = reactive({ status: '', keyword: '' })
const statsCards = reactive([])

const STATUS_MAP = {
  pending: '待处理', processing: '处理中', resolved: '已解决', closed: '已关闭',
}
function statusLabel(s) { return STATUS_MAP[s] || s }
function statusType(s) {
  const map = { pending: 'warning', processing: 'primary', resolved: 'success', closed: 'info' }
  return map[s] || ''
}

async function fetchList() {
  loading.value = true
  try {
    const params = { ...filters, page: pagination.page, limit: pagination.pageSize }
    const res = await api.get('/aftersales', { params })
    const payload = res.data || {}
    list.value = payload.list || payload || []
    pagination.total = payload.total || 0
    // 统计
    const counts = { pending: 0, processing: 0, resolved: 0, closed: 0 }
    list.value.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++ })
    statsCards.length = 0
    statsCards.push(
      { label: '待处理', count: counts.pending, color: '#e6a23c' },
      { label: '处理中', count: counts.processing, color: '#409eff' },
      { label: '已解决', count: counts.resolved, color: '#67c23a' },
      { label: '已关闭', count: counts.closed, color: '#909399' },
    )
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '加载失败')
    list.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

function viewDetail(row) {
  router.push(`/aftersale/${row.id}`)
}

// 处理售后
const showHandleDialog = ref(false)
const currentAftersale = ref({ workOrder: {} })
const handleStatus = ref('processing')
const handleNotes = ref('')

function handleAftersale(row) {
  currentAftersale.value = row
  handleStatus.value = 'processing'
  handleNotes.value = ''
  showHandleDialog.value = true
}

async function confirmHandle() {
  submitting.value = true
  try {
    await api.post(`/aftersales/${currentAftersale.value.id}/handle`, {
      status: handleStatus.value,
      notes: handleNotes.value,
    })
    ElMessage.success('售后已处理')
    showHandleDialog.value = false
    await fetchList()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '处理失败')
  } finally {
    submitting.value = false
  }
}

onMounted(fetchList)
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.mb-16 { margin-bottom: var(--space-4); }
.mb-20 { margin-bottom: var(--space-5); }
.stat-card .stat-body { text-align: center; padding: var(--space-2) 0; }
.stat-number { font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); }
.stat-label { color: var(--color-text-tertiary); font-size: var(--font-size-sm); margin-top: var(--space-1); }
.pagination-box { display: flex; justify-content: flex-end; margin-top: var(--space-4); }
.wo-link { color: var(--color-primary); text-decoration: none; }
.wo-link:hover { text-decoration: underline; }
</style>
