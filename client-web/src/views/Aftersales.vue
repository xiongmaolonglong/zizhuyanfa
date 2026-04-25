<template>
  <div>
    <div class="page-header flex-between">
      <div>
        <h1 class="page-title">售后服务</h1>
        <p class="page-desc">查看和管理售后申请记录</p>
      </div>
      <el-button type="primary" @click="router.push('/aftersales/new')">+ 新建售后</el-button>
    </div>

    <!-- 筛选 -->
    <div class="filters mb-16">
      <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width: 130px" @change="loadData">
        <el-option label="待处理" value="pending" />
        <el-option label="处理中" value="processing" />
        <el-option label="已解决" value="resolved" />
        <el-option label="已关闭" value="closed" />
      </el-select>
    </div>

    <!-- 列表 -->
    <el-card v-loading="loading">
      <el-table :data="list" stripe>
        <el-table-column label="工单号" width="160">
          <template #default="{ row }">
            <router-link :to="`/my-work-orders/${row.work_order_id}`" class="link">{{ row.workOrder?.work_order_no || '-' }}</router-link>
          </template>
        </el-table-column>
        <el-table-column prop="workOrder.title" label="项目名称" min-width="160" />
        <el-table-column prop="description" label="问题描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="评分" width="80" align="center">
          <template #default="{ row }">
            <span v-if="row.rating">{{ '★'.repeat(row.rating) }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="提交时间" width="160" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !list.length" description="暂无售后记录" />

      <div class="pagination-wrap" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAftersales } from '../api/aftersales'

const router = useRouter()
const loading = ref(false)
const list = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const filterStatus = ref('')

const statusMap = { pending: '待处理', processing: '处理中', resolved: '已解决', closed: '已关闭' }
function statusText(s) { return statusMap[s] || s }
function statusType(s) {
  const map = { pending: 'warning', processing: '', resolved: 'success', closed: 'info' }
  return map[s] || 'info'
}

async function loadData() {
  loading.value = true
  try {
    const params = { page: page.value, limit: pageSize.value }
    if (filterStatus.value) params.status = filterStatus.value
    const res = await getAftersales(params)
    list.value = res.data || []
    total.value = res.pagination?.total || 0
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function viewDetail(row) {
  router.push(`/my-work-orders/${row.work_order_id}`)
}

onMounted(loadData)
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.page-title { font-size: 20px; font-weight: 600; color: #1a1a1a; }
.page-desc { color: #909399; font-size: 14px; margin-top: 4px; }
.page-header { margin-bottom: 16px; }
.filters { display: flex; gap: 8px; }
.mb-16 { margin-bottom: 16px; }
.link { color: #67c23a; text-decoration: none; font-family: monospace; }
.text-muted { color: #909399; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
