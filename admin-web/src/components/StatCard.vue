<template>
  <el-card shadow="hover" class="stat-card">
    <div class="stat-body">
      <div v-if="icon" class="stat-icon" :class="iconClass">
        <component :is="icon" :size="24" />
      </div>
      <div class="stat-info">
        <div class="stat-value" :style="{ color }">{{ count }}</div>
        <div class="stat-label">{{ label }}</div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  count: { type: [Number, String], default: 0 },
  label: { type: String, required: true },
  color: { type: String, default: 'var(--color-text-primary)' },
  icon: { type: Object, default: null },
  iconColor: { type: String, default: 'var(--color-primary)' },
})

const iconClass = computed(() => {
  const map = {
    'var(--color-primary)': 'stat-icon-primary',
    'var(--color-success)': 'stat-icon-success',
    'var(--color-warning)': 'stat-icon-warning',
    '#722ed1': 'stat-icon-info',
  }
  return map[props.iconColor] || 'stat-icon-primary'
})
</script>

<style scoped>
.stat-card { margin-bottom: 0; }
.stat-body { display: flex; align-items: center; gap: 12px; }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.stat-icon-primary { background: rgba(37, 99, 235, 0.1); color: var(--color-primary); }
.stat-icon-success { background: rgba(22, 163, 74, 0.1); color: var(--color-success); }
.stat-icon-warning { background: rgba(234, 88, 12, 0.1); color: var(--color-warning); }
.stat-icon-info { background: rgba(114, 46, 209, 0.1); color: #722ed1; }
.stat-value { font-size: 24px; font-weight: 600; color: var(--color-text-primary); }
.stat-label { font-size: 12px; color: var(--color-text-secondary, #8c8c8c); }
</style>
