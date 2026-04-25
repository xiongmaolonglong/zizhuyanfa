<template>
  <div class="design-detail-page" v-loading="loading">
    <!-- 顶栏 -->
    <div class="top-header">
      <div class="header-left">
        <div class="wo-badge">{{ data.work_order?.work_order_no || '' }}</div>
        <h1 class="page-title">{{ data.work_order?.title || '' }}</h1>
        <!-- 一体广告标识 -->
        <el-tag v-if="hasUnifiedDesign" type="warning" effect="dark" class="unified-tag">
          <el-icon><Box /></el-icon>
          {{ unifiedGroupCount }}个一体组合
        </el-tag>
        <!-- 状态标签 -->
        <el-tag :type="designStatusType" effect="light" class="status-tag">{{ designStatusTitle }}</el-tag>
        <!-- 上传进度 -->
        <el-tag type="warning" effect="light" class="progress-tag">
          已上传 {{ uploadedCount }}/{{ totalFaceCount }} 面
        </el-tag>
      </div>
      <div class="header-right">
        <el-tag v-if="data.work_order?.designer_id" type="success" effect="plain" class="designer-tag">
          <el-icon><User /></el-icon>
          设计师: {{ data.work_order.designer?.name }}
        </el-tag>
        <el-select v-else v-model="selectedDesignerId" placeholder="选择设计师" style="width: 140px" @change="handleAssignDesigner">
          <el-option v-for="d in designers" :key="d.id" :label="d.name" :value="d.id" />
        </el-select>
      </div>
    </div>

    <!-- 内容区（左右两栏） -->
    <div class="main-content">
      <!-- 左侧：测量数据面板 -->
      <div class="measure-panel">
        <div class="panel-header">
          <span class="panel-title">测量数据</span>
          <span class="panel-count">{{ totalFaceCount }}面 · {{ totalArea.toFixed(2) }}m²</span>
        </div>
        <div class="panel-body">
          <!-- 按材料分组展示 -->
          <div v-for="mat in groupedMaterials" :key="mat.type" class="mat-group" :class="'mat-' + getMatClass(mat.type)">
            <div class="mat-head">
              <span class="mat-dot"></span>
              <span class="mat-name">{{ materialTypeLabel(mat.type) }}<span v-if="data.declaration?.project_type" class="mat-element"> - {{ projectTypeLabel(data.declaration.project_type) }}</span></span>
              <span class="mat-area">{{ mat.totalArea.toFixed(2) }}m²</span>
            </div>
            <!-- 一体组合 -->
            <div v-for="(group, gi) in mat.groups" :key="gi" class="unified-group">
              <div v-if="group.isUnified" class="unified-header">
                <el-tag type="warning" effect="dark" size="small" class="unified-badge">一体</el-tag>
                <span class="unified-name">{{ group.name || '组合' + (gi + 1) }}</span>
                <span class="unified-size">{{ Number(group.totalW||0).toFixed(2) }}×{{ Number(group.totalH||0).toFixed(2) }}cm</span>
              </div>
              <!-- 各面数据 -->
              <div class="faces-list">
                <div v-for="(face, fi) in group.faces" :key="fi" class="face-item">
                  <div class="face-row">
                    <span class="face-name">{{ face.label }}</span>
                    <span class="face-dim">{{ Number(face.width||0).toFixed(2) }}×{{ Number(face.height||0).toFixed(2) }}</span>
                    <span class="face-area">{{ face.area.toFixed(2) }}m²</span>
                    <!-- 显示额外字段 -->
                    <span v-for="ef in getFaceExtraFields(face)" :key="ef.key" class="face-extra">
                      {{ ef.value }}{{ ef.label }}
                    </span>
                    <div v-if="face.photos?.length" class="face-photos">
                      <el-image v-for="(url, pi) in face.photos.slice(0, 3)" :key="pi"
                        :src="url" :preview-src-list="face.photos" fit="cover" class="face-photo-thumb" />
                    </div>
                  </div>
                  <div v-if="face.notes" class="face-notes">备注: {{ face.notes }}</div>
                  <!-- 独立面：每个面下面显示复制条 -->
                  <div v-if="!group.isUnified" class="face-info-bar" @click="copyFaceInfo(mat, face)">
                    {{ buildFaceInfo(mat, face) }}
                    <el-icon class="copy-icon"><CopyDocument /></el-icon>
                  </div>
                </div>
              </div>
              <!-- 一体组合：所有面下面显示一条复制条 -->
              <div v-if="group.isUnified" class="mat-info-bar" @click="copyGroupInfo(mat, group)">
                {{ buildGroupInfo(mat, group) }}
                <el-icon class="copy-icon"><CopyDocument /></el-icon>
              </div>
            </div>
          </div>
          <el-empty v-if="!groupedMaterials.length" description="暂无测量数据" :image-size="60" />
        </div>
      </div>

      <!-- 右侧：设计上传工作区 -->
      <div class="work-panel">
        <div class="work-header">
          <el-icon><Picture /></el-icon>
          <span class="work-title">设计上传</span>
          <span class="work-hint">点击下方的卡片上传效果图</span>
        </div>

        <!-- 驳回提示 -->
        <div v-if="data.design?.status === 'rejected'" class="rejected-banner">
          <el-alert type="error" :closable="false" show-icon>
            <template #title>驳回原因</template>
            {{ data.design.review_comment || '无' }}
          </el-alert>
        </div>

        <div class="work-body">
          <!-- 上传卡片区 -->
          <div class="upload-grid">
            <template v-for="mat in groupedMaterials" :key="mat.type">
              <template v-for="(group, gi) in mat.groups" :key="gi">
                <!-- 一体广告卡片 -->
                <div v-if="group.isUnified"
                     class="upload-card unified-card"
                     :class="{ 'uploaded': isGroupUploaded(mat.type, gi) || getGroupDesignImages(mat.type, gi).length }">
                  <div class="card-info">
                    <div class="card-mat">
                      <span class="mat-dot" :class="'mat-' + getMatClass(mat.type)"></span>
                      {{ materialTypeLabel(mat.type) }}
                    </div>
                    <div class="card-header">
                      <el-tag type="warning" effect="dark" size="small">一体</el-tag>
                      <span class="card-name">{{ group.name || '组合' + (gi + 1) }}</span>
                    </div>
                    <div class="card-size">{{ Number(group.totalW||0).toFixed(2) }}×{{ Number(group.totalH||0).toFixed(2) }}cm</div>
                    <div class="card-meta">{{ group.faces.length }}面一体 · {{ group.totalArea?.toFixed(2) || '-' }}m²</div>
                  </div>
                  <!-- 现场照片 -->
                  <div class="card-photos" v-if="group.faces.some(f => f.photos?.length)">
                    <el-image v-for="(url, pi) in group.faces.flatMap(f => f.photos || []).slice(0, 4)" :key="pi"
                      :src="url" :preview-src-list="group.faces.flatMap(f => f.photos || [])" fit="cover" class="photo-thumb" />
                  </div>
                  <!-- 拼接示意 -->
                  <div class="card-preview">
                    <div v-for="(face, fi) in group.faces" :key="fi"
                         class="preview-face"
                         :style="{ width: getPreviewWidth(face, group) + 'px', height: getPreviewHeight(face, group) + 'px' }">
                      {{ face.label }}
                    </div>
                  </div>
                  <!-- 已上传的设计稿图片 -->
                  <div v-if="getGroupDesignImages(mat.type, gi).length" class="card-design-images">
                    <el-image v-for="(url, di) in getGroupDesignImages(mat.type, gi)" :key="di"
                      :src="url" :preview-src-list="getGroupDesignImages(mat.type, gi)" fit="cover" class="design-img" />
                  </div>
                  <!-- 上传区（驳回状态或待设计时显示） -->
                  <div v-if="!isDesignLocked" class="card-upload">
                    <FileUpload v-model="designForm.unified_images[mat.type + '_' + gi]" :limit="3" />
                  </div>
                  <div class="card-check" :class="{ 'checked': isGroupUploaded(mat.type, gi) || getGroupDesignImages(mat.type, gi).length }">
                    <el-icon v-if="isGroupUploaded(mat.type, gi) || getGroupDesignImages(mat.type, gi).length"><Check /></el-icon>
                  </div>
                </div>

                <!-- 独立面卡片 -->
                <template v-else>
                  <div v-for="(face, fi) in group.faces" :key="fi"
                       class="upload-card face-card"
                       :class="{ 'uploaded': isFaceUploaded(face.label) || getFaceDesignImages(face.label).length }">
                    <div class="card-info">
                      <div class="card-mat">
                        <span class="mat-dot" :class="'mat-' + getMatClass(mat.type)"></span>
                        {{ materialTypeLabel(mat.type) }}
                      </div>
                      <div class="card-header">
                        <span class="card-name">{{ face.label }}</span>
                      </div>
                      <div class="card-size">{{ Number(face.width||0).toFixed(2) }}×{{ Number(face.height||0).toFixed(2) }}cm</div>
                    </div>
                    <!-- 现场照片 -->
                    <div class="card-photos">
                      <el-image v-for="(url, pi) in (face.photos || []).slice(0, 2)" :key="pi"
                                :src="url" :preview-src-list="face.photos" fit="cover" class="photo-thumb" />
                      <span v-if="!face.photos?.length" class="no-photo">无照片</span>
                    </div>
                    <!-- 已上传的设计稿图片 -->
                    <div v-if="getFaceDesignImages(face.label).length" class="card-design-images">
                      <el-image v-for="(url, di) in getFaceDesignImages(face.label)" :key="di"
                        :src="url" :preview-src-list="getFaceDesignImages(face.label)" fit="cover" class="design-img" />
                    </div>
                    <!-- 上传区（驳回状态或待设计时显示） -->
                    <div v-if="!isDesignLocked" class="card-upload">
                      <FileUpload v-model="designForm.face_images[face.label]" :limit="3" :key="'face-' + face.label" />
                    </div>
                    <div class="card-check" :class="{ 'checked': isFaceUploaded(face.label) || getFaceDesignImages(face.label).length }">
                      <el-icon v-if="isFaceUploaded(face.label) || getFaceDesignImages(face.label).length"><Check /></el-icon>
                    </div>
                  </div>
                </template>
              </template>
            </template>
          </div>

          <!-- 操作侧边栏 -->
          <div class="action-sidebar">
            <div class="sidebar-title">操作面板</div>

            <!-- 颜色规范提示 -->
            <div v-if="colorRequirement" class="color-requirement-box">
              <div class="color-req-header">
                <el-icon><WarningFilled /></el-icon>
                <span>颜色要求</span>
              </div>
              <div class="color-req-content">{{ colorRequirement }}</div>
            </div>

            <!-- 源文件 -->
            <div class="sidebar-section">
              <div class="section-label">源文件（可选）</div>
              <!-- 已保存的源文件 -->
              <div v-if="savedSourceFiles.length" class="saved-files">
                <div v-for="(file, idx) in savedSourceFiles" :key="idx" class="saved-file-item">
                  <el-icon><Document /></el-icon>
                  <span class="file-name">{{ getFileName(file) }}</span>
                </div>
              </div>
              <!-- 上传组件（锁定状态时隐藏） -->
              <FileUpload
                v-if="!isDesignLocked"
                v-model="designForm.source_files"
                :limit="5"
                accept=".psd,.ai,.cdr,.sketch,.fig,.pdf"
                list-type="text"
              />
            </div>

            <!-- 设计说明 -->
            <div class="sidebar-section">
              <div class="section-label">设计说明</div>
              <div v-if="data.design?.internal_notes && isDesignLocked" class="saved-notes">{{ data.design.internal_notes }}</div>
              <el-input v-else v-model="designForm.notes" type="textarea" :rows="3" placeholder="输入设计说明或备注..." />
            </div>

            <!-- 提交按钮（锁定状态隐藏） -->
            <el-button
              v-if="!isDesignLocked"
              type="primary"
              class="submit-btn"
              @click="submitDesign"
              :loading="submitting"
              :disabled="!isAllUploaded || !hasSourceFiles">
              提交设计稿
            </el-button>
            <div v-if="(!isAllUploaded || !hasSourceFiles) && !isDesignLocked" class="upload-warning">
              {{ !isAllUploaded ? '请先上传所有面的效果图' : '请先上传源文件' }}再提交
            </div>

            <!-- 上传进度（锁定状态隐藏） -->
            <div v-if="!isDesignLocked" class="progress-section">
              <span class="progress-label">上传进度</span>
              <div class="progress-bar-wrapper">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
                </div>
              </div>
              <span class="progress-text">已上传 {{ uploadedCount }}/{{ totalFaceCount }} 面</span>
            </div>

            <!-- 审核状态提示 -->
            <template v-if="data.design?.status === 'reviewing'">
              <el-divider />
              <el-alert type="info" :closable="false" show-icon style="margin-bottom: 12px;">
                设计稿审核中，请等待管理员审核
              </el-alert>
              <el-button type="warning" @click="handleWithdraw" :loading="submitting" style="width: 100%;">撤回修改</el-button>
            </template>

            <template v-if="data.design?.status === 'approved'">
              <el-divider />
              <el-button type="warning" @click="handleConfirm" :loading="submitting">确认定稿</el-button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 驳回对话框 -->
    <el-dialog v-model="showRejectDialog" title="驳回设计" width="480px">
      <el-form>
        <el-form-item label="驳回原因" required>
          <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请详细说明驳回原因及修改要求" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmReject" :loading="submitting">确认驳回</el-button>
      </template>
    </el-dialog>

    <!-- 检测警告对话框（合并尺寸和颜色） -->
    <el-dialog v-model="sizeWarningVisible" title="检测结果警告" width="600px">
      <!-- 尺寸警告 -->
      <div v-if="sizeWarnings.length > 0">
        <el-alert type="warning" :closable="false" show-icon style="margin-bottom: 12px">
          <template #title>尺寸不符合要求</template>
        </el-alert>
        <el-table :data="sizeWarnings" border size="small" style="margin-bottom: 16px">
          <el-table-column label="面" prop="label" width="100" />
          <el-table-column label="要求尺寸" prop="expected" width="140" />
          <el-table-column label="实际尺寸" prop="actual" width="140" />
          <el-table-column label="差异">
            <template #default="{ row }">
              <span style="color: var(--color-danger)">{{ row.diff }}%</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 颜色警告 -->
      <div v-if="colorWarnings.length > 0">
        <el-alert type="warning" :closable="false" show-icon style="margin-bottom: 12px">
          <template #title>颜色不符合要求</template>
        </el-alert>
        <el-table :data="colorWarnings" border size="small">
          <el-table-column label="要求颜色" prop="required" width="100" />
          <el-table-column label="实际主色调" prop="actual" width="100" />
          <el-table-column label="差异">
            <template #default="{ row }">
              <span style="color: var(--color-danger)">{{ row.diff }}%</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div style="margin-top: 16px; color: var(--color-text-secondary); font-size: 13px;">
        建议修改后重新上传，或确认无误后继续提交。
      </div>
      <template #footer>
        <el-button @click="closeWarningDialog">返回修改</el-button>
        <el-button type="warning" @click="forceSubmit">确认提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Box, Picture, Check, User, CopyDocument, WarningFilled, Document } from '@element-plus/icons-vue'
