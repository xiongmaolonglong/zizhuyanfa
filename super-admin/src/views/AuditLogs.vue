<template>
  <div>
    <h1 class="page-title">审计日志</h1>

    <el-card>
      <template #header>
        <div class="filter-bar">
          <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" style="width: 240px" @change="loadData" />
          <el-select v-model="filters.action" placeholder="全部操作" clearable style="width: 140px" @change="loadData">
            <el-option label="创建" value="create" />
            <el-option label="更新" value="update" />
            <el-option label="删除" value="delete" />
            <el-option label="审批" value="approve" />
            <el-option label="驳回" value="reject" />
          </el-select>
          <el-select v-model="filters.tenantId" placeholder="全部租户" clearable style="width: 160px" @change="loadData">
            <el-option v-for="t in tenants" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
          <el-button type="primary" @click="loadData">查询</el-button>
        </div>
      </template>

      <el-table :data="list" stripe v-loading="loading">
        <el-table-column label="操作时间" width="170">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作人" width="120">
          <template #default="{ row }">{{ row.user_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="所属租户" width="150">
          <template #default="{ row }">{{ row.tenant_name || '系统' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="actionType(row.action)">{{ actionLabel(row.action) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="资源" width="120">
          <template #default="{ row }">{{ row.resource_type || '-' }}</template>
        </el-table-column>
        <el-table-column label="资源ID" width="100">
          <template #default="{ row }">{{ row.resource_id || '-' }}</template>
        </el-table-column>
        <el-table-column label="详情" min-width="300">
          <template #default="{ row }">
            <span class="detail-text">{{ row.detail || '-' }}</span>
          </template>
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
import { getAuditLogs } from '../api/audit'
import { getTenantList } from '../api/tenants'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const tenants = ref([])

const filters = reactive({ page: 1, limit: 20, dateRange: null, action: '', tenantId: '' })

const actionMap = { create: '创建', update: '更新', delete: '删除', approve: '审批', reject: '驳回' }
const actionTypeMap = { create: 'success', update: '', delete: 'danger', approve: 'primary', reject: 'warning' }
function actionLabel(a) { return actionMap[a] || a }
function actionType(a) { return actionTypeMap[a] || '' }
function formatDate(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }

async function loadData() {
  loading.value = true
  try {
    const params = { page: filters.page, limit: filters.limit, action: filters.action, tenant_id: filters.tenantId }
    if (filters.dateRange?.length === 2) {
      params.start_date = filters.dateRange[0].toISOString().split('T')[0]
      params.end_date = filters.dateRange[1].toISOString().split('T')[0]
    }
    const res = await getAuditLogs(params)
    const items = res.data?.list || res.data || []
    list.value = items
    total.value = res.data?.total || items.length
  } catch (err) {
    console.error('Load audit logs failed:', err)
    list.value = []
  } finally {
    loading.value = false
  }
}

function onPageChange(page) {
  filters.page = page
  loadData()
}

onMounted(async () => {
  loadData()
  try {
    const res = await getTenantList({ limit: 200 })
    tenants.value = res.data?.list || res.data || []
  } catch { /* ignore */ }
})
</script>

<style scoped>
.page-title { font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 20px; }
.filter-bar { display: flex; gap: 12px; align-items: center; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.detail-text { font-size: 13px; color: #606266; }
</style>
