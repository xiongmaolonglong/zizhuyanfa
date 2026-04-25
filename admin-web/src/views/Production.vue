<template>
  <div>
    <div class="page-header flex-between">
      <h1 class="page-title">生产管理</h1>
      <div class="page-actions">
        <el-button @click="handleRefresh" :loading="loading">
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="mb-16">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value" style="color:var(--color-warning)">{{ stats.pending }}</div>
          <div class="stat-label">待生产</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value" style="color:var(--color-primary)">{{ stats.producing }}</div>
          <div class="stat-label">排版中</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value" style="color:var(--color-success)">{{ stats.completed }}</div>
          <div class="stat-label">已完成</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value" style="color:var(--color-text-primary)">{{ stats.materialTypes }}</div>
          <div class="stat-label">材料种类</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" type="card" class="mb-16">
      <el-tab-pane name="tasks">
        <template #label>生产任务 <el-badge :value="stats.pending" :hidden="!stats.pending" type="warning" style="margin-left:4px" /></template>
      </el-tab-pane>
      <el-tab-pane name="board">
        <template #label>材料看板 <el-badge :value="boardFaceCount" :hidden="!boardFaceCount" style="margin-left:4px" /></template>
      </el-tab-pane>
      <el-tab-pane label="生产记录" name="history" />
    </el-tabs>

    <!-- Tab 1: 生产任务 -->
    <el-card v-show="activeTab === 'tasks'">
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
        <el-button type="primary" size="small" @click="downloadSelectedFiles">
          <el-icon style="margin-right:4px"><Download /></el-icon>下载CDR
        </el-button>
        <el-button type="success" size="small" plain @click="exportSelectedShops">
          导出生产单
        </el-button>
        <el-button type="warning" size="small" @click="markAsTypesetting">
          标记排版中
        </el-button>
        <el-button size="small" @click="clearSelection">清除</el-button>
      </div>

      <!-- 无选择时显示导出全部 -->
      <div v-else class="filter-bar mb-16">
        <el-button type="success" plain @click="exportAllTasks">
          <el-icon style="margin-right:4px"><Download /></el-icon>导出全部生产单
        </el-button>
      </div>

      <el-table
        :data="filteredTaskShops"
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
            <el-button v-if="!row.isCompleted" link type="primary" @click="markShopComplete(row)">标记完成</el-button>
            <router-link v-else :to="`/production/${row.work_order_id}`" class="wo-link" style="font-size:13px">查看</router-link>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Tab 2: 材料看板 -->
    <div v-if="activeTab === 'board'" :key="'board-' + allTasks.length">
      <template v-if="boardMaterials.length">
        <div v-for="mat in boardMaterials" :key="mat.material_type" class="material-group-card mb-16">
          <el-card>
            <template #header>
              <div class="material-group-header">
                <div>
                  <span class="material-title">{{ adTypeLabel(mat.material_type) }}</span>
                  <span class="material-count">（{{ getBoardFaceCount(mat.material_type, false) }} 个单独面 · {{ getBoardFaceCount(mat.material_type, true) }} 个一体面 · 共 {{ mat.totalArea.toFixed(2) }} m²）</span>
                </div>
                <div class="material-actions">
                  <el-checkbox
                    v-model="boardSelectAll[mat.material_type]"
                    @change="toggleAllBoardItems(mat.material_type, mat.items)"
                    style="margin-right:8px"
                  >全选</el-checkbox>
                  <span v-if="selectedBoardCount(mat.material_type) > 0" class="selected-count">
                    已选 {{ selectedBoardCount(mat.material_type) }} 项
                  </span>
                  <el-button type="warning" size="small" plain @click="$router.push(`/production-view/${encodeURIComponent(mat.material_type)}`)">
                    <el-icon><View /></el-icon>生产视图
                  </el-button>
                  <el-button type="success" size="small" plain @click="exportProductionSheet(mat)">
                    导出生产单
                  </el-button>
                  <el-button type="info" size="small" plain @click="exportWithImages(mat)">
                    <el-icon style="margin-right:4px"><Download /></el-icon>导出完整包
                  </el-button>
                  <el-button
                    v-if="selectedBoardCount(mat.material_type) > 0"
                    type="primary"
                    size="small"
                    @click="exportSelectedBoardItems(mat.material_type)"
                  >
                    导出选中 ({{ selectedBoardCount(mat.material_type) }})
                  </el-button>
                  <el-button type="primary" size="small" @click="openVerifyDialog(mat.material_type)">
                    标记完成 ({{ mat.items.length }})
                  </el-button>
                </div>
              </div>
            </template>

            <!-- 单独面 -->
            <template v-if="getBoardFaceRows(mat.material_type, false).length">
              <div class="face-section-title">单独面</div>
              <el-table :data="getBoardFaceRows(mat.material_type, false)" stripe class="mb-8 board-table" :row-key="(row) => row.work_order_id + '_' + row.material_type + '_' + row.group_index + '_' + row.face_label">
                <el-table-column label="" width="40">
                  <template #default="{ row }">
                    <el-checkbox
                      :model-value="isBoardItemSelected(mat.material_type, row.work_order_id + '|||' + row.material_type + '|||' + row.group_index + '|||' + row.face_label)"
                      @change="(val) => toggleBoardItem(mat.material_type, row.work_order_id + '|||' + row.material_type + '|||' + row.group_index + '|||' + row.face_label)"
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
                    <el-button v-if="!row.completed" link type="primary" @click="markFaceComplete(row)">标记完成</el-button>
                    <span v-else class="text-muted">已完成</span>
                  </template>
                </el-table-column>
              </el-table>
            </template>

            <!-- 一体面 -->
            <template v-if="getBoardFaceRows(mat.material_type, true).length">
              <div class="face-section-title">一体面</div>
              <el-table :data="getBoardFaceRows(mat.material_type, true)" stripe class="board-table" :row-key="(row) => row.work_order_id + '_' + row.material_type + '_' + row.group_index + '_' + row.face_label">
                <el-table-column label="" width="40">
                  <template #default="{ row }">
                    <el-checkbox
                      :model-value="isBoardItemSelected(mat.material_type, row.work_order_id + '|||' + row.material_type + '|||' + row.group_index + '|||' + row.face_label)"
                      @change="(val) => toggleBoardItem(mat.material_type, row.work_order_id + '|||' + row.material_type + '|||' + row.group_index + '|||' + row.face_label)"
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
                    <el-button v-if="!row.completed" link type="primary" @click="markFaceComplete(row)">标记完成</el-button>
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
    </div>

    <!-- Tab 3: 生产记录 -->
    <el-card v-show="activeTab === 'history'">
      <div class="filter-bar mb-16">
        <el-input v-model="historySearch" placeholder="搜索批次号/工单号" clearable style="width:220px" @input="filterHistory" />
        <el-select v-model="historyMaterialFilter" placeholder="全部材料" clearable style="width:140px" @change="filterHistory">
          <el-option v-for="m in historyMaterials" :key="m" :label="m" :value="m" />
        </el-select>
      </div>

      <el-table :data="filteredBatches" stripe v-loading="historyLoading">
        <el-table-column label="批次号" width="200">
          <template #default="{ row }">
            <span class="batch-tag">{{ row.batch_no }}</span>
          </template>
        </el-table-column>
        <el-table-column label="材料类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain">{{ adTypeLabel(row.material_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="完成/总数" width="100">
          <template #default="{ row }">{{ row.completed_count }}/{{ row.total_count }}</template>
        </el-table-column>
        <el-table-column label="生产日期" width="160">
          <template #default="{ row }">{{ row.created_at?.slice(0, 19) || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作人" width="100">
          <template #default="{ row }">{{ row.creator?.name || row.creator_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="备注" min-width="150">
          <template #default="{ row }">{{ row.notes || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showBatchDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination v-model:current-page="historyPage" v-model:page-size="historyPageSize"
          :total="historyTotal" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next"
          @size-change="loadBatches" @current-change="loadBatches" />
      </div>
    </el-card>

    <!-- 核对完成对话框 -->
    <el-dialog v-model="verifyVisible" :title="`核对完成 — ${adTypeLabel(verifyData.material_type)}`" width="560px" destroy-on-close>
      <div class="verify-dialog-content">
        <div class="verify-batch-no">
          <span class="label">批次号</span>
          <span class="value">{{ verifyData.batch_no }}</span>
        </div>
        <el-alert type="success" :closable="false" show-icon style="margin-bottom:16px">
          请对照实物，勾选<strong>已生产完成</strong>的工单。未勾选的视为未完成，下次继续生产。
        </el-alert>
        <div class="verify-counter">已确认 <strong>{{ verifyCheckedCount }}</strong> / {{ verifyData.items?.length || 0 }}</div>
        <el-checkbox-group v-model="verifyChecked" class="verify-checklist">
          <div v-for="(item, idx) in verifyData.items" :key="idx" class="verify-item">
            <el-checkbox :value="item.id">
              <span class="verify-item-title"><strong>{{ item.work_order_no }}</strong> {{ item.title }} — {{ item.faceSummary }} ({{ item.area.toFixed(2) }}m²)</span>
            </el-checkbox>
            <div v-if="item.source_files?.length" class="verify-item-files">
              <el-link v-for="(f, fi) in item.source_files" :key="fi" :href="f" type="primary" target="_blank" :underline="false" style="margin-right:12px">
                📄 {{ f.split('/').pop() }}
              </el-link>
            </div>
          </div>
        </el-checkbox-group>
        <el-input v-model="verifyNotes" type="textarea" :rows="2" placeholder="生产备注（可选）" style="margin-top:12px" />
      </div>
      <template #footer>
        <el-button @click="verifyVisible = false">取消</el-button>
        <el-button type="success" @click="confirmVerify">确认完成</el-button>
      </template>
    </el-dialog>

    <!-- 批次详情对话框 -->
    <el-dialog v-model="batchDetailVisible" title="批次详情" width="560px" destroy-on-close>
      <div v-if="batchDetail">
        <div class="batch-detail-header mb-16">
          <span class="batch-tag">{{ batchDetail.batch_no }}</span>
          <el-tag size="small" type="info" effect="plain" style="margin-left:8px">{{ adTypeLabel(batchDetail.material_type) }}</el-tag>
          <el-tag size="small" :type="batchDetail.completed_count === batchDetail.total_count ? 'success' : 'warning'" effect="plain" style="margin-left:8px">
            {{ batchDetail.completed_count }}/{{ batchDetail.total_count }} 已核对
          </el-tag>
        </div>
        <el-descriptions :column="2" border size="small" class="mb-16">
          <el-descriptions-item label="生产日期">{{ batchDetail.created_at?.slice(0, 19) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ batchDetail.creator?.name || batchDetail.creator_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="完成数量">{{ batchDetail.completed_count }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ batchDetail.notes || '-' }}</el-descriptions-item>
        </el-descriptions>
        <div class="mb-8"><strong>核对清单</strong></div>
        <div v-for="item in batchDetail.checklist" :key="item.work_order_id" class="batch-check-item">
          <el-icon :color="item.checked ? 'var(--color-success)' : 'var(--color-text-tertiary)'">
            <CircleCheckFilled v-if="item.checked" />
            <CircleClose v-else />
          </el-icon>
          <div class="batch-check-info">
            <span class="batch-check-wo">{{ item.work_order_no }} {{ item.title }}</span>
            <el-tag size="small" :type="item.checked ? 'success' : 'info'" effect="plain">
              {{ item.checked ? '已核对' : '未核对' }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { Refresh, CircleCheckFilled, CircleClose, Download, View } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import api from '../api'
import { useElementOptions } from '../composables/useElementOptions'

const loading = ref(false)
const activeTab = ref('tasks')
const adTypeMap = ref({})
// ===== 数据 =====
const allTasks = ref([])
const allWorkOrders = ref([])  // 原始工单数据，含 designs/measurements
const batches = ref([])
const historyLoading = ref(false)
const historyPage = ref(1)
const historyPageSize = ref(20)
const historyTotal = ref(0)

// 已完成的工单+材料组合
const completedGroups = ref(new Set())
// 排版中的工单组
const typesettingGroups = ref(new Set())
// 选中的店铺
const selectedShops = ref([])

// 材料看板中按材料类型勾选的店铺
const selectedBoardItems = ref({}) // { material_type: Set(groupKey) }
// 全选状态：{ material_type: boolean }
const boardSelectAll = ref({})
// 导出记录：{ work_order_id: [{ export_no, created_at, creator_name }] }
const exportRecords = ref({})

// ===== 统计 =====
const stats = reactive({ pending: 0, producing: 0, completed: 0, materialTypes: 0 })

// ===== 筛选 =====
const taskSearch = ref('')
const taskStatusFilter = ref('')
const historySearch = ref('')
const historyMaterialFilter = ref('')

// ===== 核对对话框 =====
const verifyVisible = ref(false)
const verifyData = reactive({ material_type: '', batch_no: '', items: [] })
const verifyChecked = ref([])
const verifyNotes = ref('')
const verifyCheckedCount = computed(() => verifyChecked.value.length)

// ===== 批次详情 =====
const batchDetailVisible = ref(false)
const batchDetail = ref(null)

// ===== 材料映射 =====
async function loadSettings() {
  try {
    const res = await api.get('/tenant/settings')
    const settings = res.data || {}
    const templates = settings.project_templates || []
    for (const tmpl of templates) {
      for (const adType of (tmpl.ad_types || [])) {
        if (adType.key && adType.label) adTypeMap.value[adType.key] = adType.label
      }
    }
  } catch {}
}

function adTypeLabel(v) {
  if (!v) return '—'
  return adTypeMap.value[v] || v
}

const { labelOf: projectTypeLabel, load: loadElementOptions } = useElementOptions()

// 计算一体组合总尺寸（宽度相加，高度相加）
function unifiedTotalSize(faces) {
  if (!faces || !faces.length) return ''
  const totalW = faces.reduce((s, f) => s + (Number(f.width) || 0), 0)
  const totalH = faces.reduce((s, f) => s + (Number(f.height) || 0), 0)
  return `${totalW.toFixed(2)}×${totalH.toFixed(2)}`
}

// ===== 加载工单数据 =====
async function loadWorkOrders() {
  loading.value = true
  try {
    const res = await api.get('/work-orders', { params: { stage: 'production', page: 1, limit: 100 } })
    const payload = res.data || {}
    const list = Array.isArray(payload) ? payload : (payload.list || [])

    // 从 productions 数据构建完成状态映射和生产任务号映射
    completedGroups.value = new Set()
    const productionTaskNos = {}  // { "workOrderId|||material_type|||groupIndex": "PROD-xxx" }
    for (const wo of list) {
      if (wo.productions) {
        for (const p of wo.productions) {
          // 使用 group_index 精确匹配，兼容旧数据用 group_name
          const groupKey = p.group_index !== undefined
            ? `${wo.id}|||${p.material_type}|||${p.group_index}`
            : `${wo.id}|||${p.material_type}`
          if (p.status === 'completed' || p.status === 'shipped') {
            completedGroups.value.add(groupKey)
          }
          if (p.production_task_no) {
            productionTaskNos[groupKey] = p.production_task_no
          }
        }
      }
    }

    allWorkOrders.value = list
    allTasks.value = flattenWorkOrders(list, productionTaskNos)
    updateStats()
  } catch (e) {
    ElMessage.error('加载工单失败')
    allTasks.value = []
  } finally {
    loading.value = false
  }
}

// 将工单数据拆解为"工单+材料+面"的任务列表
function flattenWorkOrders(workOrders, productionTaskNos = {}) {
  const tasks = []
  for (const wo of workOrders) {
    // 从测量数据中提取材料+面信息
    const measurements = wo.measurements || []
    for (const m of measurements) {
      // materials 可能是 JSON 字符串，需要解析
      let materials = m.materials || []
      if (typeof materials === 'string') {
        try { materials = JSON.parse(materials) } catch { materials = [] }
      }

      // 从设计数据获取该工单的源文件（只取最后一个审核通过版本的第一个文件）
      const sourceFiles = []
      if (wo.designs) {
        const approvedDesigns = wo.designs.filter(d => d.status === 'approved')
        if (approvedDesigns.length > 0) {
          const lastDesign = approvedDesigns[approvedDesigns.length - 1]
          let srcFiles = lastDesign.source_files || []
          if (typeof srcFiles === 'string') { try { srcFiles = JSON.parse(srcFiles) } catch { srcFiles = [] } }
          // 只取第一个CDR文件
          if (srcFiles.length > 0) sourceFiles.push(srcFiles[0])
        }
      }

      // 全局组索引：同一工单内同材料类型的每个 mat 块分配不同索引
      const matGroupCounts = {}  // { "signboard": 当前索引 }
      for (const mat of materials) {
        const matType = mat.material_type || '未分类'
        if (!matGroupCounts[matType]) matGroupCounts[matType] = 0

        const faces = mat.faces || []
        // 这个 mat 块内的面（可能是一体组合或独立面）
        const isUnified = faces.some(f => f.is_unified)
        const groupName = faces[0]?.group_name || ''

        // 获取生产任务号（用组块索引）
        const groupKey = `${wo.id}|||${matType}|||${matGroupCounts[matType]}`
        const taskNo = productionTaskNos[groupKey] || ''

        for (const face of faces) {
          // 动态查找张数字段：优先 field_ 数字字段，其次常见字段名
          let qty = 0
          const excludeKeys = ['width', 'height', '_widthM', '_heightM', 'area', 'unit', 'direction', 'photos', 'notes', 'label', 'group_name', 'is_unified', 'special_flag', 'template_id']
          for (const [key, val] of Object.entries(face)) {
            if (excludeKeys.includes(key)) continue
            const num = Number(val)
            if (!isNaN(num) && num > 0 && Number.isFinite(num)) {
              // field_ 开头或字段名含"张"/"数量"/"qty"优先
              if (key.startsWith('field_') || /张|数量|qty|quantity/i.test(key)) {
                qty = num
                break
              }
            }
          }
          tasks.push({
            work_order_id: wo.id,
            work_order_no: wo.work_order_no,
            title: wo.title,
            material_type: matType,
            face_label: face.label || '—',
            width: face.width || 0,
            height: face.height || 0,
            area: face.area || 0,
            source_files: sourceFiles,
            production_task_no: taskNo,
            group_name: groupName,
            is_unified: isUnified,
            group_index: matGroupCounts[matType],
            qty,
            project_type: wo.project_type || '',
            activity_name: wo.activity_name || '',
            client_name: wo.client_name || '',
            address: wo.address || '',
          })
        }

        // 完成一个材料块后，索引递增
        matGroupCounts[matType]++
      }
    }
  }
  return tasks
}

// ===== 按工单+材料+组合合并（同类型不同组分开显示） =====
function groupByWoMaterial(taskList) {
  const map = {}
  taskList.forEach(t => {
    const woId = String(t.work_order_id)
    // 用 group_index 区分同一工单同材料类型的不同组
    const groupKey = `${woId}|||${t.material_type}|||${t.group_index}`
    if (!map[groupKey]) {
      map[groupKey] = {
        work_order_id: woId,
        work_order_no: t.work_order_no,
        title: t.title,
        material_type: t.material_type,
        faces: [],
        totalArea: 0,
        totalQty: 0,
        production_task_no: t.production_task_no || '',
        source_files: [],
        is_unified: t.is_unified,
        group_name: t.group_name,
        group_index: t.group_index,
        activity_name: t.activity_name || '',
        client_name: t.client_name || '',
        project_type: t.project_type || '',
        address: t.address || '',
      }
    }
    map[groupKey].faces.push({ label: t.face_label, width: t.width, height: t.height, qty: t.qty || 1 })
    map[groupKey].totalArea += (t.area || 0)
    map[groupKey].totalQty += (t.qty || 0)
    if (t.source_files?.length) {
      t.source_files.forEach(f => { if (!map[groupKey].source_files.includes(f)) map[groupKey].source_files.push(f) })
    }
  })
  return Object.values(map)
}

// 判断工单+材料+组索引是否已完成
function isGroupCompleted(group) {
  const groupKey = `${group.work_order_id}|||${group.material_type}|||${group.group_index}`
  if (completedGroups.value.has(groupKey)) return true
  // 兼容旧数据：不带 group_index 的匹配
  const legacyKey = `${group.work_order_id}|||${group.material_type}`
  if (completedGroups.value.has(legacyKey)) return true
  return false
}

// 判断是否在排版中
function isTypesetting(group) {
  const groupKey = `${group.work_order_id}|||${group.material_type}|||${group.group_index}`
  return typesettingGroups.value.has(groupKey)
}

// ===== 筛选后的任务（按店铺聚合）=====
const filteredTaskShops = computed(() => {
  const groups = groupByWoMaterial(allTasks.value)
  const byShop = {}

  groups.forEach(g => {
    const woNo = g.work_order_no
    const completed = isGroupCompleted(g)
    const typesetting = isTypesetting(g)

    if (!byShop[woNo]) {
      byShop[woNo] = {
        work_order_id: g.work_order_id,
        work_order_no: woNo,
        title: g.title,
        client_name: g.client_name || '',
        activity_name: g.activity_name || '',
        project_type: g.project_type || '',
        address: g.address || '',
        materials: [],
        sourceFile: null,
        totalArea: 0,
        pendingCount: 0,
        typesettingCount: 0,
        completedCount: 0,
        isCompleted: false,
        isTypesetting: false,
      }
    }

    // 累加面积
    byShop[woNo].totalArea += g.totalArea

    // 只取第一个源文件（每个店铺一个CDR）
    if (!byShop[woNo].sourceFile && g.source_files?.length > 0) {
      byShop[woNo].sourceFile = g.source_files[0]
    }

    // 检查是否已有相同材料类型+组名的材料组
    let matGroup = byShop[woNo].materials.find(m => m.material_type === g.material_type && m.group_name === (g.group_name || ''))
    if (!matGroup) {
      matGroup = {
        material_type: g.material_type,
        group_name: g.group_name || '',
        faces: [],
        completed,
        typesetting,
      }
      byShop[woNo].materials.push(matGroup)
    }

    g.faces.forEach(f => {
      matGroup.faces.push({
        label: f.label || '—',
        width: f.width,
        height: f.height,
        qty: f.qty || 1,
        area: (Number(f.width) || 0) * (Number(f.height) || 0),
        completed,
        typesetting,
      })
    })

    // 统计状态
    if (completed) {
      byShop[woNo].completedCount++
    } else if (typesetting) {
      byShop[woNo].typesettingCount++
    } else {
      byShop[woNo].pendingCount++
    }
  })

  // 计算整体状态
  Object.values(byShop).forEach(shop => {
    const total = shop.pendingCount + shop.typesettingCount + shop.completedCount
    shop.isCompleted = shop.completedCount === total
    shop.isTypesetting = shop.typesettingCount > 0 && !shop.isCompleted
  })

  // 筛选
  let list = Object.values(byShop)
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

// ===== 材料看板 =====
const boardMaterials = computed(() => {
  const groups = groupByWoMaterial(allTasks.value).filter(g => !isGroupCompleted(g))
  const byMat = {}
  groups.forEach(item => {
    if (!byMat[item.material_type]) byMat[item.material_type] = { material_type: item.material_type, items: [], totalArea: 0 }
    byMat[item.material_type].items.push(item)
    byMat[item.material_type].totalArea += item.totalArea
  })
  return Object.values(byMat).sort((a, b) => b.items.length - a.items.length)
})

const boardFaceCount = computed(() => boardMaterials.value.reduce((s, m) => s + m.items.reduce((ss, it) => ss + it.faces.length, 0), 0))

// 获取某材料类型的面（unifiedFilter: undefined=全部, true=仅一体, false=仅单独）
function getBoardFaceRows(materialType, unifiedFilter) {
  const matGroup = boardMaterials.value.find(m => m.material_type === materialType)
  if (!matGroup) return []
  const rows = []
  for (const item of matGroup.items) {
    const completed = isGroupCompleted(item)
    const typesetting = isTypesetting(item) && !completed
    const isUnified = item.is_unified || false
    if (unifiedFilter !== undefined && unifiedFilter !== isUnified) continue

    if (isUnified) {
      // 一体面：整个组合并为一行
      const totalW = item.faces.reduce((s, f) => s + (Number(f.width) || 0), 0)
      const totalH = item.faces.reduce((s, f) => s + (Number(f.height) || 0), 0)
      const totalArea = totalW * totalH / 10000
      rows.push({
        work_order_id: item.work_order_id,
        work_order_no: item.work_order_no,
        title: item.title,
        project_type: item.project_type || '',
        address: item.address || '',
        face_label: `一体面(${item.faces.length}面)`,
        face_width: totalW,
        face_height: totalH,
        face_area: totalArea,
        face_qty: item.faces.reduce((s, f) => s + (f.qty || 1), 0),
        material_type: item.material_type,
        group_index: item.group_index,
        completed,
        typesetting,
      })
    } else {
      // 单独面：每个面一行
      for (const face of item.faces) {
        rows.push({
          work_order_id: item.work_order_id,
          work_order_no: item.work_order_no,
          title: item.title,
          project_type: item.project_type || '',
          address: item.address || '',
          face_label: face.label || '—',
          face_width: face.width || 0,
          face_height: face.height || 0,
          face_area: (Number(face.width) || 0) * (Number(face.height) || 0) / 10000,
          face_qty: face.qty || 1,
          material_type: item.material_type,
          group_index: item.group_index,
          completed,
          typesetting,
        })
      }
    }
  }
  return rows
}

function getBoardFaceCount(materialType, unifiedFilter) {
  return getBoardFaceRows(materialType, unifiedFilter).length
}

// 标记单个面完成
async function markFaceComplete(row) {
  try {
    await api.post('/production/groups/complete', {
      work_order_id: row.work_order_id,
      material_type: row.material_type,
    })
    ElMessage.success('已标记完成')
    await loadWorkOrders()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '标记完成失败')
  }
}

// ===== 批次数据 =====
async function loadBatches() {
  historyLoading.value = true
  try {
    const res = await api.get('/production/batches', {
      params: { page: historyPage.value, limit: historyPageSize.value }
    })
    const payload = res.data || {}
    batches.value = payload.list || []
    historyTotal.value = payload.total || 0
  } catch {
    batches.value = []
    historyTotal.value = 0
  } finally {
    historyLoading.value = false
  }
}

// ===== 导出记录 =====
async function loadExportRecords(materialType) {
  try {
    const res = await api.get('/production/exports', { params: { material_type: materialType, limit: 200 } })
    const payload = res.data || {}
    const list = payload.list || []
    // 按 work_order_id 重组
    const map = {}
    for (const record of list) {
      for (const wo of (record.work_orders || [])) {
        if (!map[wo.work_order_id]) map[wo.work_order_id] = []
        map[wo.work_order_id].push({
          export_no: record.export_no,
          material_type: record.material_type,
          created_at: record.created_at?.slice(0, 19) || '',
          creator_name: record.creator_name || '',
        })
      }
    }
    exportRecords.value = map
  } catch {}
}

// 获取某工单的导出标记文案
function getExportTag(woId) {
  const records = exportRecords.value[woId]
  if (!records || !records.length) return ''
  const last = records[0] // 最近一次
  return `${last.export_no}（${records.length}次）`
}

// 材料看板按材料类型勾选
function isBoardItemSelected(materialType, groupKey) {
  const set = selectedBoardItems.value[materialType]
  return set ? set.has(groupKey) : false
}

function toggleBoardItem(materialType, groupKey) {
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

function toggleAllBoardItems(materialType, items) {
  if (!selectedBoardItems.value[materialType]) {
    selectedBoardItems.value[materialType] = new Set()
  }
  const set = selectedBoardItems.value[materialType]
  // Build keys per face (not per group)
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

function selectedBoardCount(materialType) {
  const set = selectedBoardItems.value[materialType]
  return set ? set.size : 0
}

function handleBoardSelectionChange(materialType, selection, isUnified) {
  if (!selectedBoardItems.value[materialType]) {
    selectedBoardItems.value[materialType] = new Set()
  }
  const set = selectedBoardItems.value[materialType]
  // 先清除该类型的全部，再添加当前选中的
  // 因为两个表（单独面/一体面）分开渲染，需要合并
  const rows = selection.map(row => `${row.work_order_id}|||${row.material_type}|||${row.group_index}`)
  // 只更新当前表选中的行，保留另一表的选择
  // 先清除当前表已取消的项：获取当前表所有可能的 key
  const allRows = getBoardFaceRows(materialType, isUnified)
  const allKeys = new Set(allRows.map(r => `${r.work_order_id}|||${r.material_type}|||${r.group_index}`))
  // 清除当前表中未选中的
  for (const key of allKeys) {
    if (!rows.includes(key)) {
      set.delete(key)
    }
  }
  // 添加新选中的
  for (const key of rows) {
    set.add(key)
  }
  selectedBoardItems.value = { ...selectedBoardItems.value }
}

const filteredBatches = computed(() => {
  let list = batches.value
  if (historySearch.value) {
    const kw = historySearch.value.toLowerCase()
    list = list.filter(b => b.batch_no?.toLowerCase().includes(kw) || JSON.stringify(b.checklist).toLowerCase().includes(kw))
  }
  if (historyMaterialFilter.value) {
    list = list.filter(b => b.material_type === historyMaterialFilter.value)
  }
  return list
})

const historyMaterials = computed(() => [...new Set(batches.value.map(b => b.material_type))])

// ===== 统计更新 =====
function updateStats() {
  const groups = groupByWoMaterial(allTasks.value)
  const completedWoIds = new Set()
  const typesettingWoIds = new Set()
  const pendingWoIds = new Set()

  groups.forEach(g => {
    if (isGroupCompleted(g)) {
      completedWoIds.add(g.work_order_id)
    } else if (isTypesetting(g)) {
      typesettingWoIds.add(g.work_order_id)
    } else {
      pendingWoIds.add(g.work_order_id)
    }
  })

  stats.pending = pendingWoIds.size
  stats.producing = typesettingWoIds.size
  stats.completed = completedWoIds.size
  stats.materialTypes = new Set(allTasks.value.map(t => t.material_type)).size
}

// ===== 筛选 =====
function filterTasks() {} // computed 自动响应
function filterHistory() {} // computed 自动响应

// ===== 状态显示 =====
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

// ===== 选择操作 =====
function handleShopSelection(selection) {
  selectedShops.value = selection
}

function clearSelection() {
  selectedShops.value = []
}

// 批量下载CDR文件
function downloadSelectedFiles() {
  const allFiles = []
  const seenFiles = new Set()

  selectedShops.value.forEach(shop => {
    if (shop.sourceFile && !seenFiles.has(shop.sourceFile)) {
      seenFiles.add(shop.sourceFile)
      allFiles.push({ url: shop.sourceFile, name: shop.sourceFile.split('/').pop() })
    }
  })

  if (!allFiles.length) {
    ElMessage.warning('选中店铺没有源文件')
    return
  }

  // 逐个下载
  allFiles.forEach(file => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  })

  ElMessage.success(`已下载 ${allFiles.length} 个文件`)
}

// 标记为排版中
function markAsTypesetting() {
  selectedShops.value.forEach(shop => {
    // 标记该店铺所有未完成的材料组为排版中
    shop.materials.forEach(mat => {
      if (!mat.completed) {
        const groupKey = `${shop.work_order_id}|||${mat.material_type}|||${mat.group_index || 0}`
        typesettingGroups.value.add(groupKey)
      }
    })
  })

  ElMessage.success(`已标记 ${selectedShops.value.length} 个店铺为排版中`)
  clearSelection()
}

// 标记店铺完成
function markShopComplete(shop) {
  // 打开核对对话框，标记该店铺所有材料完成
  const items = shop.materials.filter(m => !m.completed).map((mat, idx) => ({
    id: `${shop.work_order_id}|||${mat.material_type}|||${mat.group_index || idx}`,
    work_order_id: shop.work_order_id,
    work_order_no: shop.work_order_no,
    title: shop.title,
    faceSummary: mat.faces.map(f => f.label).join(' + '),
    area: mat.faces.reduce((sum, f) => sum + f.area, 0),
    source_files: shop.sourceFile ? [shop.sourceFile] : [],
    group_name: mat.group_name || '',
    is_unified: false,
    group_index: mat.group_index || idx,
    material_type: mat.material_type,
  }))

  if (!items.length) {
    ElMessage.warning('该店铺没有待完成的任务')
    return
  }

  verifyData.material_type = items[0].material_type
  verifyData.batch_no = '自动生成'
  verifyData.items = items
  verifyChecked.value = items.map(i => i.id)
  verifyNotes.value = ''
  verifyVisible.value = true
}

// ===== 核对流程 =====
function openVerifyDialog(materialType) {
  const items = groupByWoMaterial(allTasks.value).filter(g => g.material_type === materialType && !isGroupCompleted(g))
  if (!items.length) { ElMessage.warning('没有待生产任务'); return }
  verifyData.material_type = materialType
  verifyData.batch_no = '自动生成'
  verifyData.items = items.map(g => ({
    id: `${g.work_order_id}|||${g.material_type}|||${g.group_index}`,
    work_order_id: g.work_order_id,
    work_order_no: g.work_order_no,
    title: g.title,
    faceSummary: g.faces.map(f => f.label).join(' + '),
    area: g.totalArea,
    source_files: g.source_files,
    group_name: g.group_name || '',
    is_unified: g.is_unified || false,
    group_index: g.group_index,
    material_type: g.material_type,
  }))
  verifyChecked.value = verifyData.items.map(i => i.id)
  verifyNotes.value = ''
  verifyVisible.value = true
}

function startVerifyGroup(group) {
  verifyData.material_type = group.material_type
  verifyData.batch_no = '自动生成'
  verifyData.items = [{
    id: `${group.work_order_id}|||${group.material_type}|||${group.group_index}`,
    work_order_id: group.work_order_id,
    work_order_no: group.work_order_no,
    title: group.title,
    faceSummary: group.faces.map(f => f.label).join(' + '),
    area: group.totalArea,
    source_files: group.source_files,
    group_name: group.group_name || '',
    is_unified: group.is_unified || false,
    group_index: group.group_index,
    material_type: group.material_type,
  }]
  verifyChecked.value = verifyData.items.map(i => i.id)
  verifyNotes.value = ''
  verifyVisible.value = true
}

async function confirmVerify() {
  if (!verifyChecked.value.length) {
    ElMessage.warning('请至少勾选一个已完成的工单')
    return
  }

  const items = verifyData.items.map(item => ({
    work_order_id: item.work_order_id,
    checked: verifyChecked.value.includes(item.id),
    group_name: item.group_name || '',
    is_unified: item.is_unified || false,
    group_index: item.group_index,
    material_type: item.material_type,
  }))

  try {
    const res = await api.post('/production/batches', {
      material_type: verifyData.material_type,
      items,
      notes: verifyNotes.value,
    })
    const data = res.data || {}
    const batch = data.batch
    verifyVisible.value = false

    // 更新本地完成状态
    items.forEach(item => {
      if (item.checked) {
        const groupKey = `${item.work_order_id}|||${item.material_type}|||${item.group_index}`
        completedGroups.value.add(groupKey)
      }
    })

    await loadWorkOrders()
    await loadBatches()

    const uncompleted = verifyData.items.length - verifyChecked.value.length
    if (uncompleted > 0) {
      ElMessage.success(`${adTypeLabel(verifyData.material_type)}：${verifyChecked.value.length} 个已确认，${uncompleted} 个未完成下次继续`)
    } else {
      ElMessage.success(`批次 ${batch?.batch_no} 已完成，${verifyChecked.value.length} 个工单标记完成`)
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '提交失败')
  }
}

// ===== 批次详情 =====
async function showBatchDetail(row) {
  try {
    const res = await api.get(`/production/batches/${row.id}`)
    batchDetail.value = res.data || {}
    batchDetailVisible.value = true
  } catch (e) {
    ElMessage.error('加载批次详情失败')
  }
}

function handleRefresh() {
  loadWorkOrders()
  loadBatches()
}

// 导出生产单（按面展开）
async function exportProductionSheet(matGroup) {
  try {
    const { default: XLSX } = await import('xlsx-js-style')
    const materialLabel = adTypeLabel(matGroup.material_type)
    const today = new Date().toISOString().slice(0, 10)

    const woMap = {}
    const currentMat = matGroup.material_type
    matGroup.items
      .filter(item => item.material_type === currentMat)
      .forEach(item => {
        const key = `${item.work_order_id}_${item.group_index ?? 0}`
        if (!woMap[key]) {
          woMap[key] = {
            work_order_no: item.work_order_no || '',
            title: item.title || '',
            project_type: item.project_type || '',
            address: item.address || '',
            items: [],
          }
        }
        for (const face of item.faces) {
          woMap[key].items.push({
            face_label: face.label || '—',
            material_type: adTypeLabel(item.material_type),
            width: Number(face.width) || 0,
            height: Number(face.height) || 0,
            qty: face.qty || 1,
            area: (Number(face.width) || 0) * (Number(face.height) || 0) / 10000,
          })
        }
      })

    const shops = Object.values(woMap)
    if (!shops.length) {
      ElMessage.warning('没有待生产任务')
      return
    }
    const merges = []
    let dataRow = 4

    const allRows = [
      ['生产单', '', '', '', '', '', '', '', '', '', ''],
      ['材料类型', materialLabel, '', '导出日期', today, '', '', '', '', '', ''],
      ['订单号', '终端', '品项', '点位', '名称', '材质', '规格', '', '', '面积(m²)', '地址'],
      ['', '', '', '', '', '', '长', '宽', '数量', '', ''],
    ]

    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } })
    merges.push({ s: { r: 2, c: 6 }, e: { r: 2, c: 8 } })

    shops.forEach(shop => {
      const faceCount = shop.items.length
      const shopStartRow = dataRow

      shop.items.forEach((f, fIdx) => {
        allRows.push([
          shop.work_order_no,
          shop.title,
          projectTypeLabel(shop.project_type),
          fIdx + 1,
          f.face_label,
          f.material_type,
          f.width.toFixed(2),
          f.height.toFixed(2),
          f.qty,
          f.area.toFixed(2),
          shop.address,
        ])
      })

      if (faceCount > 1) {
        merges.push({ s: { r: shopStartRow, c: 0 }, e: { r: shopStartRow + faceCount - 1, c: 0 } })
        merges.push({ s: { r: shopStartRow, c: 1 }, e: { r: shopStartRow + faceCount - 1, c: 1 } })
        merges.push({ s: { r: shopStartRow, c: 2 }, e: { r: shopStartRow + faceCount - 1, c: 2 } })
        merges.push({ s: { r: shopStartRow, c: 10 }, e: { r: shopStartRow + faceCount - 1, c: 10 } })
      }

      const subtotalRow = dataRow + faceCount
      const subtotalArea = shop.items.reduce((s, f) => s + f.area, 0)
      allRows.push(['', '', '小计', '', '', '', '', '', '', subtotalArea.toFixed(2), ''])
      merges.push({ s: { r: subtotalRow, c: 0 }, e: { r: subtotalRow, c: 4 } })

      dataRow = subtotalRow + 1
    })

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(allRows)
    ws['!merges'] = merges

    ws['!cols'] = [
      { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 6 }, { wch: 18 }, { wch: 22 },
      { wch: 8 }, { wch: 8 }, { wch: 6 }, { wch: 10 }, { wch: 20 },
    ]

    const borderStyle = {
      border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
    }
    const headerStyle = {
      font: { bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
    }
    const cellAlign = {
      alignment: { horizontal: 'center', vertical: 'center' },
    }

    const range = XLSX.utils.decode_range(ws['!ref'])
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddr = XLSX.utils.encode_cell({ r: R, c: C })
        if (!ws[cellAddr]) ws[cellAddr] = { v: '' }
        ws[cellAddr].s = R <= 3 ? { ...borderStyle, ...headerStyle } : { ...borderStyle, ...cellAlign }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, '生产单')
    const fileName = `生产单_${materialLabel}_${today}.xlsx`
    XLSX.writeFile(wb, fileName)
    ElMessage.success(`已导出 ${shops.length} 个店铺的生产单`)
  } catch (e) {
    ElMessage.error('导出失败：' + (e.message || '未知错误'))
  }
}

// 导出完整包（生产单 + 效果图 ZIP）
async function exportWithImages(matGroup, selectedItems) {
  try {
    const { default: XLSX } = await import('xlsx-js-style')
    const JSZip = (await import('jszip')).default
    const materialLabel = adTypeLabel(matGroup.material_type)
    const today = new Date().toISOString().slice(0, 10)

    // 如果有选中的项，只导出这些；否则导出全部
    const itemsToExport = selectedItems && selectedItems.length > 0 ? selectedItems : matGroup.items
    const woIds = [...new Set(itemsToExport.map(item => item.work_order_id))]
    if (!woIds.length) {
      ElMessage.warning('没有可导出的工单')
      return
    }

    // 生成 Excel 数据
    const woMap = {}
    const currentMat = matGroup.material_type
    itemsToExport
      .filter(item => item.material_type === currentMat)
      .forEach(item => {
        const key = `${item.work_order_id}_${item.group_index ?? 0}`
        if (!woMap[key]) {
          woMap[key] = {
            work_order_no: item.work_order_no || '',
            title: item.title || '',
            project_type: item.project_type || '',
            address: item.address || '',
            items: [],
          }
        }
        for (const face of item.faces) {
          woMap[key].items.push({
            face_label: face.label || '—',
            material_type: adTypeLabel(item.material_type),
            width: Number(face.width) || 0,
            height: Number(face.height) || 0,
            qty: face.qty || 1,
            area: (Number(face.width) || 0) * (Number(face.height) || 0) / 10000,
          })
        }
      })

    const shops = Object.values(woMap)
    if (!shops.length) {
      ElMessage.warning('没有待生产任务')
      return
    }

    // 构建 Excel 行
    const merges = []
    let dataRow = 4
    const allRows = [
      ['生产单', '', '', '', '', '', '', '', '', '', ''],
      ['材料类型', materialLabel, '', '导出日期', today, '', '', '', '', '', ''],
      ['订单号', '终端', '品项', '点位', '名称', '材质', '规格', '', '', '面积(m²)', '地址'],
      ['', '', '', '', '', '', '长', '宽', '数量', '', ''],
    ]
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } })
    merges.push({ s: { r: 2, c: 6 }, e: { r: 2, c: 8 } })

    shops.forEach(shop => {
      const faceCount = shop.items.length
      const shopStartRow = dataRow
      shop.items.forEach((f, fIdx) => {
        allRows.push([
          shop.work_order_no, shop.title, projectTypeLabel(shop.project_type),
          fIdx + 1, f.face_label, f.material_type,
          f.width.toFixed(2), f.height.toFixed(2), f.qty,
          f.area.toFixed(2), shop.address,
        ])
      })
      if (faceCount > 1) {
        merges.push({ s: { r: shopStartRow, c: 0 }, e: { r: shopStartRow + faceCount - 1, c: 0 } })
        merges.push({ s: { r: shopStartRow, c: 1 }, e: { r: shopStartRow + faceCount - 1, c: 1 } })
        merges.push({ s: { r: shopStartRow, c: 2 }, e: { r: shopStartRow + faceCount - 1, c: 2 } })
        merges.push({ s: { r: shopStartRow, c: 10 }, e: { r: shopStartRow + faceCount - 1, c: 10 } })
      }
      const subtotalRow = dataRow + faceCount
      const subtotalArea = shop.items.reduce((s, f) => s + f.area, 0)
      allRows.push(['', '', '小计', '', '', '', '', '', '', subtotalArea.toFixed(2), ''])
      merges.push({ s: { r: subtotalRow, c: 0 }, e: { r: subtotalRow, c: 4 } })
      dataRow = subtotalRow + 1
    })

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(allRows)
    ws['!merges'] = merges
    ws['!cols'] = [
      { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 6 }, { wch: 18 }, { wch: 22 },
      { wch: 8 }, { wch: 8 }, { wch: 6 }, { wch: 10 }, { wch: 20 },
    ]
    const borderStyle = {
      border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
    }
    const headerStyle = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' } }
    const cellAlign = { alignment: { horizontal: 'center', vertical: 'center' } }
    const range = XLSX.utils.decode_range(ws['!ref'])
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddr = XLSX.utils.encode_cell({ r: R, c: C })
        if (!ws[cellAddr]) ws[cellAddr] = { v: '' }
        ws[cellAddr].s = R <= 3 ? { ...borderStyle, ...headerStyle } : { ...borderStyle, ...cellAlign }
      }
    }
    XLSX.utils.book_append_sheet(wb, ws, '生产单')
    const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })

    // 创建 ZIP
    const zip = new JSZip()
    zip.file('生产单.xlsx', excelBuffer)

    // 从已加载的工单数据中提取设计图 URL（无需额外 API 调用）
    const imageList = [] // { url, fileName }
    const imageUrls = new Set() // 按 URL 去重，防止 face_mapping 和 effect_images 重复
    let noDesignCount = 0

    for (const woId of woIds) {
      const wo = allWorkOrders.value.find(w => String(w.id) === String(woId))
      const woNo = matGroup.items.find(i => String(i.work_order_id) === String(woId))?.work_order_no || `WO-${woId}`
      if (!wo) { noDesignCount++; continue }

      const designs = wo.designs || []
      const approvedDesigns = designs.filter(d => d.status === 'approved')
      if (!approvedDesigns.length) {
        noDesignCount++
        continue
      }

      const design = approvedDesigns[approvedDesigns.length - 1]

      const parseJSON = (v) => {
        if (typeof v === 'string') {
          try { return JSON.parse(v) } catch { return [] }
        }
        return Array.isArray(v) ? v : []
      }

      const faceMapping = parseJSON(design.face_mapping)
      const effectImages = parseJSON(design.effect_images)

      // 优先用 face_mapping（带面名称）
      if (faceMapping.length > 0) {
        faceMapping.forEach((face, idx) => {
          if (face.image_url && !imageUrls.has(face.image_url)) {
            imageUrls.add(face.image_url)
            imageList.push({
              url: face.image_url,
              fileName: `${woNo}_${face.face_label || '面' + (idx + 1)}.jpg`,
            })
          }
        })
      }
      // effect_images 可能与 face_mapping 重复，已存在的跳过
      if (effectImages.length > 0) {
        effectImages.forEach((url, idx) => {
          if (url && !imageUrls.has(url)) {
            imageUrls.add(url)
            const ext = url.split('.').pop()?.split('?')[0] || 'jpg'
            imageList.push({
              url,
              fileName: `${woNo}_效果图${idx + 1}.${ext}`,
            })
          }
        })
      }
    }

    if (noDesignCount > 0) {
      // noDesignCount tracked for user message below
    }

    // 并发下载所有图片
    let downloadedCount = 0
    if (imageList.length > 0) {
      const downloadPromises = imageList.map(async (img) => {
        try {
          const fullUrl = img.url.startsWith('http') ? img.url : `${window.location.origin}${img.url}`
          const response = await fetch(fullUrl)
          if (!response.ok) {
            console.warn(`[导出] 图片下载失败 ${response.status}: ${fullUrl}`)
            return
          }
          const blob = await response.blob()
          if (blob.size > 100) {
            zip.file(`设计图/${img.fileName}`, blob)
            downloadedCount++
          } else {
            console.warn(`[导出] 图片过小: ${img.fileName}`)
          }
        } catch (e) {
          console.warn(`[导出] 图片下载异常: ${e.message}`)
        }
      })

      await Promise.all(downloadPromises)
    }

    // 添加文件清单
    const manifestLines = [
      '生产单 + 设计图导出清单',
      `材料类型: ${materialLabel}`,
      `工单数量: ${woIds.length}`,
      `设计图数量: ${imageList.length}`,
      '',
      '包含的工单:',
      ...shops.map(s => `  ${s.work_order_no} ${s.title}`),
    ]
    zip.file('README.txt', manifestLines.join('\n'))

    if (imageList.length === 0) {
      const detail = noDesignCount > 0 ? `，其中 ${noDesignCount} 个工单无设计数据` : ''
      ElMessage.warning(`未找到设计图（已检查 ${woIds.length} 个工单${detail}）`)
    } else if (downloadedCount === 0) {
      ElMessage.warning(`${imageList.length} 张设计图链接找到，但下载失败（请检查控制台日志）`)
    } else {
      ElMessage.success(`已获取 ${downloadedCount} 张设计图，正在打包...`)
    }

    // 下载 ZIP
    const loadingMsg2 = ElMessage({ message: '正在打包下载...', type: 'info', duration: 0 })
    const content = await zip.generateAsync({ type: 'blob' })
    loadingMsg2.close()

    const url = window.URL.createObjectURL(content)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `生产单_${materialLabel}_${today}.zip`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    // 创建导出记录
    const exportWorkOrders = woIds.map(woId => {
      const item = itemsToExport.find(i => String(i.work_order_id) === String(woId))
      return {
        work_order_id: woId,
        work_order_no: item?.work_order_no || '',
        title: item?.title || '',
      }
    })
    try {
      await api.post('/production/exports', {
        material_type: matGroup.material_type,
        work_orders: exportWorkOrders,
      })
      await loadExportRecords(matGroup.material_type)
    } catch {}

    ElMessage.success('已导出完整包（含生产单 + 设计图）')
  } catch (e) {
    ElMessage.error('导出失败：' + (e.message || '未知错误'))
  }
}

