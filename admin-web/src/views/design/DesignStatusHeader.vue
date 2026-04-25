<template>
  <div class="top-header">
    <div class="header-left">
      <div class="wo-badge">{{ workOrder?.work_order_no || '' }}</div>
      <h1 class="page-title">{{ workOrder?.title || '' }}</h1>
      <el-tag v-if="hasUnifiedDesign" type="warning" effect="dark" class="unified-tag">
        <el-icon><Box /></el-icon>
        {{ unifiedGroupCount }}个一体组合
      </el-tag>
      <el-tag :type="statusType" effect="light" class="status-tag">{{ statusTitle }}</el-tag>
      <el-tag type="warning" effect="light" class="progress-tag">
        已上传 {{ uploadedCount }}/{{ totalFaceCount }} 面
      </el-tag>
    </div>
    <div class="header-right">
      <el-tag v-if="workOrder?.designer_id" type="success" effect="plain" class="designer-tag">
        <el-icon><User /></el-icon>
        设计师: {{ workOrder.designer?.name }}
      </el-tag>
      <el-select v-else v-model="selectedDesignerId" placeholder="选择设计师" style="width: 140px" @change="handleAssign">
        <el-option v-for="d in designers" :key="d.id" :label="d.name" :value="d.id" />
      </el-select>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Box, User } from '@element-plus/icons-vue'

const props = defineProps({
  workOrder: { type: Object, default: null },
  hasUnifiedDesign: { type: Boolean, default: false },
  unifiedGroupCount: { type: Number, default: 0 },
  statusType: { type: String, default: 'info' },
  statusTitle: { type: String, default: '待设计' },
  uploadedCount: { type: Number, default: 0 },
  totalFaceCount: { type: Number, default: 0 },
  designers: { type: Array, default: () => [] },
})

const emit = defineEmits(['assign-designer'])

const selectedDesignerId = ref(null)

function handleAssign() {
  if (!selectedDesignerId.value) return
  emit('assign-designer', selectedDesignerId.value)
  selectedDesignerId.value = null
}
</script>

<style scoped>
.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  height: 56px;
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border-light);
}
.header-left { display: flex; align-items: center; gap: 16px; }
.header-right { display: flex; align-items: center; gap: 12px; }
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
  display: flex; align-items: center; gap: var(--space-2);
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
  display: flex; align-items: center; gap: var(--space-2);
  background: var(--color-primary-bg);
  border-color: var(--color-primary-border);
  color: var(--color-primary);
}
</style>
