<template>
  <el-card class="filter-card">
    <el-form :inline="true" :model="filters">
      <el-form-item>
        <el-input v-model="filters.keyword" placeholder="搜索工单号/甲方/项目名" clearable style="width:240px">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-select v-model="filters.stage" placeholder="全部环节" clearable style="width:120px">
          <el-option v-for="s in stageOptions" :key="s.key" :label="s.label" :value="s.key" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="filters.status" placeholder="全部状态" clearable style="width:100px">
          <el-option label="正常" value="normal" />
          <el-option label="超时" value="timeout" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="filters.project_type" placeholder="全部元素" clearable style="width:120px">
          <el-option v-for="t in elementOptions" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="filters.activity_name" placeholder="全部活动" clearable style="width:130px">
          <el-option v-for="a in activities" :key="a.value" :label="a.label" :value="a.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="filters.assigned_to" placeholder="全部负责人" clearable style="width:120px">
          <el-option v-for="u in userOptions" :key="u.id" :label="u.name" :value="u.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
          start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width:240px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="$emit('search')">查询</el-button>
        <el-button @click="$emit('reset')">重置</el-button>
        <el-button @click="$emit('export')"><el-icon><Download /></el-icon>导出 Excel</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import { Search, Download } from '@element-plus/icons-vue'

const props = defineProps({
  filters: { type: Object, required: true },
  dateRange: { type: Array, default: null },
  stageOptions: { type: Array, default: () => [] },
  elementOptions: { type: Array, default: () => [] },
  activities: { type: Array, default: () => [] },
  userOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['search', 'reset', 'export', 'update:dateRange'])

const dateRange = computed({
  get: () => props.dateRange,
  set: (v) => emit('update:dateRange', v),
})
</script>
