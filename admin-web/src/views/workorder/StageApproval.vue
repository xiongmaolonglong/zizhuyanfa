<template>
  <SectionBlock
    title="审批记录"
    :state="state"
    :default-expanded="isExpanded"
  >
    <template v-if="hasData">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="审批人">{{ approval.approver_name || approval.approver?.name || '—' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType">
            {{ statusLabel }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="审批意见" :span="2">{{ approval.comment || '—' }}</el-descriptions-item>
        <el-descriptions-item label="审批日期">{{ approval.approved_at || '—' }}</el-descriptions-item>
      </el-descriptions>
    </template>
    <template v-else>
      <div class="stage-empty">
        <div class="stage-empty-text">暂无审批记录</div>
      </div>
    </template>
  </SectionBlock>
</template>

<script setup>
import { computed } from 'vue'
import SectionBlock from '../../components/SectionBlock.vue'

const props = defineProps({
  approval: { type: Object, default: null },
  state: { type: String, default: 'future' },
  isExpanded: { type: Boolean, default: false },
})

const hasData = computed(() => {
  const a = props.approval
  return a && (a.approver_id || a.approver_name || a.status)
})

const statusType = computed(() => {
  if (!props.approval) return 'info'
  if (props.approval.status === 'approved') return 'success'
  if (props.approval.status === 'rejected') return 'danger'
  return 'warning'
})

const statusLabel = computed(() => {
  if (!props.approval) return '待审批'
  if (props.approval.status === 'approved') return '已通过'
  if (props.approval.status === 'rejected') return '已驳回'
  return '待审批'
})
</script>

<style scoped>
.stage-empty { text-align: center; padding: 40px 20px; color: #9ca3af; }
.stage-empty-text { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 4px; }
</style>
