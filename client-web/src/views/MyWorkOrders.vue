<template>
  <div>
    <div class="page-header flex-between">
      <h1 class="page-title">我的工单</h1>
      <div class="page-actions">
        <el-input v-model="keyword" placeholder="搜索工单号/项目名" clearable style="width:220px" @change="loadWorkOrders">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="filterStage" placeholder="全部环节" clearable style="width:120px" @change="loadWorkOrders">
          <el-option v-for="s in stageOptions" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
      </div>
    </div>

    <!-- 工单列表 -->
    <el-card v-loading="loading">
      <div v-if="list.length" class="wo-list">
        <div v-for="wo in list" :key="wo.id" class="wo-card" @click="$router.push(`/my-work-orders/${wo.id}`)">
          <div class="wo-header">
            <span class="wo-no">{{ wo.work_order_no }}</span>
            <el-tag :type="stageTagType(wo.current_stage)" size="small">{{ stageLabel(wo.current_stage, wo) }}</el-tag>
          </div>
          <h3 class="wo-title">{{ wo.title }}</h3>
          <p class="wo-address" v-if="wo.address">{{ wo.address }}</p>
          <!-- 进度条 -->
          <div class="wo-progress">
            <el-progress :percentage="woProgress(wo)" :stroke-width="8" :color="progressColor(wo)" />
          </div>
          <div class="wo-meta">
            <span class="text-muted">甲方：{{ wo.client_name }}</span>
            <span class="text-muted">截止：{{ wo.deadline || '未设置' }}</span>
            <span v-if="wo.is_timeout" class="text-danger">已超时</span>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无工单" />

      <div class="pagination-wrap" v-if="total > pageSize">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
          :total="total" layout="total, prev, pager, next"
          @current-change="loadWorkOrders" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import api from '../api'

const loading = ref(false)
const list = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const keyword = ref('')
const filterStage = ref('')

const stageOptions = [
  { value: 'declaration', label: '申报接收' },
  { value: 'approval', label: '审批中' },
  { value: 'assignment', label: '待派单' },
  { value: 'measurement', label: '测量中' },
  { value: 'design', label: '设计中' },
  { value: 'production', label: '生产中' },
  { value: 'construction', label: '施工中' },
  { value: 'finance', label: '费用结算' },
  { value: 'archive', label: '已归档' },
]

const stageMap = {
  declaration: '申报接收', approval: '审批中', assignment: '待派单',
  measurement: '测量中', design: '设计中', production: '生产中',
  construction: '施工中', finance: '费用结算', archive: '已归档', aftersale: '售后'
}
function stageLabel(s, wo) {
  if (s === 'measurement' && wo?.measurement?.status === 'measured') return '测量待审核'
  return stageMap[s] || s
}
function stageTagType(s) {
  const map = { declaration: 'info', approval: 'warning', assignment: '', measurement: 'warning', design: 'primary', production: 'success', construction: 'success', finance: 'danger', archive: 'info' }
  return map[s] || ''
}

const PROGRESS_MAP = {
  declaration: 5, approval: 15, assignment: 25, measurement: 35,
  design: 50, production: 65, construction: 80, finance: 90, archive: 100
}
function woProgress(wo) { return PROGRESS_MAP[wo.current_stage] || 0 }
function progressColor(wo) {
  if (wo.is_timeout) return '#f5222d'
  const p = woProgress(wo)
  if (p >= 80) return '#52c41a'
  if (p >= 50) return '#1890ff'
  return '#faad14'
}

async function loadWorkOrders() {
  loading.value = true
  try {
    const params = { page: page.value, limit: pageSize.value }
    if (keyword.value) params.keyword = keyword.value
    if (filterStage.value) params.stage = filterStage.value
    const res = await api.get('/declarations', { params })
    const data = res.data || []
    // declarations 包含了工单信息，用这个来展示
    const orders = data.map(d => d.work_order).filter(Boolean)
    list.value = orders
    total.value = res.pagination?.total || orders.length
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => loadWorkOrders())
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.page-actions { display: flex; gap: 8px; }

.wo-list { display: flex; flex-direction: column; gap: 12px; }
.wo-card {
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.wo-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64,158,255,0.15);
}

.wo-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.wo-no { font-family: monospace; font-size: 13px; color: #909399; }
.wo-title { font-size: 16px; font-weight: 600; margin: 0 0 4px 0; color: #303133; }
.wo-address { font-size: 13px; color: #909399; margin: 0 0 12px 0; }
.wo-progress { margin-bottom: 8px; }
.wo-meta { display: flex; gap: 16px; font-size: 12px; }

.text-muted { color: #909399; }
.text-danger { color: #f56c6c; }
</style>