import api from '../api'
import FileUpload from '../components/FileUpload.vue'
import { useElementOptions } from '../composables/useElementOptions'

const route = useRoute()
const workOrderId = route.params.workOrderId

const loading = ref(true)
const submitting = ref(false)
const data = reactive({
  work_order: null,
  declaration: null,
  measurements: [],
  design: null,
  logs: [],
})

// ====== 新增计算属性 ======
// 总上传项数（一体组合算1项，独立面每面算1项）
const totalFaceCount = computed(() => {
  let count = 0
  for (const mat of groupedMaterials.value) {
    for (const g of mat.groups) {
      if (g.isUnified) {
        count += 1 // 一体组合算1项
      } else {
        count += g.faces.length // 独立面每面算1项
      }
    }
  }
  return count
})

// 总面积
const totalArea = computed(() => {
  return groupedMaterials.value.reduce((s, m) => s + m.totalArea, 0)
})

// 是否有一体广告
const hasUnifiedDesign = computed(() => {
  return groupedMaterials.value.some(m => m.groups.some(g => g.isUnified))
})

// 一体组合数量
const unifiedGroupCount = computed(() => {
  let count = 0
  for (const mat of groupedMaterials.value) {
    for (const g of mat.groups) {
      if (g.isUnified) count++
    }
  }
  return count
})

// 设计状态类型
const designStatusType = computed(() => {
  const map = {
    pending: 'warning',
    reviewing: 'primary',
    approved: 'success',
    rejected: 'danger',
    confirmed: 'success'
  }
  return map[data.design?.status] || 'info'
})

