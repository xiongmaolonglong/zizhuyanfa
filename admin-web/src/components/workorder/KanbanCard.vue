<template>
  <div class="kanban-card-wrap"
    @click="$router.push(`/work-orders/${wo.id}`)">
    <el-card class="kanban-card"
      :class="{ 'kanban-card-timeout': wo.is_timeout, 'kanban-card-expiring': !wo.is_timeout && wo._daysToDeadline <= 3 && wo._daysToDeadline > 0 }"
      draggable="true"
      @dragstart="$emit('dragstart', $event)">
      <div class="card-title">{{ wo.title }}</div>
      <div class="card-info">
        <span>{{ wo.client_name || '-' }}</span>
        <span class="separator">·</span>
        <span>{{ adTypeLabel }}</span>
      </div>
      <div class="card-meta">
        <span>{{ wo.assigned_to || '未分配' }}</span>
        <span :class="wo._deadlineClass">{{ wo._deadlineLabel }}</span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  wo: { type: Object, required: true },
  adTypes: { type: Array, default: () => [] }
})

defineEmits(['dragstart'])

const adTypeLabel = computed(() => {
  const item = props.adTypes.find(t => t.value === props.wo.project_type)
  return item ? item.label : props.wo.project_type || '-'
})
</script>

<style scoped>
.kanban-card-wrap { margin-bottom: 8px; }
.kanban-card {
  cursor: pointer; border: 1px solid #e5e7eb; transition: box-shadow 0.2s;
}
.kanban-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.kanban-card :deep(.el-card__body) { padding: 10px 12px; }
.card-title {
  font-size: 13px; font-weight: 600; color: #111827;
  margin-bottom: 6px; line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.card-info { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
.card-info .separator { margin: 0 4px; color: #d1d5db; }
.card-meta { font-size: 11px; color: #9ca3af; display: flex; justify-content: space-between; }
.kanban-card-timeout { border-left: 3px solid #f5222d; }
.kanban-card-expiring { border-left: 3px solid #fa8c16; }
</style>
