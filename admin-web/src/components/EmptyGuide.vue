<template>
  <el-empty :description="description" :image-size="imageSize">
    <template #extra>
      <slot>
        <el-button type="primary" size="small" @click="$emit('action')">
          {{ actionText }}
        </el-button>
      </slot>
    </template>
  </el-empty>
</template>

<script setup>
defineProps({
  description: { type: String, default: '暂无数据' },
  imageSize: { type: Number, default: 120 },
  actionText: { type: String, default: '立即创建' }
})
defineEmits(['action'])
</script>
