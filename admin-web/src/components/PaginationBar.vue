<template>
  <div v-if="total > 0" class="pagination-bar">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="pageSizes"
      :layout="layout"
      @size-change="$emit('change')"
      @current-change="$emit('change')"
    />
  </div>
</template>

<script setup>
defineProps({
  total: { type: Number, default: 0 },
  pageSizes: { type: Array, default: () => [10, 20, 50, 100] },
  layout: { type: String, default: 'total, sizes, prev, pager, next' },
})

const currentPage = defineModel('page', { type: Number, default: 1 })
const pageSize = defineModel('pageSize', { type: Number, default: 20 })

defineEmits(['change'])
</script>

<style scoped>
.pagination-bar { display: flex; justify-content: flex-end; padding-top: 16px; }
</style>
