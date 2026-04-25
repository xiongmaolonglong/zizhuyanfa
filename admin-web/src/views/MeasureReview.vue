<template>
  <div v-loading="loading">
    <div class="flex-between mb-20">
      <div>
        <el-button @click="$router.back()" class="mb-8">&larr; 返回工单详情</el-button>
        <h1 class="page-title">测量数据审核 <span class="wo-no">{{ data.work_order_no }}</span></h1>
      </div>
      <div>
        <el-button type="warning" @click="showProxyForm = true" v-if="!hasMeasurement">代录测量数据</el-button>
        <template v-if="hasMeasurement">
          <el-button type="danger" @click="handleReject">&#10007; 驳回重测</el-button>
          <el-button type="success" @click="handleApprove">&#10003; 审核通过</el-button>
        </template>
      </div>
    </div>

    <!-- 代录测量表单 -->
    <el-dialog v-model="showProxyForm" title="代录测量数据" width="640px" top="5vh">
      <el-form :model="proxyForm" label-width="100px" v-loading="formConfigLoading">
        <template v-if="formConfigLoaded && formFields.length">
          <el-form-item
            v-for="field in formFields"
            :key="field.field_key"
            :label="field.field_label"
            :required="field.required"
          >
            <el-input
              v-if="field.field_type === 'text'"
              v-model="proxyForm[field.field_key]"
              :placeholder="field.placeholder || '请输入'"
            />
            <el-input
              v-else-if="field.field_type === 'textarea'"
              v-model="proxyForm[field.field_key]"
              type="textarea"
              :rows="3"
              :placeholder="field.placeholder || '请输入'"
            />
            <el-input-number
              v-else-if="field.field_type === 'number'"
              v-model="proxyForm[field.field_key]"
              :min="0"
              :precision="2"
              controls-position="right"
              style="width: 100%"
            />
            <el-date-picker
              v-else-if="field.field_type === 'date'"
              v-model="proxyForm[field.field_key]"
              type="date"
              :placeholder="field.placeholder || '请选择日期'"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
            <el-select
              v-else-if="field.field_type === 'select'"
              v-model="proxyForm[field.field_key]"
              :placeholder="field.placeholder || '请选择'"
              style="width: 100%"
            >
              <el-option v-for="opt in (field.options || [])" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
            <el-upload
              v-else-if="field.field_type === 'image'"
              action="/api/v1/files/upload"
              list-type="picture-card"
              :file-list="proxyForm[field.field_key] || []"
              :on-success="(res) => handleFileSuccess(res, field.field_key)"
              :headers="uploadHeaders"
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
            <el-input v-else v-model="proxyForm[field.field_key]" :placeholder="field.placeholder || '请输入'" />
          </el-form-item>
        </template>
        <el-empty v-else-if="formConfigLoaded" description="未配置测量表单字段，请先到系统配置页面配置" />
        <el-skeleton v-else :rows="5" animated />
      </el-form>
      <template #footer>
        <el-button @click="showProxyForm = false">取消</el-button>
        <el-button type="primary" @click="submitProxyMeasurement" :loading="submitting">提交</el-button>
      </template>
    </el-dialog>

    <!-- Environment -->
    <el-card class="mb-20">
      <template #header><span class="section-title">测量环境</span></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="天气">{{ env.weather || '—' }}</el-descriptions-item>
        <el-descriptions-item label="现场通道">{{ env.access || '—' }}</el-descriptions-item>
        <el-descriptions-item label="车辆可达">
          <el-tag :type="env.vehicle_access ? 'success' : 'danger'">{{ env.vehicle_access ? '是' : '否' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="环境标记">
          <el-tag v-for="flag in env.environment_flags" :key="flag" size="small" type="warning" class="mr-4">{{ flag }}</el-tag>
          <span v-if="!env.environment_flags?.length" class="text-muted">无</span>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ env.notes || '—' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- Materials -->
    <el-card class="mb-20">
      <template #header><span class="section-title">材料测量数据</span></template>
      <div v-for="(mat, mi) in materials" :key="mi" class="material-section">
        <div class="mat-header">
          <span>{{ mat.type }} — {{ mat.faces.length }}面 &nbsp;
            <el-tag size="small" type="primary">合计 {{ totalArea(mat.faces) }}㎡</el-tag>
          </span>
        </div>
        <div class="mat-body">
          <div class="face-header">
            <span>面位</span><span>宽度(m)</span><span>高度(m)</span><span>面积(㎡)</span><span>备注</span><span>照片</span>
          </div>
          <div class="face-row" v-for="(face, fi) in mat.faces" :key="fi">
            <span class="face-label">{{ face.label }}</span>
            <el-input-number v-model="face.width" :min="0" :precision="2" :controls="false"
              style="width:80px" size="small" @change="markModified" />
            <el-input-number v-model="face.height" :min="0" :precision="2" :controls="false"
              style="width:80px" size="small" @change="markModified" />
            <span class="face-area">{{ face.area || (face.width * face.height).toFixed(2) }}㎡</span>
            <span>
              <el-tag v-if="face.special_flag" size="small" type="warning">特殊</el-tag>
              {{ face.notes || '' }}
            </span>
            <span class="action-link" @click="previewFacePhotos(face.photos || [])">
              {{ face.photos?.length || 0 }}张
            </span>
          </div>
        </div>
      </div>

      <div class="total-bar">
        <span class="total-label">总面积合计</span>
        <span class="total-value">{{ grandTotal }}㎡</span>
      </div>
      <el-alert v-if="areaWarning" :title="areaWarning" type="warning" :closable="false" show-icon style="margin-top:12px" />
    </el-card>

    <!-- Signature + Sketch -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header><span class="section-title">客户签名</span></template>
          <div class="sig-placeholder">
            <el-image v-if="data.signature_path" :src="data.signature_path" fit="contain" style="max-height:120px" />
            <span v-else class="text-muted">暂无签名</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header><span class="section-title">现场草图</span></template>
          <div class="sig-placeholder">
            <el-image v-if="data.sketch_path" :src="data.sketch_path" fit="contain" style="max-height:120px" />
            <span v-else class="text-muted">暂无草图</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 驳回历史 -->
    <el-card class="mb-20" v-if="rejectHistory.length">
      <template #header><span class="section-title">驳回历史</span></template>
      <el-timeline>
        <el-timeline-item v-for="(r, i) in rejectHistory" :key="i" :timestamp="r.created_at" placement="top">
          <el-tag type="danger" size="small">驳回</el-tag>
          <p class="mt-8">{{ r.reason }}</p>
          <span class="text-muted">— {{ r.rejected_by || '管理员' }}</span>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- 照片预览对话框 -->
    <el-dialog v-model="showPhotoPreview" title="照片预览" width="600px">
      <div class="photo-grid">
        <el-image v-for="(url, i) in previewPhotos" :key="i" :src="url" :preview-src-list="previewPhotos"
          fit="cover" class="photo-item" />
      </div>
    </el-dialog>

    <!-- Reject Dialog -->
    <el-dialog v-model="showReject" title="驳回重测" width="480px">
      <el-form>
        <el-form-item label="驳回原因" required>
          <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请输入驳回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReject = false">取消</el-button>
        <el-button type="danger" @click="submitReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useAuthStore } from '../store/auth'
import api from '../api'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const loading = ref(true)
const showReject = ref(false)
const rejectReason = ref('')
const submitting = ref(false)

// 代录测量
const showProxyForm = ref(false)
const formConfigLoading = ref(false)
const formConfigLoaded = ref(false)
const formFields = ref([])
const proxyForm = reactive({})

const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${auth.token}`
}))

const data = ref({})
const env = ref({})
const materials = ref([])

const hasMeasurement = computed(() => {
  return !!(data.value.measurement && (data.value.measurement.basic_info || data.value.measurement.materials?.length))
})

const grandTotal = computed(() => {
  return materials.value.reduce((sum, mat) => {
    return sum + mat.faces.reduce((s, f) => s + (f.area || (f.width * f.height)), 0)
  }, 0).toFixed(2)
})

const areaWarning = computed(() => {
  const total = parseFloat(grandTotal.value)
  if (total > 500) return '总面积超过 500㎡，请确认数据准确性'
  if (total < 1) return '总面积小于 1㎡，数据可能不完整'
  return ''
})

const rejectHistory = ref([])
const hasModifications = ref(false)

function markModified() {
  hasModifications.value = true
}

// 照片预览
const showPhotoPreview = ref(false)
const previewPhotos = ref([])

function previewFacePhotos(photos) {
  if (!photos.length) return
  previewPhotos.value = photos
  showPhotoPreview.value = true
}

function totalArea(faces) {
  return faces.reduce((s, f) => s + (f.area || (f.width * f.height)), 0).toFixed(2)
}

async function handleApprove() {
  try {
    await ElMessageBox.confirm('确认审核通过该测量数据？', '提示', { type: 'warning' })
    // 如果有修改，先保存
    if (hasModifications.value) {
      await api.put(`/measurements/${route.params.id}`, { materials: materials.value })
      ElMessage.success('数据已保存')
    }
    await api.post(`/measurements/${route.params.id}/review`, { action: 'approve' })
    ElMessage.success('审核通过，工单已进入设计环节')
    router.back()
  } catch {}
}

async function submitReject() {
  if (!rejectReason.value) return ElMessage.warning('请填写驳回原因')
  try {
    await api.post(`/measurements/${route.params.id}/review`, { action: 'reject', reason: rejectReason.value })
    ElMessage.success('已驳回，通知测量员重测')
    showReject.value = false
    router.back()
  } catch {}
}

function handleFileSuccess(res, fieldKey) {
  if (!proxyForm[fieldKey]) proxyForm[fieldKey] = []
  proxyForm[fieldKey].push(res.data?.url || res.data)
}

async function loadFormConfig() {
  formConfigLoading.value = true
  try {
    const res = await api.get('/tenant/form-config/measurement_data')
    if (res.code === 0 && res.data) {
      formFields.value = res.data.fields || []
      formFields.value.forEach(f => {
        if (f.default_value !== undefined && f.default_value !== null) {
          proxyForm[f.field_key] = f.default_value
        } else if (f.field_type === 'image') {
          proxyForm[f.field_key] = []
        }
      })
    }
  } catch (err) {
    console.error('加载测量表单配置失败:', err)
  } finally {
    formConfigLoading.value = false
    formConfigLoaded.value = true
  }
}

async function submitProxyMeasurement() {
  submitting.value = true
  try {
    await api.post(`/measurements/${route.params.id}/proxy-submit`, proxyForm)
    ElMessage.success('代录测量数据已提交')
    showProxyForm.value = false
    Object.keys(proxyForm).forEach(k => delete proxyForm[k])
    // Reload page data
    const res = await api.get(`/work-orders/${route.params.id}`)
    const d = res.data || {}
    data.value = d
    env.value = d.measurement?.basic_info || {}
    materials.value = d.measurement?.materials || []
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  loadFormConfig()
  try {
    const res = await api.get(`/work-orders/${route.params.id}`)
    const d = res.data || {}
    data.value = d
    env.value = d.measurement?.basic_info || {}
    materials.value = d.measurement?.materials || []
    // 加载驳回历史（从操作日志中筛选）
    const logRes = await api.get(`/work-orders/${route.params.id}/logs`)
    rejectHistory.value = (logRes.data || [])
      .filter(l => l.action === 'measurement_rejected')
      .map(l => ({ reason: l.detail, created_at: l.created_at, rejected_by: l.user_name }))
  } catch {
    data.value = { work_order_no: '-', measurement: { basic_info: {}, materials: [] } }
    env.value = {}
    materials.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.mb-8 { margin-bottom: var(--space-2); }
.mb-20 { margin-bottom: var(--space-5); }
.mr-4 { margin-right: var(--space-1); }
.section-title { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); }
.text-muted { color: var(--color-text-placeholder); font-size: var(--font-size-sm); }
.action-link { color: var(--color-primary); cursor: pointer; }

.material-section { border: 1px solid var(--color-border-light); border-radius: var(--radius-sm); margin-bottom: var(--space-3); overflow: hidden; }
.mat-header { background: var(--color-bg-page); padding: var(--space-3) var(--space-4); font-weight: var(--font-weight-medium); font-size: var(--font-size-sm); }
.mat-body { padding: 0 var(--space-4); }
.face-header { display: grid; grid-template-columns: 80px 100px 100px 100px 1fr 60px; gap: var(--space-2); padding: var(--space-2) 0 var(--space-1); font-size: var(--font-size-xs); color: var(--color-text-tertiary); border-bottom: 1px solid var(--color-border-light); }
.face-row { display: grid; grid-template-columns: 80px 100px 100px 100px 1fr 60px; gap: var(--space-2); padding: var(--space-2) 0; border-bottom: 1px solid var(--color-border-light); font-size: var(--font-size-xs); align-items: center; }
.face-row:last-child { border-bottom: none; }
.face-label { color: var(--color-text-tertiary); }
.face-area { color: var(--color-primary); font-weight: var(--font-weight-medium); }
.total-bar { margin-top: var(--space-4); padding: var(--space-3) var(--space-4); background: var(--color-bg-page); border-radius: var(--radius-sm); display: flex; justify-content: space-between; }
.total-label { font-weight: var(--font-weight-medium); }
.total-value { font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); color: var(--color-primary); }
.sig-placeholder { text-align: center; padding: var(--space-5); min-height: 120px; display: flex; align-items: center; justify-content: center; }
.photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-2); }
.photo-item { width: 100%; height: 120px; border-radius: var(--radius-sm); cursor: pointer; }
.mt-8 { margin-top: var(--space-2); }
</style>
