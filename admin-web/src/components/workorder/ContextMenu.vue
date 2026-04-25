<template>
  <teleport to="body">
    <div v-if="visible" class="context-menu"
      :style="{ left: x + 'px', top: y + 'px' }"
      @click.stop>
      <div class="ctx-item" @click="$emit('action', 'view')">查看详情</div>
      <div class="ctx-item" @click="$emit('action', 'remark')">添加备注</div>
      <div class="ctx-item" @click="$emit('action', 'reassign')">转交负责人</div>
      <div class="ctx-divider" />
      <div class="ctx-item" @click="$emit('action', 'tag')">管理标签</div>
      <div class="ctx-item" @click="$emit('action', 'priority')">设置优先级</div>
      <div class="ctx-item" @click="$emit('action', 'deadline')">设置截止日</div>
      <div v-if="wo?.current_stage !== 'archive'" class="ctx-divider" />
      <div v-if="wo?.current_stage !== 'archive' && isAdmin" class="ctx-item ctx-danger" @click="$emit('action', 'delete')">删除工单</div>
    </div>
  </teleport>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  wo: { type: Object, default: null },
  isAdmin: { type: Boolean, default: false }
})

defineEmits(['action', 'close'])
</script>

<style scoped>
.context-menu {
  position: fixed; z-index: 9999; background: #fff;
  border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  padding: 4px 0; min-width: 160px;
}
.ctx-item {
  padding: 8px 16px; font-size: 13px; cursor: pointer;
  color: #111827; transition: background 0.15s;
}
.ctx-item:hover { background: #f5f5f5; }
.ctx-item.ctx-danger { color: #f5222d; }
.ctx-divider { height: 1px; background: #e5e7eb; margin: 4px 0; }
</style>
