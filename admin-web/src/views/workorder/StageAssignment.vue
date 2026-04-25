<template>
  <SectionBlock
    title="派单信息"
    :state="state"
    :default-expanded="isExpanded"
  >
    <template v-if="assignment">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="派单给">{{ assignment.assignee_name || 'ID:' + assignment.assigned_to }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="isCompleted ? 'success' : 'warning'">
            {{ isCompleted ? '已完成' : '进行中' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="派单人">{{ assignment.assigner_name || '—' }}</el-descriptions-item>
        <el-descriptions-item label="派单日期">{{ formatDate(assignment.assigned_at) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ assignment.notes || '—' }}</el-descriptions-item>
      </el-descriptions>
    </template>
    <template v-else>
      <div class="stage-empty">
        <div class="stage-empty-text">等待派单</div>
      </div>
    </template>
  </SectionBlock>
</template>

<script setup>
import { computed } from 'vue'
import SectionBlock from '../../components/SectionBlock.vue'
import { formatDate } from '../../utils/format'

const props = defineProps({
  assignment: { type: Object, default: null },
  state: { type: String, default: 'future' },
  isExpanded: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
})
</script>

<style scoped>
.stage-empty { text-align: center; padding: 40px 20px; color: #9ca3af; }
.stage-empty-text { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 4px; }
</style>