// 已上传数量（包含当前表单和已保存的设计稿）
const uploadedCount = computed(() => {
  let count = 0
  for (const mat of groupedMaterials.value) {
    for (let gi = 0; gi < mat.groups.length; gi++) {
      const g = mat.groups[gi]
      if (g.isUnified) {
        // 一体组合：检查表单或已保存的设计稿
        const key = mat.type + '_' + gi
        const hasFormImage = designForm.unified_images[key]?.length > 0
        const hasSavedImage = getGroupDesignImages(mat.type, gi).length > 0
        if (hasFormImage || hasSavedImage) count++
      } else {
        // 独立面：每个面单独检查
        for (const face of g.faces) {
          const hasFormImage = designForm.face_images[face.label]?.length > 0
          const hasSavedImage = getFaceDesignImages(face.label).length > 0
          if (hasFormImage || hasSavedImage) count++
        }
      }
    }
  }
  return count
})

// 上传进度
const uploadProgress = computed(() => {
  if (totalFaceCount.value === 0) return 0
  return (uploadedCount.value / totalFaceCount.value) * 100
})

// 是否所有面都已上传
const isAllUploaded = computed(() => {
  return totalFaceCount.value > 0 && uploadedCount.value >= totalFaceCount.value
})

// 是否已上传源文件
const hasSourceFiles = computed(() => {
  return designForm.source_files?.length > 0 || savedSourceFiles.value.length > 0
})

// 已保存的源文件（从数据库读取的）
const savedSourceFiles = computed(() => {
  if (!data.design?.source_files) return []
  const files = Array.isArray(data.design.source_files) ? data.design.source_files : []
  return files.map(getFullUrl).filter(Boolean)
})

// 设计稿是否锁定（不可编辑）
const isDesignLocked = computed(() => {
  const status = data.design?.status
  return status === 'reviewing' || status === 'approved' || status === 'confirmed'
})

// 预定义颜色类名数组
const MAT_COLORS = ['blue', 'green', 'yellow', 'gray']
const matColorCache = {}

// 获取材料样式类名（动态分配，避免硬编码）
function getMatClass(type) {
  if (!type) return 'gray'
  // 缓存已分配的颜色
  if (matColorCache[type]) return matColorCache[type]
  // 根据字符串生成稳定的索引
  let hash = 0
  for (let i = 0; i < type.length; i++) {
    hash = ((hash << 5) - hash) + type.charCodeAt(i)
    hash = hash & hash
  }
  const colorClass = MAT_COLORS[Math.abs(hash) % MAT_COLORS.length]
  matColorCache[type] = colorClass
  return colorClass
}

// 判断面是否已上传
function isFaceUploaded(faceLabel) {
  return designForm.face_images[faceLabel]?.length > 0
}

// 判断一体组合是否已上传
function isGroupUploaded(matType, groupIndex) {
  return designForm.unified_images[matType + '_' + groupIndex]?.length > 0
}

// 获取一体组合已上传的设计稿图片（非驳回状态才显示）
function getGroupDesignImages(matType, groupIndex) {
  // 驳回状态不显示已保存的图片（已在表单中编辑）
  if (data.design?.status === 'rejected') return []
  if (!data.design?.face_mapping) return []
  const images = []
  for (const mapping of data.design.face_mapping) {
    if (!mapping.image_url) continue
    // 新格式：有 group_index 字段
    if (mapping.group_index !== undefined && mapping.group_index >= 0) {
      if (mapping.material_type === matType && mapping.group_index === groupIndex) {
        images.push(getFullUrl(mapping.image_url))
      }
    } else if (mapping.face_labels) {
      // 兼容：有 face_labels 字段的一体组合
      if (mapping.material_type === matType) {
        images.push(getFullUrl(mapping.image_url))
      }
    } else if (mapping.group_index === undefined && !mapping.face_label) {
      // 老格式：没有 face_label 的一体组合
      if (mapping.material_type === matType) {
        images.push(getFullUrl(mapping.image_url))
      }
    }
  }
  // 去重
  return [...new Set(images)]
}

// 获取独立面已上传的设计稿图片（非驳回状态才显示）
function getFaceDesignImages(faceLabel) {
  // 驳回状态不显示已保存的图片（已在表单中编辑）
  if (data.design?.status === 'rejected') return []
  if (!data.design?.face_mapping) return []
  const images = []
  for (const mapping of data.design.face_mapping) {
    if (mapping.face_label === faceLabel && mapping.image_url) {
      images.push(getFullUrl(mapping.image_url))
    }
  }
  // 去重
  return [...new Set(images)]
}

// 预览宽度计算
function getPreviewWidth(face, group) {
  const maxW = Math.max(...group.faces.map(f => f.width || 0), 1)
  return Math.max(30, (face.width / maxW) * 80)
}

// 预览高度计算
function getPreviewHeight(face, group) {
  const maxH = Math.max(...group.faces.map(f => f.height || 0), 1)
  return Math.max(40, (face.height / maxH) * 100)
}

// 解析测量数据中的 JSON 字段
const parsedMeasurements = computed(() => {
  return data.measurements.map(m => {
    const parsed = { ...m }
    try {
      if (typeof m.materials === 'string') {
        parsed.materials = JSON.parse(m.materials)
      }
      if (typeof m.basic_info === 'string') {
        parsed.basic_info = JSON.parse(m.basic_info)
      }
    } catch {
      parsed.materials = m.materials || []
      parsed.basic_info = null
    }
    return parsed
  })
})

// 补录信息（合并工单、申报表、custom_data 中的所有表单字段）
const SUPPLEMENT_EXCLUDE = [
  'proxy_data', 'proxy_submitted_by', 'proxy_submitted_at',
  'template_id', 'id', 'created_at', 'updated_at', 'deleted_at',
  'client_id',
]

// 字段标签硬编码映射（表单配置未覆盖的内置字段）
const BUILTIN_LABELS = {
  project_name: '项目名称',
  project_type: '元素选择',
  full_address: '项目地址',
  detail_address: '详细地址',
  contact_name: '联系人',
  contact_phone: '联系电话',
}

// 表单字段标签映射（从表单配置 API 获取）
const fieldLabels = reactive({})
const fieldTypes = reactive({})
const qtyFieldKeys = reactive(new Set()) // 动态收集的张数字段 key

// 加载表单配置和项目模板（独立调用，失败不影响页面）
async function loadFormConfig() {
  try {
    const res = await api.get('/tenant/form-config/work_order_create')
    const fields = res.data?.fields || []
    function walkFields(list) {
      for (const f of list) {
        fieldLabels[f.field_key] = f.field_label
        fieldTypes[f.field_key] = f.field_type
        // 识别张数字段：label 包含"张"或"数量"
        if (f.field_label && (f.field_label.includes('张') || f.field_label.includes('数量'))) {
          qtyFieldKeys.add(f.field_key)
        }
        if (f.subform_template?.children) walkFields(f.subform_template.children)
      }
    }
    walkFields(fields)
  } catch { /* 静默，使用原始字段名 */ }

  // 同时加载项目模板配置（测量表单字段标签）
  try {
    const res = await api.get('/tenant/settings/project-templates')
    const templates = res.data?.templates || []
    for (const tmpl of templates) {
      for (const adType of (tmpl.ad_types || [])) {
        // 遍历分组和面的字段
        for (const group of (adType.groups || [])) {
          for (const face of (group.faces || [])) {
            for (const f of (face.fields || [])) {
              if (f.field_key) {
                fieldLabels[f.field_key] = f.field_label
                fieldTypes[f.field_key] = f.field_type
                // 识别张数字段
                if (f.field_label && (f.field_label.includes('张') || f.field_label.includes('数量'))) {
                  qtyFieldKeys.add(f.field_key)
                }
              }
            }
          }
        }
        // 兼容旧格式的 face_fields
        for (const f of (adType.face_fields || [])) {
          if (f.field_key) {
            fieldLabels[f.field_key] = f.field_label
            fieldTypes[f.field_key] = f.field_type
            if (f.field_label && (f.field_label.includes('张') || f.field_label.includes('数量'))) {
              qtyFieldKeys.add(f.field_key)
            }
          }
        }
      }
    }
  } catch { /* 静默 */ }
}

