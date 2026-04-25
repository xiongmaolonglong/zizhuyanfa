<template>
  <template v-if="materials.length">
    <div v-for="mat in materials" :key="mat.material_type" class="material-group-card mb-16">
      <el-card>
        <template #header>
          <div class="material-group-header">
            <div>
              <span class="material-title">{{ adTypeLabel(mat.material_type) }}</span>
              <span class="material-count">（{{ getFaceCount(mat.material_type, false) }} 个单独面 · {{ getFaceCount(mat.material_type, true) }} 个一体面 · 共 {{ mat.totalArea.toFixed(2) }} m²）</span>
            </div>
            <div class="material-actions">
              <el-checkbox
                v-model="boardSelectAll[mat.material_type]"
                @change="toggleAll(mat.material_type, mat.items)"
                style="margin-right:8px"
              >全选</el-checkbox>
              <span v-if="selectedCount(mat.material_type) > 0" class="selected-count">
                已选 {{ selectedCount(mat.material_type) }} 项
              </span>
              <el-button type="warning" size="small" plain @click="$emit('production-view', mat.material_type)">
                <el-icon><View /></el-icon>生产视图
              </el-button>
              <el-button type="success" size="small" plain @click="$emit('export-sheet', mat)">
                导出生产单
              </el-button>
              <el-button type="info" size="small" plain @click="$emit('export-full', mat)">
                <el-icon style="margin-right:4px"><Download /></el-icon>导出完整包
              </el-button>
              <el-button
                v-if="selectedCount(mat.material_type) > 0"
                type="primary"
                size="small"
                @click="$emit('export-selected', mat.material_type)"
              >
                导出选中 ({{ selectedCount(mat.material_type) }})
              </el-button>
              <el-button type="primary" size="small" @click="$emit('open-verify', mat.material_type)">
                标记完成 ({{ mat.items.length }})
              </el-button>
            </div>
          </div>
        </template>

        <!-- 单独面 -->
        <template v-if="getFaceRows(mat.material_type, false).length">
          <div class="face-section-title">单独面</div>
          <el-table :data="getFaceRows(mat.material_type, false)" stripe class="mb-8 board-table" :row-key="(row) => row.work_order_id + '_' + row.material_type + '_' + row.group_index + '_' + row.face_label">
            <el-table-column label="" width="40">
              <template #default="{ row }">
                <el-checkbox
                  :model-value="isItemSelected(mat.material_type, row.work_order_id + '|||' + row.material_type + '|||' + row.group_index + '|||' + row.face_label)"
                  @change="toggleItem(mat.material_type, row.work_order_id + '|||' + row.material_type + '|||' + row.group_index + '|||' + row.face_label)"
                  :disabled="row.completed"
                />
              </template>
            </el-table-column>
            <el-table-column prop="work_order_no" label="工单号" width="140">
              <template #default="{ row }">
                <router-link :to="`/production/${row.work_order_id}`" class="wo-link">{{ row.work_order_no }}</router-link>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="店铺名" width="120" />
            <el-table-column label="面" width="70">
              <template #default="{ row }">{{ row.face_label }}</template>
            </el-table-column>
            <el-table-column label="尺寸" width="140">
              <template #default="{ row }">{{ Number(row.face_width||0).toFixed(2) }}×{{ Number(row.face_height||0).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="面积(m²)" width="80">
              <template #default="{ row }">{{ row.face_area.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag size="small" :type="row.completed ? 'success' : (row.typesetting ? 'warning' : 'info')" effect="plain">
                  {{ row.completed ? '已完成' : (row.typesetting ? '排版中' : '待生产') }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="导出" width="140">
              <template #default="{ row }">
                <el-tag v-if="getExportTag(row.work_order_id)" size="small" type="info" effect="plain">
                  {{ getExportTag(row.work_order_id) }}
                </el-tag>
                <span v-else class="text-muted">—</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90">
              <template #default="{ row }">
                <el-button v-if="!row.completed" link type="primary" @click="$emit('mark-face-complete', row)">标记完成</el-button>
                <span v-else class="text-muted">已完成</span>
              </template>
            </el-table-column>
          </el-table>
        </template>

        <!-- 一体面 -->
        <template v-if="getFaceRows(mat.material_type, true).length">
          <div class="face-section-title">一体面</div>
          <el-table :data="getFaceRows(mat.material_type, true)" stripe class="board-table" :row-key="(row) => row.work_order_id + '_' + row.material_type + '_' + row.group_index + '_' + row.face_label">
            <el-table-column label="" width="40">
              <template #default="{ row }">
                <el-checkbox
                  :model-value="isItemSelected(mat.material_type, row.work_order_id + '|||' + row.material_type + '|||' + row.group_index + '|||' + row.face_label)"
                  @change="toggleItem(mat.material_type, row.work_order_id + '|||' + row.material_type + '|||' + row.group_index + '|||' + row.face_label)"
                  :disabled="row.completed"
                />
              </template>
            </el-table-column>
            <el-table-column prop="work_order_no" label="工单号" width="140">
              <template #default="{ row }">
                <router-link :to="`/production/${row.work_order_id}`" class="wo-link">{{ row.work_order_no }}</router-link>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="店铺名" width="120" />
            <el-table-column label="面" width="70">
              <template #default="{ row }">{{ row.face_label }}</template>
            </el-table-column>
            <el-table-column label="尺寸" width="140">
              <template #default="{ row }">{{ Number(row.face_width||0).toFixed(2) }}×{{ Number(row.face_height||0).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="面积(m²)" width="80">
              <template #default="{ row }">{{ row.face_area.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag size="small" :type="row.completed ? 'success' : (row.typesetting ? 'warning' : 'info')" effect="plain">
                  {{ row.completed ? '已完成' : (row.typesetting ? '排版中' : '待生产') }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="导出" width="140">
              <template #default="{ row }">
                <el-tag v-if="getExportTag(row.work_order_id)" size="small" type="info" effect="plain">
                  {{ getExportTag(row.work_order_id) }}
                </el-tag>
                <span v-else class="text-muted">—</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90">
              <template #default="{ row }">
                <el-button v-if="!row.completed" link type="primary" @click="$emit('mark-face-complete', row)">标记完成</el-button>
                <span v-else class="text-muted">已完成</span>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-card>
    </div>
  </template>
  <el-card v-else>
    <el-empty description="暂无待生产任务" :image-size="80" />
  </el-card>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Download, View } from '@element-plus/icons-vue'

const props = defineProps({
  materials: { type: Array, default: () => [] },
  getFaceRows: { type: Function, default: () => [] },
  getFaceCount: { type: Function, default: () => 0 },
  getExportTag: { type: Function, default: () => '' },
  adTypeLabel: { type: Function, default: () => '-' },
})

const emit = defineEmits([
  'production-view', 'export-sheet', 'export-full', 'export-selected',
  'open-verify', 'mark-face-complete',
])

// 材料看板按材料类型勾选
const selectedBoardItems = ref({})
const boardSelectAll = ref({})

function isItemSelected(materialType, groupKey) {
  const set = selectedBoardItems.value[materialType]
  return set ? set.has(groupKey) : false
}

function toggleItem(materialType, groupKey) {
  if (!selectedBoardItems.value[materialType]) {
    selectedBoardItems.value[materialType] = new Set()
  }
  const set = selectedBoardItems.value[materialType]
  if (set.has(groupKey)) {
    set.delete(groupKey)
  } else {
    set.add(groupKey)
  }
  selectedBoardItems.value = { ...selectedBoardItems.value }
}

function toggleAll(materialType, items) {
  if (!selectedBoardItems.value[materialType]) {
    selectedBoardItems.value[materialType] = new Set()
  }
  const set = selectedBoardItems.value[materialType]
  const groupKeys = []
  for (const item of items) {
    for (const face of (item.faces || [])) {
      const faceLabel = face.label || '—'
      groupKeys.push(`${item.work_order_id}|||${item.material_type}|||${item.group_index}|||${faceLabel}`)
    }
  }
  const allSelected = groupKeys.every(k => set.has(k))
  if (allSelected) {
    groupKeys.forEach(k => set.delete(k))
    boardSelectAll.value[materialType] = false
  } else {
    groupKeys.forEach(k => set.add(k))
    boardSelectAll.value[materialType] = true
  }
  selectedBoardItems.value = { ...selectedBoardItems.value }
}

function selectedCount(materialType) {
  const set = selectedBoardItems.value[materialType]
  return set ? set.size : 0
}

// 初始化材料看板的选中状态
watch(
  () => props.materials.map(m => m.material_type),
  () => {
    for (const mat of props.materials) {
      if (!(mat.material_type in boardSelectAll.value)) {
        boardSelectAll.value[mat.material_type] = false
      }
    }
  },
  { immediate: true }
)

// Expose selected items for export
defineExpose({ selectedBoardItems })
</script>

<style scoped>
.mb-16 { margin-bottom: var(--space-4); }
.mb-8 { margin-bottom: var(--space-2); }
.text-muted { color: var(--color-text-tertiary); font-size: var(--font-size-xs); }
.wo-link { color: var(--color-primary); text-decoration: none; font-weight: 500; }
.wo-link:hover { text-decoration: underline; }
.material-group-header { display: flex; justify-content: space-between; align-items: center; }
.material-title { font-weight: 700; font-size: 15px; color: var(--color-primary); }
.material-count { font-size: 12px; color: var(--color-text-secondary); margin-left: 8px; }
.material-actions { display: flex; gap: 8px; }
.selected-count { font-size: 13px; color: var(--color-primary); font-weight: 600; margin-right: 8px; }
.face-section-title { font-weight: 600; font-size: 14px; color: var(--color-text-primary); margin-bottom: 8px; padding-left: 4px; }
.material-group-card :deep(.el-table__row) td.el-table__cell:first-child {
  pointer-events: auto !important;
}
.material-group-card :deep(.el-table .el-checkbox__input.is-disabled .el-checkbox__inner) {
  background-color: #fff !important;
  border-color: #dcdfe6 !important;
  cursor: pointer !important;
}
.material-group-card :deep(.el-table .el-checkbox__input.is-disabled) .el-checkbox__inner:hover {
  border-color: #409eff !important;
}
</style>