// 材料看板：导出选中项
async function exportSelectedBoardItems(materialType) {
  const set = selectedBoardItems.value[materialType]
  if (!set || set.size === 0) {
    ElMessage.warning('请先勾选要导出的工单')
    return
  }
  const matGroup = boardMaterials.value.find(m => m.material_type === materialType)
  if (!matGroup) return

  const selectedItems = matGroup.items.filter(item => {
    const key = `${item.work_order_id}|||${item.material_type}|||${item.group_index}`
    return set.has(key)
  })
  await exportWithImages(matGroup, selectedItems)
  // 清除选中
  selectedBoardItems.value[materialType] = new Set()
}

async function exportSelectedShops() {
  try {
    const { default: XLSX } = await import('xlsx-js-style')
    if (!selectedShops.value.length) {
      ElMessage.warning('请先选择店铺')
      return
    }

    const today = new Date().toISOString().slice(0, 10)
    const merges = []
    let dataRow = 4

    const rows = [
      ['生产单', '', '', '', '', '', '', '', '', '', ''],
      ['导出日期', today, '', '选中店铺', selectedShops.value.length, '', '', '', '', '', ''],
      ['订单号', '终端', '品项', '点位', '名称', '材质', '规格', '', '', '面积(m²)', '地址'],
      ['', '', '', '', '', '', '长', '宽', '数量', '', ''],
    ]

    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } })
    merges.push({ s: { r: 2, c: 6 }, e: { r: 2, c: 8 } })

    selectedShops.value.forEach(shop => {
      const shopStartRow = dataRow
      let rowIdx = 0

      shop.materials.forEach(mat => {
        mat.faces.forEach(face => {
          rows.push([
            shop.work_order_no,
            shop.title,
            projectTypeLabel(shop.project_type),
            rowIdx + 1,
            face.label || '—',
            adTypeLabel(mat.material_type),
            (Number(face.width) || 0).toFixed(2),
            (Number(face.height) || 0).toFixed(2),
            face.qty || 1,
            ((Number(face.width) || 0) * (Number(face.height) || 0) / 10000).toFixed(2),
            shop.address,
          ])
          rowIdx++
        })
      })

      if (rowIdx > 1) {
        merges.push({ s: { r: shopStartRow, c: 0 }, e: { r: shopStartRow + rowIdx - 1, c: 0 } })
        merges.push({ s: { r: shopStartRow, c: 1 }, e: { r: shopStartRow + rowIdx - 1, c: 1 } })
        merges.push({ s: { r: shopStartRow, c: 2 }, e: { r: shopStartRow + rowIdx - 1, c: 2 } })
        merges.push({ s: { r: shopStartRow, c: 10 }, e: { r: shopStartRow + rowIdx - 1, c: 10 } })
      }

      const subtotalRow = dataRow + rowIdx
      const subtotalArea = shop.materials.reduce((s, m) => s + m.faces.reduce((ss, f) => ss + (Number(f.width) || 0) * (Number(f.height) || 0) / 10000, 0), 0)
      rows.push(['', '', '小计', '', '', '', '', '', '', subtotalArea.toFixed(2), ''])
      merges.push({ s: { r: subtotalRow, c: 0 }, e: { r: subtotalRow, c: 4 } })

      dataRow = subtotalRow + 1
    })

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!merges'] = merges

    ws['!cols'] = [
      { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 6 }, { wch: 18 }, { wch: 22 },
      { wch: 8 }, { wch: 8 }, { wch: 6 }, { wch: 10 }, { wch: 20 },
    ]

    const borderStyle = {
      border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
    }
    const headerStyle = {
      font: { bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
    }
    const cellAlign = {
      alignment: { horizontal: 'center', vertical: 'center' },
    }

    const range = XLSX.utils.decode_range(ws['!ref'])
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddr = XLSX.utils.encode_cell({ r: R, c: C })
        if (!ws[cellAddr]) ws[cellAddr] = { v: '' }
        ws[cellAddr].s = R <= 3 ? { ...borderStyle, ...headerStyle } : { ...borderStyle, ...cellAlign }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, '生产单')
    const fileName = `生产单_选中${selectedShops.value.length}店_${today}.xlsx`
    XLSX.writeFile(wb, fileName)
    ElMessage.success(`已导出 ${selectedShops.value.length} 个店铺`)
  } catch (e) {
    ElMessage.error('导出失败：' + (e.message || '未知错误'))
  }
}