const supplementInfo = computed(() => {
  const result = []
  // 1) 从申报表取值
  if (data.declaration) {
    const declFields = [
      { key: 'project_type', label: '元素选择' },
      { key: 'full_address', label: '项目地址' },
      { key: 'detail_address', label: '详细地址' },
      { key: 'contact_name', label: '联系人' },
      { key: 'contact_phone', label: '联系电话' },
    ]
    for (const f of declFields) {
      const val = data.declaration[f.key]
      if (val) {
        result.push({ label: f.label, value: val, valueType: 'text' })
      }
    }
  }
  // 2) 从工单取值
  const woFields = [
    { key: 'title', label: '店铺名字', val: data.work_order?.title },
    { key: 'activity_name', label: '活动项目', val: data.work_order?.activity_name },
    { key: 'description', label: '需求描述', val: data.work_order?.description },
  ]
  for (const f of woFields) {
    if (f.val) {
      result.push({ label: f.label, value: f.val, valueType: 'text' })
    }
  }
  // 3) 从 custom_data 取自定义字段
  const cd = data.work_order?.custom_data
  if (cd) {
    const raw = typeof cd === 'string' ? JSON.parse(cd) : cd
    if (raw) {
      for (const [key, val] of Object.entries(raw)) {
        if (SUPPLEMENT_EXCLUDE.includes(key)) continue
        const label = fieldLabels[key] || BUILTIN_LABELS[key] || key
        const type = fieldTypes[key] || ''
        let displayVal = val
        let valueType = 'text'
        if (val === null || val === undefined) {
          displayVal = '-'
        } else if (type === 'image' && Array.isArray(val)) {
          displayVal = val.map(getFullUrl).filter(Boolean)
          valueType = 'image'
        } else if (type === 'file' && Array.isArray(val)) {
          displayVal = `${val.length} 个`
          valueType = 'text'
        } else if (Array.isArray(val)) {
          displayVal = val.join('、')
          valueType = 'text'
        }
        result.push({ label, value: displayVal, valueType })
      }
    }
  }
  return result
})

const MATERIAL_TYPE_FALLBACK = {
  spray_cloth: '喷绘布',
  acrylic: '亚克力板',
  aluminum: '铝塑板',
  stainless: '不锈钢',
  led_module: 'LED模组',
  other: '其他',
}

const adTypeMap = ref({})

function materialTypeLabel(v) {
  return adTypeMap.value[v] || MATERIAL_TYPE_FALLBACK[v] || v || '未分类'
}

const { labelOf: projectTypeLabel, load: loadElementOptions } = useElementOptions()

async function fetchAdTypeMap() {
  try {
    const res = await api.get('/tenant/settings/material-type-map')
    adTypeMap.value = res.data?.material_type_map || {}
  } catch {
    adTypeMap.value = {}
  }
  try {
    const res = await api.get('/tenant/settings/project-templates')
    const templates = res.data?.templates || []
    templates.forEach(t => {
      t.ad_types?.forEach(a => {
        if (a.key && a.label && !adTypeMap.value[a.key]) {
          adTypeMap.value[a.key] = a.label
        }
      })
    })
  } catch { /* 静默 */ }
}

// 设计颜色规范
const designColorRules = ref([])
const colorCheckConfig = ref({ enabled: true, tolerance: 30 })

async function loadDesignColorRules() {
  try {
    const res = await api.get('/tenant/settings')
    designColorRules.value = res.data?.design_color_rules || []
    sizeCheckConfig.value = res.data?.size_check_config || { enabled: true, tolerance: 10, dpi: 96 }
    colorCheckConfig.value = res.data?.color_check_config || { enabled: true, tolerance: 30 }
  } catch {
    designColorRules.value = []
    sizeCheckConfig.value = { enabled: true, tolerance: 10, dpi: 96 }
    colorCheckConfig.value = { enabled: true, tolerance: 30 }
  }
}

// 尺寸检测配置
const sizeCheckConfig = ref({ enabled: true, tolerance: 10, dpi: 96 })

// 根据元素获取颜色要求
const colorRequirement = computed(() => {
  const projectType = data.declaration?.project_type
  if (!projectType || !designColorRules.value.length) return ''
  const rule = designColorRules.value.find(r => r.name === projectType)
  return rule?.color || ''
})

// 颜色名称到 RGB 的映射
const COLOR_NAME_TO_RGB = {
  '红色': { r: 255, g: 0, b: 0 },
  '黄色': { r: 255, g: 255, b: 0 },
  '绿色': { r: 0, g: 128, b: 0 },
  '蓝色': { r: 0, g: 0, b: 255 },
  '白色': { r: 255, g: 255, b: 255 },
  '黑色': { r: 0, g: 0, b: 0 },
  '紫色': { r: 128, g: 0, b: 128 },
  '橙色': { r: 255, g: 165, b: 0 },
  '粉色': { r: 255, g: 192, b: 203 },
  '灰色': { r: 128, g: 128, b: 128 },
  '青色': { r: 0, g: 255, b: 255 },
  '金色': { r: 255, g: 215, b: 0 },
  '银色': { r: 192, g: 192, b: 192 },
}

// 获取图片主色调
function getDominantColor(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      // 缩小图片以提高性能
      const scale = Math.min(100 / img.width, 100 / img.height, 1)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const pixels = imageData.data
      let rTotal = 0, gTotal = 0, bTotal = 0, count = 0

      // 取采样点（跳过透明像素）
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i]
        const g = pixels[i + 1]
        const b = pixels[i + 2]
        const a = pixels[i + 3]
        if (a > 128) { // 只统计非透明像素
          rTotal += r
          gTotal += g
          bTotal += b
          count++
        }
      }

      if (count === 0) {
        resolve({ r: 0, g: 0, b: 0, name: '未知' })
      } else {
        const avgR = Math.round(rTotal / count)
        const avgG = Math.round(gTotal / count)
        const avgB = Math.round(bTotal / count)
        // 找最接近的颜色名称
        let closestName = '未知'
        let minDiff = Infinity
        for (const [name, rgb] of Object.entries(COLOR_NAME_TO_RGB)) {
          const diff = Math.sqrt(
            Math.pow(avgR - rgb.r, 2) +
            Math.pow(avgG - rgb.g, 2) +
            Math.pow(avgB - rgb.b, 2)
          )
          if (diff < minDiff) {
            minDiff = diff
            closestName = name
          }
        }
        resolve({ r: avgR, g: avgG, b: avgB, name: closestName })
      }
    }
    img.onerror = () => resolve({ r: 0, g: 0, b: 0, name: '未知' })
    const fullUrl = url.startsWith('http') ? url : window.location.origin + url
    img.src = fullUrl
  })
}

// 检测图片颜色是否符合要求
async function checkImageColors() {
  if (!colorCheckConfig.value.enabled) return []
  if (!colorRequirement.value) return []

  const warnings = []
  const tolerance = colorCheckConfig.value.tolerance / 100

  // 解析要求的颜色
  const requiredColorName = colorRequirement.value.trim()
  const requiredRGB = COLOR_NAME_TO_RGB[requiredColorName]
  if (!requiredRGB) {
    console.warn('未知的颜色要求:', requiredColorName)
    return []
  }

  // 收集所有图片
  const allImages = [
    ...Object.values(designForm.unified_images).flat(),
    ...Object.values(designForm.face_images).flat()
  ].filter(Boolean)


  for (const url of allImages) {
    const dominantColor = await getDominantColor(url)

    // 计算颜色差异
    const diff = Math.sqrt(
      Math.pow(dominantColor.r - requiredRGB.r, 2) +
      Math.pow(dominantColor.g - requiredRGB.g, 2) +
      Math.pow(dominantColor.b - requiredRGB.b, 2)
    ) / Math.sqrt(255 * 255 + 255 * 255 + 255 * 255) // 最大差异


    if (diff > tolerance) {
      warnings.push({
        url,
        required: requiredColorName,
        actual: dominantColor.name,
        diff: Math.round(diff * 100)
      })
    }
  }

  return warnings
}

// 颜色警告数据
const colorWarnings = ref([])

// 格式化尺寸
function formatDim(face) {
  const w = face.width || 0
  const h = face.height || 0
  if (w && h) return `${w} × ${h}`
  if (h) return `${h}`
  if (w) return `${w}`
  return '-'
}

// ========== 按材料聚合测量数据 ==========

const groupedMaterials = computed(() => {
  const map = {}
  for (const m of parsedMeasurements.value) {
    for (const mat of (m.materials || [])) {
      const type = mat.material_type || mat.type || '未分类'
      if (!map[type]) {
        map[type] = { type, groups: [], totalArea: 0 }
      }
      const faceGroups = {}
      for (const face of (mat.faces || [])) {
        const groupName = face.group_name || ''
        if (!faceGroups[groupName]) {
          faceGroups[groupName] = { name: groupName, isUnified: !!face.is_unified, faces: [] }
        }
        // 统一转换为厘米：_widthM 是米，width/height 可能是厘米
        let w = 0
        let h = 0
        if (face._widthM && face._heightM) {
          // 米转厘米：× 100
          w = face._widthM * 100
          h = face._heightM * 100
        } else {
          // 原始数据已经是厘米
          w = face.length || face.width || 0
          h = face.height || 0
        }
        const area = face.area || 0
        faceGroups[groupName].faces.push({
          label: face.label || face.face_name || '未知面',
          width: w,
          height: h,
          area,
          photos: (face.photos || []).map(getFullUrl).filter(Boolean),
          notes: face.notes || '',
          // 保留所有额外字段（张数、单价等）
          ...face,
        })
        map[type].totalArea += area
      }
      map[type].groups.push(...Object.values(faceGroups).map(g => {
        if (g.isUnified) {
          g.totalW = g.faces.reduce((s, f) => s + (f.width || 0), 0)
          g.totalH = g.faces.reduce((s, f) => s + (f.height || 0), 0)
        }
        return g
      }))
    }
  }
  return Object.values(map)
})

