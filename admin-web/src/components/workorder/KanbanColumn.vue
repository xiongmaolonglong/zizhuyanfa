<template>
  <div class="kanban-col"
    :class="{ 'kanban-col-dragover': isDragOver }"
    @dragover.prevent="$emit('dragover', $event)"
    @dragleave="$emit('dragleave', $event)"
    @drop="$emit('drop', $event)">
    <div class="kanban-header">
      <span class="col-title">{{ col.label }}</span>
      <span class="col-count">{{ items.length }}</span>
    </div>
    <div class="kanban-body">
      <KanbanCard
        v-for="wo in items" :key="wo.id"
        :wo="wo"
        :ad-types="adTypes"
        @card-dragstart="$emit('card-dragstart', $event, wo)"
      />
      <el-empty v-if="!items.length" :image-size="40" description="暂无工单" />
    </div>
  </div>
</template>

<script setup>
import KanbanCard from './KanbanCard.vue'

defineProps({
  col: { type: Object, required: true },
  items: { type: Array, default: () => [] },
  adTypes: { type: Array, default: () => [] },
  isDragOver: { type: Boolean, default: false }
})

defineEmits(['card-dragstart', 'dragover', 'dragleave', 'drop'])
</script>

<style scoped>
.kanban-col {
  min-width: 260px; flex: 1;
  border-radius: 8px; overflow: hidden;
  transition: background 0.2s, box-shadow 0.2s;
}
.kanban-col-dragover {
  background: rgba(37, 99, 235, 0.05);
  box-shadow: 0 0 0 2px #2563eb;
}
.kanban-header {
  background: #f8f9fa; padding: 10px 14px;
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 2px solid #e5e7eb;
}
.col-title { font-weight: 600; font-size: 14px; color: #374151; }
.col-count {
  background: #e5e7eb; color: #6b7280; font-size: 12px;
  padding: 2px 8px; border-radius: 10px; font-weight: 600;
}
.kanban-body {
  padding: 8px; min-height: 200px;
  max-height: calc(100vh - 220px);
  overflow-y: auto;
}
</style>
