<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">新建申报</h1>
      <div>
        <el-button @click="saveDraft">存草稿</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">提交申报</el-button>
      </div>
    </div>

    <el-card>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px" v-loading="loading">
        <template v-if="formFields.length">
          <el-form-item
            v-for="field in formFields"
            :key="field.field_key"
            :label="field.field_label"
            :prop="field.field_key"
            :required="field.required"
          >
            <AddressPicker v-if="field.enable_parse"
              v-model="form[field.field_key]" :placeholder="field.placeholder"
              :field-label="field.field_label" />
            <el-select v-else-if="field.field_type === 'select'"
              v-model="form[field.field_key]" :placeholder="field.placeholder || '请选择'" style="width:100%">
              <el-option v-for="opt in (field.options || [])" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
            <el-input v-else-if="field.field_type === 'textarea'"
              v-model="form[field.field_key]" type="textarea" :rows="3" :placeholder="field.placeholder || '请输入'" />
            <el-input-number v-else-if="field.field_type === 'number'"
              v-model="form[field.field_key]" :min="0" :precision="2" controls-position="right" style="width:100%" />
            <el-date-picker v-else-if="field.field_type === 'date'"
              v-model="form[field.field_key]" type="date" :placeholder="field.placeholder || '请选择日期'" style="width:100%" value-format="YYYY-MM-DD" />
            <el-input v-else-if="field.field_type === 'phone'"
              v-model="form[field.field_key]" :placeholder="field.placeholder || '请输入手机号'">
              <template #prefix><el-icon><Phone /></el-icon></template>
            </el-input>
            <el-upload v-else-if="field.field_type === 'image'"
              action="/api/v1/files" list-type="picture-card"
              :file-list="uploadFileLists[field.field_key] || []"
              :on-success="(res, file) => onFileSuccess(res, file, field.field_key)"
              :on-error="onFileError"
              :headers="uploadHeaders"
              name="file">
              <el-icon><Plus /></el-icon>
            </el-upload>
            <el-upload v-else-if="field.field_type === 'file'"
              action="/api/v1/files"
              :file-list="uploadFileLists[field.field_key] || []"
              :on-success="(res, file) => onFileSuccess(res, file, field.field_key)"
              :on-error="onFileError"
              :headers="uploadHeaders"
              name="file">
              <el-button type="primary">选择文件</el-button>
            </el-upload>
            <AddressPicker v-else-if="field.field_type === 'address'"
              v-model="form[field.field_key]" :placeholder="field.placeholder"
              :field-label="field.field_label" />
            <el-input v-else v-model="form[field.field_key]" :placeholder="field.placeholder || '请输入'" />
          </el-form-item>
        </template>
        <el-empty v-else-if="!loading" description="未加载到表单配置" />
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Phone } from '@element-plus/icons-vue'
import { useAuthStore } from '../store/auth'
import api from '../api'
import AddressPicker from '../components/AddressPicker.vue'

const router = useRouter()
const auth = useAuthStore()
const formRef = ref()
const submitting = ref(false)
const loading = ref(false)
const formFields = ref([])
const formRules = ref({})
const form = reactive({})
const uploadFileLists = reactive({})

const uploadHeaders = computed(() => ({
  Authorization: auth.token ? `Bearer ${auth.token}` : ''
}))

async function loadFormConfig() {
  loading.value = true
  try {
    const res = await api.get('/tenant/form-config/work_order_create')
    if (res.code === 0 && res.data) {
      formFields.value = (res.data.fields || []).filter(f => f.field_key !== 'client_id')
      const rules = {}
      formFields.value.forEach(f => {
        if (f.required) {
          rules[f.field_key] = [{ required: true, message: `请输入${f.field_label}`, trigger: f.field_type === 'select' ? 'change' : 'blur' }]
        }
        if (f.default_value !== undefined) form[f.field_key] = f.default_value
        else if (f.field_type === 'image' || f.field_type === 'file') { form[f.field_key] = []; uploadFileLists[f.field_key] = [] }
        else form[f.field_key] = ''
      })
      formRules.value = rules

      // 自动填充申报人和联系人
      const label = auth.user?.name || ''
      const phone = auth.user?.phone || ''
      formFields.value.forEach(f => {
        const lbl = f.field_label || ''
        const key = f.field_key || ''
        if ((lbl.includes('申报人') || key === 'applicant_name') && !form[f.field_key]) {
          form[f.field_key] = label
        }
        if ((lbl.includes('联系人') || key === 'contact_name') && !form[f.field_key]) {
          form[f.field_key] = label
        }
        if ((lbl.includes('联系电话') || key === 'contact_phone') && !form[f.field_key]) {
          form[f.field_key] = phone
        }
      })
    } else {
      console.warn('API returned non-success code:', res.code, res.message)
      ElMessage.error(res.message || '加载表单配置失败')
    }
  } catch (e) {
    console.error('loadFormConfig error:', e)
    ElMessage.error('加载表单配置失败')
  } finally {
    loading.value = false
  }
}

function onFileSuccess(res, file, fieldKey) {
  const url = res.url || res.data?.url
  if (!url) {
    ElMessage.error('上传成功但未返回文件地址')
    return
  }
  if (!form[fieldKey]) form[fieldKey] = []
  if (!form[fieldKey].includes(url)) form[fieldKey].push(url)
  if (!uploadFileLists[fieldKey]) uploadFileLists[fieldKey] = []
  uploadFileLists[fieldKey].push({ name: file.name, url })
}

function onFileError() {
  ElMessage.error('文件上传失败')
}

function saveDraft() {
  localStorage.setItem('declaration_draft', JSON.stringify(form))
  ElMessage.success('草稿已保存')
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const payload = { ...form }
    Object.entries(payload).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) delete payload[k]
    })
    await api.post('/declarations', payload)
    localStorage.removeItem('declaration_draft')
    ElMessage.success('申报提交成功')
    router.push('/my-declarations')
  } catch (e) {
    ElMessage.error(e.response?.data?.error || e.message || '申报提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadFormConfig()
  try {
    const draft = localStorage.getItem('declaration_draft')
    if (draft) {
      const draftData = JSON.parse(draft)
      Object.keys(draftData).forEach(k => {
        if (form[k] !== undefined) form[k] = draftData[k]
      })
    }
  } catch {}
})
</script>

<style scoped>
.page-title { font-size: 20px; font-weight: 600; color: #1a1a1a; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>