async function exportAllTasks() {
  try {
    const { default: XLSX } = await import('xlsx-js-style')
    const pending = boardMaterials.value
    if (!pending.length) {
      ElMessage.warning('没有待生产任务')
      return
    }

    const today = new Date().toISOString().slice(0, 10)
    const wb = XLSX.utils.book_new()

    let totalShops = 0

    pending.forEach(matGroup => {
      const materialLabel = adTypeLabel(matGroup.material_type) || '未分类'

      const woMap = {}
      const currentMat = matGroup.material_type
      matGroup.items
        .filter(item => item.material_type === currentMat)
        .forEach(item => {
          const key = `${item.work_order_id}_${item.group_index ?? 0}`
          if (!woMap[key]) {
            woMap[key] = {
              work_order_no: item.work_order_no || '',
              title: item.title || '',
              project_type: item.project_type || '',
              address: item.address || '',
              items: [],
            }
          }
          for (const face of item.faces) {
            woMap[key].items.push({
              face_label: face.label || '—',
              material_type: adTypeLabel(item.material_type),
              width: Number(face.width) || 0,
              height: Number(face.height) || 0,
              qty: face.qty || 1,
              area: (Number(face.width) || 0) * (Number(face.height) || 0) / 10000,
            })
          }
        })

      const shops = Object.values(woMap)
      totalShops += shops.length

      const merges = []
      let dataRow = 4

      const sheetRows = [
        ['生产单', '', '', '', '', '', '', '', '', '', ''],
        ['材料类型', materialLabel, '', '导出日期', today, '', '', '', '', '', ''],
        ['订单号', '终端', '品项', '点位', '名称', '材质', '规格', '', '', '面积(m²)', '地址'],
        ['', '', '', '', '', '', '长', '宽', '数量', '', ''],
      ]

      merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } })
      merges.push({ s: { r: 2, c: 6 }, e: { r: 2, c: 8 } })

      shops.forEach(shop => {
        const faceCount = shop.items.length
        const shopStartRow = dataRow

        shop.items.forEach((f, fIdx) => {
          sheetRows.push([
            shop.work_order_no,
            shop.title,
            projectTypeLabel(shop.project_type),
            fIdx + 1,
            f.face_label,
            f.material_type,
            f.width.toFixed(2),
            f.height.toFixed(2),
            f.qty,
            f.area.toFixed(2),
            shop.address,
          ])
        })

        if (faceCount > 1) {
          merges.push({ s: { r: shopStartRow, c: 0 }, e: { r: shopStartRow + faceCount - 1, c: 0 } })
          merges.push({ s: { r: shopStartRow, c: 1 }, e: { r: shopStartRow + faceCount - 1, c: 1 } })
          merges.push({ s: { r: shopStartRow, c: 2 }, e: { r: shopStartRow + faceCount - 1, c: 2 } })
          merges.push({ s: { r: shopStartRow, c: 10 }, e: { r: shopStartRow + faceCount - 1, c: 10 } })
        }

        const subtotalRow = dataRow + faceCount
        const subtotalArea = shop.items.reduce((s, f) => s + f.area, 0)
        sheetRows.push(['', '', '小计', '', '', '', '', '', '', subtotalArea.toFixed(2), ''])
        merges.push({ s: { r: subtotalRow, c: 0 }, e: { r: subtotalRow, c: 4 } })

        dataRow = subtotalRow + 1
      })

      const ws = XLSX.utils.aoa_to_sheet(sheetRows)
      ws['!merges'] = merges

      ws['!cols'] = [
        { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 6 }, { wch: 18 }, { wch: 22 },
        { wch: 8 }, { wch: 8 }, { wch: 6 }, { wch: 10 }, { wch: 20 },
      ]

      const borderStyle = {
        border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
      }
      const headerStyle = {
        font: { bold: true },
        alignment: { horizontal: 'center', vertical: 'center' },
      }
      const cellAlign = {
        alignment: { horizontal: 'center', vertical: 'center' },
      }

      const range = XLSX.utils.decode_range(ws['!ref'])
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddr = XLSX.utils.encode_cell({ r: R, c: C })
          if (!ws[cellAddr]) ws[cellAddr] = { v: '' }
          ws[cellAddr].s = R <= 3 ? { ...borderStyle, ...headerStyle } : { ...borderStyle, ...cellAlign }
        }
      }

      const sheetName = materialLabel.slice(0, 31)
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    })

    const fileName = `生产单_全部_${today}.xlsx`
    XLSX.writeFile(wb, fileName)
    ElMessage.success(`已导出 ${totalShops} 个店铺，按 ${pending.length} 种材料分 Sheet`)
  } catch (e) {
    ElMessage.error('导出失败：' + (e.message || '未知错误'))
  }
}

