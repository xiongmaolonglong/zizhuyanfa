<template>
  <div
    class="section-block mb-16"
    :class="{
      'section-current': state === 'current',
      'section-done': state === 'done',
      'section-future': state === 'future',
    }"
  >
    <div class="section-header" @click="toggle">
      <span class="section-dot" :class="`dot-${state}`" />
      <span class="section-title" :class="{ 'title-future': state === 'future' }">{{ title }}</span>
      <el-tag v-if="state === 'done'" size="small" type="success" effect="plain" style="font-size:11px">已完成</el-tag>
      <el-tag v-else-if="state === 'current'" size="small" type="warning" effect="plain" style="font-size:11px">进行中</el-tag>
      <span class="section-header-action" @click.stop>
        <slot name="header-action" />
      </span>
      <el-icon class="section-toggle" :class="{ open: expanded }">
        <CaretBottom />
      </el-icon>
    </div>
    <Transition name="section-expand">
      <div v-show="expanded" class="section-body" :class="{ 'body-future': state === 'future' }">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { CaretBottom } from '@element-plus/icons-vue'

const props = defineProps({
  title: { type: String, required: true },
  state: { type: String, default: 'done' }, // 'done' | 'current' | 'future'
  defaultExpanded: { type: Boolean, default: true },
})

const expanded = ref(props.defaultExpanded)

watch(() => props.defaultExpanded, (val) => {
  expanded.value = val
})

function toggle() {
  expanded.value = !expanded.value
}
</script>

<style scoped>
.section-block {
  background: white;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.section-block.section-current {
  box-shadow: 0 0 0 2px var(--color-primary);
}

.section-block.section-future {
  opacity: 0.6;
}

.section-header {
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.section-header:hover {
  background: #f9fafb;
}

.section-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-done { background: #22c55e; }
.dot-current { background: #3b82f6; box-shadow: 0 0 6px rgba(59, 130, 246, 0.4); animation: dotPulse 2s infinite; }
.dot-future { background: #d1d5db; }

@keyframes dotPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.section-title {
  flex: 1;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

.section-title.title-future {
  color: var(--color-text-tertiary);
}

.section-current .section-title {
  color: var(--color-primary);
}

.section-header-action {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-toggle {
  color: #9ca3af;
  font-size: 18px;
  transition: transform 0.2s;
}

.section-toggle.open {
  transform: rotate(180deg);
}

.section-body {
  padding: 0 20px 20px;
}

.body-future {
  color: var(--color-text-tertiary);
}

/* 展开/折叠动画 */
.section-expand-enter-active,
.section-expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.section-expand-enter-from,
.section-expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.section-expand-enter-to,
.section-expand-leave-from {
  opacity: 1;
  max-height: 2000px;
}

.mb-16 {
  margin-bottom: var(--space-4);
}
</style>
