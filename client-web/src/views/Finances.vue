<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">支付跟踪</h1>
      <p class="page-desc">查看工单报价和付款状态</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="mb-16">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">工单总数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value" style="color:#e6a23c">{{ stats.quoted }}</div>
          <div class="stat-label">已报价</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value" style="color:#67c23a">{{ stats.paid }}</div>
          <div class="stat-label">已付款</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value" style="color:#909399">{{ stats.invoiced }}</div>
          <div class="stat-label">已开票</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 列表 -->
    <el-card v-loading="loading">
      <template #header><span>付款记录</span></template>
      <el-table :data="list" stripe>
        <el-table-column label="工单号" width="160">
          <template #default="{ row }">
            <router-link :to="`/my-work-orders/${row.work_order_id}`" class="link">{{ row.workOrder?.work_order_no || '-' }}</router-link>
          </template>
        </el-table-column>
        <el-table-column prop="workOrder.title" label="项目名称" min-width="160" />
        <el-table-column label="预算总额" width="120" align="right">
          <template #default="{ row }">¥{{ formatAmount(row.budget_total) }}</template>
        </el-table-column>
        <el-table-column label="报价金额" width="120" align="right">
          <template #default="{ row }">¥{{ formatAmount(row.quote_amount) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发票号" width="120">
          <template #default="{ row }">{{ row.invoice_number || '-' }}</template>
        </el-table-column>
        <el-table-column prop="quote_notes" label="备注" min-width="150" show-overflow-tooltip />
      </el-table>
      <el-empty v-if="!loading && !list.length" description="暂无付款记录" />

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
import { getFinance } from '../api/finance'

const loading = ref(false)
const list = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const stats = ref({ total: 0, quoted: 0, paid: 0, invoiced: 0 })

const statusMap = { quoting: '报价中', quoted: '已报价', paid: '已付款', invoiced: '已开票' }
function statusText(s) { return statusMap[s] || s }
function statusType(s) {
  const map = { quoting: 'info', quoted: 'warning', paid: 'success', invoiced: '' }
  return map[s] || 'info'
}
function formatAmount(v) { return v ? Number(v).toFixed(2) : '0.00' }

async function loadData() {
  loading.value = true
  try {
    const params = { page: page.value, limit: pageSize.value }
    const res = await getFinance(params)
    list.value = res.data || []
    total.value = res.pagination?.total || 0

    // 统计
    const all = res.data || []
    stats.value = {
      total: all.length,
      quoted: all.filter(f => f.status === 'quoted').length,
      paid: all.filter(f => f.status === 'paid').length,
      invoiced: all.filter(f => f.status === 'invoiced').length,
    }
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.page-title { font-size: 20px; font-weight: 600; color: #1a1a1a; }
.page-desc { color: #909399; font-size: 14px; margin-top: 4px; }
.page-header { margin-bottom: 16px; }
.mb-16 { margin-bottom: 16px; }
.stat-card { text-align: center; padding: 16px 0; }
.stat-value { font-size: 28px; font-weight: 700; color: #409eff; }
.stat-label { margin-top: 4px; color: #909399; font-size: 13px; }
.link { color: #67c23a; text-decoration: none; font-family: monospace; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
