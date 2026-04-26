<template>
  <el-dialog v-model="visible" :title="isEditMode ? '修改测量数据' : '代录测量数据'" width="720px" top="5vh" @close="handleClose">
    <el-form label-width="90px" v-loading="formConfigLoading">
      <!-- 选择项目模板 -->
      <el-form-item label="选择项目" required v-if="projectTemplates.length && !isEditMode">
        <el-select v-model="selectedTemplateId" placeholder="请选择项目" style="width: 240px" @change="onTemplateChange">
          <el-option v-for="t in enabledTemplates" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>
      </el-form-item>
      <!-- 编辑模式显示项目名 -->
      <el-form-item label="项目" v-if="isEditMode && selectedTemplateName">
        <span>{{ selectedTemplateName }}</span>
      </el-form-item>

      <!-- 多广告类型区块 -->
      <template v-if="formConfigLoaded && !formConfigLoading">
        <div v-if="adTypeBlocks.length" style="max-height: 55vh; overflow-y: auto; padding: 0 4px;">
          <div v-for="(block, bi) in adTypeBlocks" :key="bi" class="ad-type-block">
            <el-card shadow="never">
              <template #header>
                <div class="face-card-header">
                  <span class="face-card-title">{{ currentAdTypeMap[block.adTypeKey] || '未选择类型' }}</span>
                  <el-button v-if="!isEditMode" size="small" type="danger" link @click="removeAdTypeBlock(bi)">删除</el-button>
                </div>
              </template>
              <!-- 广告类型选择（编辑模式不显示） -->
              <el-form-item v-if="!isEditMode" label="广告类型" required class="mb-12">
                <el-select v-model="block.adTypeKey" placeholder="选择广告类型" size="small" style="width:100%" @change="onBlockTypeChange(bi)">
                  <el-option
                    v-for="(label, key) in currentAdTypeMap"
                    :key="key"
                    :label="label"
                    :value="key"
                  />
                </el-select>
              </el-form-item>
              <!-- 提示：未选择类型 -->
              <div v-if="!block.adTypeKey" style="text-align:center;padding:20px;color:var(--color-text-tertiary);">
                请先选择广告类型
              </div>
              <!-- 分组 -->
              <template v-else>
                <div v-for="(group, gi) in block.groups" :key="gi" class="group-card">
                  <el-card shadow="never" :class="{ 'group-unified': group.isUnified }">
                    <template #header>
                      <div class="face-card-header">
                        <div class="group-header-left">
                          <span class="group-label">{{ group.name || ('分组' + (gi + 1)) }}</span>
                          <el-switch
                            v-model="group.isUnified"
                            active-text="一体"
                            inactive-text="独立"
                            size="small"
                            class="ml-12"
                            @change="onUnifiedChange(bi, gi)"
                          />
                          <span v-if="group.isUnified && group.faces.length < 2" class="unified-hint">需≥2面</span>
                        </div>
                        <el-button v-if="!isEditMode && block.groups.length > 1" size="small" type="danger" link @click="removeGroupFromBlock(bi, gi)">删除此组</el-button>
                      </div>
                    </template>
                    <!-- 面数据 -->
                    <div v-for="(face, fi) in group.faces" :key="fi" class="material-face-card">
                      <el-card shadow="never" style="margin-bottom: 12px">
                        <template #header>
                          <div class="face-card-header">
                            <span class="face-card-title">{{ face.label || `第 ${fi + 1} 面` }}</span>
                            <el-button v-if="!isEditMode && group.faces.length > 1" size="small" type="danger" link @click="removeFaceFromBlock(bi, gi, fi)">删除此面</el-button>
                          </div>
                        </template>
                        <el-row :gutter="16">
                          <el-col :span="12" v-for="field in getFaceFields(block.adTypeKey)" :key="field.field_key">
                            <el-form-item :label="field.field_label" :required="field.required" style="margin-bottom: 12px">
                              <el-input
                                v-if="field.field_type === 'text'"
                                v-model="face[field.field_key]"
                                :placeholder="field.placeholder || '请输入'"
                                size="small"
                              />
                              <el-input
                                v-else-if="field.field_type === 'phone'"
                                v-model="face[field.field_key]"
                                :placeholder="field.placeholder || '请输入手机号'"
                                size="small"
                              >
                                <template #prefix><el-icon><Phone /></el-icon></template>
                              </el-input>
                              <el-input
                                v-else-if="field.field_type === 'textarea'"
                                v-model="face[field.field_key]"
                                type="textarea"
                                :rows="2"
                                :placeholder="field.placeholder || '请输入'"
                                size="small"
                              />
                              <el-input-number
                                v-else-if="field.field_type === 'number'"
                                v-model="face[field.field_key]"
                                :min="0"
                                :precision="2"
                                controls-position="right"
                                size="small"
                                style="width: 100%"
                              />
                              <el-select
                                v-else-if="field.field_type === 'select'"
                                v-model="face[field.field_key]"
                                :placeholder="field.placeholder || '请选择'"
                                size="small"
                                style="width: 100%"
                                :class="{ 'warning-select': field.required && !face[field.field_key] }"
                              >
                                <el-option v-for="opt in (field.options || [])" :key="opt.value" :label="opt.label" :value="opt.value" />
                              </el-select>
                              <div v-else-if="field.field_type === 'image'">
                                <el-upload
                                  action="/api/v1/files"
                                  list-type="picture-card"
                                  :file-list="blockUploadFiles[bi]?.[gi]?.[fi]?.[field.field_key] || []"
                                  :on-success="(res, file) => handleBlockFileSuccess(res, file, bi, gi, fi, field.field_key)"
                                  :on-error="onFileError"
                                  :headers="uploadHeaders"
                                  name="file">
                                  <el-icon><Plus /></el-icon>
                                </el-upload>
                              </div>
                              <span v-else class="text-muted">—</span>
                            </el-form-item>
                          </el-col>
                        </el-row>
                      </el-card>
                    </div>
                    <div v-if="!isEditMode" class="proxy-footer">
                      <el-button size="small" type="primary" plain @click="addFaceToBlock(bi, gi)">+ 添加面</el-button>
                    </div>
                  </el-card>
                </div>
                <div v-if="!isEditMode" class="proxy-footer">
                  <el-button size="small" plain @click="addGroupToBlock(bi)">+ 添加分组</el-button>
                </div>
              </template>
            </el-card>
          </div>
          <div v-if="!isEditMode" class="proxy-footer" style="border: none; padding-top: 12px;">
            <el-button size="small" type="primary" plain @click="addAdTypeBlock" :disabled="!selectedTemplateId || !currentAdTypeOptions.length">+ 添加广告类型</el-button>
          </div>
        </div>
        <!-- 无区块时显示添加按钮 -->
        <div v-else-if="!isEditMode" style="text-align:center;padding:20px;">
          <el-button type="primary" plain @click="addAdTypeBlock" :disabled="!selectedTemplateId || !currentAdTypeOptions.length">+ 添加广告类型</el-button>
        </div>
      </template>
      <el-skeleton v-else :rows="5" animated />
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submitProxyMeasurement" :loading="submitting" :disabled="!canSubmit">{{ isEditMode ? '保存修改' : '提交' }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Phone } from '@element-plus/icons-vue'
import { useAuthStore } from '../store/auth'
import api from '../api'
import { logger } from '../utils/logger'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  workOrderId: { type: [String, Number], required: true },
  // 已有测量数据（编辑模式）
  existingData: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'success'])

