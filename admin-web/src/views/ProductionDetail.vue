<template>
  <div v-loading="loading">
    <div class="page-header flex-between">
      <div class="header-left">
        <el-button link @click="$router.back()" class="back-btn">
          <el-icon><ArrowLeft /></el-icon>返回生产管理
        </el-button>
        <h1 class="page-title">生产详情</h1>
      </div>
    </div>

    <template v-if="workOrder">
      <el-row :gutter="16">
        <!-- 左侧主内容 -->
        <el-col :span="16">
          <!-- 基本信息 -->
          <el-card class="mb-16">
            <template #header><span class="card-title">基本信息</span></template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="工单号">{{ workOrder.work_order_no }}</el-descriptions-item>
              <el-descriptions-item label="店铺名字">{{ workOrder.title }}</el-descriptions-item>
              <el-descriptions-item label="甲方企业">{{ workOrder.client_name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="负责人">{{ workOrder.assigned_to || '-' }}</el-descriptions-item>
              <el-descriptions-item label="地址" :span="2">{{ workOrder.address || '-' }}</el-descriptions-item>
              <el-descriptions-item label="当前环节">
                <el-tag size="small" type="success">生产中</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag size="small" :type="workOrder.is_timeout ? 'danger' : 'success'" effect="plain">
                  {{ workOrder.is_timeout ? '超时' : '正常' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="截止日期">{{ workOrder.deadline || '-' }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ workOrder.created_at ? workOrder.created_at.slice(0, 19) : '-' }}</el-descriptions-item>
              <el-descriptions-item label="描述" :span="2">{{ workOrder.description || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- 测量数据 -->
          <el-card v-if="measurements.length" class="mb-16">
            <template #header>
              <span class="card-title">测量数据</span>
              <el-tag size="small" type="success" style="margin-left:8px" effect="plain">{{ measurements.length }}条记录</el-tag>
            </template>
            <el-collapse v-for="m in measurements" :key="m.id" class="measure-collapse">
              <el-collapse-item :title="`测量记录 · ${m.measurer_name || '—'} · ${m.measured_at || '—'}`" :name="m.id">
                <div class="measure-item">
                  <el-descriptions :column="3" border size="small" class="mb-12">
                    <el-descriptions-item label="测量员">{{ m.measurer_name || '—' }}</el-descriptions-item>
                    <el-descriptions-item label="测量日期">{{ m.measured_at || '—' }}</el-descriptions-item>
                    <el-descriptions-item label="状态">{{ m.status || '—' }}</el-descriptions-item>
                    <el-descriptions-item label="备注" :span="3">{{ m.notes || '—' }}</el-descriptions-item>
                  </el-descriptions>
                  <div v-if="m.materials && m.materials.length" class="measure-faces">
                    <div v-for="mat in m.materials" :key="mat.material_type || mat.template_id" class="material-group">
                      <h4 class="material-title">{{ adTypeLabel(mat.material_type) }}</h4>
                      <el-table :data="mat.faces || []" stripe size="small" border>
                        <el-table-column label="面名称" width="100">
                          <template #default="{ row }">{{ row.label || '—' }}</template>
                        </el-table-column>
                        <el-table-column label="宽(m)" width="80">
                          <template #default="{ row }">{{ row.width || '—' }}</template>
                        </el-table-column>
                        <el-table-column label="高(m)" width="80">
                          <template #default="{ row }">{{ row.height || '—' }}</template>
                        </el-table-column>
                        <el-table-column label="面积(m²)" width="100">
                          <template #default="{ row }">{{ row.area || '—' }}</template>
                        </el-table-column>
                        <el-table-column label="备注" min-width="120">
                          <template #default="{ row }">{{ row.notes || '—' }}</template>
                        </el-table-column>
                        <el-table-column label="照片" width="100">
                          <template #default="{ row }">
                            <el-image v-if="row.photos && row.photos.length" :src="row.photos[0]" :preview-src-list="row.photos" fit="cover" style="width:40px;height:40px;border-radius:4px" />
                            <span v-else class="text-muted">无</span>
                          </template>
                        </el-table-column>
                      </el-table>
                    </div>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </el-card>
          <el-card v-else class="mb-16">
            <template #header><span class="card-title">测量数据</span></template>
            <el-empty description="暂无测量数据" :image-size="60" />
          </el-card>

          <!-- 设计数据 -->
          <el-card v-if="latestDesign" class="mb-16">
            <template #header>
              <span class="card-title">设计数据</span>
            </template>
            <div class="design-item">
              <div class="design-header">
                <span class="design-info">版本 V{{ latestDesign.version }} · {{ latestDesign.designer_name || '—' }}</span>
                <el-tag size="small" type="success">已通过</el-tag>
              </div>
              <!-- 效果图 -->
              <div v-if="latestDesign.effect_images && latestDesign.effect_images.length" class="design-images">
                <div class="design-images-label">效果图：</div>
                <div class="design-images-grid">
                  <el-image
                    v-for="(img, idx) in latestDesign.effect_images"
                    :key="idx"
                    :src="img"
                    :preview-src-list="latestDesign.effect_images"
                    :initial-index="idx"
                    fit="cover"
                    class="design-img-thumb"
                  />
                </div>
              </div>
              <!-- 源文件 -->
              <div v-if="dedupedSourceFiles.length" class="design-files">
                <span class="design-files-label">源文件：</span>
                <el-link v-for="(f, idx) in dedupedSourceFiles" :key="idx" :href="f" type="primary" :underline="false" target="_blank" style="margin-right:12px">
                  源文件{{ dedupedSourceFiles.length > 1 ? idx + 1 : '' }}
                </el-link>
              </div>
              <!-- 材料清单 -->
              <div v-if="latestDesign.material_list && latestDesign.material_list.length" class="design-materials">
                <span class="design-materials-label">材料清单：</span>
                <el-table :data="latestDesign.material_list" stripe size="small" border>
                  <el-table-column label="材料" min-width="120">
                    <template #default="{ row }">{{ adTypeLabel(row.material_type) || row.name || '—' }}</template>
                  </el-table-column>
                  <el-table-column label="规格" width="100">
                    <template #default="{ row }">{{ row.spec || '—' }}</template>
                  </el-table-column>
                  <el-table-column label="用量" width="80">
                    <template #default="{ row }">{{ row.quantity || row.amount || '—' }}</template>
                  </el-table-column>
                  <el-table-column label="单位" width="80">
                    <template #default="{ row }">{{ row.unit || '—' }}</template>
                  </el-table-column>
                </el-table>
              </div>
              <!-- 面映射（按材料分组） -->
              <div v-if="latestDesign.face_mapping && latestDesign.face_mapping.length" class="design-mapping">
                <div class="design-mapping-label">面映射：</div>
                <div v-for="(group, idx) in groupedFaceMapping(latestDesign.face_mapping)" :key="idx" class="mapping-group">
                  <span class="mapping-material">{{ adTypeLabel(group.material) }}</span>
                  <span class="mapping-faces">{{ group.faces.map(f => f.face_label || f.label).join('、') }}</span>
                  <el-image
                    v-for="(imgUrl, imgIdx) in group.images"
                    :key="imgIdx"
                    :src="imgUrl"
                    :preview-src-list="group.images"
                    fit="cover"
                    style="width:30px;height:30px;border-radius:4px;margin-left:4px;vertical-align:middle;cursor:pointer"
                  />
                </div>
              </div>
            </div>
          </el-card>
          <el-card v-else class="mb-16">
            <template #header><span class="card-title">设计数据</span></template>
            <el-empty description="暂无已通过的设计数据" :image-size="60" />
          </el-card>
        </el-col>

        <!-- 右侧统计 -->
        <el-col :span="8">
          <!-- 生产批次 -->
          <el-card class="mb-16" v-if="productionBatches.length">
            <template #header><span class="card-title">生产记录</span></template>
            <div v-for="batch in productionBatches" :key="batch.id" class="production-batch-item">
              <div class="batch-header">
                <span class="batch-tag">{{ batch.batch_no }}</span>
                <el-tag size="small" type="info" effect="plain">{{ adTypeLabel(batch.material_type) }}</el-tag>
              </div>
              <div class="batch-info">
                <span class="batch-date">{{ batch.created_at?.slice(0, 19) || '-' }}</span>
                <el-tag size="small" :type="batch.completed_count === batch.total_count ? 'success' : 'warning'" effect="plain">
                  {{ batch.completed_count }}/{{ batch.total_count }}
                </el-tag>
              </div>
              <div v-if="batch.notes" class="batch-notes">{{ batch.notes }}</div>
            </div>
          </el-card>

          <!-- 数据统计 -->
          <el-card>
            <template #header><span class="card-title">数据统计</span></template>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-value">{{ measurements.length }}</span>
                <span class="stat-label">测量记录</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ allDesigns.length }}</span>
                <span class="stat-label">设计版本</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ totalMaterials }}</span>
                <span class="stat-label">材料种类</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import api from '../api'

const route = useRoute()
const loading = ref(false)
const workOrder = ref(null)
const measurements = ref([])
const allDesigns = ref([])
const adTypeMap = ref({})
const productionBatches = ref([])

async function loadSettings() {
  try {
    const res = await api.get('/tenant/settings')
    const settings = res.data || {}
    const templates = settings.project_templates || []
    for (const tmpl of templates) {
      for (const adType of (tmpl.ad_types || [])) {
        if (adType.key && adType.label) adTypeMap.value[adType.key] = adType.label
      }
    }
  } catch {}
}

function adTypeLabel(v) {
  if (!v) return '—'
  return adTypeMap.value[v] || v
}

// 只显示最新已通过的设计
const latestDesign = computed(() => {
  const approved = allDesigns.value.filter(d => d.status === 'approved')
  if (approved.length === 0) return null
  approved.sort((a, b) => (b.version || 0) - (a.version || 0))
  return approved[0]
})

// 面映射按材料分组
function groupedFaceMapping(faceMapping) {
  if (!faceMapping || !faceMapping.length) return []
  const groups = {}
  for (const fm of faceMapping) {
    const key = fm.material_type || fm.material || '—'
    if (!groups[key]) groups[key] = { material: key, faces: [], images: [] }
    groups[key].faces.push(fm)
    // 收集不重复的图片
    if (fm.image_url && !groups[key].images.includes(fm.image_url)) {
      groups[key].images.push(fm.image_url)
    }
  }
  return Object.values(groups)
}

// 源文件去重
const dedupedSourceFiles = computed(() => {
  if (!latestDesign.value?.source_files) return []
  return [...new Set(latestDesign.value.source_files)]
})

const totalMaterials = computed(() => {
  const types = new Set()
  for (const d of allDesigns.value) {
    if (d.material_list && Array.isArray(d.material_list)) {
      for (const m of d.material_list) {
        if (m.material_type || m.name) types.add(m.material_type || m.name)
      }
    }
  }
  return types.size
})

async function loadData() {
  loading.value = true
  const id = route.params.id
  try {
    // 并行请求工单详情和设置
    const [woRes] = await Promise.all([
      api.get(`/work-orders/${id}`),
      loadSettings(),
    ])
    const wo = woRes.data || woRes
    workOrder.value = wo
    // 解析 measurements 的 materials JSON
    const rawMeasurements = wo.measurements || []
    measurements.value = rawMeasurements.map(m => {
      let materials = m.materials || []
      if (typeof materials === 'string') {
        try { materials = JSON.parse(materials) } catch { materials = [] }
      }
      return { ...m, materials }
    })
    // 解析 designs 的 JSON 字段
    allDesigns.value = (wo.designs || []).map(d => {
      let effectImages = d.effect_images || []
      let sourceFiles = d.source_files || []
      let materialList = d.material_list || []
      let faceMapping = d.face_mapping || []
      if (typeof effectImages === 'string') { try { effectImages = JSON.parse(effectImages) } catch {} }
      if (typeof sourceFiles === 'string') { try { sourceFiles = JSON.parse(sourceFiles) } catch {} }
      if (typeof materialList === 'string') { try { materialList = JSON.parse(materialList) } catch {} }
      if (typeof faceMapping === 'string') { try { faceMapping = JSON.parse(faceMapping) } catch {} }
      return { ...d, effect_images: effectImages, source_files: sourceFiles, material_list: materialList, face_mapping: faceMapping }
    })
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '加载失败')
  } finally {
    loading.value = false
  }
}

