<template>
  <div v-loading="loading" class="construction-detail-page">
    <!-- 顶部信息 -->
    <div class="top-bar">
      <div class="top-left">
        <el-button text @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <span class="wo-badge">{{ workOrder.work_order_no }}</span>
        <h1 class="title">{{ workOrder.title }}</h1>
        <el-tag :type="statusType" effect="light">{{ statusLabel }}</el-tag>
      </div>
      <div class="top-right">
        <template v-if="record.constructor_id">
          <span class="constructor-info">
            施工员: {{ record.constructor?.real_name || record.constructor_name || '-' }}
          </span>
          <span class="phone">{{ record.constructor?.phone || '' }}</span>
        </template>
        <el-button v-else type="primary" size="small" @click="assignDialogVisible = true">指派施工员</el-button>
      </div>
    </div>

    <!-- 安装内容 -->
    <el-card class="install-card">
      <template #header>
        <span>安装内容</span>
        <span class="total-area">共 {{ totalArea.toFixed(2) }} m²</span>
      </template>
      <div class="install-list">
        <div v-for="mat in materials" :key="mat.type" class="install-item">
          <div class="mat-header">
            <span class="mat-type">{{ materialTypeLabel(mat.type) }}</span>
            <span class="mat-area">{{ mat.totalArea.toFixed(2) }} m²</span>
          </div>
          <div class="mat-faces">
            <span v-for="(face, i) in mat.faces" :key="i" class="face-tag">
              {{ face.label }} {{ face.width }}×{{ face.height }}{{ face.unit || 'cm' }}
            </span>
            <span v-if="mat.isUnified" class="unified-tag">一体组合</span>
          </div>
        </div>
        <el-empty v-if="!materials.length" description="暂无测量数据" :image-size="60" />
      </div>
    </el-card>

    <!-- 照片上传 -->
    <div class="photo-section">
      <div class="photo-col">
        <div class="photo-header">施工前照片</div>
        <div class="photo-grid">
          <div v-for="(url, i) in beforePhotos" :key="'b' + i" class="photo-item">
            <el-image :src="url" :preview-src-list="beforePhotos" fit="cover" />
            <el-icon v-if="!readonly" class="photo-delete" @click="removePhoto('before', i)"><Close /></el-icon>
          </div>
          <div v-if="beforePhotos.length < 3 && !readonly" class="photo-add" @click="triggerUpload('before')">
            <el-icon><Plus /></el-icon>
          </div>
        </div>
      </div>
      <div class="photo-col">
        <div class="photo-header">施工后照片</div>
        <div class="photo-grid">
          <div v-for="(url, i) in afterPhotos" :key="'a' + i" class="photo-item">
            <el-image :src="url" :preview-src-list="afterPhotos" fit="cover" />
            <el-icon v-if="!readonly" class="photo-delete" @click="removePhoto('after', i)"><Close /></el-icon>
          </div>
          <div v-if="afterPhotos.length < 3 && !readonly" class="photo-add" @click="triggerUpload('after')">
            <el-icon><Plus /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 客户签名 -->
    <el-card class="signature-card">
      <template #header>客户签名</template>
      <div class="signature-area">
        <canvas v-if="!readonly && !signatureUrl" ref="signatureCanvas" class="signature-canvas" @mousedown="startDraw" @mousemove="drawing" @mouseup="endDraw" @mouseleave="endDraw" @touchstart.prevent="startDraw" @touchmove.prevent="drawing" @touchend="endDraw"></canvas>
        <img v-else-if="signatureUrl" :src="signatureUrl" class="signature-img" />
        <div v-else class="signature-placeholder">暂无签名</div>
      </div>
      <div v-if="!readonly && !signatureUrl" class="signature-actions">
        <el-button size="small" @click="clearSignature">清除</el-button>
        <el-button size="small" type="primary" @click="saveSignature">确认签名</el-button>
      </div>
    </el-card>

    <!-- 提交按钮 -->
    <div v-if="!readonly" class="submit-bar">
      <el-button type="primary" size="large" :loading="submitting" @click="submitComplete">
        提交完成
      </el-button>
    </div>

    <!-- 隐藏的文件上传 -->
    <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="handleFileChange" />

    <!-- 指派施工员对话框 -->
    <el-dialog v-model="assignDialogVisible" title="指派施工员" width="400px">
      <el-form label-width="80px">
        <el-form-item label="施工员">
          <el-select v-model="assignForm.constructor_id" placeholder="选择施工员" style="width:100%">
            <el-option v-for="u in constructors" :key="u.id" :label="u.real_name || u.name" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="施工日期">
          <el-date-picker v-model="assignForm.date" type="daterange" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAssign">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Plus, Close } from '@element-plus/icons-vue'