// 判断材料是否有"一体"分组
function hasUnified(mat) {
  return mat.groups.some(g => g.isUnified)
}

// 构建一体分组的信息条文本
function buildGroupInfo(mat, group) {
  const woNo = data.work_order?.work_order_no || ''
  const shopName = data.work_order?.title || ''
  const brand = data.declaration?.project_type || ''
  const matName = materialTypeLabel(mat.type)

  // 一体广告：显示总宽×总高
  const totalW = group.faces.reduce((s, f) => s + (f.width || 0), 0)
  const totalH = group.faces.reduce((s, f) => s + (f.height || 0), 0)
  let sizeInfo = `${totalW.toFixed(2)}×${totalH.toFixed(2)}`

  // 查找张数
  for (const face of group.faces) {
    const qty = findQtyValue(face)
    if (qty && Number(qty) > 0) {
      sizeInfo += `-${qty}张`
      break
    }
  }

  return `${woNo} · ${shopName} · ${brand} · ${matName} · ${sizeInfo}`
}

// 查找张数字段值（使用动态识别的张数字段）
function findQtyValue(face) {
  // 静态兜底字段
  const staticQtyKeys = ['quantity', 'qty', '张', '张数', '数量', 'field_6']
  // 合并动态识别的字段
  const allQtyKeys = [...staticQtyKeys, ...qtyFieldKeys]
  for (const key of allQtyKeys) {
    const val = face[key]
    const num = Number(val)
    if (!isNaN(num) && num > 0 && Number.isFinite(num)) {
      return val
    }
  }
  return null
}

  // 获取面的额外字段（只显示有实际意义的字段）
  function getFaceExtraFields(face) {
    const standardKeys = ['label', 'width', 'height', 'area', 'photos', 'notes', 'group_name', 'is_unified', 'special_flag', '_widthM', '_heightM', 'id', 'created_at', 'updated_at', 'unit', 'direction', 'face_name', 'template_id']
    const defaultLabels = {
      quantity: '张',
      qty: '张',
      张: '张',
      张数: '张',
      数量: '张',
    }
    const result = []
    for (const [key, val] of Object.entries(face)) {
      if (standardKeys.includes(key)) continue
      if (key.endsWith('_meter')) continue
      if (val === null || val === undefined || val === '') continue
      // field_ 开头的字段：有配置标签则显示，没有则隐藏
      if (key.startsWith('field_') && !fieldLabels[key]) continue
      const label = defaultLabels[key] || fieldLabels[key] || key
      result.push({ key, label, value: val })
    }
    return result
  }

// 构建单个独立面的信息条文本
function buildFaceInfo(mat, face) {
  const woNo = data.work_order?.work_order_no || ''
  const shopName = data.work_order?.title || ''
  const brand = data.declaration?.project_type || ''
  const matName = materialTypeLabel(mat.type)
  let sizeInfo = `${face.label}:${Number(face.width||0).toFixed(2)}×${Number(face.height||0).toFixed(2)}`

  // 添加张数
  const qty = findQtyValue(face)
  if (qty && Number(qty) > 0) {
    sizeInfo += `-${qty}张`
  }

  return `${woNo} · ${shopName} · ${brand} · ${matName} · ${sizeInfo}`
}

// 点击复制一体分组信息
async function copyGroupInfo(mat, group) {
  const text = buildGroupInfo(mat, group)
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    ElMessage.success('已复制到剪贴板')
  }
}

// 点击复制独立面信息
async function copyFaceInfo(mat, face) {
  const text = buildFaceInfo(mat, face)
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    ElMessage.success('已复制到剪贴板')
  }
}

// 复制材料信息条
async function copyMaterialInfo(item) {
  try {
    await navigator.clipboard.writeText(item.text)
    ElMessage.success('已复制')
  } catch {
    const ta = document.createElement('textarea')
    ta.value = item.text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    ElMessage.success('已复制')
  }
}

const designStatusIcon = computed(() => {
  const d = data.design
  if (!d) return '🎨'
  const map = { reviewing: '📋', approved: '✅', rejected: '❌' }
  return map[d.status] || '🎨'
})

// 每款材料的信息条（用于左侧栏显示）
const materialInfoItems = computed(() => {
  const items = []
  for (const mat of groupedMaterials.value) {
    const unifiedGroup = mat.groups.find(g => g.isUnified)
    let sizeInfo = ''
    if (unifiedGroup) {
      const totalW = unifiedGroup.faces.reduce((s, f) => s + (f.width || 0), 0)
      const totalH = unifiedGroup.faces.reduce((s, f) => s + (f.height || 0), 0)
      sizeInfo = `${totalW.toFixed(2)}×${totalH.toFixed(2)}`
    } else {
      const allFaces = mat.groups.flatMap(g => g.faces)
      sizeInfo = allFaces.map(f => `${f.label}:${Number(f.width||0).toFixed(2)}×${Number(f.height||0).toFixed(2)}`).join(' ')
    }
    const woNo = data.work_order?.work_order_no || ''
    const shopName = data.work_order?.title || ''
    const brand = data.declaration?.project_type || ''
    const matName = materialTypeLabel(mat.type)
    items.push({
      type: mat.type,
      label: matName,
      text: `${woNo} · ${shopName} · ${brand} · ${matName} · ${sizeInfo}`,
    })
  }
  return items
})

const designStatusTitle = computed(() => {
  const d = data.design
  if (!d) return '待设计'
  const map = { reviewing: '待审核', approved: '已通过', rejected: '已驳回' }
  return map[d.status] || '待设计'
})

const designStatusDesc = computed(() => {
  const d = data.design
  if (!d) return '请上传设计稿'
  const map = {
    reviewing: '等待管理员审核',
    approved: '设计已确认，工单进入生产环节',
    rejected: '请根据驳回原因修改后重新上传',
  }
  return map[d.status] || '请上传设计稿'
})

// 图片 URL 补全：相对路径转完整 URL
function getFullUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  const base = import.meta.env.VITE_API_URL || window.location.origin
  return base.replace(/\/$/, '') + url
}

// 驳回后显示上次设计稿
const rejectedDesignImages = computed(() => {
  if (data.design?.status !== 'rejected') return []
  const imgs = data.design?.effect_images || []
  if (!Array.isArray(imgs)) return []
  return imgs.map(getFullUrl).filter(Boolean)
})

const rejectedSourceFiles = computed(() => {
  if (data.design?.status !== 'rejected') return []
  const files = data.design?.source_files || []
  return Array.isArray(files) ? files : []
})

// 甲方上传照片（完整 URL）
const declarationPhotos = computed(() => {
  const photos = data.declaration?.photos || []
  return Array.isArray(photos) ? photos.map(getFullUrl).filter(Boolean) : []
})

function getFileName(url) {
  if (!url) return ''
  const parts = url.split('/')
  return parts[parts.length - 1] || url
}

function designStatusLabel(s) {
  if (s === 'approved') return '已通过'
  if (s === 'confirmed') return '已确认'
  if (s === 'rejected') return '已驳回'
  if (s === 'reviewing') return '待审核'
  return '待设计'
}

// 加载数据
const designVersions = ref([])
const selectedVersion = ref(null)

async function fetchData() {
  loading.value = true
  try {
    const res = await api.get(`/designs/${workOrderId}/detail`)
    const d = res.data || {}
    Object.assign(data, d)
    if (d.design_versions?.length) {
      designVersions.value = d.design_versions
      selectedVersion.value = d.design_versions[d.design_versions.length - 1]?.version
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '加载失败')
  } finally {
    loading.value = false
  }
  if (!data.work_order?.designer_id) {
    await fetchDesigners()
  }
  // 驳回状态下填充已有设计稿到表单
  if (data.design?.status === 'rejected') {
    await nextTick()
    fillRejectedDesignToForm()
  }
}

