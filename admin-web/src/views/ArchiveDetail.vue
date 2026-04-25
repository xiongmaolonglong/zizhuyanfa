<template>
  <div v-loading="loading">
    <div class="page-header flex-between">
      <div>
        <el-button @click="$router.back()" class="mb-8">&larr; 返回</el-button>
        <h1 class="page-title">归档详情 <span class="archive-no">{{ archive.archive_no }}</span></h1>
      </div>
      <el-button type="primary" @click="handleExport">导出归档文件</el-button>
    </div>

    <!-- 工单信息 -->
    <el-card class="mb-20">
      <template #header><span class="section-title">工单信息</span></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="项目">
          <el-tag v-if="projectName" type="primary" effect="plain">{{ projectName }}</el-tag>
          <span v-else class="text-muted">-</span>
        </el-descriptions-item>
        <el-descriptions-item label="店铺名字">{{ workOrder.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="需求描述" :span="2">{{ workOrder.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="完成日期">{{ workOrder.completed_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="归档日期">{{ archive.archived_at || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 归档文件汇总 -->
    <el-card class="mb-20" v-if="archive.file_urls?.length">
      <template #header><span class="section-title">归档文件（{{ totalFiles }}个）</span></template>

      <div v-for="(group, gi) in archive.file_urls" :key="gi" class="file-group">
        <h4 class="file-group-title">{{ fileLabel(group.type) }}</h4>
        <div class="photo-grid">
          <template v-if="group.urls">
            <el-image v-for="(url, i) in group.urls" :key="gi + '-' + i" :src="url"
              :preview-src-list="group.urls" fit="cover" class="photo-item" />
          </template>
          <template v-else-if="group.url">
            <el-image :src="group.url" fit="cover" class="photo-item" />
          </template>
          <template v-else-if="group.data">
            <pre class="data-block">{{ JSON.stringify(group.data, null, 2) }}</pre>
          </template>
        </div>
      </div>
    </el-card>

    <el-empty v-if="!archive.file_urls?.length" description="暂无归档文件" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'

const route = useRoute()
const router = useRouter()
const loading = ref(true)

const archive = ref({})
const workOrder = ref({})

const projectName = computed(() => {
  const cd = workOrder.value.custom_data
  return (typeof cd === 'string' ? JSON.parse(cd).project_name : cd?.project_name) || null
})

const totalFiles = computed(() => {
  return (archive.value.file_urls || []).reduce((sum, f) => sum + (f.urls ? f.urls.length : 1), 0)
})

const FILE_LABELS = {
  declaration_photos: '申报照片',
  id_card_front: '身份证正面',
  id_card_back: '身份证反面',
  measurement_photos: '测量照片',
  measurement_data: '测量数据',
  design_files: '设计文件',
  design_previews: '设计预览',
  construction_before: '施工前照片',
  construction_during: '施工中照片',
  construction_after: '施工后照片',
  construction_signature: '验收签名',
}
function fileLabel(type) { return FILE_LABELS[type] || type }

async function handleExport() {
  try {
    const res = await api.get(`/archives/${route.params.workOrderId}/export`)
    const data = res.data || {}
    ElMessage.success(`归档数据已获取，共 ${data.total_files || 0} 个文件`)
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '导出失败')
  }
}

async function fetchDetail() {
  loading.value = true
  try {
    const res = await api.get(`/archives/${route.params.workOrderId}`)
    const d = res.data || {}
    archive.value = d
    workOrder.value = d.workOrder || {}
  } catch {
    archive.value = {}
    workOrder.value = {}
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
.section-title { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); }
.archive-no { font-size: var(--font-size-sm); color: var(--color-text-tertiary); font-weight: var(--font-weight-normal); }
.file-group { margin-bottom: var(--space-4); padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-border-light); }
.file-group:last-child { border-bottom: none; margin-bottom: 0; }
.file-group-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); margin-bottom: var(--space-2); color: var(--color-text-secondary); }
.photo-grid { display: grid; grid-template-columns: repeat(5, 100px); gap: var(--space-2); }
.photo-item { width: 100px; height: 100px; border-radius: var(--radius-sm); cursor: pointer; }
.data-block { background: var(--color-bg-page); padding: var(--space-3); border-radius: var(--radius-sm); font-size: var(--font-size-xs); max-height: 300px; overflow: auto; white-space: pre-wrap; }
</style>