const auth = useAuthStore()
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const submitting = ref(false)
const formConfigLoading = ref(false)
const formConfigLoaded = ref(false)

// 项目模板驱动
const projectTemplates = ref([])
const selectedTemplateId = ref('')
const selectedTemplateName = computed(() => {
  const tmpl = projectTemplates.value.find(t => t.id === selectedTemplateId.value)
  return tmpl?.name || ''
})

// 是否编辑模式
const isEditMode = computed(() => !!props.existingData?.materials?.length)

// 只展示启用的模板（新建用），编辑模式下保留全部
const enabledTemplates = computed(() => projectTemplates.value.filter(t => t.enabled !== false))

// 当前选中的项目模板
const selectedTemplate = computed(() => {
  return projectTemplates.value.find(t => t.id === selectedTemplateId.value) || null
})

// 当前项目的广告类型映射表（key → label）
const currentAdTypeMap = computed(() => {
  const map = {}
  if (selectedTemplate.value) {
    selectedTemplate.value.ad_types?.forEach(ad => { map[ad.key] = ad.label })
  }
  // 编辑模式：补充已有材料的类型
  if (isEditMode.value && props.existingData?.materials) {
    for (const mat of props.existingData.materials) {
      const key = mat.material_type || mat.type
      if (key && !map[key]) {
        map[key] = mat.material_type_label || key
      }
    }
  }
  return map
})