// ===== 初始化材料看板的选中状态 =====
watch(
  () => boardMaterials.value.map(m => m.material_type),
  () => {
    for (const mat of boardMaterials.value) {
      if (!(mat.material_type in boardSelectAll.value)) {
        boardSelectAll.value[mat.material_type] = false
      }
    }
  },
  { immediate: true }
)

onMounted(() => {
  loadElementOptions()
  loadSettings()
  loadWorkOrders()
  loadBatches()
})
</script>

<style scoped>
.page-header { margin-bottom: var(--space-6); }
.page-actions { display: flex; gap: var(--space-2); }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.mb-16 { margin-bottom: var(--space-4); }
.mb-8 { margin-bottom: var(--space-2); }

.stat-card { text-align: center; padding: 4px 0; }
.stat-value { font-size: 28px; font-weight: 700; }
.stat-label { font-size: 13px; color: var(--color-text-tertiary); margin-top: 4px; }

.filter-bar { display: flex; gap: var(--space-3); align-items: center; flex-wrap: wrap; }

.wo-link { color: var(--color-primary); text-decoration: none; font-weight: 500; }
.wo-link:hover { text-decoration: underline; }

.batch-tag {
  font-family: monospace; font-size: 12px; font-weight: 600;
  color: var(--color-primary); background: #dbeafe;
  padding: 2px 8px; border-radius: 4px; display: inline-block;
}

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

