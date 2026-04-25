<template>
  <div>
    <div class="filter-bar mb-16">
      <el-input v-model="search" placeholder="搜索批次号/工单号" clearable style="width:220px" />
      <el-select v-model="materialFilter" placeholder="全部材料" clearable style="width:140px">
        <el-option v-for="m in materialOptions" :key="m" :label="m" :value="m" />
      </el-select>
    </div>

    <el-table :data="filteredBatches" stripe v-loading="loading">
      <el-table-column label="批次号" width="200">
        <template #default="{ row }">
          <span class="batch-tag">{{ row.batch_no }}</span>
        </template>
      </el-table-column>
      <el-table-column label="材料类型" width="100">
        <template #default="{ row }">
          <el-tag size="small" type="info" effect="plain">{{ adTypeLabel(row.material_type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="完成/总数" width="100">
        <template #default="{ row }">{{ row.completed_count }}/{{ row.total_count }}</template>
      </el-table-column>
      <el-table-column label="生产日期" width="160">
        <template #default="{ row }">{{ row.created_at?.slice(0, 19) || '-' }}</template>
      </el-table-column>
      <el-table-column label="操作人" width="100">
        <template #default="{ row }">{{ row.creator?.name || row.creator_name || '-' }}</template>
      </el-table-column>
      <el-table-column label="备注" min-width="150">
        <template #default="{ row }">{{ row.notes || '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="$emit('show-detail', row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrap">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
        :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next"
        @size-change="$emit('load')" @current-change="$emit('load')" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  batches: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  total: { type: Number, default: 0 },
  adTypeLabel: { type: Function, default: () => '-' },
})

const emit = defineEmits(['load', 'show-detail'])

const search = ref('')
const materialFilter = ref('')
const page = ref(1)
const pageSize = ref(20)

const materialOptions = computed(() => [...new Set(props.batches.map(b => b.material_type))])

const filteredBatches = computed(() => {
  let list = props.batches
  if (search.value) {
    const kw = search.value.toLowerCase()
    list = list.filter(b => b.batch_no?.toLowerCase().includes(kw) || JSON.stringify(b.checklist).toLowerCase().includes(kw))
  }
  if (materialFilter.value) {
    list = list.filter(b => b.material_type === materialFilter.value)
  }
  return list
})
</script>

<style scoped>
.mb-16 { margin-bottom: var(--space-4); }
.filter-bar { display: flex; gap: var(--space-3); align-items: center; flex-wrap: wrap; }
.batch-tag {
  font-family: monospace; font-size: 12px; font-weight: 600;
  color: var(--color-primary); background: #dbeafe;
  padding: 2px 8px; border-radius: 4px; display: inline-block;
}
</style>
