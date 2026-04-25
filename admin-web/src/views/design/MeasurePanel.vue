<template>
  <div class="measure-panel">
    <div class="panel-header">
      <span class="panel-title">测量数据</span>
      <span class="panel-count">{{ totalFaceCount }}面 · {{ totalArea.toFixed(2) }}m²</span>
    </div>
    <div class="panel-body">
      <div v-for="mat in materials" :key="mat.type" class="mat-group" :class="'mat-' + getMatClass(mat.type)">
        <div class="mat-head">
          <span class="mat-dot"></span>
          <span class="mat-name">{{ materialTypeLabel(mat.type) }}<span v-if="projectType" class="mat-element"> - {{ projectType }}</span></span>
          <span class="mat-area">{{ mat.totalArea.toFixed(2) }}m²</span>
        </div>
        <div v-for="(group, gi) in mat.groups" :key="gi" class="unified-group">
          <div v-if="group.isUnified" class="unified-header">
            <el-tag type="warning" effect="dark" size="small" class="unified-badge">一体</el-tag>
            <span class="unified-name">{{ group.name || '组合' + (gi + 1) }}</span>
            <span class="unified-size">{{ Number(group.totalW||0).toFixed(2) }}×{{ Number(group.totalH||0).toFixed(2) }}cm</span>
          </div>
          <div class="faces-list">
            <div v-for="(face, fi) in group.faces" :key="fi" class="face-item">
              <div class="face-row">
                <span class="face-name">{{ face.label }}</span>
                <span class="face-dim">{{ Number(face.width||0).toFixed(2) }}×{{ Number(face.height||0).toFixed(2) }}</span>
                <span class="face-area">{{ face.area.toFixed(2) }}m²</span>
                <span v-for="ef in getFaceExtraFields(face)" :key="ef.key" class="face-extra">
                  {{ ef.value }}{{ ef.label }}
                </span>
                <div v-if="face.photos?.length" class="face-photos">
                  <el-image v-for="(url, pi) in face.photos.slice(0, 3)" :key="pi"
                    :src="url" :preview-src-list="face.photos" fit="cover" class="face-photo-thumb" />
                </div>
              </div>
              <div v-if="face.notes" class="face-notes">备注: {{ face.notes }}</div>
              <div v-if="!group.isUnified" class="face-info-bar" @click="$emit('copy-face', mat, face)">
                {{ buildFaceInfo(mat, face) }}
                <el-icon class="copy-icon"><CopyDocument /></el-icon>
              </div>
            </div>
          </div>
          <div v-if="group.isUnified" class="mat-info-bar" @click="$emit('copy-group', mat, group)">
            {{ buildGroupInfo(mat, group) }}
            <el-icon class="copy-icon"><CopyDocument /></el-icon>
          </div>
        </div>
      </div>
      <el-empty v-if="!materials.length" description="暂无测量数据" :image-size="60" />
    </div>
  </div>
</template>

<script setup>
import { CopyDocument } from '@element-plus/icons-vue'

defineProps({
  materials: { type: Array, default: () => [] },
  totalFaceCount: { type: Number, default: 0 },
  totalArea: { type: Number, default: 0 },
  projectType: { type: String, default: '' },
  materialTypeLabel: { type: Function, default: () => '-' },
  getMatClass: { type: Function, default: () => 'gray' },
  getFaceExtraFields: { type: Function, default: () => [] },
  buildFaceInfo: { type: Function, default: () => '' },
  buildGroupInfo: { type: Function, default: () => '' },
})

defineEmits(['copy-face', 'copy-group'])
</script>

<style scoped>
.measure-panel {
  width: 340px;
  flex-shrink: 0;
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  height: 50px; padding: 0 var(--space-4);
  background: var(--color-bg-page);
  border-bottom: 1px solid var(--color-border-light);
}
.panel-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}
.panel-count { font-size: var(--font-size-xs); color: var(--color-text-tertiary); }
.panel-body { flex: 1; overflow-y: auto; padding: var(--space-3); }
.mat-group {
  border-radius: var(--radius-base);
  margin-bottom: 10px;
  border: 1px solid;
}
.mat-group.mat-blue { background: var(--color-primary-bg); border-color: var(--color-primary-border); }
.mat-group.mat-green { background: var(--color-success-bg); border-color: var(--color-success-border); }
.mat-group.mat-yellow { background: var(--color-warning-bg); border-color: var(--color-warning-border); }
.mat-group.mat-gray { background: var(--color-bg-page); border-color: var(--color-border-light); }
.mat-head {
  display: flex; align-items: center; gap: var(--space-2);
  padding: 10px var(--space-3);
}
.mat-group.mat-blue .mat-head { background: var(--color-primary-border); }
.mat-group.mat-green .mat-head { background: var(--color-success-border); }
.mat-group.mat-yellow .mat-head { background: var(--color-warning-border); }
.mat-group.mat-gray .mat-head { background: var(--color-border-light); }
.mat-dot { width: 8px; height: 8px; border-radius: 50%; }
.mat-dot.mat-blue { background: var(--color-primary); }
.mat-dot.mat-green { background: var(--color-success); }
.mat-dot.mat-yellow { background: var(--color-warning); }
.mat-dot.mat-gray { background: var(--color-text-tertiary); }
.mat-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
  flex: 1;
}
.mat-element {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  margin-left: 2px;
}
.mat-area { font-size: var(--font-size-xs); color: var(--color-primary); }
.mat-info-bar {
  margin: var(--space-2) var(--space-3);
  padding: var(--space-2) 10px;
  background: var(--color-info-bg);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex; align-items: center; justify-content: space-between;
  transition: background var(--transition-fast);
}
.mat-info-bar:hover { background: var(--color-info-border); }
.mat-info-bar .copy-icon { opacity: 0; transition: opacity var(--transition-fast); }
.mat-info-bar:hover .copy-icon { opacity: 1; }
.unified-group { padding: var(--space-1) var(--space-3) var(--space-3); }
.unified-header {
  display: flex; align-items: center; gap: var(--space-2);
  padding: var(--space-2);
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-2);
}
.unified-badge { font-size: 10px; }
.unified-name {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}
.unified-size { font-size: 11px; color: var(--color-text-tertiary); margin-left: auto; }
.faces-list { display: flex; flex-direction: column; gap: 2px; }
.face-item {
  padding: var(--space-2) var(--space-2);
  background: var(--color-bg-card);
  border-radius: 4px;
}
.face-row {
  display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap;
}
.face-name {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  width: 50px;
}
.face-dim { font-size: 11px; color: var(--color-text-tertiary); }
.face-area { font-size: 11px; color: var(--color-primary); }
.face-extra { font-size: 11px; color: var(--color-warning); margin-left: 4px; }
.face-notes {
  font-size: 11px; color: var(--color-danger); margin-top: var(--space-1);
  padding-left: 0; line-height: 1.4;
}
.face-photos { display: flex; gap: var(--space-1); margin-left: auto; }
.face-photo-thumb { width: 32px; height: 32px; border-radius: 4px; cursor: pointer; }
.face-info-bar {
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-2);
  background: var(--color-info-bg);
  border-radius: 4px;
  font-size: 11px;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex; align-items: center; justify-content: space-between;
  transition: background var(--transition-fast);
}
.face-info-bar:hover { background: var(--color-info-border); }
.face-info-bar .copy-icon { opacity: 0; transition: opacity var(--transition-fast); }
.face-info-bar:hover .copy-icon { opacity: 1; }
</style>
