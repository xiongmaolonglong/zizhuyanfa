<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">我的申报</h1>
      <el-button type="primary" @click="openCreate">+ 新建申报</el-button>
    </div>

    <el-table :data="list" stripe v-loading="tableLoading">
      <el-table-column v-for="col in columns" :key="col.field_key"
        :label="col.field_label" :width="col.width" :min-width="col.minWidth">
        <template #default="{ row }">
          <template v-if="col.isLink">
            <router-link :to="`/declarations/${row.id}`" class="link">{{ getFieldValue(row, col) }}</router-link>
          </template>
          <template v-else-if="col.field_key === 'activity_name'">
            {{ getActivityLabel(row) }}
          </template>
          <template v-else-if="col.field_key === 'project_type'">
            {{ getProjectTypeLabel(row) }}
          </template>
          <template v-else>
            {{ getFieldValue(row, col) || '-' }}
          </template>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="handleEdit(row)" v-if="canEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" link @click="handleDelete(row)" v-if="canDelete(row)">删除</el-button>
          <span v-if="!canEdit(row) && !canDelete(row)" class="text-muted">-</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新建/编辑 申报对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑申报' : '新建申报'" width="600px"
      @closed="onDialogClosed">
      <el-form ref="dialogFormRef" :model="dialogForm" :rules="dialogRules" label-width="100px"
        v-loading="dialogLoading">
        <template v-for="field in formFields" :key="field.field_key">
          <el-form-item
            v-if="field.field_key !== 'client_id'"
            :label="field.field_label"
            :prop="field.field_key"
            :required="field.required"
          >
            <AddressPicker v-if="field.enable_parse || field.field_type === 'address'"
              v-model="dialogForm[field.field_key]"
              :placeholder="field.placeholder"
              :field-label="field.field_label" />
            <el-select v-else-if="field.field_type === 'select'"
              v-model="dialogForm[field.field_key]"
              :placeholder="field.placeholder || '请选择'"
              style="width:100%">
              <el-option v-for="opt in (field.options || [])" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
            <el-upload v-else-if="field.field_type === 'image'"
              action="/api/v1/files" list-type="picture-card"
              :file-list="uploadFileLists[field.field_key] || []"
              :on-success="(res, file) => onFileSuccess(res, file, field.field_key)"
              :headers="{ Authorization: `Bearer ${token}` }"
              name="file">
              <el-icon><Plus /></el-icon>
            </el-upload>
            <el-input v-else v-model="dialogForm[field.field_key]"
              :placeholder="field.placeholder || '请输入'" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存' : '提交申报' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import api from '../api'
import AddressPicker from '../components/AddressPicker.vue'
import { useAuthStore } from '../store/auth'

const auth = useAuthStore()
const token = computed(() => auth.token || '')

const list = ref([])
const tableLoading = ref(false)
const formFields = ref([])
const activityOptions = ref([])
const projectTypeOptions = ref([])
const uploadFileLists = ref({})

const columns = computed(() => {
  return formFields.value
    .filter(f => f.visible && !['description', 'client_id'].includes(f.field_key))
    .map(f => {
      const isLink = f.field_key === 'title'
      const widthMap = { title: 160, project_type: 120, activity_name: 120 }
      return {
        field_key: f.field_key,
        field_label: f.field_label,
        width: widthMap[f.field_key],
        minWidth: f.field_key === 'address' || f.field_key === 'title' ? 180 : undefined,
        isLink,
      }
    })
})

onMounted(async () => {
  await loadFormConfig()
  loadData()
})

async function loadFormConfig() {
  try {
    const res = await api.get('/tenant/form-config/work_order_create')
    if (res.code === 0 && res.data?.fields) {
      formFields.value = res.data.fields
      res.data.fields.forEach(f => {
        if (f.field_key === 'activity_name' && f.options) activityOptions.value = f.options
        if (f.field_key === 'project_type' && f.options) projectTypeOptions.value = f.options
      })
    }
  } catch {}
}

async function loadData() {
  tableLoading.value = true
  try {
    const res = await api.get('/declarations')
    list.value = res.data || []
  } catch {
    list.value = []
  } finally {
    tableLoading.value = false
  }
}

