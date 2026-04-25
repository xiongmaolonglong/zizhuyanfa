<template>
  <div>
    <h1 class="page-title">全局工作台</h1>

    <div class="stat-grid">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-value">{{ dashboard.total_tenants || 0 }}</div>
        <div class="stat-label">租户数</div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-value primary">{{ dashboard.total_orders || 0 }}</div>
        <div class="stat-label">工单总量</div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-value warning">{{ dashboard.active_clients || 0 }}</div>
        <div class="stat-label">活跃甲方</div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-value success">{{ dashboard.active_tenants || 0 }}</div>
        <div class="stat-label">活跃租户</div>
      </el-card>
    </div>

    <el-row :gutter="16" class="mt-16">
      <el-col :span="14">
        <el-card>
          <template #header><span>工单趋势（近 30 天）</span></template>
          <div ref="lineChartRef" class="chart" />
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header><span>租户工单 TOP 10</span></template>
          <div ref="barChartRef" class="chart" />
        </el-card>
      </el-col>
    </el-row>

    <el-card class="mt-16">
      <template #header><span>最近活跃的租户</span></template>
      <el-table :data="activeTenants" stripe v-loading="loading">
        <el-table-column prop="name" label="租户名称" min-width="200" />
        <el-table-column prop="contact_phone" label="联系电话" width="140" />
        <el-table-column label="工单数" width="100" align="center">
          <template #default="{ row }">{{ row.stats?.order_count || 0 }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '正常' : '已暂停' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <router-link :to="`/tenants/${row.id}`" class="link">查看</router-link>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getDashboard, getDashboardTrend, getTenantList } from '../api/tenants'

const lineChartRef = ref()
const barChartRef = ref()
let lineChart, barChart, echarts

const loading = ref(true)
const dashboard = ref({})
const activeTenants = ref([])

function initCharts(trendData, topAdvertisers) {
  lineChart = echarts.init(lineChartRef.value)
  const days = trendData?.map(d => d.date) || []
  const created = trendData?.map(d => d.created) || []
  const completed = trendData?.map(d => d.completed) || []

  lineChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['新建', '完成'], bottom: 0 },
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: { type: 'category', data: days, axisLabel: { fontSize: 11, rotate: 30 } },
    yAxis: { type: 'value' },
    series: [
      {
        name: '新建', type: 'line', data: created, smooth: true,
        areaStyle: { color: 'rgba(114,46,209,0.15)' },
        lineStyle: { color: '#722ed1' }, itemStyle: { color: '#722ed1' }
      },
      {
        name: '完成', type: 'line', data: completed, smooth: true,
        areaStyle: { color: 'rgba(103,194,58,0.15)' },
        lineStyle: { color: '#67c23a' }, itemStyle: { color: '#67c23a' }
      }
    ]
  })

  barChart = echarts.init(barChartRef.value)
  const names = topAdvertisers?.map(t => t.name) || []
  const counts = topAdvertisers?.map(t => t.order_count) || []

  barChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 100, right: 30, top: 10, bottom: 30 },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: names, axisLabel: { fontSize: 11 } },
    series: [{
      type: 'bar', data: counts,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#722ed1' },
          { offset: 1, color: '#b37feb' }
        ]),
        borderRadius: [0, 4, 4, 0]
      },
      barWidth: 16
    }]
  })
}

onMounted(async () => {
  try {
    const [dashRes, trendRes, tenantRes, echartsMod] = await Promise.all([
      getDashboard(),
      getDashboardTrend('day'),
      getTenantList({ limit: 10 }),
      import('echarts'),
    ])
    echarts = echartsMod.default || echartsMod
    dashboard.value = dashRes.data || {}
    activeTenants.value = (tenantRes.data?.list || tenantRes.data || []).slice(0, 5)

    const trendData = trendRes.data?.trend || []
    const topAdvertisers = dashRes.data?.top_advertisers || []

    setTimeout(() => initCharts(trendData, topAdvertisers), 100)
  } catch (err) {
    console.error('Dashboard load error:', err)
  } finally {
    loading.value = false
  }

  window.addEventListener('resize', () => {
    lineChart?.resize()
    barChart?.resize()
  })
})

onUnmounted(() => {
  lineChart?.dispose()
  barChart?.dispose()
})
</script>

<style scoped>
.page-title { font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 20px; }
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-card { text-align: center; padding: 20px 0; }
.stat-value { font-size: 32px; font-weight: 700; color: #1a1a1a; }
.stat-value.primary { color: #722ed1; }
.stat-value.warning { color: #e6a23c; }
.stat-value.success { color: #67c23a; }
.stat-label { margin-top: 4px; color: #8c8c8c; font-size: 14px; }
.mt-16 { margin-top: 16px; }
.chart { width: 100%; height: 300px; }
.link { color: #722ed1; text-decoration: none; }
</style>
