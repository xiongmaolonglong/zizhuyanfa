<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">数据看板</h1>
      <p class="page-desc">实时掌握工单进度与业务状况</p>
    </div>

    <!-- Stats Cards -->
    <el-row :gutter="16" class="stats-row">
      <el-col :xs="12" :sm="8" :md="4" v-for="stat in stats" :key="stat.label">
        <el-card shadow="hover" class="stat-card clickable-card" :class="stat.colorClass"
          @click="handleCardClick(stat)">
          <div class="stat-icon">
            <el-icon :size="24"><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value">{{ stat.value }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Alert -->
    <el-alert v-if="timeoutList.length" :title="`${timeoutList.length} 条工单超时`" type="warning"
      :description="timeoutDesc" show-icon closable class="timeout-alert">
      <template #default>
        <el-button size="small" type="primary" @click="$router.push('/work-orders')">立即处理</el-button>
      </template>
    </el-alert>

    <!-- 月度对比 -->
    <el-row :gutter="20" class="mb-20">
      <el-col :span="8" v-for="m in monthStats" :key="m.label">
        <el-card shadow="hover">
          <div class="month-stat">
            <div class="month-label">{{ m.label }}</div>
            <div class="month-value" :style="{ color: m.color }">{{ m.value }}</div>
            <div class="month-sub">{{ m.sub }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Chart + Recent -->
    <el-row :gutter="20">
      <el-col :xs="24" :md="16">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>近 7 天工单趋势</span>
            </div>
          </template>
          <div ref="chartEl" class="chart-container" v-if="trendData.new.some(v => v > 0) || trendData.completed.some(v => v > 0)"></div>
          <el-empty v-else description="暂无趋势数据" :image-size="80" />
        </el-card>
      </el-col>
      <el-col :xs="24" :md="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>超时预警</span>
              <el-tag type="danger" size="small" effect="plain">{{ timeoutList.length }}</el-tag>
            </div>
          </template>
          <div v-if="timeoutList.length" class="timeout-list">
            <div v-for="item in timeoutList" :key="item.id" class="timeout-item">
              <router-link :to="`/work-orders/${item.id}`" class="wo-link">{{ item.work_order_no }}</router-link>
              <div class="timeout-item-desc">
                <span class="text-muted">{{ item.title }}</span>
                <el-tag size="small" type="warning" effect="plain">{{ item.stage }}</el-tag>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无超时工单" :image-size="80" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 各环节工单数 + 状态分布 -->
    <el-row :gutter="20" class="mb-20">
      <el-col :xs="24" :md="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header"><span>各环节工单数</span></div>
          </template>
          <div ref="barChartEl" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header"><span>状态分布</span></div>
          </template>
          <div ref="pieChartEl" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import { logger } from '../utils/logger'
import { STAGE_MAP } from '../utils/format'
import {
  Document, Position, Timer, Picture, Box, Tools
} from '@element-plus/icons-vue'

const router = useRouter()

// 图标组件需要用 markRaw 包裹，避免 Vue 将其转为响应式
const ICON_MAP = {
  Document: markRaw(Document),
  Position: markRaw(Position),
  Timer: markRaw(Timer),
  Picture: markRaw(Picture),
  Box: markRaw(Box),
  Tools: markRaw(Tools),
}

const stats = ref([
  { label: '申报待接收', value: 0, icon: ICON_MAP.Document, colorClass: 'color-blue', stage: 'declaration' },
  { label: '待派单', value: 0, icon: ICON_MAP.Position, colorClass: 'color-orange', stage: 'assignment' },
  { label: '测量中', value: 0, icon: ICON_MAP.Timer, colorClass: 'color-cyan', stage: 'measurement' },
  { label: '设计中', value: 0, icon: ICON_MAP.Picture, colorClass: 'color-purple', stage: 'design' },
  { label: '待施工', value: 0, icon: ICON_MAP.Box, colorClass: 'color-green', stage: 'production' },
  { label: '待结算', value: 0, icon: ICON_MAP.Tools, colorClass: 'color-pink', stage: 'construction' }
])
const timeoutList = ref([])
const trendData = ref({ new: [], completed: [] })
const trendDates = ref([])
const chartEl = ref(null)
const barChartEl = ref(null)
const pieChartEl = ref(null)
let chartInstance = null
let barInstance = null
let pieInstance = null

const statusLabels = {
  draft: '草稿', submitted: '已提交', assigned: '已派单', measuring: '测量中',
  measured: '已测量', designing: '设计中', producing: '生产中', constructing: '施工中',
  completed: '已完成', quoting: '报价中', archived: '已归档'
}
const rawStats = ref({ by_stage: {}, by_status: {} })
let echarts = null

async function ensureEcharts() {
  if (!echarts) {
    const { use } = await import('echarts')
    const echartsCore = await import('echarts/core')
    const { CanvasRenderer } = await import('echarts/renderers')
    const { TitleComponent, TooltipComponent, LegendComponent, GridComponent } = await import('echarts/components')
    const { LineChart, BarChart, PieChart } = await import('echarts/charts')
    use([CanvasRenderer, TitleComponent, TooltipComponent, LegendComponent, GridComponent, LineChart, BarChart, PieChart])
    echarts = echartsCore.default || echartsCore
  }
  return echarts
}

const monthStats = ref([
  { label: '本月新建', value: 0, sub: '', color: '#2563eb' },
  { label: '本月完成', value: 0, sub: '', color: '#16a34a' },
  { label: '上月对比', value: 0, sub: '', color: '#6b7280' },
])

// 趋势数据
const trendApiData = ref(null)

const timeoutDesc = computed(() => {
  return timeoutList.value.map(t => `${t.work_order_no}（${t.current_stage}超时）`).join('、')
})

function handleCardClick(stat) {
  router.push(`/work-orders?stage=${stat.stage}`)
}

async function renderChart() {
  if (!chartEl.value) return
  const ec = await ensureEcharts()
  if (!chartInstance) {
    chartInstance = ec.init(chartEl.value)
    window.addEventListener('resize', () => chartInstance?.resize())
  }
  chartInstance.setOption({
    tooltip: { trigger: 'axis', backgroundColor: '#fff', borderColor: '#e5e7eb', textStyle: { color: '#111827' } },
    legend: { data: ['新建', '完成'], bottom: 0, textStyle: { fontSize: 12 } },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category', data: trendDates.value,
      axisTick: { alignWithLabel: true },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
      axisLabel: { color: '#6b7280', fontSize: 11 }
    },
    series: [
      {
        name: '新建', type: 'line', smooth: true, showSymbol: false,
        data: trendData.value.new,
        lineStyle: { width: 2.5, color: '#2563eb' },
        itemStyle: { color: '#2563eb' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(37,99,235,0.12)' }, { offset: 1, color: 'rgba(37,99,235,0)' }] } }
      },
      {
        name: '完成', type: 'line', smooth: true, showSymbol: false,
        data: trendData.value.completed,
        lineStyle: { width: 2.5, color: '#16a34a' },
        itemStyle: { color: '#16a34a' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(22,163,74,0.1)' }, { offset: 1, color: 'rgba(22,163,74,0)' }] } }
      },
    ],
  })
}

async function renderBarChart() {
  if (!barChartEl.value) return
  const ec = await ensureEcharts()
  if (!barInstance) {
    barInstance = ec.init(barChartEl.value)
    window.addEventListener('resize', () => barInstance?.resize())
  }
  const byStage = rawStats.value.by_stage || {}
  const keys = Object.keys(byStage)
  barInstance.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
    xAxis: { type: 'category', data: keys.map(k => STAGE_MAP[k] || k), axisLabel: { color: '#6b7280', fontSize: 11 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } }, axisLabel: { color: '#6b7280', fontSize: 11 } },
    series: [{ type: 'bar', data: Object.values(byStage), itemStyle: { color: '#2563eb', borderRadius: [4, 4, 0, 0] } }],
  })
}

