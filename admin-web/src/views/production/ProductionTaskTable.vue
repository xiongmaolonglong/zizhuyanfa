<template>
  <div>
    <div class="filter-bar mb-16">
      <el-input v-model="taskSearch" placeholder="搜索工单号/店铺名" clearable style="width:220px" />
      <el-select v-model="taskStatusFilter" placeholder="全部状态" clearable style="width:120px">
        <el-option label="待生产" value="pending" />
        <el-option label="排版中" value="typesetting" />
        <el-option label="已完成" value="completed" />
      </el-select>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="selectedShops.length > 0" class="batch-action-bar mb-16">
      <span class="batch-info">已选 {{ selectedShops.length }} 个店铺</span>
      <el-button type="primary" size="small" @click="$emit('download-cdr')">
        <el-icon style="margin-right:4px"><Download /></el-icon>下载CDR
      </el-button>
      <el-button type="success" size="small" plain @click="$emit('export-selected')">
        导出生产单
      </el-button>
      <el-button type="warning" size="small" @click="$emit('mark-typesetting')">
        标记排版中
      </el-button>
      <el-button size="small" @click="clearSelection">清除</el-button>
    </div>

    <!-- 无选择时显示导出全部 -->
    <div v-else class="filter-bar mb-16">
      <el-button type="success" plain @click="$emit('export-all')">
        <el-icon style="margin-right:4px"><Download /></el-icon>导出全部生产单
      </el-button>
    </div>

    <el-table
      :data="filteredShops"
      stripe
      v-loading="loading"
      @selection-change="handleShopSelection"
      row-key="work_order_id"
    >
      <el-table-column type="selection" width="50" :selectable="(row) => !row.isCompleted" />
      <el-table-column type="expand">
        <template #default="{ row }">
          <div class="shop-expand-content">
            <div v-for="(mat, mIdx) in row.materials" :key="mIdx" class="shop-material-group">
              <div class="shop-material-title">
                {{ adTypeLabel(mat.material_type) }}
                <span v-if="mat.group_name" class="shop-group-name">（{{ mat.group_name }}）</span>
              </div>
              <div v-for="(face, idx) in mat.faces" :key="idx" class="shop-face-row">
                <span class="face-label">{{ face.label }}</span>
                <span class="face-size">{{ Number(face.width||0).toFixed(2) }}×{{ Number(face.height||0).toFixed(2) }}m</span>
                <span class="face-area">{{ face.area.toFixed(2) }}m²</span>
                <el-tag size="small" :type="face.completed ? 'success' : (face.typesetting ? 'warning' : 'info')" effect="plain">
                  {{ face.completed ? '已完成' : (face.typesetting ? '排版中' : '待生产') }}
                </el-tag>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="work_order_no" label="工单号" width="140">
        <template #default="{ row }">
          <router-link :to="`/production/${row.work_order_id}`" class="wo-link">{{ row.work_order_no }}</router-link>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="店铺名" min-width="140" />
      <el-table-column label="甲方" width="80">
        <template #default="{ row }">
          <span v-if="row.client_name" class="text-muted">{{ row.client_name }}</span>
          <span v-else class="text-muted">—</span>
        </template>
      </el-table-column>
      <el-table-column label="材料" min-width="120">
        <template #default="{ row }">
          <span v-for="(mat, idx) in row.materials" :key="idx" class="material-tag">
            {{ adTypeLabel(mat.material_type) }}{{ idx < row.materials.length - 1 ? '、' : '' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="点位" width="50">
        <template #default="{ row }">
          {{ row.materials.reduce((sum, m) => sum + m.faces.length, 0) }}
        </template>
      </el-table-column>
      <el-table-column label="面积(m²)" width="70">
        <template #default="{ row }">{{ row.totalArea.toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="源文件" width="80">
        <template #default="{ row }">
          <a v-if="row.sourceFile" :href="row.sourceFile" target="_blank" class="file-link" :title="row.sourceFile.split('/').pop()">
            📄 CDR
          </a>
          <span v-else class="text-muted">无</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag size="small" :type="getShopStatusType(row)" effect="plain">
            {{ getShopStatusLabel(row) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button v-if="!row.isCompleted" link type="primary" @click="$emit('mark-complete', row)">标记完成</el-button>
          <router-link v-else :to="`/production/${row.work_order_id}`" class="wo-link" style="font-size:13px">查看</router-link>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Download } from '@element-plus/icons-vue'

const props = defineProps({
  taskShops: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  adTypeLabel: { type: Function, default: () => '-' },
})

const emit = defineEmits(['selection-change', 'download-cdr', 'export-selected', 'mark-typesetting', 'export-all', 'mark-complete'])

const taskSearch = ref('')
const taskStatusFilter = ref('')
const selectedShops = ref([])

const filteredShops = computed(() => {
  let list = props.taskShops
  if (taskSearch.value) {
    const kw = taskSearch.value.toLowerCase()
    list = list.filter(s => s.work_order_no.toLowerCase().includes(kw) || s.title.toLowerCase().includes(kw))
  }
  if (taskStatusFilter.value === 'completed') {
    list = list.filter(s => s.isCompleted)
  } else if (taskStatusFilter.value === 'typesetting') {
    list = list.filter(s => s.isTypesetting && !s.isCompleted)
  } else if (taskStatusFilter.value === 'pending') {
    list = list.filter(s => !s.isCompleted && !s.isTypesetting)
  }
  return list.sort((a, b) => b.pendingCount - a.pendingCount)
})

function getShopStatusType(row) {
  if (row.isCompleted) return 'success'
  if (row.isTypesetting) return 'warning'
  return 'info'
}

function getShopStatusLabel(row) {
  if (row.isCompleted) return '已完成'
  if (row.isTypesetting) return '排版中'
  return '待生产'
}

function handleShopSelection(selection) {
  selectedShops.value = selection
  emit('selection-change', selection)
}

function clearSelection() {
  selectedShops.value = []
}
</script>

<style scoped>
.mb-16 { margin-bottom: var(--space-4); }
.filter-bar { display: flex; gap: var(--space-3); align-items: center; flex-wrap: wrap; }
.text-muted { color: var(--color-text-tertiary); font-size: var(--font-size-xs); }
.wo-link { color: var(--color-primary); text-decoration: none; font-weight: 500; }
.wo-link:hover { text-decoration: underline; }
.file-link { font-size: 11px; color: var(--color-primary); text-decoration: none; }
.file-link:hover { text-decoration: underline; }
.material-tag { font-size: 12px; color: var(--color-text-secondary); }
.batch-action-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
}
.batch-info { font-size: 13px; color: var(--color-text-secondary); }
.shop-expand-content { padding: 0 20px 10px; }
.shop-material-group { margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #f3f4f6; }
.shop-material-group:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.shop-material-title { font-weight: 600; font-size: 13px; color: var(--color-primary); margin-bottom: 6px; }
.shop-group-name { font-weight: normal; font-size: 12px; color: var(--color-text-secondary); margin-left: 4px; }
.shop-face-row { display: flex; align-items: center; gap: 16px; padding: 3px 0; font-size: 12px; }
.face-label { color: var(--color-text-primary); min-width: 50px; }
.face-size { color: var(--color-text-secondary); }
.face-area { color: var(--color-text-secondary); }
</style>
