<template>
  <SectionBlock
    title="生产记录"
    :state="state"
    :default-expanded="isExpanded"
  >
    <template v-if="productions?.length">
      <div v-for="(p, i) in productions" :key="i" class="stage-item-box">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="描述" :span="2">{{ p.description || '—' }}</el-descriptions-item>
          <el-descriptions-item label="材料">{{ p.material || '—' }}</el-descriptions-item>
          <el-descriptions-item label="数量">{{ p.quantity || '—' }} {{ p.unit || '' }}</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ p.start_date || '—' }}</el-descriptions-item>
          <el-descriptions-item label="完成日期">{{ p.complete_date || '—' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="p.status === 'completed' ? 'success' : 'warning'">
              {{ p.status === 'completed' ? '已完成' : '进行中' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ p.notes || '—' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </template>
    <template v-else>
      <div class="stage-empty">
        <div class="stage-empty-text">等待生产记录</div>
      </div>
    </template>
  </SectionBlock>
</template>

<script setup>
import SectionBlock from '../../components/SectionBlock.vue'

defineProps({
  productions: { type: Array, default: () => [] },
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