async function renderPieChart() {
  if (!pieChartEl.value) return
  const ec = await ensureEcharts()
  if (!pieInstance) {
    pieInstance = ec.init(pieChartEl.value)
    window.addEventListener('resize', () => pieInstance?.resize())
  }
  const byStatus = rawStats.value.by_status || {}
  pieInstance.setOption({
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      data: Object.entries(byStatus).map(([key, value]) => ({ name: statusLabels[key] || key, value })),
      label: { color: '#6b7280', fontSize: 12 },
    }],
  })
}

onMounted(() => {
  // 异步加载数据，不阻塞页面渲染
  loadData()
})

async function loadData() {
  try {
    const res = await api.get('/work-orders/stats')
    const data = res.data || {}
    const stageCount = data.by_stage || {}
    const statConfigs = [
      { label: '申报待接收', key: 'declaration', icon: ICON_MAP.Document, colorClass: 'color-blue' },
      { label: '待派单', key: 'assignment', icon: ICON_MAP.Position, colorClass: 'color-orange' },
      { label: '测量中', key: 'measurement', icon: ICON_MAP.Timer, colorClass: 'color-cyan' },
      { label: '设计中', key: 'design', icon: ICON_MAP.Picture, colorClass: 'color-purple' },
      { label: '待施工', key: 'production', icon: ICON_MAP.Box, colorClass: 'color-green' },
      { label: '待结算', key: 'construction', icon: ICON_MAP.Tools, colorClass: 'color-pink' }
    ]
    stats.value = statConfigs.map(cfg => ({
      label: cfg.label,
      value: stageCount[cfg.key] || 0,
      icon: cfg.icon,
      colorClass: cfg.colorClass,
      stage: cfg.key
    }))
    timeoutList.value = data.timeout_orders || []
    rawStats.value = { by_stage: data.by_stage || {}, by_status: data.by_status || {} }

    // 月度统计（需要后端提供真实数据，暂时显示 0）
    const total = data.total || 0
    const thisMonthNew = 0
    const thisMonthDone = 0
    monthStats.value = [
      { label: '本月新建', value: thisMonthNew, sub: `累计工单 ${total} 个`, color: '#2563eb' },
      { label: '本月完成', value: thisMonthDone, sub: '已归档/验收', color: '#16a34a' },
      { label: '上月对比', value: data.timeout_count || 0, sub: '超时工单', color: '#ea580c' },
    ]

    // 获取 7 日趋势数据
    const today = new Date()
    const dates = []
    const newCounts = []
    const completedCounts = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      dates.push(`${d.getMonth() + 1}/${d.getDate()}`)
      newCounts.push(0)
      completedCounts.push(0)
    }

    const trendRes = await api.get('/work-orders/trend', { params: { days: 7 } }).catch(() => null)
    if (trendRes?.data && Array.isArray(trendRes.data)) {
      trendApiData.value = trendRes.data
      // 使用真实数据覆盖
      const dateKeys = dates.map((_, i) => {
        const d = new Date(today)
        d.setDate(d.getDate() - (6 - i))
        return d.toISOString().split('T')[0]
      })
      for (const item of trendRes.data) {
        const idx = dateKeys.indexOf(item.date)
        if (idx !== -1) {
          newCounts[idx] = item.new_count || 0
          completedCounts[idx] = item.completed_count || 0
        }
      }
    }

    trendDates.value = dates
    trendData.value = { new: newCounts, completed: completedCounts }
  } catch {
    timeoutList.value = []
  }

  await nextTick()
  renderChart()
  renderBarChart()
  renderPieChart()
}
</script>