// 生产批次通过工单的生产任务查询，不再单独请求批次列表
async function loadProductionBatches(woId) {
  try {
    const res = await api.get('/production/tasks', { params: { work_order_id: woId, page: 1, limit: 10 } })
    const payload = res.data || {}
    const list = payload.list || []
    productionBatches.value = list
  } catch {}
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page-header { margin-bottom: var(--space-6); }
.header-left { display: flex; align-items: center; gap: var(--space-3); }
.back-btn { font-size: 13px; color: var(--color-text-secondary); }
.back-btn:hover { color: var(--color-primary); }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.mb-16 { margin-bottom: var(--space-4); }
.card-title { font-weight: var(--font-weight-semibold); font-size: var(--font-size-sm); }

.measure-item, .design-item { padding: 4px 0; }
.design-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.design-info { font-size: 13px; color: var(--color-text-secondary); }
.measure-faces, .design-images, .design-files, .design-mapping, .design-review, .design-materials { margin-top: 12px; }
.material-title { font-size: 13px; font-weight: 600; color: var(--color-primary); margin-bottom: 8px; }
.design-images-label, .design-files-label, .design-mapping-label, .design-materials-label { font-size: 13px; font-weight: 500; color: var(--color-text-secondary); margin-bottom: 6px; }
.mapping-group { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; font-size: 13px; }
.mapping-material { font-weight: 600; color: var(--color-primary); }
.mapping-faces { color: var(--color-text-secondary); }
.design-images-grid { display: flex; gap: 8px; flex-wrap: wrap; }
.design-img-thumb { width: 80px; height: 80px; border-radius: 6px; cursor: pointer; }
.text-muted { color: var(--color-text-tertiary); font-size: var(--font-size-xs); }
.mb-12 { margin-bottom: 12px; }

.stats-grid { display: flex; justify-content: space-around; text-align: center; }
.stat-item { display: flex; flex-direction: column; gap: 4px; }
.stat-value { font-size: 20px; font-weight: 600; color: var(--color-text-primary); }
.stat-label { font-size: 12px; color: var(--color-text-tertiary); }

.production-batch-item { padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
.production-batch-item:last-child { border-bottom: none; }
.batch-header { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.batch-tag { font-family: monospace; font-size: 12px; font-weight: 600; color: var(--color-primary); background: #dbeafe; padding: 2px 8px; border-radius: 4px; }
.batch-info { display: flex; justify-content: space-between; align-items: center; }
.batch-date { font-size: 12px; color: var(--color-text-secondary); }
.batch-notes { font-size: 12px; color: var(--color-text-tertiary); margin-top: 4px; font-style: italic; }
</style>
