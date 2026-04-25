<template>
  <SectionBlock
    title="归档信息"
    :state="state"
    :default-expanded="isExpanded"
  >
    <template v-if="archive">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="归档人">{{ archive.archiver_name || archive.archiver?.name || 'ID:' + archive.archived_by }}</el-descriptions-item>
        <el-descriptions-item label="归档日期">{{ archive.archive_date || '—' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag type="info" size="small">已归档</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ archive.notes || '—' }}</el-descriptions-item>
      </el-descriptions>
    </template>
    <template v-else>
      <div class="stage-empty">
        <div class="stage-empty-text">等待归档</div>
      </div>
    </template>
  </SectionBlock>
</template>

<script setup>
import SectionBlock from '../../components/SectionBlock.vue'

defineProps({
  archive: { type: Object, default: null },
  state: { type: String, default: 'future' },
  isExpanded: { type: Boolean, default: false },
})
</script>

<style scoped>
.stage-empty { text-align: center; padding: 40px 20px; color: #9ca3af; }
.stage-empty-text { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 4px; }
</style>