<style scoped>
.page-header { margin-bottom: var(--space-6); }

.stats-row { margin-bottom: var(--space-5); }
.mb-20 { margin-bottom: var(--space-5); }

.stat-card {
  cursor: pointer;
  border: 1px solid var(--color-border-light);
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-base);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.color-blue .stat-icon { background: var(--color-primary-bg); color: var(--color-primary); }
.color-orange .stat-icon { background: var(--color-warning-bg); color: var(--color-warning); }
.color-cyan .stat-icon { background: #ecfeff; color: #0891b2; }
.color-purple .stat-icon { background: #faf5ff; color: #9333ea; }
.color-green .stat-icon { background: var(--color-success-bg); color: var(--color-success); }
.color-pink .stat-icon { background: #fdf2f8; color: #db2777; }

.stat-info { flex: 1; min-width: 0; }
.stat-label { color: var(--color-text-tertiary); font-size: var(--font-size-xs); margin-bottom: var(--space-1); }
.stat-value { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); line-height: 1.2; }

.month-stat { text-align: center; padding: var(--space-2) 0; }
.month-label { color: var(--color-text-tertiary); font-size: var(--font-size-xs); margin-bottom: var(--space-1); }
.month-value { font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); }
.month-sub { color: var(--color-text-tertiary); font-size: var(--font-size-xs); margin-top: var(--space-1); }

.timeout-alert {
  margin-bottom: var(--space-5);
  border-radius: var(--radius-base);
}

.chart-card :deep(.el-card__body) { padding-bottom: var(--space-4); }
.chart-container { height: 280px; }

.card-header { display: flex; justify-content: space-between; align-items: center; }

.timeout-list { max-height: 280px; overflow-y: auto; }
.timeout-item { padding: var(--space-3) 0; border-bottom: 1px solid var(--color-border-light); }
.timeout-item:last-child { border-bottom: none; }
.timeout-item-desc { display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-1); }

.text-muted { color: var(--color-text-tertiary); font-size: var(--font-size-xs); }

@media (max-width: 768px) {
  .stat-card :deep(.el-card__body) { padding: var(--space-3); }
  .stat-icon { width: 40px; height: 40px; }
  .stat-value { font-size: var(--font-size-lg); }
}
</style>
