<template>
  <div v-loading="loading">
    <!-- 加载失败提示 -->
    <el-result v-if="loadError" icon="warning" title="加载失败" :sub-title="loadError">
      <template #extra>
        <el-button type="primary" @click="loadData">重新加载</el-button>
        <el-button @click="$router.push('/audit')">返回审核中心</el-button>
      </template>
    </el-result>

    <template v-if="!loadError">
    <div class="page-header flex-between">
      <div class="header-left">
        <el-button link @click="$router.back()" class="back-btn">
          <el-icon><ArrowLeft /></el-icon>返回审核中心
        </el-button>
        <h1 class="page-title">审核详情</h1>
      </div>
      <div class="page-actions" v-if="auditType">
        <el-button type="success" @click="handleApprove" :loading="submitting">
          <el-icon><Check /></el-icon>审核通过
        </el-button>
        <el-button type="danger" @click="openRejectDialog">
          <el-icon><Close /></el-icon>驳回
        </el-button>
      </div>
    </div>

    <template v-if="data">
      <!-- 基本信息 -->
      <el-card class="mb-16">
        <template #header>
          <span class="card-title">基本信息</span>
        </template>
        <el-descriptions :column="4" border>
          <el-descriptions-item label="工单号">{{ data.work_order_no }}</el-descriptions-item>
          <el-descriptions-item label="店铺名">{{ data.title }}</el-descriptions-item>
          <el-descriptions-item label="元素">{{ projectTypeLabel(data.project_type) }}</el-descriptions-item>
          <el-descriptions-item label="当前环节">{{ stageLabel(data.current_stage) }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ data.assigned_to || '未分配' }}</el-descriptions-item>
          <el-descriptions-item label="截止日期">{{ data.deadline || '—' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 测量审核详情 -->
      <template v-if="auditType === 'measurement'">
        <el-card v-if="measurementData" class="mb-16">
          <template #header>
            <span class="card-title">测量数据</span>
            <el-tag size="small" type="success" style="margin-left:8px">测量员: {{ measurementData.measurer_name || '—' }}</el-tag>
          </template>
          <div v-for="(mat, mi) in measurementMaterials" :key="mi" class="material-section">
            <div class="mat-header">
              <span>{{ materialTypeLabel(mat.material_type || mat.type) }} — {{ mat.faces?.length || 0 }}面
                <el-tag size="small" type="primary">合计 {{ matTotalArea(mat.faces) }}m²</el-tag>
              </span>
            </div>
            <div class="mat-body">
              <div class="face-header">
                <span>面位</span><span>宽度(cm)</span><span>高度(cm)</span><span>面积(m²)</span><span>备注</span><span>照片</span>
              </div>
              <div class="face-row" v-for="(face, fi) in mat.faces" :key="fi">
                <span class="face-label">{{ face.label || face.face_name || face.direction || '未知面' }}</span>
                <span>{{ (face._widthM ? face._widthM * 100 : face.width || 0).toFixed(2) }}</span>
                <span>{{ (face._heightM ? face._heightM * 100 : face.height || 0).toFixed(2) }}</span>
                <span class="face-area">{{ (face.area || 0).toFixed(2) }}m²</span>
                <span>
                  <el-tag v-if="face.is_unified || face.isUnified" size="small" type="warning">一体</el-tag>
                  {{ face.notes || '' }}
                </span>
                <span class="action-link" @click="previewFacePhotos(face.photos || [])">
                  {{ face.photos?.length || 0 }}张
                </span>
              </div>
            </div>
          </div>
          <el-empty v-if="!measurementMaterials.length" description="暂无测量数据" />
        </el-card>
      </template>

      <!-- 设计审核详情 -->
      <template v-if="auditType === 'design'">
        <el-card v-if="designData" class="mb-16">
          <template #header>
            <div class="flex-between">
              <div>
                <span class="card-title">设计稿</span>
                <el-tag size="small" style="margin-left:8px">设计师: {{ designData.designer_name || '—' }}</el-tag>
                <el-tag size="small" type="info" style="margin-left:4px">v{{ designData.version }}</el-tag>
              </div>
              <el-button type="primary" size="small" @click="printPreview">
                <el-icon><Printer /></el-icon> 打印预览
              </el-button>
            </div>
          </template>
          <!-- PDF 文件下载 -->
          <div v-if="designPdfs.length" class="pdf-section">
            <h4 class="section-label">设计文件</h4>
            <div class="pdf-list">
              <a v-for="(pdf, i) in designPdfs" :key="i" :href="pdf.url" target="_blank" class="pdf-link">
                <el-icon><Document /></el-icon>
                <span>{{ pdf.name }}</span>
                <el-button size="small" type="primary" link>下载</el-button>
              </a>
            </div>
          </div>
          <!-- 照片对比：按面分组，现场照片 vs 设计效果图 -->
          <div v-if="compareGroups.length" class="compare-section">
            <h4 class="section-label">现场照片 vs 设计效果图</h4>
            <div class="compare-list">
              <div v-for="(group, gi) in compareGroups" :key="gi" class="compare-group">
                <div class="compare-group-header">
                  <span class="compare-group-name">{{ group.name }}</span>
                  <el-tag v-if="group.isUnified" type="warning" effect="dark" size="small">一体</el-tag>
                  <span class="compare-group-size">{{ group.sizeText }}</span>
                </div>
                <div class="compare-pair" v-for="(pair, pi) in group.pairs" :key="pi">
                  <div class="compare-side">
                    <div class="compare-label">
                      <el-tag type="warning" effect="plain" size="small">现场照片</el-tag>
                      <span class="compare-face-name">{{ pair.faceLabel }}</span>
                    </div>
                    <div class="compare-photos">
                      <el-image
                        v-for="(url, ui) in pair.sitePhotos"
                        :key="'s'+ui"
                        :src="url"
                        :preview-src-list="pair.sitePhotos"
                        fit="cover"
                        class="compare-image"
                      />
                      <span v-if="!pair.sitePhotos.length" class="no-photo-text">无照片</span>
                    </div>
                  </div>
                  <div class="compare-arrow">→</div>
                  <div class="compare-side">
                    <div class="compare-label">
                      <el-tag type="success" effect="plain" size="small">设计效果图</el-tag>
                      <span class="compare-face-name">{{ pair.faceLabel }}</span>
                    </div>
                    <div class="compare-photos">
                      <el-image
                        v-for="(url, di) in pair.designImages"
                        :key="'d'+di"
                        :src="url"
                        :preview-src-list="pair.designImages"
                        fit="cover"
                        class="compare-image"
                      />
                      <span v-if="!pair.designImages.length" class="no-photo-text">未上传</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- 测量数据参考 -->
          <div v-if="measureRef.length" class="ref-section">
            <h4 class="section-label">测量数据（参考）</h4>
            <div v-for="(mat, mi) in designMeasurementMaterials" :key="mi" class="material-section">
              <div class="mat-header">
                <span>{{ materialTypeLabel(mat.material_type || mat.type) }} — {{ mat.faces?.length || 0 }}面
                  <el-tag size="small" type="primary">合计 {{ matTotalArea(mat.faces) }}m²</el-tag>
                </span>
              </div>
              <div class="mat-body">
                <div class="face-header face-header-5col">
                  <span>面位</span><span>宽度(cm)</span><span>高度(cm)</span><span>面积(m²)</span><span>备注</span>
                </div>
                <div class="face-row face-row-5col" v-for="(face, fi) in mat.faces" :key="fi">
                  <span class="face-label">{{ face.label || face.face_name || face.direction || '未知面' }}</span>
                  <span>{{ (face._widthM ? face._widthM * 100 : face.width || 0).toFixed(2) }}</span>
                  <span>{{ (face._heightM ? face._heightM * 100 : face.height || 0).toFixed(2) }}</span>
                  <span class="face-area">{{ (face.area || 0).toFixed(2) }}m²</span>
                  <span>
                    <el-tag v-if="face.is_unified || face.isUnified" size="small" type="warning">一体</el-tag>
                    {{ face.notes || '' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <!-- 甲方照片 -->
          <div v-if="declarationPhotos.length" class="ref-section">
            <h4 class="section-label">甲方上传照片</h4>
            <div class="photo-grid">
              <el-image
                v-for="(url, i) in declarationPhotos"
                :key="'decl' + i"
                :src="url"
                :preview-src-list="declarationPhotos"
                :initial-index="i"
                fit="cover"
                class="photo-thumb"
              />
            </div>
          </div>
        </el-card>
      </template>

      <!-- 施工验收详情 -->
      <template v-if="auditType === 'construction'">
        <el-card v-if="constructionData" class="mb-16">
          <template #header>
            <span class="card-title">施工信息</span>
            <el-tag size="small" type="warning" style="margin-left:8px">施工员: {{ constructionData.constructor_name || '—' }}</el-tag>
          </template>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="开工日期">{{ constructionData.started_at || '—' }}</el-descriptions-item>
            <el-descriptions-item label="完工日期">{{ constructionData.constructed_at || '—' }}</el-descriptions-item>
            <el-descriptions-item label="施工时长">{{ constructionData.duration_minutes ? constructionData.duration_minutes + '分钟' : '—' }}</el-descriptions-item>
            <el-descriptions-item label="施工备注" :span="3">{{ constructionData.notes || '—' }}</el-descriptions-item>
          </el-descriptions>
          <!-- 完工照片 -->
          <div v-if="constructionPhotos.length" class="photo-section">
            <h4 class="section-label">完工照片</h4>
            <div class="photo-grid">
              <el-image
                v-for="(url, i) in constructionPhotos"
                :key="'const' + i"
                :src="url"
                :preview-src-list="constructionPhotos"
                :initial-index="i"
                fit="cover"
                class="photo-thumb"
              />
            </div>
          </div>
        </el-card>
      </template>

      <!-- 操作日志 -->
      <el-card>
        <template #header><span class="card-title">操作日志</span></template>
        <el-timeline>
          <el-timeline-item
            v-for="log in logs"
            :key="log.id"
            :timestamp="log.created_at?.slice(0, 19) || ''"
            placement="top"
          >
            <span>{{ log.detail }}</span>
            <span v-if="log.user_name" class="log-user"> — {{ log.user_name }}</span>
          </el-timeline-item>
          <el-empty v-if="!logs.length" description="暂无操作日志" :image-size="60" />
        </el-timeline>
      </el-card>
    </template>
    </template>

    <!-- 驳回对话框 -->
    <el-dialog v-model="showRejectDialog" :title="`驳回 - ${data?.work_order_no} ${data?.title}`" width="480px">
      <el-form>
        <el-form-item label="驳回原因" required>
          <el-input v-model="rejectReason" type="textarea" :rows="4" placeholder="请详细说明驳回原因及修改要求" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmReject" :loading="submitting">确认驳回</el-button>
      </template>
    </el-dialog>

    <!-- 打印预览对话框（可调整宽度） -->
    <el-dialog v-model="showPrintDialog" title="打印预览" :width="printDialogWidth" top="5vh" class="print-dialog" :close-on-click-modal="false">
      <div class="print-width-control">
        <span>预览宽度：</span>
        <el-slider v-model="printDialogWidthNum" :min="500" :max="1200" :step="50" :format-tooltip="v => v + 'px'" style="width: 200px" />
        <el-button-group>
          <el-button size="small" @click="printDialogWidthNum = 720">默认</el-button>
          <el-button size="small" @click="printDialogWidthNum = 900">宽屏</el-button>
          <el-button size="small" @click="printDialogWidthNum = 1100">最大</el-button>
        </el-button-group>
      </div>
      <div class="print-preview-content" id="printArea">
        <!-- 基本信息区 -->
        <div class="print-header">
          <h2>设计审核单</h2>
          <div class="print-info">
            <div class="info-row"><span class="label">工单号:</span><span>{{ data?.work_order_no }}</span></div>
            <div class="info-row"><span class="label">店铺名:</span><span>{{ data?.title }}</span></div>
            <div class="info-row"><span class="label">元素:</span><span>{{ projectTypeLabel(data?.project_type) }}</span></div>
            <div class="info-row"><span class="label">设计师:</span><span>{{ designData?.designer_name || '—' }}</span></div>
            <div class="info-row"><span class="label">版本:</span><span>v{{ designData?.version }}</span></div>
            <div class="info-row"><span class="label">日期:</span><span>{{ new Date().toLocaleDateString() }}</span></div>
          </div>
        </div>
        <!-- 设计图区域 -->
        <div class="print-designs">
          <h3>设计效果图</h3>
          <div class="design-images-print">
            <div v-for="(item, i) in designImagesWithInfo" :key="i" class="design-image-item" :class="{ 'full-width': designImages.length === 1, 'half-width': designImages.length === 2 }">
              <div class="image-above-label">{{ item.materialName }} {{ item.size }}</div>
              <img :src="item.url" :alt="item.materialName + ' ' + item.size" />
            </div>
          </div>
        </div>
        <!-- 签字区 -->
        <div class="print-signature">
          <div class="signature-item">
            <span>设计师签字:</span>
            <div class="signature-line"></div>
          </div>
          <div class="signature-item">
            <span>审核人签字:</span>
            <div class="signature-line"></div>
          </div>
          <div class="signature-item">
            <span>日期:</span>
            <div class="signature-line"></div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showPrintDialog = false">关闭</el-button>
        <el-dropdown @command="handleCaptureAction">
          <el-button type="info" :loading="capturing">
            📷 截图 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="copy">复制到剪贴板</el-dropdown-item>
              <el-dropdown-item command="save">保存为图片</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="primary" @click="previewPdf" :loading="pdfGenerating">
          预览PDF
        </el-button>
        <el-button type="success" @click="doPrint" :loading="pdfGenerating">
          <el-icon><Printer /></el-icon> 下载PDF
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Check, Close, Document, Printer, ArrowDown } from '@element-plus/icons-vue'
import api from '../api'
import { useElementOptions } from '../composables/useElementOptions'
import { STAGE_MAP } from '../utils/format'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const loadError = ref(null)
const data = ref(null)
const auditType = ref('')
const showRejectDialog = ref(false)
const rejectReason = ref('')
const logs = ref([])
const showPrintDialog = ref(false)
const pdfGenerating = ref(false)
const printDialogWidthNum = ref(720)
const capturing = ref(false)

// Detail data
const measurementData = ref(null)
const designData = ref(null)
const constructionData = ref(null)
const measureRef = ref([])
const designImages = ref([])
const declarationPhotos = ref([])
const constructionPhotos = ref([])
const sitePhotos = ref([]) // 现场照片（从测量数据提取）
const designPdfs = ref([]) // 设计 PDF 文件

const printDialogWidth = computed(() => printDialogWidthNum.value + 'px')

function stageLabel(s) { return STAGE_MAP[s] || s }

const { labelOf: projectTypeLabel, load: loadElementOptions } = useElementOptions()

const adTypeMap = ref({})

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

function materialTypeLabel(v) {
  if (!v) return '未分类'
  return adTypeMap.value[v] || v
}

function groupMaterials(materials) {
  const map = {}
  for (const m of materials) {
    let mats = m.materials || []
    if (typeof mats === 'string') { try { mats = JSON.parse(mats) } catch { mats = [] } }
    if (!Array.isArray(mats)) continue
    for (const mat of mats) {
      const type = mat.material_type || mat.type || '未分类'
      if (!map[type]) map[type] = { type, faces: [], totalArea: 0 }
      for (const face of (mat.faces || [])) {
        let w = face.width || face._widthM || 0
        let h = face.height || face._heightM || 0
        const storedArea = face.area || 0
        // w/h 单位是 cm，如果没有存储的面积，需要 /10000 转成 m²
        const area = storedArea > 0 ? storedArea : (w * h) / 10000
        map[type].faces.push({
          label: face.label || '未知面',
          width: w,
          height: h,
          area,
          photos: face.photos || [],
          isUnified: face.is_unified || face.isUnified || false,
          groupName: face.group_name || face.groupName || '',
        })
        map[type].totalArea += area
      }
    }
  }
  // 按 group_name 分组，一体组合放一起
  for (const type of Object.values(map)) {
    const groups = {}
    const ungrouped = []
    for (const face of type.faces) {
      if (face.isUnified && face.groupName) {
        if (!groups[face.groupName]) groups[face.groupName] = { key: 'u_' + face.groupName, groupName: face.groupName, isUnified: true, faces: [] }
        groups[face.groupName].faces.push(face)
      } else {
        ungrouped.push(face)
      }
    }
    type.groupedFaces = [...Object.values(groups), ...ungrouped.map(f => ({ key: f.label, groupName: '', isUnified: false, faces: [f] }))]
  }
  return Object.values(map)
}

const groupedMaterials = computed(() => groupMaterials(measurementData.value ? [measurementData.value] : []))

const designGroupedMaterials = computed(() => groupMaterials(measureRef.value))

// 测量材料数据（直接解析，用于测量审核）
const measurementMaterials = computed(() => {
  if (!measurementData.value) return []
  let mats = measurementData.value.materials || []
  if (typeof mats === 'string') { try { mats = JSON.parse(mats) } catch { mats = [] } }
  return mats
})

// 设计审核中的测量材料数据
const designMeasurementMaterials = computed(() => {
  if (!measureRef.value || !measureRef.value.length) return []
  let mats = measureRef.value[0]?.materials || []
  if (typeof mats === 'string') { try { mats = JSON.parse(mats) } catch { mats = [] } }
  return mats
})

// 计算材料总面积
function matTotalArea(faces) {
  if (!faces || !Array.isArray(faces)) return '0.00'
  return faces.reduce((s, f) => s + (f.area || 0), 0).toFixed(2)
}

// 照片预览
function previewFacePhotos(photos) {
  if (!photos.length) return
  previewPhotos.value = photos.map(getFullUrl)
  showPhotoPreview.value = true
}

const showPhotoPreview = ref(false)
const previewPhotos = ref([])

// 按面对应的对比数据：现场照片 vs 设计效果图
const compareGroups = computed(() => {
  if (!measurementData.value) return []
  let mats = measurementData.value.materials || []
  if (typeof mats === 'string') { try { mats = JSON.parse(mats) } catch { mats = [] } }
  const mapping = designData.value?.face_mapping || []

  // 构建设计图映射
  const unifiedDesignMap = {}  // material_type_group_index -> [urls]
  const faceDesignMap = {}     // face_label -> [urls]
  for (const item of mapping) {
    const imgUrl = getFullUrl(item.image_url)
    if (!imgUrl) continue
    if (item.face_labels && Array.isArray(item.face_labels) && item.group_index !== undefined && item.group_index >= 0) {
      const key = (item.material_type || '') + '_' + item.group_index
      if (!unifiedDesignMap[key]) unifiedDesignMap[key] = { faceLabels: item.face_labels, urls: [] }
      unifiedDesignMap[key].urls.push(imgUrl)
    } else if (item.face_label) {
      if (!faceDesignMap[item.face_label]) faceDesignMap[item.face_label] = []
      faceDesignMap[item.face_label].push(imgUrl)
    }
  }

  const groups = []
  // 遍历每个材料（保留顺序，不合并同名材料）
  for (let mi = 0; mi < mats.length; mi++) {
    const mat = mats[mi]
    const matType = mat.material_type || mat.type || '未分类'
    const faces = mat.faces || []
    if (!faces.length) continue

    // 同一材料内按 group_name 分组，分配 groupIdx（跟设计提交时一致）
    const subGroups = {}
    for (const face of faces) {
      const groupName = face.group_name || ''
      const isUnified = face.is_unified || face.isUnified || false
      if (!subGroups[groupName]) subGroups[groupName] = { groupName, isUnified, faces: [] }
      subGroups[groupName].faces.push(face)
    }
    const subGroupList = Object.values(subGroups)
    let gIdx = 0
    for (const g of subGroupList) g.groupIdx = gIdx++

    for (const g of subGroupList) {
      const matName = materialTypeLabel(matType)
      const displayName = g.groupName ? matName + ' - ' + g.groupName : matName
      const pairs = []

      if (g.isUnified) {
        const designKey = matType + '_' + g.groupIdx
        const designUrls = unifiedDesignMap[designKey]?.urls || []
        const sitePhotos = []
        const faceLabels = []
        let totalW = 0, maxH = 0
        for (const face of g.faces) {
          const label = face.label || face.face_name || '未知面'
          faceLabels.push(label)
          for (const p of (face.photos || [])) {
            const url = getFullUrl(p)
            if (url) sitePhotos.push(url)
          }
          const w = face._widthM ? face._widthM * 100 : (face.width || 0)
          const h = face._heightM ? face._heightM * 100 : (face.height || 0)
          totalW += w
          maxH = Math.max(maxH, h)
        }
        pairs.push({
          faceLabel: faceLabels.join(' + '),
          sitePhotos,
          designImages: [...new Set(designUrls)],
        })
        groups.push({ name: displayName, isUnified: true, sizeText: totalW > 0 ? `${totalW.toFixed(0)}×${maxH.toFixed(0)}cm` : '', pairs })
      } else {
        for (const face of g.faces) {
          const label = face.label || face.face_name || '未知面'
          const sitePhotos = (face.photos || []).map(getFullUrl).filter(Boolean)
          const designUrls = faceDesignMap[label] || []
          pairs.push({ faceLabel: label, sitePhotos, designImages: [...new Set(designUrls)] })
        }
        groups.push({ name: displayName, isUnified: false, sizeText: '', pairs })
      }
    }
  }

  return groups
})

// 设计图片带尺寸和材料信息
const designImagesWithInfo = computed(() => {
  const result = []
  const mapping = designData.value?.face_mapping || []
  // 获取原始测量数据
  let rawMaterials = measurementData.value?.materials || []
  if (typeof rawMaterials === 'string') {
    try { rawMaterials = JSON.parse(rawMaterials) } catch { rawMaterials = [] }
  }

  // 从face_mapping提取图片与面的对应关系
  const imageToInfo = new Map()
  for (const item of mapping) {
    const imgUrl = getFullUrl(item.image_url)
    if (!imgUrl) continue

    const info = imageToInfo.get(imgUrl) || {
      faces: [],
      materialTypes: new Set(),
      groupIndex: item.group_index
    }

    // 一体组合：face_labels 是数组
    if (item.face_labels && Array.isArray(item.face_labels)) {
      info.faces = item.face_labels
      info.isUnified = true
    } else if (item.face_label) {
      info.faces.push(item.face_label)
    }

    if (item.material_type) info.materialTypes.add(materialTypeLabel(item.material_type))
    imageToInfo.set(imgUrl, info)
  }

  // 辅助函数：从原始测量数据查找面的尺寸
  const findFaceSize = (materialType, faceLabel) => {
    for (const mat of rawMaterials) {
      if (!Array.isArray(mat.faces)) continue
      for (const face of mat.faces) {
        if (face.label === faceLabel) {
          return { width: face.width, height: face.height }
        }
      }
    }
    return null
  }

  // 为每张设计图添加信息
  for (const url of designImages.value) {
    const info = imageToInfo.get(url)
    let sizeText = ''
    let faceLabel = ''

    if (info?.faces.length) {
      // 构建面标签文本
      if (info.isUnified && info.faces.length > 1) {
        faceLabel = info.faces.join('+') + ' 一体'
        // 一体组合：找出最大宽度和高度
        let maxW = 0, maxH = 0
        for (const f of info.faces) {
          const size = findFaceSize(info.materialTypes.values().next().value, f)
          if (size) {
            maxW = Math.max(maxW, size.width || 0)
            maxH = Math.max(maxH, size.height || 0)
          }
        }
        if (maxW && maxH) {
          sizeText = `${maxW}×${maxH}cm`
        }
      } else {
        // 单面：直接获取尺寸
        faceLabel = info.faces[0]
        const mats = Array.from(info.materialTypes)
        for (const matType of mats) {
          const size = findFaceSize(matType, faceLabel)
          if (size) {
            sizeText = `${size.width}×${size.height}cm`
            break
          }
        }
      }
    }

    result.push({
      url,
      materialName: info?.materialTypes.size ? Array.from(info.materialTypes).join('/') : '',
      size: sizeText,
      faces: info?.faces || [],
      faceLabel // 新增：面的标签（一体面显示如"门头+侧面 一体"）
    })
  }

  return result
})

function getFullUrl(u) {
  if (!u) return ''
  if (u.startsWith('http')) return u
  const origin = window.location.origin
  return u.startsWith('/') ? origin + u : origin + '/' + u
}

async function loadData() {
  loading.value = true
  loadError.value = null
  const id = route.params.id
  try {
    // 并行获取工单详情、申报信息、日志、设置
    const [woRes, declRes, logRes] = await Promise.all([
      api.get(`/work-orders/${id}`),
      api.get(`/tenant/declarations/${id}`).catch(() => ({})),
      api.get(`/work-orders/${id}/logs`).catch(() => ({})),
      loadSettings(),
    ])
    data.value = woRes.data || woRes
    auditType.value = determineAuditType(data.value)
    declarationPhotos.value = ((declRes.data || {}).photos || []).map(u => getFullUrl(u))
    logs.value = logRes.data?.list || logRes.data || []

    // 根据审核类型获取相关数据
    const type = auditType.value

    if (type === 'measurement' || type === 'design') {
      // 测量数据优先从工单详情获取
      let m = data.value.measurements?.[0] || data.value.measurement
      if (!m) {
        // 如果工单详情没有，再调用测量 API
        try {
          const mRes = await api.get(`/measurements/tasks/${id}`)
          m = mRes.data?.measurements?.[0] || mRes.data
        } catch {}
      }
      if (m) {
        measurementData.value = m
        if (m.measurer_id || m.measurer_name) {
          measurementData.value.measurer_name = m.measurer_name || ''
        }
      }
    }

    if (type === 'design') {
      // 设计数据优先从工单详情获取
      let d = data.value.designs?.[0] || data.value.design
      if (d) {
        designData.value = d
        designImages.value = ((d.effect_images || [])).map(u => getFullUrl(u))
        // 提取 PDF 文件
        const files = d.source_files || []
        designPdfs.value = files.filter(f => {
          const url = f?.url || f || ''
          return url.toLowerCase().endsWith('.pdf')
        }).map(f => ({
          name: f?.name || (typeof f === 'string' ? f.split('/').pop() : '设计文件.pdf'),
          url: getFullUrl(f?.url || f)
        }))
        designData.value.designer_name = d.designer_name || ''
      }
      // 提取现场照片
      if (measurementData.value) {
        measureRef.value = [measurementData.value]
        try {
          let mats = measurementData.value.materials || []
          if (typeof mats === 'string') mats = JSON.parse(mats)
          if (Array.isArray(mats)) {
            const photoSet = new Set()
            for (const mat of mats) {
              for (const face of (mat.faces || [])) {
                for (const p of (face.photos || [])) {
                  const url = getFullUrl(p)
                  if (url) photoSet.add(url)
                }
              }
            }
            sitePhotos.value = Array.from(photoSet)
          }
        } catch { sitePhotos.value = [] }
      }
    }

    if (type === 'construction') {
      // 施工数据从工单详情获取
      const c = data.value.constructions?.[0] || data.value.construction
      if (c) {
        constructionData.value = c
        constructionPhotos.value = ((c.after_photos || c.completed_photos || [])).map(u => getFullUrl(u))
        constructionData.value.constructor_name = c.constructor_name || ''
      }
    }
  } catch (e) {
    const errorMsg = e.response?.data?.error || e.message || '加载失败'
    loadError.value = errorMsg
    ElMessage.error(errorMsg)
  } finally {
    loading.value = false
  }
}

function determineAuditType(wo) {
  if (!wo) return ''
  const stage = wo.current_stage
  if (stage === 'measurement') return 'measurement'
  if (stage === 'design') return 'design'
  if (stage === 'construction') return 'construction'
  // Fallback: check if there's a pending review
  if (wo.measurement?.status === 'measured') return 'measurement'
  return 'design'
}

async function handleApprove() {
  submitting.value = true
  try {
    if (auditType.value === 'measurement') {
      await api.post(`/measurements/${route.params.id}/review`, { action: 'approve' })
    } else if (auditType.value === 'design') {
      await api.post(`/designs/${route.params.id}/review`, { action: 'approve' })
    } else if (auditType.value === 'construction') {
      await api.post(`/construction/${route.params.id}/internal-verify`, { verified: true, notes: '' })
    }
    ElMessage.success('审核通过')
    router.push('/audit')
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  } finally {
    submitting.value = false
  }
}

function openRejectDialog() {
  rejectReason.value = ''
  showRejectDialog.value = true
}

async function confirmReject() {
  if (!rejectReason.value.trim()) return ElMessage.warning('请填写驳回原因')
  submitting.value = true
  try {
    if (auditType.value === 'measurement') {
      await api.post(`/measurements/${route.params.id}/review`, {
        action: 'reject', reason: rejectReason.value.trim(),
      })
    } else if (auditType.value === 'design') {
      await api.post(`/designs/${route.params.id}/review`, {
        action: 'reject', comment: rejectReason.value.trim(),
      })
    } else if (auditType.value === 'construction') {
      await api.post(`/construction/${route.params.id}/internal-verify`, {
        verified: false, notes: rejectReason.value.trim(),
      })
    }
    ElMessage.success('已驳回')
    router.push('/audit')
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  } finally {
    submitting.value = false
  }
}

function printPreview() {
  showPrintDialog.value = true
}

async function doPrint() {
  const printContent = document.getElementById('printArea')
  if (!printContent) return

  pdfGenerating.value = true
  try {
    const html2pdf = (await import('html2pdf.js')).default
    const opt = {
      margin: 10,
      filename: `${data.value?.work_order_no || '设计审核单'}_设计稿.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'avoid-all' }
    }
    await html2pdf().set(opt).from(printContent).save()
    ElMessage.success('PDF已下载')
  } catch (e) {
    console.error('PDF生成失败:', e)
    ElMessage.error('PDF生成失败，请重试')
  } finally {
    pdfGenerating.value = false
  }
}

async function previewPdf() {
  const printContent = document.getElementById('printArea')
  if (!printContent) return

  pdfGenerating.value = true
  try {
    const html2pdf = (await import('html2pdf.js')).default
    const opt = {
      margin: 10,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'avoid-all' }
    }
    const pdf = await html2pdf().set(opt).from(printContent).outputPdf('blob')
    const url = URL.createObjectURL(pdf)
    window.open(url, '_blank')
  } catch (e) {
    console.error('PDF预览失败:', e)
    ElMessage.error('PDF预览失败，请重试')
  } finally {
    pdfGenerating.value = false
  }
}

function handleCaptureAction(command) {
  captureScreenshot(command)
}

async function captureScreenshot(mode = 'save') {
  const printContent = document.getElementById('printArea')
  if (!printContent) return

  capturing.value = true
  try {
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(printContent, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    })

    if (mode === 'copy') {
      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ])
          ElMessage.success('截图已复制到剪贴板')
        } catch {
          ElMessage.error('复制失败，请尝试保存为图片')
        }
      }, 'image/png')
    } else {
      const link = document.createElement('a')
      link.download = `${data.value?.work_order_no || '设计审核单'}_截图.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      ElMessage.success('截图已保存')
    }
  } catch (e) {
    console.error('截图失败:', e)
    ElMessage.error('截图失败，请重试')
  } finally {
    capturing.value = false
  }
}

onMounted(() => { loadElementOptions(); loadData() })
</script>

<style scoped>
.page-header { margin-bottom: var(--space-6); }
.header-left { display: flex; align-items: center; gap: var(--space-3); }
.back-btn { font-size: 13px; color: var(--color-text-secondary); }
.back-btn:hover { color: var(--color-primary); }
.page-actions { display: flex; gap: var(--space-2); }
.mb-16 { margin-bottom: var(--space-4); }
.card-title { font-weight: var(--font-weight-semibold); font-size: var(--font-size-sm); }
.log-user { color: var(--color-text-secondary); font-size: 12px; }

/* Material sections - same as MeasureReview */
.material-section { border: 1px solid var(--color-border-light); border-radius: var(--radius-sm); margin-bottom: var(--space-3); overflow: hidden; }
.mat-header { background: var(--color-bg-page); padding: var(--space-3) var(--space-4); font-weight: var(--font-weight-medium); font-size: var(--font-size-sm); }
.mat-body { padding: 0 var(--space-4); }
.face-header { display: grid; grid-template-columns: 100px 100px 100px 100px 1fr 80px; gap: var(--space-2); padding: var(--space-2) 0 var(--space-1); font-size: var(--font-size-xs); color: var(--color-text-tertiary); border-bottom: 1px solid var(--color-border-light); }
.face-row { display: grid; grid-template-columns: 100px 100px 100px 100px 1fr 80px; gap: var(--space-2); padding: var(--space-2) 0; border-bottom: 1px solid var(--color-border-light); font-size: var(--font-size-xs); align-items: center; }
.face-row:last-child { border-bottom: none; }
.face-header-5col, .face-row-5col { grid-template-columns: 100px 100px 100px 100px 1fr; }
.face-label { color: var(--color-text-secondary); }
.face-area { color: var(--color-primary); font-weight: var(--font-weight-medium); }
.action-link { color: var(--color-primary); cursor: pointer; }

/* Photos */
.photo-section, .design-section, .ref-section { margin-top: 16px; }
.section-label { font-size: 13px; font-weight: 700; margin-bottom: 10px; color: var(--color-text-secondary); }
.photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; }
.photo-thumb { width: 100%; height: 80px; border-radius: 6px; cursor: pointer; border: 1px solid #e5e7eb; }
.face-photo-thumb { width: 48px; height: 48px; border-radius: 4px; cursor: pointer; border: 1px solid #e5e7eb; }

.design-images-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
.design-image { width: 100%; height: 180px; border-radius: 8px; cursor: pointer; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }

/* PDF section */
.pdf-section { margin-bottom: 16px; }
.pdf-list { display: flex; flex-direction: column; gap: 8px; }
.pdf-link {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; background: #f5f7fa; border-radius: 6px;
  color: var(--color-text-primary); font-size: 13px;
  transition: all 0.2s;
}
.pdf-link:hover { background: #e6f7ff; color: var(--color-primary); }
.pdf-link .el-icon { color: var(--color-primary); }

/* Compare section */
.compare-section { margin-top: 16px; border: 1px solid var(--color-border-light); border-radius: 8px; padding: 16px; }
.compare-list { display: flex; flex-direction: column; gap: 16px; }
.compare-group { border: 1px solid var(--color-border-light); border-radius: 8px; overflow: hidden; }
.compare-group-header {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; background: #f5f7fa;
  font-size: 13px; font-weight: 700;
}
.compare-group-name { color: #374151; }
.compare-group-size { margin-left: auto; font-size: 12px; color: var(--color-text-tertiary); font-weight: 400; }
.compare-pair {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px; border-top: 1px solid #f0f0f0;
}
.compare-side { flex: 1; min-width: 0; }
.compare-label { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.compare-face-name { font-size: 12px; color: var(--color-text-secondary); font-weight: 500; }
.compare-photos { display: flex; flex-wrap: wrap; gap: 6px; }
.compare-image { width: 120px; height: 120px; border-radius: 6px; cursor: pointer; border: 1px solid #e5e7eb; }
.compare-arrow { font-size: 18px; color: var(--color-text-tertiary); align-self: center; padding: 0 4px; flex-shrink: 0; }
.no-photo-text { font-size: 12px; color: var(--color-text-tertiary); line-height: 120px; text-align: center; }

/* Print preview styles */
.print-preview-content { padding: 20px; background: #fff; }
.print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
.print-header h2 { margin: 0 0 15px 0; font-size: 20px; }
.print-info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: left; }
.info-row { font-size: 13px; }
.info-row .label { color: #666; margin-right: 8px; }
.print-designs { margin: 20px 0; }
.print-designs h3 { font-size: 14px; margin-bottom: 12px; border-left: 3px solid var(--color-primary); padding-left: 8px; }
.design-images-print { display: flex; flex-direction: column; gap: 24px; }
.design-image-item { text-align: center; page-break-inside: avoid; }
.design-image-item.full-width { max-width: 100%; }
.design-image-item img { max-width: 100%; height: auto; max-height: 500px; object-fit: contain; border: 1px solid #ddd; background: #fafafa; }
.image-above-label { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 8px; text-align: center; }
.print-width-control { display: flex; align-items: center; gap: 12px; padding: 8px 12px; margin-bottom: 12px; background: #f5f7fa; border-radius: 6px; font-size: 13px; color: #666; }
.print-width-control .el-slider { flex: 1; max-width: 200px; }
.print-signature { margin-top: 30px; display: flex; justify-content: space-between; padding-top: 20px; border-top: 1px solid #eee; }
.signature-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.signature-line { width: 120px; border-bottom: 1px solid #333; height: 1px; }

/* 一体标识 */
.unified-row { background: #fff7ed; }
.unified-row + .unified-row td { border-top: none; }
.unified-cell { position: relative; }
.unified-cell.is-unified { padding-left: 28px; }
.unified-bar {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--color-warning);
}
.unified-cell.is-first .unified-bar { border-radius: 2px 2px 0 0; }
.unified-cell.is-last .unified-bar { border-radius: 0 0 2px 2px; }
.unified-tag {
  position: absolute;
  left: 6px; top: 50%;
  transform: translateY(-50%);
  background: var(--color-warning);
  color: #fff;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}
</style>
