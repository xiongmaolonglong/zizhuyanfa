<template>
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
      <div v-if="savedSourceFiles.length" class="saved-files">
        <div v-for="(file, idx) in savedSourceFiles" :key="idx" class="saved-file-item">
          <el-icon><Document /></el-icon>
          <span class="file-name">{{ getFileName(file) }}</span>
        </div>
      </div>
      <FileUpload
        v-if="!locked"
        v-model="sourceFiles"
        :limit="5"
        accept=".psd,.ai,.cdr,.sketch,.fig,.pdf"
        list-type="text"
      />
    </div>

    <!-- 设计说明 -->
    <div class="sidebar-section">
      <div class="section-label">设计说明</div>
      <div v-if="savedNotes" class="saved-notes">{{ savedNotes }}</div>
      <el-input v-else v-model="notes" type="textarea" :rows="3" placeholder="输入设计说明或备注..." />
    </div>

    <!-- 提交按钮 -->
    <el-button
      v-if="!locked"
      type="primary"
      class="submit-btn"
      @click="$emit('submit')"
      :loading="submitting"
      :disabled="!allUploaded || !hasSourceFiles">
      提交设计稿
    </el-button>
    <div v-if="(!allUploaded || !hasSourceFiles) && !locked" class="upload-warning">
      {{ !allUploaded ? '请先上传所有面的效果图' : '请先上传源文件' }}再提交
    </div>

    <!-- 上传进度 -->
    <div v-if="!locked" class="progress-section">
      <span class="progress-label">上传进度</span>
      <div class="progress-bar-wrapper">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
      </div>
      <span class="progress-text">已上传 {{ uploadedCount }}/{{ totalFaceCount }} 面</span>
    </div>

    <!-- 审核中提示 + 撤回 -->
    <template v-if="designStatus === 'reviewing'">
      <el-divider />
      <el-alert type="info" :closable="false" show-icon style="margin-bottom: 12px;">
        设计稿审核中，请等待管理员审核
      </el-alert>
      <el-button type="warning" @click="$emit('withdraw')" :loading="submitting" style="width: 100%;">撤回修改</el-button>
    </template>

    <!-- 管理员审核操作 -->
    <template v-if="isAdmin && designStatus === 'reviewing'">
      <el-divider />
      <div class="review-actions">
        <el-button type="success" @click="$emit('approve')" :loading="submitting" style="width: 100%;">审核通过</el-button>
        <el-button type="danger" @click="$emit('reject')" :loading="submitting" style="width: 100%;">驳回</el-button>
      </div>
    </template>

    <template v-if="designStatus === 'approved'">
      <el-divider />
      <el-button type="warning" @click="$emit('confirm')" :loading="submitting">确认定稿</el-button>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { WarningFilled, Document } from '@element-plus/icons-vue'
import FileUpload from '../../components/FileUpload.vue'

const props = defineProps({
  colorRequirement: { type: String, default: '' },
  savedSourceFiles: { type: Array, default: () => [] },
  savedNotes: { type: String, default: '' },
  sourceFiles: { type: Array, default: () => [] },
  notes: { type: String, default: '' },
  locked: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
  allUploaded: { type: Boolean, default: false },
  hasSourceFiles: { type: Boolean, default: false },
  uploadedCount: { type: Number, default: 0 },
  totalFaceCount: { type: Number, default: 0 },
  progress: { type: Number, default: 0 },
  designStatus: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
})

const emit = defineEmits(['submit', 'withdraw', 'approve', 'reject', 'confirm', 'update:sourceFiles', 'update:notes'])

const sourceFiles = computed({
  get: () => props.sourceFiles,
  set: (v) => emit('update:sourceFiles', v),
})

const notes = computed({
  get: () => props.notes,
  set: (v) => emit('update:notes', v),
})

function getFileName(url) {
  if (!url) return ''
  const parts = url.split('/')
  return parts[parts.length - 1] || url
}
</script>

<style scoped>
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
  display: flex; align-items: center; gap: var(--space-2);
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
.sidebar-section { display: flex; flex-direction: column; gap: var(--space-2); }
.saved-files { display: flex; flex-direction: column; gap: var(--space-1); }
.saved-file-item {
  display: flex; align-items: center; gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  word-break: break-all;
}
.saved-file-item .el-icon { color: var(--color-primary); flex-shrink: 0; }
.saved-notes {
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.5;
  word-break: break-all;
}
.section-label { font-size: var(--font-size-xs); color: var(--color-text-tertiary); }
.submit-btn { width: 100%; height: 50px; font-size: 15px; font-weight: var(--font-weight-semibold); border-radius: 10px; }
.progress-section {
  background: var(--color-bg-card);
  border-radius: var(--radius-base);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.progress-label { font-size: var(--font-size-xs); color: var(--color-text-tertiary); }
.progress-bar-wrapper { display: flex; }
.progress-bar {
  flex: 1; height: 8px; background: var(--color-border-light);
  border-radius: 4px; overflow: hidden;
}
.progress-fill {
  height: 100%; background: var(--color-success);
  border-radius: 4px; transition: width var(--transition-slow);
}
.progress-text { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
.upload-warning {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
  text-align: center;
  line-height: 1.4;
}
.review-actions { display: flex; flex-direction: column; gap: var(--space-2); width: 100%; }
.review-actions .el-button { width: 100% !important; }
</style>