// 当前项目的广告类型选项列表
const currentAdTypeOptions = computed(() => {
  return selectedTemplate.value?.ad_types || []
})

// 多广告类型区块 + 分组结构
const adTypeBlocks = ref([])
const blockUploadFiles = ref({})

const canSubmit = computed(() => {
  return selectedTemplateId.value && adTypeBlocks.value.some(b =>
    b.adTypeKey && b.groups.some(g => g.faces.length > 0)
  )
})

function onTemplateChange() {
  if (isEditMode.value) return // 编辑模式不重置
  adTypeBlocks.value = []
  blockUploadFiles.value = {}
}

function getFaceFields(adTypeKey) {
  const tmpl = projectTemplates.value.find(t => t.id === selectedTemplateId.value)
  const adType = tmpl?.ad_types?.find(a => a.key === adTypeKey)
  return adType?.face_fields || []
}

function createBlockFace(adTypeKey) {
  const fields = getFaceFields(adTypeKey)
  const face = {}
  fields.forEach(f => {
    if (f.field_type === 'image') face[f.field_key] = []
    else face[f.field_key] = ''
  })
  return face
}

function onBlockTypeChange(bi) {
  const block = adTypeBlocks.value[bi]
  if (!block) return
  const fields = getFaceFields(block.adTypeKey)
  for (const group of block.groups) {
    for (const face of group.faces) {
      for (const field of fields) {
        if (!(field.field_key in face)) {
          face[field.field_key] = field.field_type === 'image' ? [] : ''
        }
      }
    }
  }
  // 广告类型切换后更新所有分组名称
  const adTypeLabel = currentAdTypeMap.value[block.adTypeKey] || block.adTypeKey
  block.groups.forEach((group, gi) => {
    const unifiedTag = group.isUnified ? '一体' : '独立'
    group.name = `${adTypeLabel}${gi + 1}-${unifiedTag}`
  })
}

function addAdTypeBlock() {
  const firstAdTypeKey = selectedTemplate.value?.ad_types?.[0]?.key || ''
  const adTypeLabel = currentAdTypeMap.value[firstAdTypeKey] || firstAdTypeKey
  adTypeBlocks.value.push({
    adTypeKey: firstAdTypeKey,
    groups: [{ name: `${adTypeLabel}1-独立`, isUnified: false, faces: [createBlockFace(firstAdTypeKey)] }],
  })
}

function removeAdTypeBlock(bi) {
  adTypeBlocks.value.splice(bi, 1)
  delete blockUploadFiles.value[bi]
  const newMap = {}
  Object.keys(blockUploadFiles.value).forEach(k => {
    const num = parseInt(k)
    if (num < bi) newMap[num] = blockUploadFiles.value[k]
    else if (num > bi) newMap[num - 1] = blockUploadFiles.value[k]
  })
  blockUploadFiles.value = newMap
}

function addGroupToBlock(bi) {
  const block = adTypeBlocks.value[bi]
  if (!block) return
  const adTypeLabel = currentAdTypeMap.value[block.adTypeKey] || block.adTypeKey
  const idx = block.groups.length + 1
  block.groups.push({ name: `${adTypeLabel}${idx}-独立`, isUnified: false, faces: [createBlockFace(block.adTypeKey)] })
}

function onUnifiedChange(bi, gi) {
  const block = adTypeBlocks.value[bi]
  if (!block) return
  const group = block.groups[gi]
  if (!group) return
  // 开启一体时，自动更新分组名标识
  const adTypeLabel = currentAdTypeMap.value[block.adTypeKey] || block.adTypeKey || ''
  const unifiedTag = group.isUnified ? '一体' : '独立'
  group.name = `${adTypeLabel}${gi + 1}-${unifiedTag}`
}

