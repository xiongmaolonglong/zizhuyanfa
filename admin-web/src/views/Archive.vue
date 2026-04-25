<template>
  <div>
    <div class="page-header flex-between">
      <h1 class="page-title">归档管理</h1>
      <div>
        <el-button @click="exportArchive"><el-icon><Download /></el-icon>导出</el-button>
        <el-button @click="fetchList" :icon="Refresh" circle title="刷新" />
      </div>
    </div>

    <!-- 统计 -->
    <el-row :gutter="16" class="mb-20">
      <el-col :span="8" v-for="stat in statsCards" :key="stat.label">
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
          <el-input v-model="filters.keyword" placeholder="搜索归档编号/工单号/项目名" clearable style="width:280px" @change="fetchList" />
        </el-form-item>
        <el-form-item>
          <el-button @click="fetchList">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表 -->
    <el-card>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="archive_no" label="归档编号" width="190" />
        <el-table-column prop="workOrder.work_order_no" label="工单号" width="160">
          <template #default="{ row }">
            <router-link :to="`/work-orders/${row.work_order_id}`" class="wo-link">{{ row.workOrder?.work_order_no }}</router-link>
          </template>
        </el-table-column>
        <el-table-column label="店铺名字" min-width="150">
          <template #default="{ row }">{{ row.workOrder?.title }}</template>
        </el-table-column>
        <el-table-column label="文件数" width="100">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ countFiles(row.file_urls) }} 个</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="archived_at" label="归档日期" width="120" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
            <el-button size="small" type="primary" @click="exportArchive(row)">导出</el-button>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh, Download } from '@element-plus/icons-vue'
import api from '../api'
import { exportWithTimestamp } from '../utils/export'

const router = useRouter()
const list = ref([])
const loading = ref(false)

const pagination = reactive({ page: 1, pageSize: 20, total: 0 })
const filters = reactive({ keyword: '' })

// 统计
const statsCards = reactive([])

async function fetchList() {
  loading.value = true
  try {
    const params = { ...filters, page: pagination.page, limit: pagination.pageSize }
    const res = await api.get('/archives', { params })
    const payload = res.data || {}
    list.value = payload.list || payload || []
    pagination.total = payload.total || 0
    // 统计
    const today = new Date().toISOString().split('T')[0]
    const thisMonth = today.slice(0, 7)
    const thisWeekCount = list.value.filter(r => r.archived_at && r.archived_at >= thisMonth).length
    statsCards.length = 0
    statsCards.push(
      { label: '总归档', count: pagination.total, color: '#2563eb' },
      { label: '本月归档', count: thisWeekCount, color: '#16a34a' },
      { label: '文件总数', count: list.value.reduce((s, r) => s + countFiles(r.file_urls), 0), color: '#ea580c' },
    )
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '加载失败')
    list.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

function exportArchive() {
  if (!list.value.length) return ElMessage.warning('没有可导出的数据')
  exportWithTimestamp(list.value, [
    { key: 'work_order_no', label: '工单号', map: row => row.workOrder?.work_order_no || '-' },
    { key: 'title', label: '项目名称', map: row => row.workOrder?.title || '-' },
    { key: 'archived_at', label: '归档时间' },
    { key: 'archived_by', label: '归档人', map: row => row.archiver?.name || '-' },
    { key: 'file_count', label: '文件数', map: row => countFiles(row.file_urls) },
    { key: 'remark', label: '备注' },
  ], '归档管理')
  ElMessage.success(`已导出 ${list.value.length} 条数据`)
}

function countFiles(files) {
  if (!files) return 0
  return files.reduce((sum, f) => sum + (f.urls ? f.urls.length : 1), 0)
}

function viewDetail(row) {
  router.push(`/archive/${row.work_order_id}`)
}

onMounted(fetchList)
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.mb-20 { margin-bottom: var(--space-5); }
.stat-card .stat-body { text-align: center; padding: var(--space-2) 0; }
.stat-number { font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); }
.stat-label { color: var(--color-text-tertiary); font-size: var(--font-size-sm); margin-top: var(--space-1); }
.pagination-box { display: flex; justify-content: flex-end; margin-top: var(--space-4); }
.wo-link { color: var(--color-primary); text-decoration: none; }
.wo-link:hover { text-decoration: underline; }
</style>
