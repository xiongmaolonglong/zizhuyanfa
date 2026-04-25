<template>
  <div :class="['photo-grid', gridClass]">
    <el-image
      v-for="(url, i) in photos"
      :key="i"
      :src="url"
      :preview-src-list="previewList"
      :initial-index="i"
      :preview-teleported="true"
      fit="cover"
      class="photo-item"
      :class="itemClass"
      :lazy="lazy"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  photos: { type: Array, required: true },
  size: { type: String, default: 'sm' },
  columns: { type: Number, default: 5 },
  lazy: { type: Boolean, default: false },
})

const gridClass = computed(() => `photo-grid-${props.size}`)
const itemClass = computed(() => `photo-item-${props.size}`)

const previewList = computed(() => {
  return props.photos.map(p => typeof p === 'string' ? p : (p.url || p))
})
</script>

<style scoped>
.photo-grid { display: grid; gap: var(--space-2); }
.photo-grid-sm { grid-template-columns: repeat(5, 80px); }
.photo-grid-md { grid-template-columns: repeat(4, 120px); }
.photo-grid-lg { grid-template-columns: repeat(4, 160px); }

.photo-item { border-radius: var(--radius-sm); cursor: pointer; }
.photo-item-sm { width: 80px; height: 80px; }
.photo-item-md { width: 120px; height: 90px; }
.photo-item-lg { width: 160px; height: 120px; }
</style>