// 驳回状态下填充已有设计稿到表单（需要在 groupedMaterials 计算完成后执行）
function fillRejectedDesignToForm() {
  if (data.design?.status !== 'rejected') return
  if (!data.design?.face_mapping) return
  if (groupedMaterials.value.length === 0) return

  // 清空表单
  designForm.unified_images = {}
  designForm.face_images = {}

  // 遍历 groupedMaterials 找到正确的映射
  for (const mat of groupedMaterials.value) {
    for (let gi = 0; gi < mat.groups.length; gi++) {
      const group = mat.groups[gi]
      if (group.isUnified) {
        // 一体组合：按 material_type 和 group_index 匹配
        const key = mat.type + '_' + gi
        const images = new Set()
        for (const mapping of data.design.face_mapping) {
          if (!mapping.image_url) continue
          // 新格式：有 group_index
          if (mapping.group_index !== undefined) {
            if (mapping.material_type === mat.type && mapping.group_index === gi) {
              images.add(getFullUrl(mapping.image_url))
            }
          } else if (mapping.face_labels) {
            // 兼容：有 face_labels 字段
            if (mapping.material_type === mat.type) {
              images.add(getFullUrl(mapping.image_url))
            }
          }
        }
        if (images.size > 0) {
          designForm.unified_images[key] = [...images]
        }
      } else {
        // 独立面：每个面单独映射
        for (const face of group.faces) {
          const faceImages = []
          for (const mapping of data.design.face_mapping) {
            if (mapping.face_label === face.label && mapping.image_url) {
              const url = getFullUrl(mapping.image_url)
              if (!faceImages.includes(url)) {
                faceImages.push(url)
              }
            }
          }
          if (faceImages.length > 0) {
            designForm.face_images[face.label] = faceImages
          }
        }
      }
    }
  }

  // 源文件和备注
  const sourceFiles = data.design.source_files || []
  if (Array.isArray(sourceFiles)) {
    designForm.source_files = sourceFiles.map(getFullUrl).filter(Boolean)
  }
  designForm.notes = data.design.internal_notes || ''

}

// 设计师指派
const designers = ref([])
const selectedDesignerId = ref(null)

async function fetchDesigners() {
  try {
    const res = await api.get('/designs/designers')
    designers.value = res.data || []
  } catch {
    designers.value = []
  }
}

async function handleAssignDesigner() {
  if (!selectedDesignerId.value) return ElMessage.warning('请选择设计师')
  submitting.value = true
  try {
    await api.post(`/designs/${workOrderId}/assign`, { designer_id: selectedDesignerId.value })
    ElMessage.success('指派成功')
    selectedDesignerId.value = null
    await fetchData()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '指派失败')
  } finally {
    submitting.value = false
  }
}


// 上传设计
const designForm = reactive({
  material_images: {},  // { 'KT板': ['url'] } 一体广告用
  face_images: {},      // { '左侧': ['url1'] } 独立面用
  unified_images: {},   // { 'spray_cloth_0': ['url'] } 一体组合用
  source_files: [],
  notes: '',
})

// 获取图片实际尺寸
function getImageSize(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => {
      console.warn('无法读取图片尺寸:', url)
      resolve({ width: 0, height: 0 })
    }
    // 处理相对路径
    const fullUrl = url.startsWith('http') ? url : window.location.origin + url
    img.src = fullUrl
  })
}

// 检测图片尺寸是否符合要求
async function checkImageSizes() {
  if (!sizeCheckConfig.value.enabled) return []

  const warnings = []
  const dpi = sizeCheckConfig.value.dpi || 96
  const tolerance = (sizeCheckConfig.value.tolerance || 10) / 100

  // 收集所有图片和对应的面信息
  const imageChecks = []

  // 一体广告图片
  for (const [key, images] of Object.entries(designForm.unified_images)) {
    const [matType, groupIdx] = key.split('_')
    const mat = groupedMaterials.value.find(m => m.type === matType)
    const group = mat?.groups?.[parseInt(groupIdx)]
    if (group && images?.length) {
      // 一体广告：计算总尺寸
      const totalW = group.faces.reduce((s, f) => s + (f.width || 0), 0)
      const totalH = Math.max(...group.faces.map(f => f.height || 0), 0)
      for (const img of images) {
        imageChecks.push({ url: img, expectedW: totalW, expectedH: totalH, label: group.name || '一体', matType })
      }
    }
  }

  // 独立面图片
  for (const [faceLabel, images] of Object.entries(designForm.face_images)) {
    if (!images?.length) continue
    // 找到对应面的尺寸
    let found = null
    for (const mat of groupedMaterials.value) {
      for (const g of mat.groups) {
        const face = g.faces.find(f => f.label === faceLabel)
        if (face) {
          found = { width: face.width, height: face.height, matType: mat.type }
          break
        }
      }
      if (found) break
    }
    if (found) {
      for (const img of images) {
        imageChecks.push({ url: img, expectedW: found.width, expectedH: found.height, label: faceLabel, matType: found.matType })
      }
    }
  }

  for (const check of imageChecks) {
    const size = await getImageSize(check.url)
    if (!size.width || !size.height) continue

    // 像素转厘米 (1 inch = 2.54 cm)
    const actualW = size.width / dpi * 2.54
    const actualH = size.height / dpi * 2.54

    const diffW = Math.abs(actualW - check.expectedW) / (check.expectedW || 1)
    const diffH = Math.abs(actualH - check.expectedH) / (check.expectedH || 1)

    if (diffW > tolerance || diffH > tolerance) {
      warnings.push({
        label: check.label,
        expected: `${check.expectedW.toFixed(0)}×${check.expectedH.toFixed(0)}cm`,
        actual: `${actualW.toFixed(0)}×${actualH.toFixed(0)}cm`,
        diff: Math.round(Math.max(diffW, diffH) * 100),
      })
    }
  }

  return warnings
}

// 尺寸警告对话框
const sizeWarningVisible = ref(false)
const sizeWarnings = ref([])
const pendingSubmit = ref(false)

async function submitDesign() {
  // 先检测尺寸
  if (sizeCheckConfig.value.enabled) {
    const warnings = await checkImageSizes()
    if (warnings.length > 0) {
      sizeWarnings.value = warnings
      sizeWarningVisible.value = true
      pendingSubmit.value = true
      return
    }
  }

  await doSubmitDesign()
}

// 从完整 URL 提取相对路径
function extractRelativePath(url) {
  if (!url) return ''
  if (url.startsWith('/')) return url // 已经是相对路径
  // 提取 path 部分
  try {
    const u = new URL(url)
    return u.pathname // 返回相对路径部分
  } catch {
    return url
  }
}

async function doSubmitDesign() {
  // 收集所有图片
  const unifiedImages = Object.values(designForm.unified_images).flat().filter(Boolean)
  const faceImages = Object.values(designForm.face_images).flat().filter(Boolean)
  const allImages = [...unifiedImages, ...faceImages]


  if (!allImages.length) return ElMessage.warning('请至少上传一张效果图')

  submitting.value = true
  try {
    const faceMapping = []
    // 一体广告：每个组只创建一条 mapping（不带 face_label）
    for (const [key, images] of Object.entries(designForm.unified_images)) {
      if (!images?.length) continue
      const [matType, groupIdx] = key.split('_')
      const mat = groupedMaterials.value.find(m => m.type === matType)
      const group = mat?.groups?.[parseInt(groupIdx)]
      if (group) {
        for (const img of images) {
          if (!img) continue
          const relativeUrl = extractRelativePath(img)
          // 一体组合：只创建一条 mapping，不带 face_label
          faceMapping.push({
            material_type: matType,
            group_index: parseInt(groupIdx),
            face_labels: group.faces.map(f => f.label), // 保存所有面标签
            image_url: relativeUrl,
          })
        }
      }
    }
    // 独立面
    for (const [faceLabel, images] of Object.entries(designForm.face_images)) {
      if (!images?.length) continue
      for (const img of images) {
        if (!img) continue
        const relativeUrl = extractRelativePath(img)
        const matType = findFaceMaterialType(faceLabel)
        faceMapping.push({
          face_label: faceLabel,
          material_type: matType,
          group_index: -1, // 独立面用 -1 标记
          image_url: relativeUrl,
        })
      }
    }


    // effect_images 也要转成相对路径
    const relativeImages = allImages.map(extractRelativePath).filter(Boolean)

    await api.post(`/designs/${workOrderId}`, {
      effect_images: relativeImages,
      source_files: designForm.source_files.map(extractRelativePath).filter(Boolean),
      internal_notes: designForm.notes,
      face_mapping: faceMapping,
    })
    ElMessage.success('设计稿上传成功')
    // 正确清空表单
    for (const key in designForm.unified_images) {
      designForm.unified_images[key] = []
    }
    for (const key in designForm.face_images) {
      designForm.face_images[key] = []
    }
    designForm.material_images = {}
    designForm.source_files = []
    designForm.notes = ''
    await fetchData()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '上传失败')
  } finally {
    submitting.value = false
  }
}