.file-links { display: flex; flex-direction: column; gap: 2px; }
.file-link { font-size: 11px; color: var(--color-primary); text-decoration: none; }
.file-link:hover { text-decoration: underline; }

.text-muted { color: var(--color-text-tertiary); font-size: var(--font-size-xs); }

.face-list { display: flex; flex-direction: column; gap: 2px; }
.face-item { font-size: 12px; color: var(--color-text-secondary); }
.qty-item { color: var(--color-primary); font-weight: 600; margin-top: 4px; display: block; }
.face-inline { display: inline-block; font-size: 12px; color: var(--color-text-secondary); margin-right: 8px; }
.face-inline.qty-item { color: var(--color-primary); font-weight: 600; }

.material-group-header { display: flex; justify-content: space-between; align-items: center; }
.material-title { font-weight: 700; font-size: 15px; color: var(--color-primary); }
.material-count { font-size: 12px; color: var(--color-text-secondary); margin-left: 8px; }
.material-actions { display: flex; gap: 8px; }
.selected-count { font-size: 13px; color: var(--color-primary); font-weight: 600; margin-right: 8px; }

.face-section-title { font-weight: 600; font-size: 14px; color: var(--color-text-primary); margin-bottom: 8px; padding-left: 4px; }

.verify-dialog-content { padding: 0; }
.verify-batch-no { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--el-border-color-lighter); }
.verify-batch-no .label { font-size: 13px; color: var(--color-text-secondary); }
.verify-batch-no .value { font-family: monospace; font-size: 14px; font-weight: 600; color: var(--color-primary); background: #dbeafe; padding: 2px 12px; border-radius: 4px; }
.verify-counter { font-size: 14px; margin-bottom: 8px; color: var(--color-text-secondary); }
.verify-counter strong { color: var(--color-primary); }
.verify-checklist { max-height: 300px; overflow-y: auto; }
.verify-item { padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
.verify-item:last-child { border-bottom: none; }
.verify-item-title { font-size: 13px; }
.verify-item-files { padding-left: 24px; font-size: 12px; color: var(--color-text-secondary); margin-top: 4px; }

.batch-detail-header { display: flex; align-items: center; }
.batch-check-item { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
.batch-check-item:last-child { border-bottom: none; }
.batch-check-info { flex: 1; display: flex; justify-content: space-between; align-items: center; }
.batch-check-wo { font-size: 13px; font-weight: 500; }

.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }

/* 生产任务展开 */
.shop-expand-content { padding: 0 20px 10px; }
.shop-material-group { margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #f3f4f6; }
.shop-material-group:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.shop-material-title { font-weight: 600; font-size: 13px; color: var(--color-primary); margin-bottom: 6px; }
.shop-group-name { font-weight: normal; font-size: 12px; color: var(--color-text-secondary); margin-left: 4px; }
.shop-face-row { display: flex; align-items: center; gap: 16px; padding: 3px 0; font-size: 12px; }
.face-label { color: var(--color-text-primary); min-width: 50px; }
.face-size { color: var(--color-text-secondary); }
.face-area { color: var(--color-text-secondary); }
.material-tag { font-size: 12px; color: var(--color-text-secondary); }

/* 材料看板表格勾选框强制可交互 */
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
