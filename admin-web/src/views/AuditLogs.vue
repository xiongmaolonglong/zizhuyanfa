<template>
  <div>
    <div class="page-header flex-between">
      <div>
        <h1 class="page-title">操作日志</h1>
        <p class="page-desc">查看系统操作记录</p>
      </div>
      <div class="toolbar">
        <el-button @click="loadLogs" :loading="logLoading"><el-icon><Refresh /></el-icon>刷新</el-button>
        <el-button @click="exportLogs"><el-icon><Download /></el-icon>导出</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="mb-20">
      <el-col :span="6" v-for="stat in logStats" :key="stat.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value" :style="{ color: stat.color }">{{ stat.count }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选 -->
    <el-card class="mb-20">
      <el-form :inline="true">
        <el-form-item>
          <el-input v-model="logKeyword" placeholder="搜索工单号/操作人/内容" clearable style="width:240px" @change="loadLogs" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="logFilterAction" placeholder="全部操作" clearable style="width:120px" @change="loadLogs">
            <el-option label="创建" value="create" />
            <el-option label="编辑" value="update" />
            <el-option label="删除" value="delete" />
            <el-option label="派单" value="assign" />
            <el-option label="环节推进" value="advance" />
            <el-option label="审核" value="review" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-date-picker v-model="logDateRange" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width:220px" @change="loadLogs" />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 日志列表 -->
    <el-card v-loading="logLoading">
      <el-table :data="logList" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="工单号" width="160">
          <template #default="{ row }"><router-link :to="`/work-orders/${row.work_order_id}`" class="wo-link">{{ row.work_order_no || '-' }}</router-link></template>
        </el-table-column>
        <el-table-column label="操作人" width="100">
          <template #default="{ row }">{{ row.operator_name || row.created_by || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作类型" width="110">
          <template #default="{ row }"><el-tag :type="logActionTagType(row.action)" size="small">{{ logActionLabel(row.action) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作内容" min-width="300">
          <template #default="{ row }"><span class="log-content">{{ row.content }}</span></template>
        </el-table-column>
        <el-table-column label="时间" width="160">
          <template #default="{ row }">{{ row.created_at }}</template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap" v-if="logTotal > logPageSize">
        <el-pagination v-model:current-page="logPage" v-model:page-size="logPageSize" :total="logTotal" :page-sizes="[20, 50, 100]" layout="total, sizes, prev, pager, next" @size-change="loadLogs" @current-change="loadLogs" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Download } from '@element-plus/icons-vue'
import api from '../api'
import { exportWithTimestamp } from '../utils/export'

const logLoading = ref(false)
const logList = ref([])
const logPage = ref(1)
const logPageSize = ref(50)
const logTotal = ref(0)
const logKeyword = ref('')
const logFilterAction = ref('')
const logDateRange = ref(null)

const logActionMap = {
  create: '创建', update: '编辑', delete: '删除', assign: '派单',
  advance: '环节推进', remark: '备注', review: '审核', confirm: '确认',
}
function logActionLabel(a) { return logActionMap[a] || a || '-' }

function logActionTagType(a) {
  const map = { create: 'success', update: '', delete: 'danger', assign: 'warning', advance: 'primary', remark: 'info', review: 'success', confirm: 'success' }
  return map[a] || ''
}

const logStats = computed(() => [
  { label: '总操作数', count: logTotal.value, color: '#2563eb' },
  { label: '今日操作', count: logList.value.filter(l => l.created_at?.startsWith(new Date().toISOString().split('T')[0])).length, color: '#16a34a' },
  { label: '删除操作', count: logList.value.filter(l => l.action === 'delete').length, color: '#dc2626' },
  { label: '派单操作', count: logList.value.filter(l => l.action === 'assign').length, color: '#ea580c' },
])

async function loadLogs() {
  logLoading.value = true
  try {
    const params = { page: logPage.value, limit: logPageSize.value }
    if (logKeyword.value) params.keyword = logKeyword.value
    if (logFilterAction.value) params.action = logFilterAction.value
    if (logDateRange.value) { params.start_date = logDateRange.value[0]; params.end_date = logDateRange.value[1] }
    try {
      const logRes = await api.get('/admin/logs', { params })
      const logPayload = logRes.data || {}
      logList.value = logPayload.list || logPayload || []
      logTotal.value = logPayload.total || 0
    } catch { logList.value = []; logTotal.value = 0 }
  } catch { logList.value = []; logTotal.value = 0 }
  finally { logLoading.value = false }
}

function exportLogs() {
  if (!logList.value.length) return ElMessage.warning('没有可导出的数据')
  exportWithTimestamp(logList.value, [
    { key: 'work_order_no', label: '工单号' },
    { key: 'action', label: '操作类型', map: row => logActionLabel(row.action) },
    { key: 'content', label: '操作内容' },
    { key: 'operator_name', label: '操作人' },
    { key: 'created_at', label: '操作时间' },
  ], '操作日志')
  ElMessage.success(`已导出 ${logList.value.length} 条日志`)
}

onMounted(loadLogs)
</script>

<style scoped>
.page-desc { color: var(--color-text-tertiary); font-size: var(--font-size-sm); margin-top: var(--space-1); }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.mb-20 { margin-bottom: var(--space-5); }
.toolbar { display: flex; align-items: center; gap: var(--space-2); }
.stat-card { text-align: center; padding: var(--space-4) 0; }
.stat-value { font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); }
.stat-label { color: var(--color-text-tertiary); font-size: var(--font-size-xs); margin-top: var(--space-1); }
.log-content { white-space: pre-wrap; word-break: break-all; font-size: var(--font-size-xs); }
.pagination-wrap { display: flex; justify-content: flex-end; padding-top: var(--space-4); }
</style>