import api from '../api'

const route = useRoute()
const loading = ref(true)
const submitting = ref(false)
const readonly = ref(false)

const workOrder = ref({})
const record = ref({})
const measurements = ref([])

// 照片
const beforePhotos = ref([])
const afterPhotos = ref([])
const currentUploadType = ref('before')
const fileInput = ref(null)

// 签名
const signatureCanvas = ref(null)
const signatureUrl = ref('')
let ctx = null
let isDrawing = false

// 指派
const assignDialogVisible = ref(false)
const constructors = ref([])
const assignForm = ref({ constructor_id: null, date: null })

// 材料类型映射
const MATERIAL_LABELS = {
  signboard: '软膜灯箱',
  led_screen: 'LED屏幕',
  lightbox: '灯箱',
  acryilic: '亚克力',
  pvc: 'PVC板',
  vinyl: '车贴',
  other: '其他'
}

function materialTypeLabel(type) {
  return MATERIAL_LABELS[type] || type || '未知'
}

// 从测量数据提取材料列表
const materials = computed(() => {
  const list = []
  for (const mat of measurements.value) {
    const faces = mat.faces || []
    const totalArea = faces.reduce((sum, f) => sum + (f.area || 0), 0)
    const isUnified = faces.some(f => f.is_unified)
    list.push({
      type: mat.material_type,
      faces: faces.map(f => ({
        label: f.label || f.direction || '',
        width: f._widthM || f.width || 0,
        height: f._heightM || f.height || 0,
        unit: f.unit || 'm'
      })),
      totalArea,
      isUnified
    })
  }
  return list
})

const totalArea = computed(() => materials.value.reduce((sum, m) => sum + m.totalArea, 0))

const statusLabel = computed(() => {
  const map = { scheduled: '待施工', installing: '施工中', completed: '已完成', internally_verified: '内部验收', accepted: '甲方验收' }
  return map[record.value.status] || '待施工'
})

const statusType = computed(() => {
  const map = { scheduled: 'info', installing: 'warning', completed: 'primary', internally_verified: 'success', accepted: 'success' }
  return map[record.value.status] || 'info'
})

// 加载数据
async function fetchData() {
  loading.value = true
  try {
    const res = await api.get(`/construction/tasks/${route.params.workOrderId}`)
    workOrder.value = res.data?.work_order || {}
    record.value = res.data?.constructions?.[0] || {}

    // 照片
    beforePhotos.value = parsePhotos(record.value.before_photos)
    afterPhotos.value = parsePhotos(record.value.after_photos)
    signatureUrl.value = record.value.signature_path || ''

    // 判断只读：已完成或已验收
    readonly.value = ['completed', 'internally_verified', 'accepted'].includes(record.value.status)

    // 获取测量数据
    if (workOrder.value.id) {
      try {
        const measureRes = await api.get(`/measurements/tasks/${workOrder.value.id}`)
        const measureData = measureRes.data?.measurements?.[0]
        if (measureData) {
          // materials 是 JSON 字符串，需要解析
          const mats = measureData.materials
          if (typeof mats === 'string') {
            measurements.value = JSON.parse(mats)
          } else if (Array.isArray(mats)) {
            measurements.value = mats
          }
        }
      } catch {
        measurements.value = []
      }
    }

    // 获取施工员列表
    const usersRes = await api.get('/tenant/users?role=constructor')
    constructors.value = usersRes.data?.data || []
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

function parsePhotos(data) {
  if (!data) return []
  if (typeof data === 'string') {
    try { data = JSON.parse(data) } catch { return [] }
  }
  return Array.isArray(data) ? data : []
}

// 照片上传
function triggerUpload(type) {
  currentUploadType.value = type
  fileInput.value?.click()
}

async function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await api.post('/files', formData)
    const url = res.data?.url || res.url
    if (url) {
      if (currentUploadType.value === 'before') {
        beforePhotos.value.push(url)
      } else {
        afterPhotos.value.push(url)
      }
      // 自动保存
      await savePhotos()
    }
  } catch (e) {
    ElMessage.error('上传失败')
  }
  e.target.value = ''
}

async function removePhoto(type, index) {
  if (type === 'before') {
    beforePhotos.value.splice(index, 1)
  } else {
    afterPhotos.value.splice(index, 1)
  }
  await savePhotos()
}

