<template>
  <SectionBlock
    title="施工记录"
    :state="state"
    :default-expanded="isExpanded"
  >
    <template v-if="constructions?.length">
      <div v-for="(c, i) in constructions" :key="i" class="stage-item-box">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="施工人">{{ c.constructor_name || c.constructor?.name || 'ID:' + c.constructor_id }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="c.status === 'completed' ? 'success' : 'warning'">
              {{ c.status === 'completed' ? '已完成' : '进行中' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ c.start_date || '—' }}</el-descriptions-item>
          <el-descriptions-item label="完成日期">{{ c.end_date || '—' }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ c.description || '—' }}</el-descriptions-item>
          <el-descriptions-item label="验收结果">{{ c.acceptance_result || '—' }}</el-descriptions-item>
          <el-descriptions-item label="安全检查">
            <el-tag v-if="c.safety_check" type="success" size="small">已检查</el-tag>
            <span v-else class="text-muted">未检查</span>
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ c.notes || '—' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </template>
    <template v-else>
      <div class="stage-empty">
        <div class="stage-empty-text">等待施工记录</div>
      </div>
    </template>
  </SectionBlock>
</template>

<script setup>
import SectionBlock from '../../components/SectionBlock.vue'

defineProps({
  constructions: { type: Array, default: () => [] },
  state: { type: String, default: 'future' },
  isExpanded: { type: Boolean, default: false },
})
</script>

<style scoped>
.stage-empty { text-align: center; padding: 40px 20px; color: #9ca3af; }
.stage-empty-text { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 4px; }
.stage-item-box { margin-bottom: var(--space-3); }
.stage-item-box:last-child { margin-bottom: 0; }
.text-muted { color: var(--color-text-tertiary); font-size: var(--font-size-xs); }
</style>
