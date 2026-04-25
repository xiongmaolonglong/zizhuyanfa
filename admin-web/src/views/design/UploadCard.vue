<template>
  <!-- 一体组合卡片 -->
  <template v-if="group.isUnified">
    <div class="upload-card unified-card"
         :class="{ 'uploaded': isUnifiedUploaded || unifiedDesignImages.length }">
      <div class="card-info">
        <div class="card-mat">
          <span class="mat-dot" :class="'mat-' + matClass"></span>
          {{ materialTypeLabel(matType) }}
        </div>
        <div class="card-header">
          <el-tag type="warning" effect="dark" size="small">一体</el-tag>
          <span class="card-name">{{ group.name || '组合' + (groupIndex + 1) }}</span>
        </div>
        <div class="card-size">{{ Number(group.totalW||0).toFixed(2) }}×{{ Number(group.totalH||0).toFixed(2) }}cm</div>
        <div class="card-meta">{{ group.faces.length }}面一体 · {{ group.totalArea?.toFixed(2) || '-' }}m²</div>
      </div>
      <div class="card-photos" v-if="group.faces.some(f => f.photos?.length)">
        <el-image v-for="(url, pi) in group.faces.flatMap(f => f.photos || []).slice(0, 4)" :key="pi"
          :src="url" :preview-src-list="group.faces.flatMap(f => f.photos || [])" fit="cover" class="photo-thumb" />
      </div>
      <div class="card-preview">
        <div v-for="(f, fi) in group.faces" :key="fi"
             class="preview-face"
             :style="{ width: getPreviewWidth(f) + 'px', height: getPreviewHeight(f) + 'px' }">
          {{ f.label }}
        </div>
      </div>
      <div v-if="unifiedDesignImages.length" class="card-design-images">
        <el-image v-for="(url, di) in unifiedDesignImages" :key="di"
          :src="url" :preview-src-list="unifiedDesignImages" fit="cover" class="design-img" />
      </div>
      <div v-if="!locked" class="card-upload">
        <FileUpload v-model="unifiedImages[uploadKey]" :limit="3" />
      </div>
      <div class="card-check" :class="{ 'checked': isUnifiedUploaded || unifiedDesignImages.length }">
        <el-icon v-if="isUnifiedUploaded || unifiedDesignImages.length"><Check /></el-icon>
      </div>
    </div>
  </template>

  <!-- 独立面卡片 -->
  <template v-else>
    <div v-for="(face, fi) in group.faces" :key="fi"
         class="upload-card face-card"
         :class="{ 'uploaded': isFaceUploaded(face.label) || getFaceDesignImg(face.label).length }">
      <div class="card-info">
        <div class="card-mat">
          <span class="mat-dot" :class="'mat-' + matClass"></span>
          {{ materialTypeLabel(matType) }}
        </div>
        <div class="card-header">
          <span class="card-name">{{ face.label }}</span>
        </div>
        <div class="card-size">{{ Number(face.width||0).toFixed(2) }}×{{ Number(face.height||0).toFixed(2) }}cm</div>
      </div>
      <div class="card-photos">
        <el-image v-for="(url, pi) in (face.photos || []).slice(0, 2)" :key="pi"
                  :src="url" :preview-src-list="face.photos" fit="cover" class="photo-thumb" />
        <span v-if="!face.photos?.length" class="no-photo">无照片</span>
      </div>
      <div v-if="getFaceDesignImg(face.label).length" class="card-design-images">
        <el-image v-for="(url, di) in getFaceDesignImg(face.label)" :key="di"
          :src="url" :preview-src-list="getFaceDesignImg(face.label)" fit="cover" class="design-img" />
      </div>
      <div v-if="!locked" class="card-upload">
        <FileUpload v-model="faceImages[face.label]" :limit="3" :key="'face-' + face.label" />
      </div>
      <div class="card-check" :class="{ 'checked': isFaceUploaded(face.label) || getFaceDesignImg(face.label).length }">
        <el-icon v-if="isFaceUploaded(face.label) || getFaceDesignImg(face.label).length"><Check /></el-icon>
      </div>
    </div>
  </template>
</template>

<script setup>
import { computed } from 'vue'
import { Check } from '@element-plus/icons-vue'
import FileUpload from '../../components/FileUpload.vue'

const props = defineProps({
  matType: { type: String, required: true },
  matClass: { type: String, default: 'gray' },
  group: { type: Object, required: true },
  groupIndex: { type: Number, required: true },
  locked: { type: Boolean, default: false },
  materialTypeLabel: { type: Function, default: () => '-' },
  unifiedImages: { type: Object, default: () => ({}) },
  faceImages: { type: Object, default: () => ({}) },
  unifiedDesignImages: { type: Array, default: () => [] },
  faceDesignImages: { type: Object, default: () => ({}) },
})

const uploadKey = computed(() => props.matType + '_' + props.groupIndex)

const isUnifiedUploaded = computed(() => {
  return props.unifiedImages[uploadKey.value]?.length > 0
})

function isFaceUploaded(label) {
  return props.faceImages[label]?.length > 0
}

function getFaceDesignImg(label) {
  return props.faceDesignImages[label] || []
}

function getPreviewWidth(face) {
  const maxW = Math.max(...props.group.faces.map(f => f.width || 0), 1)
  return Math.max(30, (face.width / maxW) * 80)
}

function getPreviewHeight(face) {
  const maxH = Math.max(...props.group.faces.map(f => f.height || 0), 1)
  return Math.max(40, (face.height / maxH) * 100)
}
</script>

<style scoped>
.upload-card {
  display: flex; align-items: center; gap: var(--space-4);
  padding: var(--space-4);
  background: var(--color-bg-page);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}
.upload-card:hover { border-color: var(--color-primary); background: var(--color-bg-card); }
.upload-card.uploaded { background: var(--color-success-bg); border-color: var(--color-success-border); }
.card-info { width: 140px; flex-shrink: 0; }
.card-mat {
  display: flex; align-items: center; gap: var(--space-1);
  font-size: 15px; font-weight: var(--font-weight-bold);
  color: var(--color-primary); margin-bottom: var(--space-1);
}
.card-header { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-1); }
.card-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
}
.card-size {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}
.card-meta { font-size: 11px; color: var(--color-text-tertiary); }
.card-preview { display: flex; gap: 2px; align-items: center; height: 100px; }
.preview-face {
  display: flex; align-items: center; justify-content: center;
  border-radius: 4px; font-size: 10px;
  color: var(--color-text-secondary);
  background: var(--color-primary-bg);
  border: 1px solid var(--color-primary);
}
.card-photos { display: flex; gap: var(--space-1); }
.photo-thumb { width: 48px; height: 48px; border-radius: 4px; cursor: pointer; }
.no-photo { font-size: 11px; color: var(--color-text-tertiary); }
.card-upload { flex: 1; min-width: 0; }
.card-check {
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--color-border-light);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.card-check.checked { background: var(--color-success); color: var(--color-bg-card); }
.card-design-images {
  display: flex; gap: var(--space-1); padding: var(--space-2);
  background: var(--color-success-bg); border-radius: var(--radius-base);
}
.design-img { width: 80px; height: 80px; border-radius: var(--radius-sm); cursor: pointer; }
</style>
