<template>
  <div class="production-view">
    <div class="page-header flex-between">
      <div class="page-header-left">
        <el-button link @click="$router.push('/production')">
          <el-icon><Back /></el-icon> 返回生产
        </el-button>
        <h1 class="page-title">
          {{ adTypeLabel(materialType) }} — 生产清单
        </h1>
      </div>
      <div class="page-actions">
        <el-button type="primary" @click="window.print()">
          <el-icon><Printer /></el-icon>打印清单
        </el-button>
      </div>
    </div>

    <!-- 统计栏 -->
    <div v-loading="loading" class="stats-bar">
      <el-statistic title="总数" :value="stats.total" />
      <el-statistic title="待生产" :value="stats.pending" />
      <el-statistic title="排版中" :value="stats.typesetting" />
      <el-statistic title="已完成" :value="stats.completed" />
    </div>

    <!-- 筛选 -->
    <div class="filter-bar">
      <el-radio-group v-model="filterStatus" size="small">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="pending">待生产</el-radio-button>
        <el-radio-button value="typesetting">排版中</el-radio-button>
        <el-radio-button value="completed">已完成</el-radio-button>
      </el-radio-group>
      <span class="counter">共 {{ filteredItems.length }} 项</span>
    </div>

    <!-- 生产清单列表 -->
    <div v-if="filteredItems.length" class="item-list">
      <div
        v-for="(item, idx) in filteredItems"
        :key="`${item.work_order_id}_${item.face_label}_${item.group_name}`"
        class="production-item"
        :class="{ 'is-completed': item.production_status === 'completed' }"
      >
        <!-- 序号 -->
        <div class="item-index">{{ idx + 1 }}</div>

        <!-- 设计图 -->
        <div class="item-image">
          <el-image
            v-if="item.effect_images?.length"
            :src="item.effect_images[0]"
            fit="cover"
            class="design-thumb"
            :preview-src-list="item.effect_images"
            :initial-index="0"
          >
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
                <span>加载失败</span>
              </div>
            </template>
          </el-image>
          <div v-else class="image-placeholder">
            <el-icon><Picture /></el-icon>
            <span>无设计图</span>
          </div>
        </div>

        <!-- 信息 -->
        <div class="item-info">
          <div class="info-row">
            <span class="label">工单号</span>
            <span class="value">{{ item.work_order_no }}</span>
          </div>
          <div class="info-row">
            <span class="label">店铺/名称</span>
            <span class="value">{{ item.title }}</span>
          </div>
          <div class="info-row" v-if="item.group_name">
            <span class="label">分组</span>
            <span class="value">{{ item.group_name }}</span>
          </div>
          <div class="info-row">
            <span class="label">面别</span>
            <span class="value">{{ item.face_label }}</span>
            <span v-if="item.is_unified" class="unified-tag">一体面</span>
          </div>
          <div class="info-row">
            <span class="label">尺寸</span>
            <span class="value">{{ item.height ? `${Number(item.width).toFixed(1)}m × ${Number(item.height).toFixed(1)}m` : `${Number(item.width).toFixed(1)}m` }}</span>
          </div>
          <div class="info-row">
            <span class="label">面积</span>
            <span class="value">{{ Number(item.area).toFixed(2) }} m²</span>
          </div>
          <div class="info-row">
            <span class="label">数量</span>
            <span class="value value-qty">{{ item.qty }}</span>
          </div>
          <div class="info-row" v-if="item.source_files?.length">
            <span class="label">源文件</span>
            <el-link
              v-for="(f, fi) in item.source_files"
              :key="fi"
              :href="f"
              target="_blank"
              type="primary"
              :underline="false"
              class="file-link"
            >
              <el-icon><Document /></el-icon> 文件{{ fi + 1 }}
            </el-link>
          </div>
        </div>

        <!-- 状态 -->
        <div class="item-status">
          <el-tag
            size="small"
            :type="statusType(item.production_status)"
            effect="plain"
          >
            {{ statusLabel(item.production_status) }}
          </el-tag>
        </div>
      </div>
    </div>

    <el-card v-else-if="!loading">
      <el-empty description="暂无匹配的生产项" :image-size="80" />
    </el-card>

    <!-- 底部汇总 -->
    <div v-if="filteredItems.length" class="summary-footer">
      <div class="summary-item">
        <span class="summary-label">合计面积</span>
        <span class="summary-value">{{ totalArea.toFixed(2) }} m²</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">合计数量</span>
        <span class="summary-value">{{ totalQty }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Back, Printer, Picture, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const route = useRoute()
const materialType = route.params.materialType
const loading = ref(false)
const items = ref([])
const filterStatus = ref('all')
const stats = ref({ total: 0, pending: 0, typesetting: 0, completed: 0 })

const adTypeLabel = (key) => {
  const map = {
    '软膜灯箱': '软膜灯箱',
    '卡布灯箱': '卡布灯箱',
    '吸塑字': '吸塑字',
    '发光字': '发光字',
    '不锈钢字': '不锈钢字',
    '喷绘': '喷绘',
    '写真': '写真',
    '展架': '展架',
    '未分类': '其他材料',
  }
  return map[key] || key
}

const filteredItems = computed(() => {
  if (filterStatus.value === 'all') return items.value
  return items.value.filter(i => i.production_status === filterStatus.value)
})

const totalArea = computed(() => filteredItems.value.reduce((s, i) => s + (Number(i.area) || 0), 0))
const totalQty = computed(() => filteredItems.value.reduce((s, i) => s + (Number(i.qty) || 0), 0))

function statusType(status) {
  return { pending: 'info', typesetting: 'warning', completed: 'success' }[status] || 'info'
}

function statusLabel(status) {
  return { pending: '待生产', typesetting: '排版中', completed: '已完成' }[status] || status
}

async function loadData() {
  loading.value = true
  try {
    const res = await api.get(`/production/view/${materialType}`)
    const data = res.data || {}
    items.value = data.items || []
    stats.value = {
      total: data.total || 0,
      pending: data.pending || 0,
      typesetting: data.typesetting || 0,
      completed: data.completed || 0,
    }
  } catch {
    ElMessage.error('加载生产清单失败')
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.production-view {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.stats-bar {
  display: flex;
  gap: 32px;
  padding: 16px;
  margin-bottom: 12px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.counter {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 生产项卡片 */
.item-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.production-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  align-items: flex-start;
  transition: box-shadow 0.2s;
}

.production-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.production-item.is-completed {
  opacity: 0.6;
  background: #f9fafb;
}

.item-index {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.is-completed .item-index {
  background: var(--color-success);
}

/* 设计图缩略图 */
.item-image {
  width: 120px;
  height: 90px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid #e5e7eb;
}

.design-thumb {
  width: 100%;
  height: 100%;
}

.image-error,
.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 11px;
  gap: 4px;
}

/* 信息区域 */
.item-info {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px 20px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.info-row .label {
  color: #6b7280;
  white-space: nowrap;
  min-width: 56px;
}

.info-row .value {
  color: var(--color-text-primary);
}

.value-qty {
  font-weight: 600;
  font-size: 16px;
  color: var(--color-primary);
}

.unified-tag {
  font-size: 11px;
  padding: 1px 6px;
  background: #fef3c7;
  color: #d97706;
  border-radius: 4px;
}

.file-link {
  font-size: 12px;
}

.item-status {
  flex-shrink: 0;
  padding-top: 4px;
}

/* 底部汇总 */
.summary-footer {
  display: flex;
  gap: 32px;
  padding: 16px;
  margin-top: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.summary-label {
  font-size: 13px;
  color: #6b7280;
  margin-right: 8px;
}

.summary-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

/* 打印样式 */
@media print {
  .page-actions,
  .filter-bar {
    display: none !important;
  }

  .production-view {
    max-width: none;
  }

  .page-header-left .el-button {
    display: none !important;
  }

  .production-item {
    break-inside: avoid;
    page-break-inside: avoid;
    border: 1px solid #ccc;
    box-shadow: none;
  }

  .production-item.is-completed {
    opacity: 1;
  }

  .stats-bar {
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 8px;
  }
}
</style>
