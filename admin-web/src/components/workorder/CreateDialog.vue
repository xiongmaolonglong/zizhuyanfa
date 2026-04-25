<template>
  <el-dialog v-model="visible" title="补录工单" width="600px" @open="loadConfig" :close-on-click-modal="false">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" v-loading="loading">
      <!-- 必填字段 -->
      <template v-if="fields.length">
        <template v-for="field in requiredFields" :key="field.field_key">
          <el-form-item :label="field.field_label" :prop="field.field_key" :required="field.required">
            <AddressPicker v-if="field.enable_parse || field.field_type === 'address'"
              v-model="form[field.field_key]" :placeholder="field.placeholder"
              :field-label="field.field_label" />
            <el-select v-else-if="field.field_type === 'client_select'"
              v-model="form[field.field_key]" placeholder="请选择" style="width:100%">
              <el-option v-for="c in clients" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
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
              :headers="{ Authorization: `Bearer ${token}` }"
              name="file">
              <el-icon><Plus /></el-icon>
            </el-upload>
            <el-input v-else v-model="form[field.field_key]" :placeholder="field.placeholder || '请输入'" />
          </el-form-item>
        </template>

        <!-- 非必填字段可折叠 -->
        <el-collapse v-if="optionalFields.length" v-model="showOptional">
          <el-collapse-item name="optional" title="更多信息（选填）">
            <template v-for="field in optionalFields" :key="field.field_key">
              <el-form-item :label="field.field_label" :prop="field.field_key">
                <AddressPicker v-if="field.enable_parse || field.field_type === 'address'"
                  v-model="form[field.field_key]" :placeholder="field.placeholder"
                  :field-label="field.field_label" />
                <el-select v-else-if="field.field_type === 'client_select'"
                  v-model="form[field.field_key]" placeholder="请选择" style="width:100%">
                  <el-option v-for="c in clients" :key="c.id" :label="c.name" :value="c.id" />
                </el-select>
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
                  :headers="{ Authorization: `Bearer ${token}` }"
                  name="file">
                  <el-icon><Plus /></el-icon>
                </el-upload>
                <el-input v-else v-model="form[field.field_key]" :placeholder="field.placeholder || '请输入'" />
              </el-form-item>
            </template>
          </el-collapse-item>
        </el-collapse>
      </template>
      <el-empty v-else description="未加载到表单配置" />
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit" :loading="submitting">确认创建</el-button>
    </template>
  </el-dialog>

  <!-- 创建成功确认 -->
  <el-dialog v-model="successVisible" title="创建成功" width="480px" :close-on-click-modal="false">
    <div class="success-content">
      <el-result icon="success" :title="successMessage">
        <template #extra>
          <div class="success-actions">
            <router-link :to="`/work-orders/${createdWorkOrderId}`">
              <el-button type="primary">查看工单</el-button>
            </router-link>
            <el-button @click="goToDispatch" v-if="createdWorkOrderId">去派单</el-button>
          </div>
        </template>
      </el-result>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Phone } from '@element-plus/icons-vue'
import { useAuthStore } from '../../store/auth'
import api from '../../api'
import AddressPicker from '../AddressPicker.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  clients: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue', 'done'])

const router = useRouter()
const auth = useAuthStore()
const visible = ref(false)
const loading = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const fields = ref([])
const form = reactive({})
const rules = ref({})
const uploadFileLists = ref({})
const token = auth.token
const showOptional = ref([])

// 成功提示
const successVisible = ref(false)
const successMessage = ref('')
const createdWorkOrderId = ref(null)

// 必填/选填分类
const requiredFields = computed(() => fields.value.filter(f => f.required))
const optionalFields = computed(() => fields.value.filter(f => !f.required))

watch(() => props.modelValue, v => visible.value = v)
watch(visible, v => emit('update:modelValue', v))

async function loadConfig() {
  loading.value = true
  try {
    const res = await api.get('/tenant/form-config/work_order_create')
    if (res.code === 0 && res.data) {
      fields.value = res.data.fields || []
      const r = {}
      fields.value.forEach(f => {
        if (f.required) r[f.field_key] = [{ required: true, message: `请输入${f.field_label}`, trigger: 'change' }]
        form[f.field_key] = f.default_value !== undefined ? f.default_value : f.field_type === 'image' ? [] : ''
      })
      rules.value = r
      loadDefaultClient()
    }
  } catch (e) {
    console.error('加载创建表单配置失败:', e)
  } finally {
    loading.value = false
  }
}

async function loadDefaultClient() {
  try {
    const res = await api.get('/clients/default')
    if (res.code === 0 && res.data?.default_client_id) {
      form.client_id = res.data.default_client_id
    }
  } catch {}
}

function onFileSuccess(res, file, fieldKey) {
  const url = res.url || res.data?.url
  if (!url) return ElMessage.error('上传成功但未返回文件地址')
  if (!form[fieldKey]) form[fieldKey] = []
  if (!form[fieldKey].includes(url)) form[fieldKey].push(url)
  if (!uploadFileLists.value[fieldKey]) uploadFileLists.value[fieldKey] = []
  uploadFileLists.value[fieldKey].push({ name: file.name || url.split('/').pop(), url })
}

async function submit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const knownFields = ['client_id', 'title', 'project_type', 'project_category', 'activity_name', 'address', 'description', 'deadline', 'client_user_id']
    const body = {}
    const customData = {}
    Object.entries(form).forEach(([key, value]) => {
      if (knownFields.includes(key)) body[key] = value
      else customData[key] = value
    })
    if (Object.keys(customData).length > 0) body.custom_data = customData
    const res = await api.post('/work-orders', body)
    const woId = res.data?.id
    createdWorkOrderId.value = woId
    successMessage.value = `工单 ${res.data?.work_order_no || ''} 已创建`
    visible.value = false
    successVisible.value = true
    fields.value.forEach(f => { form[f.field_key] = f.default_value !== undefined ? f.default_value : f.field_type === 'image' ? [] : '' })
    emit('done')
  } catch (e) {
    const msg = e.response?.data?.message || e.response?.data?.error || e.message || '创建失败'
    ElMessage.error(msg)
  } finally {
    submitting.value = false
  }
}

function goToDispatch() {
  successVisible.value = false
  router.push('/dispatch')
}
</script>

<style scoped>
.success-content { padding: 20px 0; }
.success-actions { display: flex; gap: 12px; justify-content: center; }
</style>
