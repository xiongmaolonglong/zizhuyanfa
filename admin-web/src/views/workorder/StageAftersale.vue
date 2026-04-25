<template>
  <SectionBlock
    title="售后记录"
    :state="state"
    :default-expanded="isExpanded"
  >
    <template v-if="aftersales?.length">
      <div v-for="(a, i) in aftersales" :key="i" class="stage-item-box">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="问题类型">{{ a.issue_type || '—' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="a.status === 'resolved' ? 'success' : 'warning'" size="small">
              {{ a.status === 'resolved' ? '已解决' : a.status === 'processing' ? '处理中' : '待处理' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="问题描述" :span="2">{{ a.description || '—' }}</el-descriptions-item>
          <el-descriptions-item label="处理人">{{ a.handler_name || a.handler?.name || '—' }}</el-descriptions-item>
          <el-descriptions-item label="解决日期">{{ a.resolved_at || '—' }}</el-descriptions-item>
          <el-descriptions-item label="解决方案" :span="2">{{ a.solution || '—' }}</el-descriptions-item>
          <el-descriptions-item label="客户反馈">{{ a.feedback || '—' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </template>
    <template v-else>
      <div class="stage-empty">
        <div class="stage-empty-text">暂无售后记录</div>
      </div>
    </template>
  </SectionBlock>
</template>

<script setup>
import SectionBlock from '../../components/SectionBlock.vue'

defineProps({
  aftersales: { type: Array, default: () => [] },
  state: { type: String, default: 'future' },
  isExpanded: { type: Boolean, default: false },
})
</script>

<style scoped>
.stage-empty { text-align: center; padding: 40px 20px; color: #9ca3af; }
.stage-empty-text { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 4px; }
.stage-item-box { margin-bottom: var(--space-3); }
.stage-item-box:last-child { margin-bottom: 0; }
</style>
