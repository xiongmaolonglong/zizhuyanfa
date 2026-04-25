<template>
  <div>
    <h1 class="page-title">申报总览</h1>

    <div class="stat-grid">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-value">{{ stats.total || 0 }}</div>
        <div class="stat-label">申报总数</div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-value primary">{{ stats.declaration || 0 }}</div>
        <div class="stat-label">申报中</div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-value warning">{{ stats.approval || 0 }}</div>
        <div class="stat-label">审批中</div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-value success">{{ stats.archive || 0 }}</div>
        <div class="stat-label">已归档</div>
      </el-card>
    </div>

    <el-card class="mt-16">
      <template #header>
        <div class="filter-bar">
          <el-input v-model="filters.keyword" placeholder="搜索工单号 / 项目名" clearable style="width: 220px" @clear="loadData" @keyup.enter="loadData" />
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 140px" @change="loadData">
            <el-option label="待接收" value="submitted" />
            <el-option label="申报中" value="declaration" />
            <el-option label="审批中" value="approval" />
            <el-option label="生产中" value="production" />
            <el-option label="施工中" value="construction" />
            <el-option label="已归档" value="archive" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
          <el-button type="primary" @click="loadData">查询</el-button>
        </div>
      </template>

      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="work_order_no" label="工单号" width="140" />
        <el-table-column prop="title" label="项目名称" min-width="200" />
        <el-table-column label="所属租户" width="150">
          <template #default="{ row }">{{ row.tenant_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="阶段" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :style="{ color: stageColor(row), background: stageBg(row), border: 'none' }">
              {{ stageLabel(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row)">
              {{ statusLabel(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申报时间" width="160">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          layout="total, prev, pager, next"
          :total="total"
          :page-size="filters.limit"
          :current-page="filters.page"
          @current-change="onPageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getDeclarations } from '../api/declarations'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const stats = reactive({ total: 0, declaration: 0, approval: 0, archive: 0 })

const filters = reactive({ page: 1, limit: 15, keyword: '', status: '' })

const stageMap = {
  submitted: '待接收', declaration: '申报中', approval: '审批中',
  assignment: '待派单', measurement: '测量中', design: '设计中',
  production: '生产中', construction: '施工中', inspection: '验收中',
  finance: '费用结算', archive: '已归档', rejected: '已驳回'
}
const stageColors = {
  submitted: '#F59E0B', declaration: '#4F46E5', approval: '#F59E0B',
  assignment: '#4F46E5', measurement: '#4F46E5', design: '#4F46E5',
  production: '#8B5CF6', construction: '#4F46E5', inspection: '#10B981',
  finance: '#F59E0B', archive: '#909399', rejected: '#F56C6C'
}
const stageBgs = {
  submitted: '#FEF3C7', declaration: '#C7D2FE', approval: '#FEF3C7',
  assignment: '#C7D2FE', measurement: '#C7D2FE', design: '#C7D2FE',
  production: '#EDE9FE', construction: '#C7D2FE', inspection: '#D1FAE5',
  finance: '#FEF3C7', archive: '#F3F4F6', rejected: '#FEE2E2'
}

function stageLabel(r) { return stageMap[r.current_stage] || r.current_stage }
function stageColor(r) { return stageColors[r.current_stage] || '#4F46E5' }
function stageBg(r) { return stageBgs[r.current_stage] || '#C7D2FE' }
function statusLabel(r) { return r.work_order?.status === 'rejected' ? '已驳回' : stageLabel(r) }
function statusType(r) {
  const s = r.work_order?.status
  if (s === 'rejected') return 'danger'
  if (['archive', 'inspection'].includes(r.current_stage)) return 'success'
  if (['approval', 'finance'].includes(r.current_stage)) return 'warning'
  return 'primary'
}
function formatDate(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }

async function loadData() {
  loading.value = true
  try {
    const res = await getDeclarations({ page: filters.page, limit: filters.limit })
    const items = res.data?.list || res.data || []
    list.value = items
    total.value = res.data?.total || items.length
    // 粗略统计
    stats.total = res.data?.total || total.value
    stats.declaration = items.filter(i => i.current_stage === 'declaration').length
    stats.approval = items.filter(i => i.current_stage === 'approval').length
    stats.archive = items.filter(i => i.current_stage === 'archive').length
  } catch (err) {
    console.error('Load declarations failed:', err)
    list.value = []
  } finally {
    loading.value = false
  }
}

function onPageChange(page) {
  filters.page = page
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
.page-title { font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 20px; }
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-card { text-align: center; padding: 20px 0; }
.stat-value { font-size: 32px; font-weight: 700; color: #1a1a1a; }
.stat-value.primary { color: #722ed1; }
.stat-value.warning { color: #e6a23c; }
.stat-value.success { color: #67c23a; }
.stat-label { margin-top: 4px; color: #8c8c8c; font-size: 14px; }
.mt-16 { margin-top: 16px; }
.filter-bar { display: flex; gap: 12px; align-items: center; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