function getFieldValue(row, col) {
  if (['title', 'activity_name'].includes(col.field_key)) {
    return row.work_order?.[col.field_key]
  }
  return row[col.field_key]
}

function getActivityLabel(row) {
  const val = row.work_order?.activity_name
  if (!val) return '-'
  const opt = activityOptions.value.find(o => o.value === val)
  return opt ? opt.label : val
}

function getProjectTypeLabel(row) {
  const val = row.project_type
  if (!val) return '-'
  const opt = projectTypeOptions.value.find(o => o.value === val)
  return opt ? opt.label : val
}

// --- 新建/编辑 对话框 ---
const dialogVisible = ref(false)
const dialogForm = ref({})
const dialogFormRef = ref()
const dialogRules = ref({})
const submitting = ref(false)
const dialogLoading = ref(false)
const isEdit = ref(false)

function buildRules() {
  const rules = {}
  formFields.value.forEach(f => {
    if (f.required && f.field_key !== 'client_id') {
      rules[f.field_key] = [{ required: true, message: `请输入${f.field_label}`, trigger: f.field_type === 'select' ? 'change' : 'blur' }]
    }
  })
  return rules
}

function initForm(data = {}) {
  const form = {}
  uploadFileLists.value = {}
  formFields.value.forEach(f => {
    form[f.field_key] = data[f.field_key] !== undefined ? data[f.field_key] : ''
    if (f.field_type === 'image') {
      form[f.field_key] = []
      const existingFiles = data[f.field_key] || []
      uploadFileLists.value[f.field_key] = existingFiles.map((url, idx) => ({
        name: `image_${idx}`,
        url: url.startsWith('http') ? url : `/api/v1${url}`,
      }))
    }
  })
  return form
}

function openCreate() {
  isEdit.value = false
  dialogForm.value = initForm()
  dialogRules.value = buildRules()
  dialogVisible.value = true
}

function canEdit(row) {
  const wo = row.work_order || {}
  // 审批通过（进入派单及以后环节）后不可编辑
  const lockedStages = ['assignment', 'measurement', 'design', 'production', 'construction', 'finance', 'archive', 'aftersale']
  if (lockedStages.includes(wo.current_stage)) return false
  // 审批中也不可编辑
  if (wo.current_stage === 'approval') return false
  return true
}

function canDelete(row) {
  const wo = row.work_order || {}
  const lockedStages = ['assignment', 'measurement', 'design', 'production', 'construction', 'finance', 'archive', 'aftersale']
  return !lockedStages.includes(wo.current_stage)
}

function handleEdit(row) {
  isEdit.value = true
  const wo = row.work_order || {}
  dialogForm.value = initForm({
    ...row,
    ...wo,
  })
  dialogRules.value = buildRules()
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await dialogFormRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const payload = { ...dialogForm.value }
    // 清理空值
    Object.entries(payload).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) delete payload[k]
    })
    if (isEdit.value) {
      await api.put(`/declarations/${payload.id}`, payload)
      ElMessage.success('修改成功')
    } else {
      await api.post('/declarations', payload)
      ElMessage.success('申报提交成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || (isEdit.value ? '修改失败' : '申报提交失败'))
  } finally {
    submitting.value = false
  }
}

function onDialogClosed() {
  dialogForm.value = {}
  uploadFileLists.value = {}
}

function onFileSuccess(res, file, fieldKey) {
  if (res.code === 0 && res.data) {
    if (!dialogForm.value[fieldKey]) dialogForm.value[fieldKey] = []
    dialogForm.value[fieldKey].push(res.data.url)
  }
}

// --- 删除 ---
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定删除此申报？删除后不可恢复。', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await api.delete(`/declarations/${row.id}`)
    ElMessage.success('已删除')
    loadData()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.response?.data?.error || '删除失败')
    }
  }
}
</script>

<style scoped>
.page-title { font-size: 20px; font-weight: 600; color: #1a1a1a; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.link { color: #67c23a; text-decoration: none; font-family: monospace; }
.text-muted { color: #909399; font-size: 14px; }
</style>
