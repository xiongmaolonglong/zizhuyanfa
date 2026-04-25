<template>
  <SectionBlock
    title="设计信息"
    :state="state"
    :default-expanded="isExpanded"
  >
    <template v-if="designs?.length">
      <div v-for="(d, i) in designs" :key="i" class="stage-item-box">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设计师">{{ d.designer_name || d.designer?.name || 'ID:' + d.designer_id }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ d.design_type || '—' }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ d.description || '—' }}</el-descriptions-item>
          <el-descriptions-item label="审核人">{{ d.reviewer_name || d.reviewer?.name || '—' }}</el-descriptions-item>
          <el-descriptions-item label="审核意见">{{ d.review_comment || '—' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="d.status === 'approved' ? 'success' : d.status === 'rejected' ? 'danger' : 'warning'">
              {{ d.status === 'approved' ? '已通过' : d.status === 'rejected' ? '已驳回' : '待审核' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="提交日期">{{ d.submitted_at || d.created_at || '—' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </template>
    <template v-else-if="designImages?.length">
      <div class="design-photo-grid">
        <el-image v-for="(img, i) in designImages" :key="i" :src="img.url || img" :preview-src-list="designImages.map(d => d.url || d)"
          fit="cover" class="design-photo-item" lazy />
      </div>
    </template>
    <template v-else>
      <div class="stage-empty">
        <div class="stage-empty-text">等待设计稿</div>
      </div>
    </template>
  </SectionBlock>
</template>

<script setup>
import SectionBlock from '../../components/SectionBlock.vue'

defineProps({
  designs: { type: Array, default: () => [] },
  designImages: { type: Array, default: () => [] },
  state: { type: String, default: 'future' },
  isExpanded: { type: Boolean, default: false },
})
</script>

<style scoped>
.stage-empty { text-align: center; padding: 40px 20px; color: #9ca3af; }
.stage-empty-text { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 4px; }
.stage-item-box { margin-bottom: var(--space-3); }
.stage-item-box:last-child { margin-bottom: 0; }
.design-photo-grid { display: grid; grid-template-columns: repeat(4, 160px); gap: var(--space-3); }
.design-photo-item { width: 160px; height: 120px; border-radius: var(--radius-sm); cursor: pointer; }
</style>
