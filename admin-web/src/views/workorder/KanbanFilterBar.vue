<template>
  <el-card class="filter-card kanban-filter-bar">
    <el-form :inline="true">
      <el-form-item>
        <el-input v-model="search" placeholder="搜索工单号/甲方/项目名" clearable style="width:220px">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-select v-model="filterStage" placeholder="全部环节" clearable style="width:120px">
          <el-option v-for="c in kanbanColumns" :key="c.key" :label="c.label" :value="c.key" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="filterProjectType" placeholder="全部元素" clearable style="width:120px">
          <el-option v-for="t in elementOptions" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="filterActivity" placeholder="全部活动" clearable style="width:130px">
          <el-option v-for="a in activities" :key="a.value" :label="a.label" :value="a.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width:100px">
          <el-option label="正常" value="normal" />
          <el-option label="超时" value="timeout" />
          <el-option label="即将到期" value="expiring" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="filterAssignee" placeholder="全部负责人" clearable style="width:120px">
          <el-option v-for="u in userOptions" :key="u.id" :label="u.name" :value="u.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="$emit('search')">查询</el-button>
        <el-button @click="$emit('reset')">重置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { Search } from '@element-plus/icons-vue'

const props = defineProps({
  kanbanColumns: { type: Array, default: () => [] },
  elementOptions: { type: Array, default: () => [] },
  activities: { type: Array, default: () => [] },
  userOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['search', 'reset'])

const search = defineModel('search', { type: String, default: '' })
const filterStage = defineModel('filterStage', { type: String, default: '' })
const filterProjectType = defineModel('filterProjectType', { type: String, default: '' })
const filterActivity = defineModel('filterActivity', { type: String, default: '' })
const filterStatus = defineModel('filterStatus', { type: String, default: '' })
const filterAssignee = defineModel('filterAssignee', { type: String, default: '' })
</script>
