<template>
  <div v-loading="loading">
    <div class="page-header flex-between">
      <div>
        <el-button @click="$router.back()" class="mb-8">&larr; 返回</el-button>
        <h1 class="page-title">售后详情</h1>
      </div>
      <div>
        <el-button v-if="aftersale.status === 'pending' || aftersale.status === 'processing'" type="primary" @click="openHandleDialog">处理</el-button>
      </div>
    </div>

    <!-- 基本信息 -->
    <el-card class="mb-20">
      <template #header><span class="section-title">售后信息</span></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="项目">
          <el-tag v-if="projectName" type="primary" effect="plain">{{ projectName }}</el-tag>
          <span v-else class="text-muted">-</span>
        </el-descriptions-item>
        <el-descriptions-item label="店铺名字">{{ aftersale.workOrder?.title }}</el-descriptions-item>
        <el-descriptions-item label="提交人">{{ aftersale.clientRequester?.real_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ aftersale.clientRequester?.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ aftersale.handler?.real_name || '未分配' }}</el-descriptions-item>
        <el-descriptions-item label="处理日期">{{ aftersale.resolved_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(aftersale.status)">{{ statusLabel(aftersale.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="提交日期">{{ formatDate(aftersale.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="问题描述" :span="2">{{ aftersale.description }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 问题照片 -->
    <el-card class="mb-20" v-if="aftersale.photos?.length">
      <template #header><span class="section-title">问题照片（{{ aftersale.photos.length }}张）</span></template>
      <div class="photo-grid">
        <el-image v-for="(url, i) in aftersale.photos" :key="'p' + i" :src="url"
          :preview-src-list="aftersale.photos" fit="cover" class="photo-item" />
      </div>
    </el-card>

    <!-- 处理记录 -->
    <el-card class="mb-20" v-if="aftersale.handler_notes || aftersale.handler_photos?.length">
      <template #header><span class="section-title">处理记录</span></template>
      <div class="handler-notes">{{ aftersale.handler_notes }}</div>
      <div v-if="aftersale.handler_photos?.length" class="photo-grid mt-12">
        <el-image v-for="(url, i) in aftersale.handler_photos" :key="'h' + i" :src="url"
          :preview-src-list="aftersale.handler_photos" fit="cover" class="photo-item" />
      </div>
    </el-card>

    <!-- 处理对话框 -->
    <el-dialog v-model="showHandleDialog" title="处理售后" width="520px">
      <el-form label-width="80px">
        <el-form-item label="处理结果" required>
          <el-select v-model="handleForm.status" style="width:100%">
            <el-option label="处理中" value="processing" />
            <el-option label="已解决" value="resolved" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input v-model="handleForm.notes" type="textarea" :rows="3" placeholder="填写处理详情" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showHandleDialog = false">取消</el-button>
        <el-button type="primary" @click="submitHandle" :loading="submitting">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { formatDate } from '../utils/format'
import api from '../api'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const submitting = ref(false)

const aftersale = ref({})

const projectName = computed(() => {
  const cd = aftersale.value.workOrder?.custom_data
  return (typeof cd === 'string' ? JSON.parse(cd).project_name : cd?.project_name) || null
})

const STATUS_MAP = {
  pending: '待处理', processing: '处理中', resolved: '已解决', closed: '已关闭',
}
function statusLabel(s) { return STATUS_MAP[s] || s }
function statusType(s) {
  const map = { pending: 'warning', processing: 'primary', resolved: 'success', closed: 'info' }
  return map[s] || ''
}

// 处理
const showHandleDialog = ref(false)
const handleForm = reactive({ status: 'processing', notes: '' })

function openHandleDialog() {
  handleForm.status = aftersale.value.status === 'processing' ? 'resolved' : 'processing'
  handleForm.notes = ''
  showHandleDialog.value = true
}

async function submitHandle() {
  submitting.value = true
  try {
    await api.post(`/aftersales/${aftersale.value.id}/handle`, {
      status: handleForm.status,
      notes: handleForm.notes,
    })
    ElMessage.success('售后已处理')
    showHandleDialog.value = false
    await fetchDetail()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '处理失败')
  } finally {
    submitting.value = false
  }
}

async function fetchDetail() {
  loading.value = true
  try {
    const res = await api.get(`/aftersales/${route.params.id}`)
    aftersale.value = res.data || {}
  } catch {
    aftersale.value = {}
  } finally {
    loading.value = false
  }
}

onMounted(fetchDetail)
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.mb-8 { margin-bottom: var(--space-2); }
.mb-20 { margin-bottom: var(--space-5); }
.mt-12 { margin-top: var(--space-3); }
.section-title { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); }
.wo-link { color: var(--color-primary); text-decoration: none; }
.wo-link:hover { text-decoration: underline; }
.handler-notes { padding: var(--space-3); background: var(--color-bg-page); border-radius: var(--radius-sm); font-size: var(--font-size-sm); line-height: 1.6; }
.photo-grid { display: grid; grid-template-columns: repeat(5, 100px); gap: var(--space-2); }
.photo-item { width: 100px; height: 100px; border-radius: var(--radius-sm); cursor: pointer; }
</style>