// 关闭警告对话框并清空上传
function closeWarningDialog() {
  sizeWarningVisible.value = false
  sizeWarnings.value = []
  colorWarnings.value = []
  // 清空所有上传的图片（保持对象结构，只清空数组）
  for (const key in designForm.unified_images) {
    designForm.unified_images[key] = []
  }
  for (const key in designForm.face_images) {
    designForm.face_images[key] = []
  }
  designForm.source_files = []
  designForm.notes = ''
}

// 强制提交（忽略警告）
async function forceSubmit() {
  sizeWarningVisible.value = false
  sizeWarnings.value = []
  colorWarnings.value = []
  await doSubmitDesign()
}

// 根据面名找材料类型
function findFaceMaterialType(faceLabel) {
  for (const mat of groupedMaterials.value) {
    for (const g of mat.groups) {
      for (const f of g.faces) {
        if (f.label === faceLabel) return mat.type
      }
    }
  }
  return ''
}

// 提交审核（驳回后重新上传后调用）
async function submitDesignReview() {
  submitting.value = true
  try {
    await api.post(`/designs/${workOrderId}/submit-review`)
    ElMessage.success('已提交审核')
    await fetchData()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '提交失败')
  } finally {
    submitting.value = false
  }
}

// 撤回设计稿
async function handleWithdraw() {
  try {
    await ElMessageBox.confirm('撤回后可以重新修改设计稿再提交，是否撤回？', '撤回确认', {
      type: 'warning',
      confirmButtonText: '确认撤回',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await api.post(`/designs/${workOrderId}/withdraw`)
    ElMessage.success('已撤回，可重新修改')
    await fetchData()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '撤回失败')
  } finally {
    submitting.value = false
  }
}

// 审核
const showRejectDialog = ref(false)
const rejectReason = ref('')

async function handleReview(action) {
  submitting.value = true
  try {
    await api.post(`/designs/${workOrderId}/review`, { action, comment: '' })
    ElMessage.success('审核通过')
    await fetchData()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function confirmReject() {
  if (!rejectReason.value) return ElMessage.warning('请填写驳回原因')
  submitting.value = true
  try {
    await api.post(`/designs/${workOrderId}/review`, { action: 'reject', comment: rejectReason.value })
    ElMessage.success('已驳回')
    showRejectDialog.value = false
    rejectReason.value = ''
    await fetchData()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '驳回失败')
  } finally {
    submitting.value = false
  }
}

async function handleConfirm() {
  try {
    await ElMessageBox.confirm('确认定稿后将无法修改设计，是否继续？', '确认定稿', {
      type: 'warning',
      confirmButtonText: '确认',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await api.post(`/designs/${workOrderId}/confirm`)
    ElMessage.success('设计已确认定稿')
    await fetchData()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '确认失败')
  } finally {
    submitting.value = false
  }
}

// 日志
function logTypeColor(type) {
  const map = { create: 'success', edit: '', delete: 'danger', stage_change: 'warning', stage_changed: 'warning', approval: 'success', dispatch: 'primary', design_upload: '', design_approve: 'success', design_reject: 'danger', upload_design: '', design_approved: 'success', design_confirm: 'success', archived: 'success', aftersale_created: 'warning', aftersale_resolved: 'success', aftersale_closed: 'info', aftersale_rated: 'success', construction_submitted: 'success', internal_verified: 'success', internal_verify_rejected: 'danger', client_accepted: 'success', client_verify_rejected: 'danger', construction_exception: 'danger', work_order_created: 'success', work_order_updated: '', work_order_deleted: 'danger', stage_advanced: 'warning', remark_added: 'info', work_order_reassigned: 'warning', tags_updated: 'info', priority_updated: 'info', deadline_updated: 'info', design_update: '', material_change: 'warning', designer_assign: 'primary', production_task_created: 'info', production_warehoused: 'success', production_status_updated: 'info', material_pickup: 'info', quote_created: 'info', payment_recorded: 'success', invoice_created: 'info', settlement_submitted: 'warning', settlement_rejected: 'danger', create_assignment: 'primary', receive_assignment: 'success', proxy_submit_measurement: 'warning', approve_measurement: 'success', reject_measurement: 'danger' }
  return map[type] || 'info'
}

function logTypeLabel(type) {
  const map = {
    create: '创建', edit: '编辑', delete: '删除', stage_change: '阶段变更', stage_changed: '阶段变更',
    approval: '审批', dispatch: '派单', remark_added: '备注',
    design_upload: '上传设计', design_approve: '审核通过', design_reject: '审核驳回',
    work_order_created: '创建工单', designer_assign: '指派设计师',
    create_assignment: '创建派单', receive_assignment: '确认接派单',
    upload_design: '上传设计稿', design_approved: '设计审核通过',
    design_confirm: '设计确认定稿', design_update: '修改设计稿',
    material_change: '材料变更',
    approve_measurement: '测量审核通过', reject_measurement: '测量驳回',
    measurement_rejected: '测量驳回', resubmit_measurement: '重新提交测量',
    proxy_submit_measurement: '代录测量数据',
    stage_advanced: '阶段推进', stage_reverted: '阶段回退',
    work_order_updated: '编辑工单', work_order_deleted: '删除工单',
    work_order_reassigned: '重新派单', tags_updated: '标签变更',
    priority_updated: '优先级变更', deadline_updated: '截止日变更',
    construction_submitted: '提交施工', construction_exception: '施工异常',
    internal_verified: '内部验收通过', internal_verify_rejected: '内部验收退回',
    client_accepted: '甲方验收通过', client_verify_rejected: '甲方验收驳回',
    archived: '工单归档', aftersale_created: '创建售后',
    aftersale_resolved: '售后已解决', aftersale_closed: '售后已关闭',
    aftersale_rated: '售后评价',
    production_task_created: '创建生产任务', production_warehoused: '生产入库',
    production_status_updated: '生产状态更新', material_pickup: '材料领取',
    quote_created: '创建报价', payment_recorded: '收款记录',
    invoice_created: '创建发票', settlement_submitted: '提交结算',
    settlement_rejected: '结算驳回',
  }
  return map[type] || type || '操作'
}

// 监听图片上传，上传后立即检测尺寸和颜色
watch(
  () => [designForm.unified_images, designForm.face_images],
  async () => {
    // 延迟一下等待数据更新
    await new Promise(r => setTimeout(r, 500))

    let hasWarning = false

    // 尺寸检测
    if (sizeCheckConfig.value.enabled) {
      const sizeWs = await checkImageSizes()
      sizeWarnings.value = sizeWs
      if (sizeWs.length > 0) hasWarning = true
    }

    // 颜色检测
    if (colorCheckConfig.value.enabled && colorRequirement.value) {
      const colorWs = await checkImageColors()
      colorWarnings.value = colorWs
      if (colorWs.length > 0) hasWarning = true
    }

    // 有警告则显示对话框
    if (hasWarning) {
      sizeWarningVisible.value = true
    }
  },
  { deep: true }
)

onMounted(() => {
  loadElementOptions()
  fetchAdTypeMap()
  loadFormConfig()
  loadDesignColorRules()
  fetchData()
})
</script>

<style scoped>
/* 页面容器 */
.design-detail-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-page);
}

/* 顶栏 */
.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  height: 56px;
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border-light);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wo-badge {
  background: var(--color-primary);
  color: var(--color-bg-card);
  padding: var(--space-1) 10px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
}

.page-title {
  font-size: 17px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.unified-tag {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-primary);
  border-color: var(--color-primary);
  padding: var(--space-1) 10px;
  border-radius: 12px;
}

.status-tag {
  font-size: var(--font-size-xs);
  padding: var(--space-1) 10px;
  border-radius: 12px;
  background: var(--color-warning-bg);
  color: var(--color-warning);
  border-color: transparent;
}

.progress-tag {
  font-size: var(--font-size-xs);
  padding: var(--space-1) 10px;
  border-radius: 12px;
  background: var(--color-warning-bg);
  color: var(--color-warning);
  border-color: transparent;
}

.designer-tag {
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-primary-bg);
  border-color: var(--color-primary-border);
  color: var(--color-primary);
}

/* 主内容区 */
.main-content {
  display: flex;
  flex: 1;
  padding: var(--space-4);
  gap: var(--space-4);
  overflow: hidden;
}

