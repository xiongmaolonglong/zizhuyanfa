<template>
  <div>
    <div class="page-header flex-between">
      <div>
        <h1 class="page-title">仓库管理</h1>
        <p class="page-desc">入库、出库登记与库存概览</p>
      </div>
      <div>
        <el-button @click="fetchAll" :icon="Refresh" circle title="刷新" />
        <el-button type="success" @click="showInbound = true">入库登记</el-button>
        <el-button type="warning" @click="showOutbound = true">出库登记</el-button>
      </div>
    </div>

    <!-- 库存概览 -->
    <el-row :gutter="16" class="mb-16">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-body">
            <div class="stat-number" style="color: #2563eb">{{ inventory.length }}</div>
            <div class="stat-label">材料种类</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-body">
            <div class="stat-number" style="color: #16a34a">{{ inventory.reduce((s, i) => s + i.stock, 0) }}</div>
            <div class="stat-label">库存总量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-body">
            <div class="stat-number" style="color: #ea580c">{{ recordCount }}</div>
            <div class="stat-label">出入库记录</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 库存明细 -->
    <el-card class="mb-16">
      <template #header>
        <div class="card-header"><span>库存明细</span></div>
      </template>
      <el-table :data="inventory" stripe v-loading="loading">
        <el-table-column prop="material_type" label="材料名称" min-width="150" />
        <el-table-column prop="spec" label="规格" width="120" />
        <el-table-column label="入库总量" width="100" align="right">
          <template #default="{ row }">{{ row.total_in.toFixed(1) }}</template>
        </el-table-column>
        <el-table-column label="出库总量" width="100" align="right">
          <template #default="{ row }">{{ row.total_out.toFixed(1) }}</template>
        </el-table-column>
        <el-table-column label="当前库存" width="100" align="right">
          <template #default="{ row }">
            <span :style="{ color: row.stock < 10 ? '#dc2626' : '#16a34a', fontWeight: 600 }">{{ row.stock.toFixed(1) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="warehouse_location" label="库位" width="120" />
      </el-table>
      <el-empty v-if="!loading && !inventory.length" description="暂无库存" />
    </el-card>

    <!-- 出入库记录 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>出入库记录</span>
          <div class="record-filters">
            <el-select v-model="recordFilter.type" placeholder="全部类型" clearable style="width: 110px" class="mr-8" @change="fetchRecords">
              <el-option label="入库" value="inbound" />
              <el-option label="出库" value="outbound" />
            </el-select>
            <el-input v-model="recordFilter.material_type" placeholder="搜索材料" clearable style="width: 140px" class="mr-8" @change="fetchRecords" />
          </div>
        </div>
      </template>
      <el-table :data="records" stripe v-loading="recordLoading">
        <el-table-column label="单号" width="170">
          <template #default="{ row }">{{ row.receipt_no }}</template>
        </el-table-column>
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="row.type === 'inbound' ? 'success' : 'warning'">{{ row.type === 'inbound' ? '入库' : '出库' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="工单号" width="160">
          <template #default="{ row }">
            <router-link v-if="row.work_order_id" :to="`/work-orders/${row.work_order_id}`" class="wo-link">{{ row.workOrder?.order_no || '—' }}</router-link>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column prop="material_type" label="材料名称" min-width="120" />
        <el-table-column label="数量" width="100" align="right">
          <template #default="{ row }">{{ row.quantity }} {{ row.unit }}</template>
        </el-table-column>
        <el-table-column prop="warehouse_location" label="库位" width="100" />
        <el-table-column prop="constructor_name" label="施工队" width="100" />
        <el-table-column prop="operator_name" label="操作人" width="100" />
        <el-table-column prop="notes" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column label="时间" width="160">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button size="small" type="danger" link @click="deleteRecord(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!recordLoading && !records.length" description="暂无出入库记录" />

      <div class="pagination-box" v-if="recordTotal > recordPageSize">
        <el-pagination
          v-model:current-page="recordPage"
          v-model:page-size="recordPageSize"
          :total="recordTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchRecords"
          @current-change="fetchRecords"
        />
      </div>
    </el-card>

    <!-- 入库对话框 -->
    <el-dialog v-model="showInbound" title="入库登记" width="520px">
      <el-form :model="inboundForm" label-width="100px" ref="inboundFormRef" :rules="inboundRules">
        <el-form-item label="关联工单"><el-input v-model="inboundForm.work_order_id" placeholder="可选，输入工单ID" /></el-form-item>
        <el-form-item label="材料名称" prop="material_type"><el-input v-model="inboundForm.material_type" placeholder="如：铝塑板" /></el-form-item>
        <el-form-item label="规格"><el-input v-model="inboundForm.spec" placeholder="如：4mm" /></el-form-item>
        <el-form-item label="数量" prop="quantity"><el-input-number v-model="inboundForm.quantity" :min="0.1" :step="1" :precision="1" /></el-form-item>
        <el-form-item label="单位"><el-input v-model="inboundForm.unit" placeholder="件" /></el-form-item>
        <el-form-item label="库位"><el-input v-model="inboundForm.warehouse_location" placeholder="如：A区-01" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="inboundForm.notes" type="textarea" :rows="2" placeholder="可选" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showInbound = false">取消</el-button>
        <el-button type="success" @click="submitInbound" :loading="inboundSaving">确认入库</el-button>
      </template>
    </el-dialog>

    <!-- 出库对话框 -->
    <el-dialog v-model="showOutbound" title="出库登记" width="520px">
      <el-form :model="outboundForm" label-width="100px" ref="outboundFormRef" :rules="outboundRules">
        <el-form-item label="关联工单"><el-input v-model="outboundForm.work_order_id" placeholder="可选，输入工单ID" /></el-form-item>
        <el-form-item label="材料名称" prop="material_type"><el-input v-model="outboundForm.material_type" placeholder="如：铝塑板" /></el-form-item>
        <el-form-item label="数量" prop="quantity"><el-input-number v-model="outboundForm.quantity" :min="0.1" :step="1" :precision="1" /></el-form-item>
        <el-form-item label="施工队"><el-input v-model="outboundForm.constructor_name" placeholder="领料施工队" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="outboundForm.notes" type="textarea" :rows="2" placeholder="可选" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showOutbound = false">取消</el-button>
        <el-button type="warning" @click="submitOutbound" :loading="outboundSaving">确认出库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import api from '../api'
import { getWarehouseRecords, createInbound, createOutbound, deleteWarehouseRecord } from '../api/warehouses'

const loading = ref(false)
const inventory = ref([])
const recordCount = ref(0)

const records = ref([])
const recordLoading = ref(false)
const recordPage = ref(1)
const recordPageSize = ref(20)
const recordTotal = ref(0)
const recordFilter = reactive({ type: '', material_type: '' })

const showInbound = ref(false)
const showOutbound = ref(false)
const inboundSaving = ref(false)
const outboundSaving = ref(false)
const inboundForm = reactive({ work_order_id: '', material_type: '', spec: '', quantity: 0, unit: '件', warehouse_location: '', notes: '' })
const outboundForm = reactive({ work_order_id: '', material_type: '', quantity: 0, constructor_name: '', notes: '' })
const inboundFormRef = ref(null)
const outboundFormRef = ref(null)
const inboundRules = { material_type: [{ required: true, message: '材料名称为必填', trigger: 'blur' }], quantity: [{ required: true, message: '数量必须大于0', trigger: 'change' }] }
const outboundRules = { material_type: [{ required: true, message: '材料名称为必填', trigger: 'blur' }], quantity: [{ required: true, message: '数量必须大于0', trigger: 'change' }] }

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
}

async function fetchInventory() {
  loading.value = true
  try {
    const res = await api.get('/warehouse/inventory')
    const data = res.data || {}
    inventory.value = data.inventory || []
    recordCount.value = data.summary?.total_inbound + data.summary?.total_outbound || 0
  } catch {
    inventory.value = []
  } finally {
    loading.value = false
  }
}

async function fetchRecords() {
  recordLoading.value = true
  try {
    const params = { page: recordPage.value, limit: recordPageSize.value }
    if (recordFilter.type) params.type = recordFilter.type
    if (recordFilter.material_type) params.material_type = recordFilter.material_type
    const res = await getWarehouseRecords(params)
    const rows = res.data || []
    records.value = Array.isArray(rows) ? rows : (rows.list || [])
    recordTotal.value = res.pagination?.total || records.value.length
  } catch {
    records.value = []
  } finally {
    recordLoading.value = false
  }
}

async function fetchAll() {
  fetchInventory()
  fetchRecords()
}

async function submitInbound() {
  const valid = await inboundFormRef.value.validate().catch(() => false)
  if (!valid) return
  inboundSaving.value = true
  try {
    const payload = { ...inboundForm, work_order_id: inboundForm.work_order_id ? parseInt(inboundForm.work_order_id) : null }
    await createInbound(payload)
    ElMessage.success('入库登记成功')
    showInbound.value = false
    Object.assign(inboundForm, { work_order_id: '', material_type: '', spec: '', quantity: 0, unit: '件', warehouse_location: '', notes: '' })
    fetchAll()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '入库失败')
  } finally {
    inboundSaving.value = false
  }
}

async function submitOutbound() {
  const valid = await outboundFormRef.value.validate().catch(() => false)
  if (!valid) return
  outboundSaving.value = true
  try {
    const payload = { ...outboundForm, work_order_id: outboundForm.work_order_id ? parseInt(outboundForm.work_order_id) : null }
    await createOutbound(payload)
    ElMessage.success('出库登记成功')
    showOutbound.value = false
    Object.assign(outboundForm, { work_order_id: '', material_type: '', quantity: 0, constructor_name: '', notes: '' })
    fetchAll()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '出库失败')
  } finally {
    outboundSaving.value = false
  }
}

async function deleteRecord(row) {
  try {
    await ElMessageBox.confirm(`确定删除出入库记录「${row.receipt_no}」吗？`, '提示', { type: 'warning' })
    await deleteWarehouseRecord(row.id)
    ElMessage.success('已删除')
    fetchAll()
  } catch {}
}

onMounted(fetchAll)
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.page-header { margin-bottom: var(--space-6); }
.page-desc { color: var(--color-text-tertiary); font-size: var(--font-size-sm); margin-top: var(--space-1); }
.mb-16 { margin-bottom: 16px; }
.mr-8 { margin-right: var(--space-2); }
.card-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-2); }
.record-filters { display: flex; align-items: center; }
.stat-card .stat-body { text-align: center; padding: var(--space-2) 0; }
.stat-number { font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); }
.stat-label { color: var(--color-text-tertiary); font-size: var(--font-size-sm); margin-top: var(--space-1); }
.wo-link { color: var(--color-primary); text-decoration: none; }
.wo-link:hover { text-decoration: underline; }
</style>