function removeGroupFromBlock(bi, gi) {
  const block = adTypeBlocks.value[bi]
  if (!block || block.groups.length <= 1) return
  block.groups.splice(gi, 1)
  if (!blockUploadFiles.value[bi]) return
  delete blockUploadFiles.value[bi][gi]
  const newMap = {}
  Object.keys(blockUploadFiles.value[bi]).forEach(gKey => {
    const num = parseInt(gKey)
    if (num < gi) newMap[num] = blockUploadFiles.value[bi][gKey]
    else if (num > gi) newMap[num - 1] = blockUploadFiles.value[bi][gKey]
  })
  blockUploadFiles.value[bi] = newMap
}

function addFaceToBlock(bi, gi) {
  const block = adTypeBlocks.value[bi]
  if (!block) return
  const group = block.groups[gi]
  if (!group) return
  // 检查当前组内的面是否都已选择测量面
  const fields = getFaceFields(block.adTypeKey)
  const labelField = fields.find(f => f.field_role === 'label' && f.field_type === 'select')
  if (labelField) {
    for (let fi = 0; fi < group.faces.length; fi++) {
      const face = group.faces[fi]
      if (!face[labelField.field_key]) {
        ElMessage.warning(`第 ${fi + 1} 面的测量面未选择，请先选择后再添加新面`)
        return
      }
    }
  }
  group.faces.push(createBlockFace(block.adTypeKey))
}

function removeFaceFromBlock(bi, gi, fi) {
  const block = adTypeBlocks.value[bi]
  if (!block) return
  const group = block.groups[gi]
  if (!group) return
  group.faces.splice(fi, 1)
  // 删除面后如果标记为一体但不足2面，不自动切回——用户可能还要加面
  if (!blockUploadFiles.value[bi]) return
  if (!blockUploadFiles.value[bi][gi]) return
  delete blockUploadFiles.value[bi][gi][fi]
  const newMap = {}
  Object.keys(blockUploadFiles.value[bi][gi]).forEach(fKey => {
    const num = parseInt(fKey)
    if (num < fi) newMap[num] = blockUploadFiles.value[bi][gi][fKey]
    else if (num > fi) newMap[num - 1] = blockUploadFiles.value[bi][gi][fKey]
  })
  blockUploadFiles.value[bi][gi] = newMap
}

function handleBlockFileSuccess(res, file, bi, gi, fi, fieldKey) {
  const url = res.url || res.data?.url
  if (!url) {
    ElMessage.error('上传成功但未返回文件地址')
    return
  }
  if (!blockUploadFiles.value[bi]) blockUploadFiles.value[bi] = {}
  if (!blockUploadFiles.value[bi][gi]) blockUploadFiles.value[bi][gi] = {}
  if (!blockUploadFiles.value[bi][gi][fi]) blockUploadFiles.value[bi][gi][fi] = {}
  if (!blockUploadFiles.value[bi][gi][fi][fieldKey]) blockUploadFiles.value[bi][gi][fi][fieldKey] = []
  blockUploadFiles.value[bi][gi][fi][fieldKey].push({ name: file.name || url.split('/').pop(), url })
  if (!adTypeBlocks.value[bi].groups[gi].faces[fi][fieldKey]) adTypeBlocks.value[bi].groups[gi].faces[fi][fieldKey] = []
  if (!adTypeBlocks.value[bi].groups[gi].faces[fi][fieldKey].includes(url)) {
    adTypeBlocks.value[bi].groups[gi].faces[fi][fieldKey].push(url)
  }
}

