<template>
  <div>
    <div class="page-header flex-between">
      <h1 class="page-title">费用管理</h1>
      <div style="display:flex;gap:8px">
        <el-button @click="exportFinance"><el-icon><Download /></el-icon>导出</el-button>
        <el-button type="primary" @click="showStats = !showStats">
          {{ showStats ? '隐藏统计' : '费用统计' }}
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div v-if="showStats" class="stats-row mb-20">
      <el-card>
        <template #header>报价总额</template>
        <div class="stat-value">{{ formatMoney(stats.totalQuote) }}</div>
      </el-card>
      <el-card>
        <template #header>已结清</template>
        <div class="stat-value success">{{ formatMoney(stats.totalPaid) }}</div>
      </el-card>
      <el-card>
        <template #header>未结清</template>
        <div class="stat-value warning">{{ formatMoney(stats.totalPending) }}</div>
      </el-card>
      <el-card>
        <template #header>月度趋势</template>
        <v-chart :option="chartOption" style="height:200px" autoresize />
      </el-card>
    </div>

    <!-- 筛选 -->
    <el-card class="mb-20">
      <el-form :inline="true">
        <el-form-item>
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width:120px" @change="fetchList">
            <el-option label="报价中" value="quoted" />
            <el-option label="已结清" value="paid" />
            <el-option label="已开票" value="invoiced" />
            <el-option label="结算完成" value="settlement_complete" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="filters.keyword" placeholder="搜索工单号" clearable style="width:200px" @change="fetchList" />
        </el-form-item>
        <el-form-item>
          <el-button @click="fetchList">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 费用列表 -->
    <el-card>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="workOrder.work_order_no" label="工单号" width="160">
          <template #default="{ row }">
            <router-link :to="`/work-orders/${row.work_order_id}`" class="wo-link">{{ row.workOrder?.work_order_no }}</router-link>
          </template>
        </el-table-column>
        <el-table-column label="店铺名字" min-width="150">
          <template #default="{ row }">{{ row.workOrder?.title }}</template>
        </el-table-column>
        <el-table-column label="报价" width="120">
          <template #default="{ row }">{{ formatMoney(row.quote_amount) }}</template>
        </el-table-column>
        <el-table-column label="已用" width="140">
          <template #default="{ row }">
            <div>
              {{ formatMoney(row.budget_used) }}
              <el-progress :percentage="budgetPercent(row)" :stroke-width="4"
                :color="budgetColor(row)" style="margin-top:4px" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="剩余" width="120">
          <template #default="{ row }">
            <span :class="{ 'text-danger': (row.budget_remaining || (row.quote_amount - row.budget_used)) < 0 }">
              {{ formatMoney(row.budget_remaining || (row.quote_amount - row.budget_used)) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><el-tag size="small">{{ statusLabel(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="openQuoteDialog(row)">报价</el-button>
            <el-button size="small" @click="openInvoiceDialog(row)">发票</el-button>
            <el-button size="small" @click="openSettlementDialog(row)">结算</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !list.length" description="暂无费用记录" />
    </el-card>

    <!-- 报价对话框 -->
    <el-dialog v-model="showQuoteDialog" title="编辑报价" width="520px">
      <el-form :model="quoteForm" label-width="80px">
        <el-form-item label="工单"><span class="wo-link">{{ quoteForm.work_order_no }}</span></el-form-item>
        <el-form-item label="报价金额" prop="total_amount">
          <el-input-number v-model="quoteForm.total_amount" :min="0" :precision="2"
            controls-position="right" style="width:100%" />
        </el-form-item>
        <el-form-item label="报价备注">
          <el-input v-model="quoteForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showQuoteDialog = false">取消</el-button>
        <el-button type="primary" @click="submitQuote" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- 发票对话框 -->
    <el-dialog v-model="showInvoiceDialog" title="开票记录" width="480px">
      <el-form :model="invoiceForm" label-width="80px">
        <el-form-item label="发票号">
          <el-input v-model="invoiceForm.invoice_number" placeholder="请输入发票号" />
        </el-form-item>
        <el-form-item label="发票金额">
          <el-input-number v-model="invoiceForm.amount" :min="0" :precision="2"
            controls-position="right" style="width:100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="invoiceForm.status" style="width:100%">
            <el-option label="已开票" value="invoiced" />
            <el-option label="未开票" value="not_invoiced" />
            <el-option label="已寄出" value="sent" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showInvoiceDialog = false">取消</el-button>
        <el-button type="primary" @click="submitInvoice" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- 结算对话框 -->
    <el-dialog v-model="showSettlementDialog" title="结算审批" width="520px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="工单">{{ settlementData.work_order_no }}</el-descriptions-item>
        <el-descriptions-item label="报价">{{ formatMoney(settlementData.quote_amount) }}</el-descriptions-item>
        <el-descriptions-item label="已用">{{ formatMoney(settlementData.budget_used) }}</el-descriptions-item>
        <el-descriptions-item label="剩余">{{ formatMoney(settlementData.budget_remaining) }}</el-descriptions-item>
      </el-descriptions>
      <div class="mt-16">
        <el-button type="success" @click="approveSettlement" :loading="submitting">确认结算</el-button>
        <el-button type="danger" @click="rejectSettlement" :loading="submitting">驳回</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import api from '../api'
import { formatMoney } from '../utils/format'
import { exportWithTimestamp } from '../utils/export'

const list = ref([])
const loading = ref(false)
const showStats = ref(false)
const submitting = ref(false)

const filters = reactive({ status: '', keyword: '' })

// 统计
const stats = reactive({ totalQuote: 0, totalPaid: 0, totalPending: 0 })
const chartOption = ref({
  xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
  yAxis: { type: 'value', name: '金额(¥)' },
  series: [{ type: 'bar', data: [], itemStyle: { color: '#2563eb' } }],
  tooltip: { trigger: 'axis' },
})

const STATUS_MAP = {
  quoted: '已报价', paid: '已结清', invoiced: '已开票',
  settlement_complete: '结算完成', settlement_rejected: '结算驳回',
}
function statusLabel(s) { return STATUS_MAP[s] || '报价中' }

async function fetchList() {
  loading.value = true
  try {
    const params = { ...filters }
    const res = await api.get('/finance/quotes', { params })
    list.value = res.data || []
    // 计算统计
    stats.totalQuote = list.value.reduce((s, r) => s + (r.quote_amount || 0), 0)
    stats.totalPaid = list.value.filter(r => r.status === 'paid').reduce((s, r) => s + (r.quote_amount || 0), 0)
    stats.totalPending = stats.totalQuote - stats.totalPaid
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '加载失败')
    list.value = []
  }
  finally { loading.value = false }
}

function exportFinance() {
  if (!list.value.length) return ElMessage.warning('没有可导出的数据')
  exportWithTimestamp(list.value, [
    { key: 'work_order_no', label: '工单号', map: row => row.workOrder?.work_order_no },
    { key: 'title', label: '店铺名字', map: row => row.workOrder?.title },
    { key: 'quote_amount', label: '报价总额', map: row => row.quote_amount?.toFixed(2) || '0.00' },
    { key: 'budget_used', label: '已用金额', map: row => row.budget_used?.toFixed(2) || '0.00' },
    { key: 'budget_remaining', label: '剩余金额', map: row => row.budget_remaining?.toFixed(2) || '0.00' },
    { key: 'status', label: '状态', map: row => statusLabel(row.status) },
  ], '费用管理')
  ElMessage.success(`已导出 ${list.value.length} 条数据`)
}

function budgetPercent(row) {
  const used = row.budget_used || 0
  const quote = row.quote_amount || 1
  return Math.min(Math.round((used / quote) * 100), 100)
}

function budgetColor(row) {
  const pct = budgetPercent(row)
  return pct > 90 ? '#dc2626' : pct > 70 ? '#ea580c' : '#16a34a'
}

// 报价
const showQuoteDialog = ref(false)
const quoteForm = reactive({ id: '', work_order_no: '', work_order_id: '', total_amount: 0, notes: '' })

function openQuoteDialog(row) {
  quoteForm.id = row.id
  quoteForm.work_order_id = row.work_order_id
  quoteForm.work_order_no = row.workOrder?.work_order_no
  quoteForm.total_amount = row.quote_amount || 0
  quoteForm.notes = row.quote_notes || ''
  showQuoteDialog.value = true
}

async function submitQuote() {
  if (!quoteForm.total_amount) return ElMessage.warning('报价金额不能为空')
  submitting.value = true
  try {
    await api.post(`/finance/${quoteForm.work_order_id}/quote`, {
      items: [{ description: '报价', amount: quoteForm.total_amount }],
      total_amount: quoteForm.total_amount,
      notes: quoteForm.notes,
    })
    ElMessage.success('报价已更新')
    showQuoteDialog.value = false
    await fetchList()
  } catch (e) { ElMessage.error(e.response?.data?.error || '操作失败') }
  finally { submitting.value = false }
}

// 发票
const showInvoiceDialog = ref(false)
const invoiceForm = reactive({ invoice_number: '', amount: 0, status: 'invoiced', _workOrderId: '' })

function openInvoiceDialog(row) {
  invoiceForm.invoice_number = row.invoice_number || ''
  invoiceForm.amount = row.quote_amount || 0
  invoiceForm.status = row.status === 'invoiced' ? 'invoiced' : 'not_invoiced'
  invoiceForm._workOrderId = row.work_order_id
  showInvoiceDialog.value = true
}

async function submitInvoice() {
  if (!invoiceForm.invoice_number) return ElMessage.warning('发票号不能为空')
  submitting.value = true
  try {
    await api.post(`/finance/${invoiceForm._workOrderId}/invoice`, {
      invoice_number: invoiceForm.invoice_number,
      amount: invoiceForm.amount,
    })
    ElMessage.success('开票记录已添加')
    showInvoiceDialog.value = false
    await fetchList()
  } catch (e) { ElMessage.error(e.response?.data?.error || '操作失败') }
  finally { submitting.value = false }
}

// 结算
const showSettlementDialog = ref(false)
const settlementData = reactive({ work_order_no: '', quote_amount: 0, budget_used: 0, budget_remaining: 0, _workOrderId: '' })

function openSettlementDialog(row) {
  settlementData.work_order_no = row.workOrder?.work_order_no
  settlementData.quote_amount = row.quote_amount || 0
  settlementData.budget_used = row.budget_used || 0
  settlementData.budget_remaining = row.budget_remaining || (row.quote_amount - row.budget_used)
  settlementData._workOrderId = row.work_order_id
  showSettlementDialog.value = true
}

async function approveSettlement() {
  submitting.value = true
  try {
    await api.post(`/finance/${settlementData._workOrderId}/settlement`)
    ElMessage.success('结算已确认')
    showSettlementDialog.value = false
    await fetchList()
  } catch (e) { ElMessage.error(e.response?.data?.error || '操作失败') }
  finally { submitting.value = false }
}

async function rejectSettlement() {
  submitting.value = true
  try {
    await api.post(`/finance/${settlementData._workOrderId}/settlement/reject`, { reason: '结算驳回' })
    ElMessage.success('结算已驳回')
    showSettlementDialog.value = false
    await fetchList()
  } catch (e) { ElMessage.error(e.response?.data?.error || '操作失败') }
  finally { submitting.value = false }
}

onMounted(fetchList)
</script>

<style scoped>
.page-header { margin-bottom: var(--space-6); }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); }
.stat-value { font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); }
.stat-value.success { color: var(--color-success); }
.stat-value.warning { color: var(--color-warning); }
.mb-20 { margin-bottom: var(--space-5); }
.mt-16 { margin-top: var(--space-4); }
.text-danger { color: var(--color-danger); }
</style>
