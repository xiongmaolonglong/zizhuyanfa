<template>
  <div v-loading="loading">
    <div class="page-header">
      <el-page-header @back="$router.back()" :title="'工单 ' + (detail.work_order_no || '')">
        <template #content>
          <span class="wo-title-text">{{ detail.title }}</span>
        </template>
      </el-page-header>
    </div>

    <!-- 进度条 -->
    <el-card class="mt-16">
      <template #header><span>工单进度</span></template>
      <div class="progress-steps">
        <el-steps :active="currentStep" finish-status="success" simple>
          <el-step v-for="s in stages" :key="s.key" :title="s.label" :icon="s.icon" />
        </el-steps>
      </div>
      <div class="progress-bar-wrap">
        <el-progress :percentage="progressPercent" :stroke-width="12" :color="progressColor" />
      </div>
    </el-card>

    <!-- 基本信息 -->
    <el-card class="mt-16">
      <template #header><span>基本信息</span></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="工单号">{{ detail.work_order_no }}</el-descriptions-item>
        <el-descriptions-item label="项目名称">{{ detail.title }}</el-descriptions-item>
        <el-descriptions-item label="甲方企业">{{ detail.client_name }}</el-descriptions-item>
        <el-descriptions-item label="当前环节">
          <el-tag :type="stageTagType(detail.current_stage)">{{ stageLabel(detail.current_stage) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="负责人">{{ detail.assigned_to || '待分配' }}</el-descriptions-item>
        <el-descriptions-item label="截止日期">
          <span :class="{ 'text-danger': detail.is_timeout }">{{ detail.deadline || '未设置' }}</span>
          <el-tag v-if="detail.is_timeout" type="danger" size="small" style="margin-left:8px">已超时</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="项目地址" :span="2">{{ detail.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注说明" :span="2">{{ detail.description || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 设计确认（设计阶段显示） -->
    <el-card class="mt-16" v-if="detail.current_stage === 'design' && designs.length">
      <template #header>
        <span>设计稿确认</span>
      </template>
      <div v-for="d in designs" :key="d.id" class="design-item">
        <div class="design-header">
          <span class="design-name">{{ d.file_name || '设计稿' }}</span>
          <el-tag :type="d.status === 'approved' ? 'success' : d.status === 'rejected' ? 'danger' : 'warning'" size="small">
            {{ d.status === 'approved' ? '已确认' : d.status === 'rejected' ? '已驳回' : '待确认' }}
          </el-tag>
        </div>
        <div class="design-preview">
          <el-image v-if="d.file_url" :src="d.file_url" fit="contain" style="max-width:300px;max-height:200px"
            :preview-src-list="[d.file_url]" />
          <el-empty v-else description="暂无预览图" :image-size="80" />
        </div>
        <div v-if="d.status === 'pending'" class="design-actions">
          <el-button type="success" @click="confirmDesign(d)">确认</el-button>
          <el-button type="danger" @click="rejectDesign(d)">驳回</el-button>
        </div>
        <p v-if="d.reject_reason" class="text-danger mt-8">驳回原因：{{ d.reject_reason }}</p>
      </div>
    </el-card>

    <!-- 费用确认（财务阶段显示） -->
    <el-card class="mt-16" v-if="detail.current_stage === 'finance' && finances.length">
      <template #header><span>费用明细</span></template>
      <el-table :data="finances" stripe>
        <el-table-column prop="item_name" label="费用项目" min-width="150" />
        <el-table-column prop="description" label="说明" min-width="200" />
        <el-table-column prop="quantity" label="数量" width="80" align="center" />
        <el-table-column prop="unit_price" label="单价" width="100" align="right">
          <template #default="{ row }">¥{{ row.unit_price?.toFixed(2) || '0.00' }}</template>
        </el-table-column>
        <el-table-column prop="total_amount" label="金额" width="120" align="right">
          <template #default="{ row }">¥{{ row.total_amount?.toFixed(2) || '0.00' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.confirmed ? 'success' : 'warning'" size="small">
              {{ row.confirmed ? '已确认' : '待确认' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="finance-total" v-if="finances.length">
        <span>合计金额：</span>
        <span class="total-amount">¥{{ totalAmount.toFixed(2) }}</span>
        <el-button v-if="hasUnconfirmed" type="primary" @click="confirmAllFinance">全部确认</el-button>
      </div>
    </el-card>

    <!-- 操作日志 -->
    <el-card class="mt-16">
      <template #header><span>操作日志</span></template>
      <el-timeline>
        <el-timeline-item v-for="log in logs" :key="log.id"
          :timestamp="log.created_at" placement="top">
          {{ log.content }}
        </el-timeline-item>
        <el-empty v-if="!logs.length" description="暂无日志" :image-size="60" />
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document, Check, Position, Timer, Picture, Box, Tools, Money, Folder
} from '@element-plus/icons-vue'
import api from '../api'

const route = useRoute()
const loading = ref(true)
const detail = ref({})
const designs = ref([])
const finances = ref([])
const logs = ref([])

const stages = [
  { key: 'declaration', label: '申报', icon: Document },
  { key: 'approval', label: '审批', icon: Check },
  { key: 'assignment', label: '派单', icon: Position },
  { key: 'measurement', label: '测量', icon: Timer },
  { key: 'design', label: '设计', icon: Picture },
  { key: 'production', label: '生产', icon: Box },
  { key: 'construction', label: '施工', icon: Tools },
  { key: 'finance', label: '结算', icon: Money },
  { key: 'archive', label: '归档', icon: Folder },
]

const stageIndex = computed(() => stages.findIndex(s => s.key === detail.value.current_stage))
const currentStep = computed(() => stageIndex.value + 1)

const PROGRESS_MAP = {
  declaration: 5, approval: 15, assignment: 25, measurement: 35,
  design: 50, production: 65, construction: 80, finance: 90, archive: 100
}
const progressPercent = computed(() => PROGRESS_MAP[detail.value.current_stage] || 0)
const progressColor = computed(() => {
  if (detail.value.is_timeout) return '#f5222d'
  if (progressPercent.value >= 80) return '#52c41a'
  if (progressPercent.value >= 50) return '#1890ff'
  return '#faad14'
})

const stageMap = {
  declaration: '申报接收', approval: '审批中', assignment: '待派单',
  measurement: '测量中', design: '设计中', production: '生产中',
  construction: '施工中', finance: '费用结算', archive: '已归档'
}
function stageLabel(s) { return stageMap[s] || s }
function stageTagType(s) {
  const map = { declaration: 'info', approval: 'warning', assignment: '', measurement: 'warning', design: 'primary', production: 'success', construction: 'success', finance: 'danger', archive: 'info' }
  return map[s] || ''
}

const totalAmount = computed(() => finances.value.reduce((sum, f) => sum + (f.total_amount || 0), 0))
const hasUnconfirmed = computed(() => finances.value.some(f => !f.confirmed))

async function loadDetail() {
  loading.value = true
  try {
    const id = route.params.id
    // 从申报接口获取工单详情（客户端视角）
    const res = await api.get(`/declarations/${id}`)
    detail.value = res.data?.work_order || res.data || {}

    // 加载设计稿
    try {
      const designRes = await api.get('/designs', { params: { work_order_id: id } })
      designs.value = designRes.data || []
    } catch { designs.value = [] }

    // 加载费用
    try {
      const finRes = await api.get('/finance', { params: { work_order_id: id } })
      finances.value = finRes.data || []
    } catch { finances.value = [] }

    // 加载日志
    try {
      const logRes = await api.get(`/work-orders/${id}/logs`)
      logs.value = logRes.data || []
    } catch { logs.value = [] }
  } catch {
    ElMessage.error('加载工单失败')
  } finally {
    loading.value = false
  }
}

async function confirmDesign(d) {
  try {
    await ElMessageBox.confirm('确认该设计稿？确认后将进入下一环节。', '确认设计', { type: 'info' })
    await api.post(`/designs/${detail.value.id}/review`, { action: 'approve' })
    ElMessage.success('已确认')
    loadDetail()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.response?.data?.error || '确认失败')
  }
}

async function rejectDesign(d) {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入驳回原因', '驳回设计', {
      inputType: 'textarea',
      inputValidator: v => !!v || '请输入驳回原因',
    })
    await api.post(`/designs/${detail.value.id}/review`, { action: 'reject', comment: reason })
    ElMessage.success('已驳回')
    loadDetail()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.response?.data?.error || '驳回失败')
  }
}

async function confirmAllFinance() {
  try {
    await ElMessageBox.confirm('确认所有费用明细？', '费用确认', { type: 'info' })
    for (const f of finances.value) {
      if (!f.confirmed) {
        await api.post(`/finance/${detail.value.id}/settlement`)
      }
    }
    ElMessage.success('已全部确认')
    loadDetail()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '确认失败')
  }
}

onMounted(() => loadDetail())
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.wo-title-text { font-size: 16px; font-weight: 600; }
.mt-16 { margin-top: 16px; }

.progress-steps { margin-bottom: 16px; overflow-x: auto; }
.progress-bar-wrap { padding: 0 8px; }

.design-item { border: 1px solid #ebeef5; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
.design-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.design-name { font-weight: 600; }
.design-preview { margin-bottom: 12px; }
.design-actions { display: flex; gap: 8px; }
.mt-8 { margin-top: 8px; }

.finance-total {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 16px 0 0;
  font-size: 14px;
}
.total-amount { font-size: 20px; font-weight: 700; color: #f56c6c; }
.text-danger { color: #f56c6c; }
</style>
