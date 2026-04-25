<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">售后申请</h1>
    </div>

    <el-card>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" style="max-width:600px">
        <el-form-item label="关联工单" prop="work_order_id">
          <el-select v-model="form.work_order_id" placeholder="请选择工单" filterable style="width:100%">
            <el-option v-for="wo in workOrders" :key="wo.id" :label="`${wo.work_order_no} - ${wo.title}`" :value="wo.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="问题描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请详细描述售后问题" />
        </el-form-item>
        <el-form-item label="现场照片">
          <el-upload
            action="/api/v1/files"
            list-type="picture-card"
            :file-list="fileList"
            :on-success="onFileSuccess"
            :on-remove="onFileRemove"
            :headers="uploadHeaders"
            name="file"
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">提交申请</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useAuthStore } from '../store/auth'
import { createAftersale, getAftersales } from '../api/aftersales'

const router = useRouter()
const auth = useAuthStore()
const formRef = ref()
const submitting = ref(false)
const workOrders = ref([])

const form = reactive({
  work_order_id: '',
  description: '',
  photos: []
})

const fileList = ref([])
const uploadHeaders = computed(() => ({ Authorization: `Bearer ${auth.token}` }))

const rules = {
  work_order_id: [{ required: true, message: '请选择工单', trigger: 'change' }],
  description: [{ required: true, message: '请描述售后问题', trigger: 'blur' }]
}

onMounted(async () => {
  try {
    const res = await getAftersales({ limit: 200 })
    // 从售后列表中提取工单信息
    const woMap = new Map()
    for (const a of (res.data || [])) {
      if (a.workOrder && !woMap.has(a.workOrder.id)) {
        woMap.set(a.workOrder.id, { id: a.workOrder.id, work_order_no: a.workOrder.work_order_no, title: a.workOrder.title })
      }
    }
    workOrders.value = Array.from(woMap.values())
  } catch {
    workOrders.value = []
  }
})

function onFileSuccess(res, file) {
  const url = res.url || res.data?.url
  if (!url) return ElMessage.error('上传失败')
  if (!form.photos.includes(url)) form.photos.push(url)
}

function onFileRemove(file) {
  const url = file.url || file.response?.url || file.response?.data?.url
  if (!url) return
  const idx = form.photos.indexOf(url)
  if (idx > -1) form.photos.splice(idx, 1)
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    await createAftersale({
      work_order_id: parseInt(form.work_order_id),
      description: form.description.trim(),
      photos: form.photos
    })
    ElMessage.success('售后申请已提交')
    router.push('/aftersales')
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '提交失败')
  } finally {
    submitting.value = false
  }
}

function handleReset() {
  form.work_order_id = ''
  form.description = ''
  form.photos = []
  fileList.value = []
}
</script>

<style scoped>
.page-title { font-size: 20px; font-weight: 600; color: #1a1a1a; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>