const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${auth.token}`
}))

function onFileError(err) {
  const msg = err?.response?.data?.error || err?.message || '上传失败'
  ElMessage.error(msg)
}

async function loadFormConfig() {
  formConfigLoading.value = true
  try {
    const res = await api.get('/tenant/settings/project-templates')
    if (res.code === 0 && res.data) {
      projectTemplates.value = res.data.templates || []
    }
  } catch (err) {
    logger.error('加载项目模板失败:', err)
  } finally {
    formConfigLoading.value = false
    formConfigLoaded.value = true
  }
}

// 从已有数据回填表单
function populateFromExistingData() {
  if (!props.existingData?.materials?.length) return

  // 尝试从材料中找到 template_id
  const templateId = props.existingData.materials[0]?.template_id
  if (templateId) {
    selectedTemplateId.value = templateId
  } else {
    // 没有模板 ID，默认选第一个模板
    if (projectTemplates.value.length) {
      selectedTemplateId.value = projectTemplates.value[0].id
    }
  }

  // 按材料类型分组
  const blocks = []
  for (const mat of props.existingData.materials) {
    const adTypeKey = mat.material_type || mat.type
    const fields = getFaceFields(adTypeKey)

    // 按 group_name 分组，空名时按一体/独立自动区分
    const groupMap = {}
    let autoGroupCounter = 0
    for (const face of (mat.faces || [])) {
      let groupName = face.group_name || ''
      // 空 group_name 处理：独立面各成一组，一体连续面合为一组
      if (!groupName) {
        if (!face.is_unified) {
          autoGroupCounter++
          groupName = `__indep_${autoGroupCounter}`
        } else {
          // 一体面：尝试与前一个一体空名组合并
          const keys = Object.keys(groupMap)
          const lastKey = keys.length > 0 ? keys[keys.length - 1] : null
          if (lastKey && groupMap[lastKey].isUnified && !groupMap[lastKey]._hasRealName) {
            groupName = lastKey
          } else {
            autoGroupCounter++
            groupName = `__unified_${autoGroupCounter}`
          }
        }
      }
      if (!groupMap[groupName]) {
        groupMap[groupName] = {
          name: face.group_name || '',
          isUnified: !!face.is_unified,
          _hasRealName: !!face.group_name,
          faces: []
        }
      }

      // 构建面数据，映射到表单字段
      const formFace = { label: face.label || '' }
      for (const field of fields) {
        const key = field.field_key
        if (field.field_type === 'image') {
          formFace[key] = face.photos || []
        } else if (field.field_type === 'number') {
          // 根据角色映射宽度/高度
          const role = field.field_role || ''
          if (role === 'width') {
            formFace[key] = face.width || 0
          } else if (role === 'height') {
            formFace[key] = face.height || 0
          } else {
            formFace[key] = face[key] || 0
          }
        } else if (field.field_type === 'select') {
          const role = field.field_role || ''
          if (role === 'label') {
            formFace[key] = face.label || ''
          } else {
            formFace[key] = face[key] || ''
          }
        } else if (field.field_type === 'textarea' || field.field_type === 'text') {
          if (key === 'note' || key === 'notes') {
            formFace[key] = face.notes || ''
          } else {
            formFace[key] = face[key] || ''
          }
        } else {
          formFace[key] = face[key] || ''
        }
      }
      groupMap[groupName].faces.push(formFace)
    }

    // 补全空名分组的显示名
    const adTypeLabel = currentAdTypeMap.value[adTypeKey] || adTypeKey
    let groupIdx = 0
    const groups = Object.values(groupMap).map(g => {
      groupIdx++
      if (!g.name) {
        const unifiedTag = g.isUnified ? '一体' : '独立'
        g.name = `${adTypeLabel}${groupIdx}-${unifiedTag}`
      }
      delete g._hasRealName
      return g
    })
    blocks.push({
      adTypeKey,
      groups
    })
  }

  adTypeBlocks.value = blocks

  // 初始化照片上传文件列表
  blockUploadFiles.value = {}
  blocks.forEach((block, bi) => {
    block.groups.forEach((group, gi) => {
      group.faces.forEach((face, fi) => {
        const fields = getFaceFields(block.adTypeKey)
        for (const field of fields) {
          if (field.field_type === 'image' && face[field.field_key]?.length) {
            if (!blockUploadFiles.value[bi]) blockUploadFiles.value[bi] = {}
            if (!blockUploadFiles.value[bi][gi]) blockUploadFiles.value[bi][gi] = {}
            if (!blockUploadFiles.value[bi][gi][fi]) blockUploadFiles.value[bi][gi][fi] = {}
            blockUploadFiles.value[bi][gi][fi][field.field_key] = face[field.field_key].map(url => ({
              name: url.split('/').pop(),
              url
            }))
          }
        }
      })
    })
  })
}

async function submitProxyMeasurement() {
  if (!canSubmit.value) {
    ElMessage.warning('请选择项目和广告类型，并至少添加一个面')
    return
  }
  // 校验必填字段
  for (const block of adTypeBlocks.value) {
    if (!block.adTypeKey) {
      ElMessage.warning('请选择广告类型')
      return
    }
    // 获取字段定义
    const fields = getFaceFields(block.adTypeKey)
    if (!fields.length) {
      ElMessage.warning(`配置错误：未找到「${currentAdTypeMap.value[block.adTypeKey]}」的字段定义`)
      return
    }

    for (const group of block.groups) {
      for (let fi = 0; fi < group.faces.length; fi++) {
        for (const field of fields) {
          // 确保 required 是布尔值（可能是字符串 "true"/"false"）
          const isRequired = field.required === true || field.required === 'true' || field.required === 1
          if (!isRequired) continue

          const value = group.faces[fi][field.field_key]
          let isEmpty = false

          // 根据字段类型判断空值
          if (field.field_type === 'number') {
            // 数字字段：null、undefined 或空字符串视为空，但 0 是有效值
            isEmpty = value === null || value === undefined || value === ''
          } else if (field.field_type === 'image') {
            // 图片字段：检查数组是否为空
            isEmpty = !Array.isArray(value) || value.length === 0
          } else if (field.field_type === 'select') {
            // 下拉选择：null、undefined 或空字符串视为空
            isEmpty = value === null || value === undefined || value === ''
          } else {
            // 文本/多行文本等其他字段
            isEmpty = value === null || value === undefined || String(value).trim() === ''
          }

          if (isEmpty) {
            // 测量面字段特殊提示
            if (field.field_role === 'label') {
              ElMessage.warning(`【测量面未选择】${currentAdTypeMap.value[block.adTypeKey]} 的第 ${fi + 1} 面请选择测量面`, 5000)
            } else {
              ElMessage.warning(`${currentAdTypeMap.value[block.adTypeKey]} 的第 ${fi + 1} 面的「${field.field_label}」为必填`)
            }
            return
          }
        }
      }
    }
  }
  submitting.value = true
  try {
    // 把动态面数据转为后端标准格式
    function normalizeFace(face, adTypeKey, faceIndex) {
      const fields = getFaceFields(adTypeKey)
      const result = { photos: [], notes: '' }
      let measureFaceLabel = ''
      let widthVal = 0, heightVal = 0
      let widthMeter = 0, heightMeter = 0
      const extraFields = {}

      for (const field of fields) {
        const key = field.field_key
        const val = face[key]
        const fieldUnit = field.field_unit || 'm'
        const fieldRole = field.field_role || ''

        if (field.field_type === 'image') {
          result.photos = Array.isArray(val) ? val.map(v => (typeof v === 'string' ? v : v.url)).filter(Boolean) : (val || [])
        } else if (field.field_type === 'number') {
          const numVal = Number(val) || 0
          const toMeter = fieldUnit === 'cm' ? numVal / 100 : (fieldUnit === 'mm' ? numVal / 1000 : numVal)
          if (fieldRole === 'width') {
            widthVal = numVal
            widthMeter = Number(toMeter.toFixed(4))
          } else if (fieldRole === 'height') {
            heightVal = numVal
            heightMeter = Number(toMeter.toFixed(4))
          } else {
            extraFields[key] = numVal
            extraFields[key + '_meter'] = Number(toMeter.toFixed(4))
          }
        } else if (field.field_type === 'select') {
          if (fieldRole === 'label' || !measureFaceLabel) {
            measureFaceLabel = String(val || '')
          }
          extraFields[key] = val
        } else if (field.field_type === 'textarea' || field.field_type === 'text') {
          if (key === 'note' || key === 'notes') {
            result.notes = String(val || '')
          } else {
            extraFields[key] = String(val || '')
          }
        }
      }

      // 如果没有通过 field_role 找到宽度/高度，按顺序回退
      if (widthVal === 0 && heightVal === 0) {
        const numFields = fields.filter(f => f.field_type === 'number')
        if (numFields.length >= 1) {
          const f1 = numFields[0]
          const v1 = Number(face[f1.field_key]) || 0
          const u1 = f1.field_unit || 'm'
          widthVal = v1
          widthMeter = u1 === 'cm' ? v1 / 100 : (u1 === 'mm' ? v1 / 1000 : v1)
        }
        if (numFields.length >= 2) {
          const f2 = numFields[1]
          const v2 = Number(face[f2.field_key]) || 0
          const u2 = f2.field_unit || 'm'
          heightVal = v2
          heightMeter = u2 === 'cm' ? v2 / 100 : (u2 === 'mm' ? v2 / 1000 : v2)
        }
      }

      result.width = Number(widthVal.toFixed(4))
      result.height = Number(heightVal.toFixed(4))
      result._widthM = widthMeter
      result._heightM = heightMeter
      result.area = Number((widthMeter * heightMeter).toFixed(4))
      result.label = measureFaceLabel || face.label || `第${faceIndex + 1}面`
      result.special_flag = false
      Object.assign(result, extraFields)
      return result
    }

    const materials = adTypeBlocks.value
      .filter(b => b.adTypeKey && b.groups.some(g => g.faces.length > 0))
      .map((b, bi) => {
        const faces = []
        for (let gi = 0; gi < b.groups.length; gi++) {
          const group = b.groups[gi]
          for (let fi = 0; fi < group.faces.length; fi++) {
            const face = normalizeFace(group.faces[fi], b.adTypeKey, fi)
            // 确保分组名唯一：广告类型+分组序号+一体/独立标识
            const adTypeLabel = currentAdTypeMap.value[b.adTypeKey] || b.adTypeKey
            // 1个面时自动降为独立
            const actualUnified = group.isUnified && group.faces.length >= 2
            const unifiedTag = actualUnified ? '一体' : '独立'
            face.group_name = `${adTypeLabel}${gi + 1}-${unifiedTag}`
            face.is_unified = actualUnified
            faces.push(face)
          }
        }
        return {
          material_type: b.adTypeKey,
          faces,
        }
      })

    await api.post(`/measurements/${props.workOrderId}/proxy-submit`, {
      template_id: selectedTemplateId.value,
      materials,
    })
    ElMessage.success(isEditMode.value ? '测量数据已更新' : '代录测量数据已提交')
    visible.value = false
    emit('success')
    // 重置
    resetForm()
  } catch (e) {
    logger.error('代录提交失败:', e)
    const errData = e.response?.data
    const errMsg = errData?.message || errData?.error || e.message || '提交失败'
    ElMessage.error(errMsg)
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  selectedTemplateId.value = ''
  adTypeBlocks.value = []
  blockUploadFiles.value = {}
}

function handleClose() {
  // 关闭时重置
  resetForm()
}

// 监听弹窗打开，每次打开都重新加载模板确保使用最新配置
async function onVisibleChange(val) {
  if (!val) return
  // 重新加载项目模板（用户可能在设置页刚修改过）
  formConfigLoading.value = true
  try {
    const res = await api.get('/tenant/settings/project-templates')
    if (res.code === 0 && res.data) {
      const oldTemplateIds = projectTemplates.value.map(t => t.id)
      projectTemplates.value = res.data.templates || []
      // 如果当前选中的模板已不存在，重置选择
      if (selectedTemplateId.value && !projectTemplates.value.find(t => t.id === selectedTemplateId.value)) {
        selectedTemplateId.value = ''
        adTypeBlocks.value = []
      }
      // 如果是编辑模式，用最新模板回填已有数据
      if (isEditMode.value) {
        populateFromExistingData()
      }
    }
  } catch (err) {
    logger.error('加载项目模板失败:', err)
  } finally {
    formConfigLoading.value = false
    formConfigLoaded.value = true
  }
}

watch(visible, onVisibleChange)

onMounted(() => {
  loadFormConfig()
})
</script>

<style scoped>
.ad-type-block { margin-bottom: 16px; }
.face-card-header { display: flex; justify-content: space-between; align-items: center; }
.face-card-title { font-weight: 600; }
.group-card { margin-bottom: 12px; }
.group-card .group-header-left { display: flex; align-items: center; gap: 12px; }
.group-card .group-label { font-size: 13px; color: #606266; background: #f5f7fa; padding: 4px 12px; border-radius: 4px; }
.group-unified { border: 1px solid #409eff; }
.ml-12 { margin-left: 12px; }
.mb-12 { margin-bottom: 12px; }
.unified-hint { font-size: 11px; color: #909399; margin-left: 8px; }
.proxy-footer { display: flex; justify-content: center; padding-top: 8px; border-top: 1px dashed #e5e7eb; }
.text-muted { color: #909399; }
.material-face-card { margin-bottom: 8px; }

/* 必填但未选择的下拉框警告样式 */
:deep(.warning-select) .el-input__wrapper {
  border: 1px solid var(--color-danger);
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
}
:deep(.warning-select) .el-input__inner::placeholder {
  color: var(--color-danger);
}
</style>
