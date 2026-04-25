<template>
  <div>
    <div class="page-header flex-between">
      <h1 class="page-title">施工管理</h1>
      <div>
        <el-button @click="exportConstruction"><el-icon><Download /></el-icon>导出</el-button>
        <el-button @click="fetchList" :icon="Refresh" circle title="刷新" />
      </div>
    </div>

    <!-- 筛选 -->
    <el-card class="mb-20">
      <el-form :inline="true">
        <el-form-item>
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width:130px" @change="fetchList">
            <el-option v-for="(label, val) in STATUS_MAP" :key="val" :label="label" :value="val" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="filters.keyword" placeholder="搜索工单号/项目" clearable style="width:200px" @change="fetchList" />
        </el-form-item>
        <el-form-item>
          <el-button @click="fetchList">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计卡片 -->
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

    <!-- 列表 -->
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
        <el-table-column label="施工员" width="120">
          <template #default="{ row }">{{ row.constructor?.real_name || row.constructor_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="施工日期" width="120">
          <template #default="{ row }">{{ row.constructed_at || '-' }}</template>
        </el-table-column>
        <el-table-column label="耗时" width="80">
          <template #default="{ row }">{{ row.duration_minutes ? row.duration_minutes + 'min' : '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="400">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
            <el-button size="small" @click="viewLogs(row)">日志</el-button>
            <el-button v-if="row.status === 'completed'" size="small" type="primary" @click="openVerifyDialog(row)">内部验收</el-button>
            <el-button v-if="row.status === 'internally_verified'" size="small" type="success" @click="openClientVerifyDialog(row)">客户验收</el-button>
            <el-button v-if="row.status === 'scheduled'" size="small" type="warning" @click="startConstruction(row)">开始</el-button>
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

    <!-- 内部验收对话框 -->
    <el-dialog v-model="showVerifyDialog" title="内部验收" width="520px">
      <el-descriptions :column="1" border class="mb-16">
        <el-descriptions-item label="工单号">{{ verifyTask.workOrder?.work_order_no }}</el-descriptions-item>
        <el-descriptions-item label="项目">{{ verifyTask.workOrder?.title }}</el-descriptions-item>
      </el-descriptions>
      <el-form :model="verifyForm" label-width="100px">
        <el-form-item label="验收结果" required>
          <el-radio-group v-model="verifyForm.result">
            <el-radio :label="true">通过</el-radio>
            <el-radio :label="false">不通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="验收说明">
          <el-input v-model="verifyForm.notes" type="textarea" :rows="3" placeholder="填写验收意见或整改要求" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showVerifyDialog = false">取消</el-button>
        <el-button :type="verifyForm.result ? 'success' : 'danger'" @click="submitVerify" :loading="submitting">
          {{ verifyForm.result ? '确认通过' : '退回整改' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 客户验收对话框 -->
    <el-dialog v-model="showClientVerifyDialog" title="客户验收" width="520px">
      <el-descriptions :column="1" border class="mb-16">
        <el-descriptions-item label="工单号">{{ clientVerifyTask.workOrder?.work_order_no }}</el-descriptions-item>
        <el-descriptions-item label="项目">{{ clientVerifyTask.workOrder?.title }}</el-descriptions-item>
      </el-descriptions>
      <el-form :model="clientVerifyForm" label-width="100px">
        <el-form-item label="验收结果" required>
          <el-radio-group v-model="clientVerifyForm.result">
            <el-radio :label="true">通过</el-radio>
            <el-radio :label="false">不通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="验收说明">
          <el-input v-model="clientVerifyForm.notes" type="textarea" :rows="3" placeholder="客户验收意见或整改要求" />
        </el-form-item>
        <el-form-item label="验收照片">
          <el-upload
            action="/api/v1/files/upload"
            list-type="picture-card"
            :file-list="clientVerifyPhotos"
            :on-success="(res) => onClientVerifyPhotoSuccess(res)"
            :headers="{ Authorization: `Bearer ${auth.token}` }"
            name="file"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showClientVerifyDialog = false">取消</el-button>
        <el-button :type="clientVerifyForm.result ? 'success' : 'danger'" @click="submitClientVerify" :loading="clientVerifySubmitting">
          {{ clientVerifyForm.result ? '确认验收通过' : '退回整改' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 施工日志抽屉 -->
    <el-drawer v-model="showLogDrawer" title="施工日志" size="560px">
      <div class="log-toolbar mb-16">
        <el-button type="primary" size="small" @click="openAddLog">+ 添加日志</el-button>
      </div>
      <el-timeline v-if="constructionLogs.length">
        <el-timeline-item v-for="log in constructionLogs" :key="log.id"
          :timestamp="log.log_date || log.created_at" placement="top">
          <div class="log-card">
            <div class="log-head">
              <el-tag size="small" :type="log.status === 'completed' ? 'success' : 'warning'">
                {{ log.status === 'completed' ? '已完成' : '施工中' }}
              </el-tag>
              <span class="log-worker">{{ log.worker_name || log.operator || '—' }}</span>
              <span class="log-weather" v-if="log.weather">{{ log.weather }}</span>
            </div>
            <div class="log-content">{{ log.content || log.work_description || '—' }}</div>
            <div class="log-meta">
              <span v-if="log.labor_count">用工 {{ log.labor_count }}人</span>
              <span v-if="log.duration_hours">耗时 {{ log.duration_hours }}h</span>
            </div>
            <div class="log-actions">
              <el-button text size="small" @click="editLog(log)">编辑</el-button>
              <el-button text size="small" type="danger" @click="deleteLog(log)">删除</el-button>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无施工日志" />
    </el-drawer>

    <!-- 添加/编辑日志对话框 -->
    <el-dialog v-model="showLogDialog" :title="logForm.id ? '编辑日志' : '添加日志'" width="520px">
      <el-form :model="logForm" label-width="80px" ref="logFormRef">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="日期" required>
              <el-date-picker v-model="logForm.log_date" type="date" value-format="YYYY-MM-DD"
                style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="天气">
              <el-select v-model="logForm.weather" style="width:100%">
                <el-option label="晴" value="晴" />
                <el-option label="多云" value="多云" />
                <el-option label="阴" value="阴" />
                <el-option label="小雨" value="小雨" />
                <el-option label="大雨" value="大雨" />
                <el-option label="雪" value="雪" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="施工内容" required>
          <el-input v-model="logForm.content" type="textarea" :rows="4"
            placeholder="描述今日施工内容、进度、问题等" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="用工人数">
              <el-input-number v-model="logForm.labor_count" :min="0" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="耗时(h)">
              <el-input-number v-model="logForm.duration_hours" :min="0" :precision="1" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态">
              <el-select v-model="logForm.status" style="width:100%">
                <el-option label="施工中" value="in_progress" />
                <el-option label="已完成" value="completed" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showLogDialog = false">取消</el-button>
        <el-button type="primary" @click="submitLog" :loading="logSubmitting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Download, Plus } from '@element-plus/icons-vue'
import { useAuthStore } from '../store/auth'
import api from '../api'
import { logger } from '../utils/logger'
import { exportWithTimestamp } from '../utils/export'

const router = useRouter()
const auth = useAuthStore()
const list = ref([])
const loading = ref(false)
const submitting = ref(false)

const pagination = reactive({ page: 1, pageSize: 20, total: 0 })
const filters = reactive({ status: '', keyword: '' })

const STATUS_MAP = {
  scheduled: '待施工', installing: '施工中', completed: '已完成',
  internally_verified: '内部验收通过', accepted: '甲方已验收',
  rejected: '退回整改',
}
function statusLabel(s) { return STATUS_MAP[s] || s }
function statusType(s) {
  const map = { scheduled: 'info', installing: 'warning', completed: 'primary', internally_verified: 'success', accepted: 'success', rejected: 'danger' }
  return map[s] || ''
}

// 统计
const statsCards = reactive([])

async function fetchList() {
  loading.value = true
  try {
    const params = { ...filters, page: pagination.page, limit: pagination.pageSize }
    const res = await api.get('/construction/tasks', { params })
    // api 拦截器已返回 res.data，所以 res 就是响应体
    list.value = res.data || []
    pagination.total = res.pagination?.total || 0
    computeStats()
  } catch {
    list.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

function exportConstruction() {
  if (!list.value.length) return ElMessage.warning('没有可导出的数据')
  exportWithTimestamp(list.value, [
    { key: 'work_order_no', label: '工单号', map: row => row.workOrder?.work_order_no || '-' },
    { key: 'title', label: '项目名称', map: row => row.workOrder?.title || '-' },
    { key: 'status', label: '状态', map: row => STATUS_MAP[row.status] || row.status },
    { key: 'constructor', label: '施工人', map: row => row.constructor_name || '-' },
    { key: 'start_date', label: '开始日期' },
    { key: 'end_date', label: '完成日期' },
  ], '施工管理')
  ElMessage.success(`已导出 ${list.value.length} 条数据`)
}

function computeStats() {
  const all = list.value.length ? list.value : []
  const counts = { scheduled: 0, installing: 0, completed: 0, internally_verified: 0, accepted: 0 }
  all.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++ })
  statsCards.length = 0
  statsCards.push(
    { label: '待施工', count: counts.scheduled, color: '#909399' },
    { label: '施工中', count: counts.installing, color: '#e6a23c' },
    { label: '已完成', count: counts.completed, color: '#409eff' },
    { label: '待客户验收', count: counts.internally_verified, color: '#7c3aed' },
    { label: '已验收', count: counts.accepted, color: '#67c23a' },
  )
}

function viewDetail(row) {
  router.push(`/construction/${row.work_order_id}`)
}

// 开始施工
async function startConstruction(row) {
  try {
    await ElMessageBox.confirm('确认开始施工？', '提示', { type: 'warning' })
    await api.post(`/construction/${row.work_order_id}`, {
      status: 'installing',
    })
    ElMessage.success('已开始施工')
    await fetchList()
  } catch {}
}

// 验收
const showVerifyDialog = ref(false)
const verifyTask = reactive({ workOrder: {} })
const verifyForm = reactive({ result: true, notes: '' })

function openVerifyDialog(row) {
  verifyTask.workOrder = row.workOrder || {}
  verifyTask.id = row.id
  verifyTask.work_order_id = row.work_order_id
  verifyForm.result = true
  verifyForm.notes = ''
  showVerifyDialog.value = true
}

async function submitVerify() {
  submitting.value = true
  try {
    const endpoint = verifyForm.result
      ? `/construction/${verifyTask.work_order_id}/internal-verify`
      : `/construction/${verifyTask.work_order_id}/internal-verify`
    await api.post(endpoint, {
      verified: verifyForm.result,
      notes: verifyForm.notes,
    })
    ElMessage.success(verifyForm.result ? '验收通过' : '已退回整改')
    showVerifyDialog.value = false
    await fetchList()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(fetchList)

// 施工日志
const showLogDrawer = ref(false)
const showLogDialog = ref(false)
const logSubmitting = ref(false)
const logFormRef = ref(null)
const constructionLogs = ref([])
const currentLogWorkOrderId = ref('')
const logForm = reactive({
  id: null, log_date: '', weather: '', content: '', labor_count: null,
  duration_hours: null, status: 'in_progress'
})

async function viewLogs(row) {
  currentLogWorkOrderId.value = row.work_order_id
  constructionLogs.value = []
  showLogDrawer.value = true
  try {
    const res = await api.get(`/construction/${row.work_order_id}/logs`)
    constructionLogs.value = res.data || []
  } catch (e) {
    logger.error('加载施工日志失败:', e)
  }
}

function openAddLog() {
  Object.assign(logForm, {
    id: null, log_date: new Date().toISOString().slice(0, 10), weather: '',
    content: '', labor_count: null, duration_hours: null, status: 'in_progress'
  })
  showLogDialog.value = true
}

function editLog(log) {
  Object.assign(logForm, {
    id: log.id, log_date: log.log_date || '', weather: log.weather || '',
    content: log.content || '', labor_count: log.labor_count || null,
    duration_hours: log.duration_hours || null, status: log.status || 'in_progress'
  })
  showLogDialog.value = true
}

async function submitLog() {
  if (!logForm.content) return ElMessage.warning('请填写施工内容')
  logSubmitting.value = true
  try {
    const payload = { ...logForm, work_order_id: currentLogWorkOrderId.value }
    if (logForm.id) {
      await api.put(`/construction/logs/${logForm.id}`, payload)
      ElMessage.success('日志已更新')
    } else {
      await api.post(`/construction/${currentLogWorkOrderId.value}/logs`, payload)
      ElMessage.success('日志已添加')
    }
    showLogDialog.value = false
    viewLogs({ work_order_id: currentLogWorkOrderId.value })
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  } finally {
    logSubmitting.value = false
  }
}

async function deleteLog(log) {
  try {
    await ElMessageBox.confirm('确定删除此施工日志吗？', '提示', { type: 'warning' })
    await api.delete(`/construction/logs/${log.id}`)
    ElMessage.success('已删除')
    viewLogs({ work_order_id: currentLogWorkOrderId.value })
  } catch {}
}

// 客户验收
const showClientVerifyDialog = ref(false)
const clientVerifyTask = reactive({ workOrder: {} })
const clientVerifyForm = reactive({ result: true, notes: '' })
const clientVerifyPhotos = ref([])
const clientVerifySubmitting = ref(false)

function openClientVerifyDialog(row) {
  clientVerifyTask.workOrder = row.workOrder || {}
  clientVerifyTask.id = row.id
  clientVerifyTask.work_order_id = row.work_order_id
  clientVerifyForm.result = true
  clientVerifyForm.notes = ''
  clientVerifyPhotos.value = []
  showClientVerifyDialog.value = true
}

function onClientVerifyPhotoSuccess(res) {
  const url = res.url || res.data?.url
  if (!url) return ElMessage.error('照片上传失败')
  clientVerifyPhotos.value.push({ name: url.split('/').pop(), url })
}

async function submitClientVerify() {
  clientVerifySubmitting.value = true
  try {
    const photoUrls = clientVerifyPhotos.value.map(p => p.url)
    await api.post(`/construction/${clientVerifyTask.work_order_id}/verify`, {
      verified: clientVerifyForm.result,
      notes: clientVerifyForm.notes,
      photos: photoUrls,
    })
    ElMessage.success(clientVerifyForm.result ? '客户验收通过' : '已退回整改')
    showClientVerifyDialog.value = false
    await fetchList()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  } finally {
    clientVerifySubmitting.value = false
  }
}
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
.log-toolbar { display: flex; justify-content: flex-end; }
.log-card { background: var(--color-bg-page); border-radius: var(--radius-sm); padding: 12px; }
.log-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.log-worker { font-weight: var(--font-weight-medium); font-size: var(--font-size-sm); }
.log-weather { color: var(--color-text-tertiary); font-size: var(--font-size-xs); margin-left: auto; }
.log-content { font-size: var(--font-size-sm); line-height: 1.6; margin-bottom: 8px; }
.log-meta { color: var(--color-text-tertiary); font-size: var(--font-size-xs); display: flex; gap: 12px; }
.log-actions { margin-top: 8px; border-top: 1px solid var(--color-border-light); padding-top: 8px; }
</style>
