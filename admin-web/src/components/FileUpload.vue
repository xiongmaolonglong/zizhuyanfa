<template>
  <div class="upload-container" :class="{ disabled }">
    <!-- 已上传文件 -->
    <div v-for="(file, index) in localFiles" :key="index" class="uploaded-item">
      <img v-if="isImageUrl(file)" :src="file" class="uploaded-img" @click="previewImage(file)" />
      <div v-else class="uploaded-file">
        <el-icon><Document /></el-icon>
        <span class="file-name">{{ getFileName(file) }}</span>
      </div>
      <div v-if="!disabled" class="delete-overlay" @click.stop="removeFile(index)">
        <el-icon class="delete-icon"><Delete /></el-icon>
      </div>
    </div>

    <!-- 上传按钮 -->
    <div class="upload-btn" @click="triggerUpload" v-if="!disabled && localFiles.length < limit">
      <el-icon v-if="!uploading"><Plus /></el-icon>
      <el-icon v-else class="is-loading"><Loading /></el-icon>
    </div>
    <input ref="fileInput" type="file" :accept="accept" @change="handleFileChange" style="display:none" />

    <!-- 预览 -->
    <el-dialog v-model="showPreview" title="预览" width="80%" append-to-body>
      <img :src="previewUrl" style="width: 100%;" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Plus, Delete, Document, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  limit: { type: Number, default: 9 },
  accept: { type: String, default: 'image/*' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const localFiles = ref([])
const showPreview = ref(false)
const previewUrl = ref('')
const fileInput = ref(null)
const uploading = ref(false)

// 同步外部值到本地
watch(() => props.modelValue, (val) => {
  if (val && Array.isArray(val)) {
    localFiles.value = [...val]
  }
}, { immediate: true, deep: true })

// 同步本地值到外部
function emitUpdate() {
  emit('update:modelValue', [...localFiles.value])
}

function triggerUpload() {
  fileInput.value?.click()
}

async function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return

  uploading.value = true

  try {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: formData
    })

    const data = await res.json()

    if (data.url) {
      localFiles.value.push(data.url)
      emitUpdate()
      ElMessage.success('上传成功')
    } else {
      ElMessage.error(data.error || '上传失败')
    }
  } catch (err) {
    ElMessage.error('上传失败：' + err.message)
  } finally {
    uploading.value = false
    // 重置 input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

function removeFile(index) {
  localFiles.value.splice(index, 1)
  emitUpdate()
}

function isImageUrl(url) {
  if (!url) return false
  const ext = url.split('.').pop()?.toLowerCase() || ''
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext) || url.includes('image')
}

function getFileName(url) {
  return url?.split('/').pop() || '文件'
}

function previewImage(url) {
  previewUrl.value = url
  showPreview.value = true
}
</script>

<style scoped>
.upload-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.upload-container.disabled {
  opacity: 0.7;
  pointer-events: none;
}

.uploaded-item {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

.uploaded-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}

.uploaded-file {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 12px;
}

.uploaded-file .el-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.file-name {
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-overlay {
  position: absolute;
  top: 0;
  right: 0;
  width: 24px;
  height: 24px;
  background: #dc2626;
  border-radius: 0 8px 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
}

.delete-overlay:hover {
  background: #b91c1c;
}

.delete-icon {
  color: #fff;
  font-size: 14px;
}

.upload-btn {
  width: 100px;
  height: 100px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-btn:hover {
  border-color: var(--color-primary, #2563eb);
  background: #eff6ff;
}

.upload-btn .el-icon {
  font-size: 20px;
  color: #6b7280;
}

.is-loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
