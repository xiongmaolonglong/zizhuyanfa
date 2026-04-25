<template>
  <SectionBlock
    title="测量数据"
    :state="state"
    :default-expanded="isExpanded"
  >
    <template #header-action>
      <el-button
        v-if="currentStage === 'measurement' && !measurement"
        type="primary"
        size="small"
        @click="$emit('open-proxy')"
      >代录测量数据</el-button>
      <el-button
        v-if="currentStage === 'measurement' && measurement && measurement.status !== 'approved'"
        type="warning"
        size="small"
        @click="$emit('open-proxy')"
      >{{ measurement.status === 'rejected' ? '修改测量数据' : '编辑测量数据' }}</el-button>
      <el-button
        v-if="isAdmin && currentStage === 'measurement' && measurement?.status === 'measured'"
        type="success"
        size="small"
        @click="$emit('approve')"
        :loading="submitting"
      >审核通过</el-button>
      <el-button
        v-if="isAdmin && currentStage === 'measurement' && measurement?.status === 'measured'"
        type="danger"
        size="small"
        @click="$emit('reject')"
      >驳回</el-button>
      <el-button
        v-if="isAdmin && currentStage === 'measurement' && measurement?.status === 'measured'"
        link
        type="primary"
        size="small"
        @click="$emit('go-audit')"
      >去审核中心</el-button>
    </template>
    <template v-if="measurement">
      <el-descriptions :column="2" border class="mb-16">
        <el-descriptions-item label="测量员">{{ measurement.measurer_name || '—' }}</el-descriptions-item>
        <el-descriptions-item label="测量日期">{{ formatDate(measurement.measured_at) }}</el-descriptions-item>
        <el-descriptions-item label="面积">{{ totalArea > 0 ? totalArea.toFixed(2) : '—' }} m²</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="measurement.status === 'approved' ? 'success' : measurement.status === 'rejected' ? 'danger' : 'warning'">
            {{ measurement.status === 'approved' ? '已审核' : measurement.status === 'rejected' ? '已驳回' : '待审核' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ measurement.notes || '—' }}</el-descriptions-item>
        <el-descriptions-item v-if="measurement.status === 'rejected'" label="驳回原因" :span="2">
          <span class="text-danger">{{ measurement.rejection_reason || '—' }}</span>
        </el-descriptions-item>
      </el-descriptions>
      <div class="material-section" v-for="(mat, mi) in groupedMaterials" :key="mi">
        <div class="mat-header">
          <span>{{ resolveAdTypeLabel(mat) }} — {{ mat.groups.reduce((c, g) => c + g.faces.length, 0) }}面 &nbsp;
            <el-tag size="small">合计 {{ mat.totalArea.toFixed(2) }}m²</el-tag>
          </span>
        </div>
        <div class="mat-body">
          <div v-for="(group, gi) in mat.groups" :key="gi" class="meas-group">
            <div class="meas-group-header">
              <span class="meas-group-name">{{ group.name || ('分组' + (gi + 1)) }}</span>
              <el-tag v-if="group.isUnified" size="small" type="primary" effect="dark">一体</el-tag>
              <el-tag v-else size="small" type="info">独立</el-tag>
            </div>
            <div class="face-row" v-for="(face, fi) in group.faces" :key="fi">
              <span class="face-label">{{ face.label }}</span>
              <span>{{ Number(face.width||0).toFixed(2) }} × {{ Number(face.height||0).toFixed(2) }}cm</span>
              <span class="face-area">{{ face.area || ((face.width * face.height) / 10000).toFixed(2) }}m²</span>
              <span class="face-extra" v-if="getExtraFields(face).length">
                <template v-for="ef in getExtraFields(face)" :key="ef.key">
                  <el-tag size="small" effect="plain" class="extra-tag">{{ ef.value }}{{ ef.label }}</el-tag>
                </template>
              </span>
              <span class="text-muted" v-else>{{ face.notes || '—' }}</span>
              <span class="face-photos" v-if="face.photos?.length">
                <el-image
                  v-for="(url, pi) in face.photos.slice(0, 3)"
                  :key="pi"
                  :src="url"
                  :preview-src-list="face.photos"
                  :initial-index="pi"
                  fit="cover"
                  class="face-thumb"
                />
                <span v-if="face.photos.length > 3" class="more-photos">+{{ face.photos.length - 3 }}</span>
              </span>
              <span v-else class="text-muted">0张</span>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="stage-empty">
        <div class="stage-empty-text">等待测量数据</div>
      </div>
    </template>
  </SectionBlock>
</template>

<script setup>
import { computed } from 'vue'
import SectionBlock from '../../components/SectionBlock.vue'
import { formatDate } from '../../utils/format'

const props = defineProps({
  measurement: { type: Object, default: null },
  groupedMaterials: { type: Array, default: () => [] },
  totalArea: { type: Number, default: 0 },
  currentStage: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
  state: { type: String, default: 'future' },
  isExpanded: { type: Boolean, default: false },
  resolveAdTypeLabel: { type: Function, default: () => '-' },
  getExtraFields: { type: Function, default: () => [] },
})

defineEmits(['open-proxy', 'approve', 'reject', 'go-audit'])
</script>

<style scoped>
.stage-empty { text-align: center; padding: 40px 20px; color: #9ca3af; }
.stage-empty-text { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 4px; }
.mb-16 { margin-bottom: var(--space-4); }
.text-danger { color: var(--color-danger); }
.text-muted { color: var(--color-text-tertiary); font-size: var(--font-size-xs); }
.material-section { border: 1px solid var(--color-border-light); border-radius: var(--radius-sm); margin-bottom: var(--space-3); overflow: hidden; }
.mat-header { background: var(--color-bg-page); padding: var(--space-3) var(--space-4); font-weight: var(--font-weight-medium); font-size: var(--font-size-sm); }
.mat-body { padding: 0 var(--space-4); }
.meas-group { margin: 8px 0; }
.meas-group-header { display: flex; align-items: center; gap: 8px; padding: 6px 8px; background: var(--color-bg-page); border-left: 3px solid var(--color-primary); margin-bottom: 4px; }
.meas-group-name { font-weight: var(--font-weight-medium); font-size: var(--font-size-xs); flex: 1; }
.face-row { display: grid; grid-template-columns: 60px 120px 80px 1fr auto; gap: var(--space-2); padding: var(--space-2) 0; border-bottom: 1px solid var(--color-border-light); font-size: var(--font-size-xs); align-items: center; }
.face-row:last-child { border-bottom: none; }
.face-label { color: var(--color-text-tertiary); }
.face-area { color: var(--color-primary); font-weight: var(--font-weight-medium); }
.face-extra { display: flex; gap: 4px; flex-wrap: wrap; }
.extra-tag { font-size: 11px; }
.face-photos { display: flex; gap: 4px; align-items: center; }
.face-thumb { width: 36px; height: 36px; border-radius: 4px; cursor: pointer; }
.more-photos { font-size: 10px; color: var(--color-text-tertiary); }
</style>