/* 左侧测量数据面板 */
.measure-panel {
  width: 340px;
  flex-shrink: 0;
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  padding: 0 var(--space-4);
  background: var(--color-bg-page);
  border-bottom: 1px solid var(--color-border-light);
}

.panel-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.panel-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-3);
}

/* 材料分组 */
.mat-group {
  border-radius: var(--radius-base);
  margin-bottom: 10px;
  border: 1px solid;
}

.mat-group.mat-blue {
  background: var(--color-primary-bg);
  border-color: var(--color-primary-border);
}

.mat-group.mat-green {
  background: var(--color-success-bg);
  border-color: var(--color-success-border);
}

.mat-group.mat-yellow {
  background: var(--color-warning-bg);
  border-color: var(--color-warning-border);
}

.mat-group.mat-gray {
  background: var(--color-bg-page);
  border-color: var(--color-border-light);
}

.mat-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 10px var(--space-3);
}

.mat-group.mat-blue .mat-head { background: var(--color-primary-border); }
.mat-group.mat-green .mat-head { background: var(--color-success-border); }
.mat-group.mat-yellow .mat-head { background: var(--color-warning-border); }
.mat-group.mat-gray .mat-head { background: var(--color-border-light); }

.mat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.mat-dot.mat-blue { background: var(--color-primary); }
.mat-dot.mat-green { background: var(--color-success); }
.mat-dot.mat-yellow { background: var(--color-warning); }
.mat-dot.mat-gray { background: var(--color-text-tertiary); }

.mat-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
  flex: 1;
}

.mat-element {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  margin-left: 2px;
}

.mat-area {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
}

.mat-info-bar {
  margin: var(--space-2) var(--space-3);
  padding: var(--space-2) 10px;
  background: var(--color-info-bg);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background var(--transition-fast);
}

.mat-info-bar:hover {
  background: var(--color-info-border);
}

.mat-info-bar .copy-icon {
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.mat-info-bar:hover .copy-icon {
  opacity: 1;
}

/* 独立面每面下面的复制条 */
.face-info-bar {
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-2);
  background: var(--color-info-bg);
  border-radius: 4px;
  font-size: 11px;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background var(--transition-fast);
}

.face-info-bar:hover {
  background: var(--color-info-border);
}

.face-info-bar .copy-icon {
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.face-info-bar:hover .copy-icon {
  opacity: 1;
}

/* 一体组合 */
.unified-group {
  padding: var(--space-1) var(--space-3) var(--space-3);
}

.unified-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-2);
}

.unified-badge {
  font-size: 10px;
}

.unified-name {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.unified-size {
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-left: auto;
}

/* 面列表 */
.faces-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.face-item {
  padding: var(--space-2) var(--space-2);
  background: var(--color-bg-card);
  border-radius: 4px;
}

.face-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.face-name {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  width: 50px;
}

.face-dim {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.face-area {
  font-size: 11px;
  color: var(--color-primary);
}

.face-extra {
  font-size: 11px;
  color: var(--color-warning);
  margin-left: 4px;
}

.face-notes {
  font-size: 11px;
  color: var(--color-danger);
  margin-top: var(--space-1);
  padding-left: 0;
  line-height: 1.4;
}

.face-photos {
  display: flex;
  gap: var(--space-1);
  margin-left: auto;
}

.face-photo-thumb {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
}

/* 右侧工作区 */
.work-panel {
  flex: 1;
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.work-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 50px;
  padding: 0 var(--space-4);
  background: var(--color-primary-bg);
  border-bottom: 1px solid var(--color-primary-border);
  color: var(--color-primary);
}

.work-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
}

.work-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  font-weight: var(--font-weight-regular);
  margin-left: auto;
}

/* 驳回提示 */
.rejected-banner {
  padding: var(--space-3) var(--space-4);
  background: var(--color-danger-bg);
}

.work-body {
  flex: 1;
  display: flex;
  padding: var(--space-3);
  gap: var(--space-3);
  overflow: hidden;
}

/* 上传网格 */
.upload-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

/* 上传卡片 */
.upload-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--color-bg-page);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.upload-card:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-card);
}

.upload-card.uploaded {
  background: var(--color-success-bg);
  border-color: var(--color-success-border);
}

.card-info {
  width: 140px;
  flex-shrink: 0;
}

.card-mat {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 15px;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--space-1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.card-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
}

.card-size {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

.card-meta {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

/* 预览区 */
.card-preview {
  display: flex;
  gap: 2px;
  align-items: center;
  height: 100px;
}

.preview-face {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 10px;
  color: var(--color-text-secondary);
  background: var(--color-primary-bg);
  border: 1px solid var(--color-primary);
}

/* 现场照片 */
.card-photos {
  display: flex;
  gap: var(--space-1);
}

.photo-thumb {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  cursor: pointer;
}

.no-photo {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

/* 上传区 */
.card-upload {
  flex: 1;
  min-width: 0;
}

.uploaded-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-success-bg);
  border-radius: var(--radius-base);
  color: var(--color-success);
  font-size: var(--font-size-sm);
}

/* 勾选标记 */
.card-check {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-check.checked {
  background: var(--color-success);
  color: var(--color-bg-card);
}

/* 已上传的设计稿图片 */
.card-design-images {
  display: flex;
  gap: var(--space-1);
  padding: var(--space-2);
  background: var(--color-success-bg);
  border-radius: var(--radius-base);
}

.design-img {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

/* 操作侧边栏 */
.action-sidebar {
  width: 200px;
  flex-shrink: 0;
  background: var(--color-bg-page);
  border-radius: var(--radius-base);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.sidebar-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.color-requirement-box {
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning-border);
  border-radius: var(--radius-base);
  padding: var(--space-3);
  margin-bottom: var(--space-4);
}

.color-req-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-warning);
  margin-bottom: var(--space-2);
}

.color-req-content {
  font-size: var(--font-size-sm);
  color: var(--color-warning);
  line-height: 1.5;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.saved-files {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.saved-file-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  word-break: break-all;
}

.saved-file-item .el-icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.saved-notes {
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.5;
  word-break: break-all;
}

.section-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.submit-btn {
  width: 100%;
  height: 50px;
  font-size: 15px;
  font-weight: var(--font-weight-semibold);
  border-radius: 10px;
}

/* 上传进度 */
.progress-section {
  background: var(--color-bg-card);
  border-radius: var(--radius-base);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.progress-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.progress-bar-wrapper {
  display: flex;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--color-border-light);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-success);
  border-radius: 4px;
  transition: width var(--transition-slow);
}

.progress-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.upload-warning {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
  text-align: center;
  line-height: 1.4;
}

.review-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

/* 响应式 */
@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
  }
  .measure-panel {
    width: 100%;
    max-height: 200px;
  }
  .action-sidebar {
    width: 100%;
  }
}
</style>

<style>
/* 设计详情页 - Element Plus 上传组件覆盖（非 scoped） */
[class*="design-detail-page"] .el-upload--picture-card {
  width: 100px !important;
  height: 100px !important;
  border-radius: 10px !important;
  border: 2px dashed var(--color-border-light) !important;
  background: var(--color-bg-page) !important;
  transition: all var(--transition-fast) !important;
}
[class*="design-detail-page"] .el-upload--picture-card:hover {
  border-color: var(--color-primary) !important;
  background: var(--color-primary-bg) !important;
}

/* 文件上传组件 - 删除按钮始终可见 */
[class*="design-detail-page"] .upload-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
[class*="design-detail-page"] .uploaded-item {
  position: relative !important;
}
[class*="design-detail-page"] .delete-overlay {
  display: flex !important;
  position: absolute !important;
  top: 0 !important;
  right: 0 !important;
  width: 24px !important;
  height: 24px !important;
  background: var(--color-danger) !important;
  border-radius: 0 8px 0 8px !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  z-index: 10 !important;
}
[class*="design-detail-page"] .delete-icon {
  color: var(--color-bg-card) !important;
  font-size: 14px !important;
}

/* 源文件上传按钮 */
[class*="design-detail-page"] .source-upload .el-button--primary {
  background: var(--color-bg-page) !important;
  color: var(--color-text-tertiary) !important;
  border: 2px dashed var(--color-border-light) !important;
  border-radius: 10px !important;
  font-size: var(--font-size-sm) !important;
  padding: 10px 20px !important;
  transition: all var(--transition-fast) !important;
}
[class*="design-detail-page"] .source-upload .el-button--primary:hover {
  background: var(--color-primary-bg) !important;
  color: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
}

/* 提交按钮 */
[class*="design-detail-page"] .full-width-btn {
  border-radius: 10px !important;
  height: 44px !important;
  font-size: 15px !important;
  font-weight: var(--font-weight-semibold) !important;
}
</style>