async function savePhotos() {
  try {
    await api.post(`/construction/${route.params.workOrderId}`, {
      before_photos: beforePhotos.value,
      after_photos: afterPhotos.value
    })
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

// 签名
function initCanvas() {
  nextTick(() => {
    if (!signatureCanvas.value) return
    const canvas = signatureCanvas.value
    canvas.width = canvas.offsetWidth
    canvas.height = 200
    ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
  })
}

function getPos(e) {
  const canvas = signatureCanvas.value
  const rect = canvas.getBoundingClientRect()
  if (e.touches) {
    return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
  }
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function startDraw(e) {
  isDrawing = true
  const pos = getPos(e)
  ctx.beginPath()
  ctx.moveTo(pos.x, pos.y)
}

function drawing(e) {
  if (!isDrawing) return
  const pos = getPos(e)
  ctx.lineTo(pos.x, pos.y)
  ctx.stroke()
}

function endDraw() {
  isDrawing = false
}

function clearSignature() {
  if (!ctx) return
  ctx.clearRect(0, 0, signatureCanvas.value.width, signatureCanvas.value.height)
}

function saveSignature() {
  if (!signatureCanvas.value) return
  const url = signatureCanvas.value.toDataURL('image/png')
  signatureUrl.value = url
}

// 提交完成
async function submitComplete() {
  if (beforePhotos.value.length === 0 || afterPhotos.value.length === 0) {
    return ElMessage.warning('请上传施工前后的照片')
  }
  if (!signatureUrl.value) {
    return ElMessage.warning('请完成客户签名')
  }

  submitting.value = true
  try {
    // 上传签名图片
    let signaturePath = signatureUrl.value
    if (signatureUrl.value.startsWith('data:')) {
      const blob = await fetch(signatureUrl.value).then(r => r.blob())
      const formData = new FormData()
      formData.append('file', blob, 'signature.png')
      const res = await api.post('/files', formData)
      signaturePath = res.data?.url || res.url
    }

    await api.post(`/construction/${route.params.workOrderId}`, {
      before_photos: beforePhotos.value,
      after_photos: afterPhotos.value,
      signature_path: signaturePath,
      status: 'completed'
    })

    ElMessage.success('提交成功')
    await fetchData()
  } catch (e) {
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}

// 指派施工员
async function handleAssign() {
  if (!assignForm.value.constructor_id) {
    return ElMessage.warning('请选择施工员')
  }
  try {
    await api.post(`/construction/${route.params.workOrderId}/assign`, {
      constructor_id: assignForm.value.constructor_id,
      start_date: assignForm.value.date?.[0],
      end_date: assignForm.value.date?.[1]
    })
    ElMessage.success('指派成功')
    assignDialogVisible.value = false
    await fetchData()
  } catch (e) {
    ElMessage.error('指派失败')
  }
}

onMounted(() => {
  fetchData().then(() => {
    if (!readonly.value) initCanvas()
  })
})
</script>

<style scoped>
.construction-detail-page {
  padding: 16px;
  background: var(--color-bg-page);
  min-height: calc(100vh - 60px);
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
}

.top-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wo-badge {
  background: var(--color-primary);
  color: #fff;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.top-right {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.install-card {
  margin-bottom: 16px;
}

.install-card :deep(.el-card__header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-area {
  color: var(--color-text-secondary);
  font-size: 14px;
}

.install-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.install-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.mat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.mat-type {
  font-weight: 600;
  color: var(--color-text-primary);
}

.mat-area {
  color: var(--color-primary);
  font-weight: 500;
}

.mat-faces {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.face-tag {
  font-size: 12px;
  color: var(--color-text-secondary);
  background: #fff;
  padding: 2px 8px;
  border-radius: 4px;
}

.unified-tag {
  font-size: 12px;
  color: #fff;
  background: #ea580c;
  padding: 2px 8px;
  border-radius: 4px;
}

.photo-section {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.photo-col {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}

.photo-header {
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--color-text-primary);
}

.photo-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.photo-item {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
}

.photo-item :deep(.el-image) {
  width: 100%;
  height: 100%;
}

.photo-delete {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(0,0,0,0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.photo-item:hover .photo-delete {
  opacity: 1;
}

.photo-add {
  width: 100px;
  height: 100px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #9ca3af;
  font-size: 24px;
}

.photo-add:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.signature-card {
  margin-bottom: 16px;
}

.signature-area {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.signature-canvas {
  width: 100%;
  height: 200px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
  touch-action: none;
}

.signature-img {
  max-width: 100%;
  max-height: 200px;
}

.signature-placeholder {
  color: var(--color-text-placeholder);
}

.signature-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.submit-bar {
  display: flex;
  justify-content: center;
  padding: 24px;
}

.submit-bar :deep(.el-button) {
  min-width: 200px;
}

@media (max-width: 768px) {
  .photo-section {
    flex-direction: column;
  }
}
</style>
