<template>
  <div>
    <div class="page-header flex-between">
      <div>
        <h1 class="page-title">设计管理</h1>
        <p class="page-desc">管理设计稿上传与审核</p>
      </div>
      <el-button @click="fetchData" :icon="Refresh" circle title="刷新" />
    </div>

    <!-- 统计 -->
    <el-row :gutter="16" class="mb-20">
      <el-col :span="8" v-for="stat in statCards" :key="stat.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-body">
            <div class="stat-number" :style="{ color: stat.color }">{{ stat.count }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="待设计" name="designing">
        <el-table :data="designList" stripe v-loading="loading" @row-click="handleRowClick">
          <el-table-column prop="work_order_no" label="工单号" width="160">
            <template #default="{ row }">
              <router-link :to="`/designs/${row.id}`" class="wo-link">{{ row.work_order_no }}</router-link>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="店铺名字" min-width="150" />
          <el-table-column label="测量面积" width="100">
            <template #default="{ row }">{{ calcArea(row) }}㎡</template>
          </el-table-column>
          <el-table-column label="设计师" width="120">
            <template #default="{ row }">
              <span v-if="row.designer" class="designer-tag">{{ row.designer.name }}</span>
              <span v-else class="text-muted">未指派</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click.stop="goDesign(row)">上传设计</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!loading && !designList.length" description="暂无待设计工单" />
      </el-tab-pane>

      <el-tab-pane label="已完成" name="completed">
        <el-table :data="completedList" stripe v-loading="loading">
          <el-table-column prop="work_order_no" label="工单号" width="160">
            <template #default="{ row }">
              <router-link :to="`/designs/${row.id}`" class="wo-link">{{ row.work_order_no }}</router-link>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="店铺名字" min-width="150" />
          <el-table-column label="设计版本" width="100">
            <template #default="{ row }">v{{ row.design_count || 1 }}</template>
          </el-table-column>
          <el-table-column prop="created_at" label="完成时间" width="160" />
        </el-table>
        <el-empty v-if="!loading && !completedList.length" description="暂无已完成设计" />
      </el-tab-pane>
    </el-tabs>

    <!-- 测量数据查看抽屉 -->
    <el-drawer v-model="showMeasureDrawer" title="测量数据参考" size="600px">
      <el-descriptions :column="2" border class="mb-16">
        <el-descriptions-item label="工单号">{{ measureWO.work_order_no }}</el-descriptions-item>
        <el-descriptions-item label="店铺名字">{{ measureWO.title }}</el-descriptions-item>
        <el-descriptions-item label="总面积">{{ measureTotalArea }}㎡</el-descriptions-item>
        <el-descriptions-item label="测量员">{{ measureWO.measurements?.[0]?.measurer?.name || '—' }}</el-descriptions-item>
      </el-descriptions>

      <!-- 各面尺寸可视化 -->
      <div v-if="measureFaces.length">
        <h4 class="section-title">各面尺寸对比</h4>
        <div class="face-grid">
          <div v-for="(face, i) in measureFaces" :key="i" class="face-card">
            <div class="face-title">{{ face.label || (i + 1) + '面' }}</div>
            <div class="face-dims">{{ Number(face.width||0).toFixed(2) }}cm × {{ Number(face.height||0).toFixed(2) }}cm</div>
            <div class="face-area">{{ (face.area || ((face.width * face.height) / 10000) || 0).toFixed(2) }}㎡</div>
            <div class="face-bar">
              <div class="face-bar-fill" :style="{ width: getBarWidth(face) + '%' }"></div>
            </div>
            <div v-if="face.notes" class="face-note">{{ face.notes }}</div>
          </div>
        </div>
      </div>

      <!-- 材料分布 -->
      <div v-if="measureMaterials.length > 1">
        <h4 class="section-title">材料分布</h4>
        <div class="material-bar">
          <div v-for="(mat, i) in measureMaterials" :key="i"
            class="material-segment"
            :style="{ width: getMaterialWidth(mat) + '%', backgroundColor: materialColors[i % materialColors.length] }">
            {{ mat.type }} {{ mat.faces.length }}面
          </div>
        </div>
      </div>

      <!-- 设计版本对比（如果有历史设计） -->
      <div v-if="measureWO.designs?.length > 1">
        <h4 class="section-title">设计版本历史</h4>
        <div class="version-list">
          <div v-for="(d, i) in measureWO.designs" :key="i" class="version-item">
            <span class="version-tag">v{{ i + 1 }}</span>
            <span class="version-date">{{ d.created_at || d.submitted_at || '—' }}</span>
            <el-tag size="small" :type="d.status === 'approved' ? 'success' : d.status === 'rejected' ? 'danger' : 'warning'">
              {{ d.status === 'approved' ? '通过' : d.status === 'rejected' ? '驳回' : '待审' }}
            </el-tag>
            <span class="version-type">{{ d.design_type || '—' }}</span>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import api from '../api'

const router = useRouter()

const activeTab = ref('designing')
const designList = ref([])
const completedList = ref([])
const loading = ref(false)
const submitting = ref(false)

const statCards = reactive([])

// 材料类型映射（后台表单配置的 value → label）
const MATERIAL_TYPE_FALLBACK = {
  spray_cloth: '喷绘布',
  acrylic: '亚克力板',
  aluminum: '铝塑板',
  stainless: '不锈钢',
  led_module: 'LED模组',
  other: '其他',
}

// 动态广告类型映射（从系统设置获取）
const adTypeMap = ref({})

function getMaterialTypes(row) {
  if (!row.measurements?.length) return ''
  const mats = row.measurements[0]?.materials || []
  return mats.map(m => {
    const v = m.type || m.material_type || ''
    return adTypeMap.value[v] || MATERIAL_TYPE_FALLBACK[v] || v || '未分类'
  }).join('、')
}

async function fetchAdTypeMap() {
  try {
    const res = await api.get('/tenant/settings/material-type-map')
    adTypeMap.value = res.data?.material_type_map || {}
  } catch {
    adTypeMap.value = {}
  }
}

function calcArea(row) {
  if (!row.measurements?.length) return '0.00'
  const mats = row.measurements[0]?.materials
  if (!mats) return '0.00'
  const materials = typeof mats === 'string' ? JSON.parse(mats) : mats
  if (!Array.isArray(materials)) return '0.00'
  let total = 0
  for (const mat of materials) {
    for (const face of (mat.faces || [])) {
      const w = Number(face.width) || 0
      const h = Number(face.height) || 0
      const storedArea = Number(face.area) || 0
      if (w > 0 && h > 0) {
        const rawProduct = w * h
        if (storedArea > 0) {
          const ratio = storedArea / rawProduct
          total += ratio < 0.001 ? storedArea : storedArea / 10000
        } else {
          total += rawProduct / 10000
        }
      }
    }
  }
  return total.toFixed(2)
}

async function fetchData() {
  loading.value = true
  try {
    const res = await api.get('/designs/tasks')
    const allDesigns = res.data || []
    designList.value = allDesigns.filter(w => w.current_stage === 'design')
  } catch {
    designList.value = []
  }
  // 已完成：查已进入生产及之后的工单
  try {
    const stages = ['production', 'construction', 'finance', 'archive', 'aftersale']
    const completedResults = await Promise.all(
      stages.map(stage => api.get('/work-orders', { params: { stage } }))
    )
    completedList.value = completedResults.flatMap(r => r.data?.list || r.data || [])
  } catch {
    completedList.value = []
  }
  // 统计
  statCards.length = 0
  statCards.push(
    { label: '待设计', count: designList.value.length, color: '#e6a23c' },
    { label: '已完成', count: completedList.value.length, color: '#67c23a' },
    { label: '总设计次数', count: completedList.value.reduce((s, r) => s + (r.design_count || 0), 0), color: '#9333ea' },
  )
  loading.value = false
}

function goDesign(row) {
  router.push(`/designs/${row.id}`)
}

onMounted(() => {
  fetchAdTypeMap()
  fetchData()
})

// 测量数据可视化
const showMeasureDrawer = ref(false)
const measureWO = reactive({ id: '', work_order_no: '', title: '', designs: [], measurements: [] })
const measureFaces = ref([])
const measureMaterials = ref([])

const measureTotalArea = computed(() => {
  return measureFaces.value.reduce((s, f) => s + (f.area || ((f.width * f.height) / 10000) || 0), 0).toFixed(2)
})

const materialColors = ['#2563eb', '#16a34a', '#ea580c', '#9333ea', '#dc2626', '#0891b2']

function handleRowClick(row) {
  openMeasureView(row)
}

function openMeasureView(row) {
  if (!row.measurements?.length) return
  Object.assign(measureWO, {
    id: row.id, work_order_no: row.work_order_no, title: row.title,
    designs: row.designs || [], measurements: row.measurements
  })
  // 收集所有面
  const allFaces = []
  const allMats = []
  for (const m of (row.measurements[0]?.materials || [])) {
    allMats.push(m)
    for (const f of (m.faces || [])) {
      allFaces.push({ ...f, materialType: m.type })
    }
  }
  measureFaces.value = allFaces
  measureMaterials.value = allMats
  showMeasureDrawer.value = true
}

function getBarWidth(face) {
  const maxArea = Math.max(...measureFaces.value.map(f => f.area || ((f.width * f.height) / 10000) || 0), 1)
  return ((face.area || ((face.width * face.height) / 10000) || 0) / maxArea * 100).toFixed(0)
}

function getMaterialWidth(mat) {
  const totalFaces = measureMaterials.value.reduce((s, m) => s + m.faces.length, 0) || 1
  return (mat.faces.length / totalFaces * 100).toFixed(0)
}
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.page-header { margin-bottom: var(--space-6); }
.page-desc { color: var(--color-text-tertiary); font-size: var(--font-size-sm); margin-top: var(--space-1); }
.mb-16 { margin-bottom: var(--space-4); }
.mb-20 { margin-bottom: var(--space-5); }
.mt-4 { margin-top: var(--space-1); }
.ml-8 { margin-left: var(--space-2); }
.stat-card .stat-body { text-align: center; padding: var(--space-2) 0; }
.stat-number { font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); }
.stat-label { color: var(--color-text-tertiary); font-size: var(--font-size-sm); margin-top: var(--space-1); }
.text-muted { color: var(--color-text-tertiary); font-size: var(--font-size-xs); }
.designer-tag { display: inline-block; background: #eff6ff; color: #2563eb; padding: 2px 10px; border-radius: 12px; font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); }
.wo-link { color: var(--color-primary); text-decoration: none; }
.wo-link:hover { text-decoration: underline; }
.section-title { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); margin: 16px 0 12px; }
.face-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.face-card { background: var(--color-bg-page); border: 1px solid var(--color-border-light); border-radius: var(--radius-sm); padding: 12px; }
.face-title { font-weight: var(--font-weight-medium); font-size: var(--font-size-sm); margin-bottom: 4px; }
.face-dims { font-size: var(--font-size-xs); color: var(--color-text-tertiary); }
.face-area { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); color: var(--color-primary); margin: 4px 0; }
.face-bar { height: 6px; background: var(--color-border-light); border-radius: 3px; overflow: hidden; }
.face-bar-fill { height: 100%; background: var(--color-primary); border-radius: 3px; transition: width 0.3s; }
.face-note { font-size: var(--font-size-xs); color: var(--color-text-tertiary); margin-top: 4px; }
.material-bar { display: flex; height: 32px; border-radius: var(--radius-sm); overflow: hidden; margin-bottom: 8px; }
.material-segment { display: flex; align-items: center; justify-content: center; color: #fff; font-size: var(--font-size-xs); font-weight: var(--font-weight-medium); min-width: 60px; }
.version-list { display: flex; flex-direction: column; gap: 8px; }
.version-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--color-bg-page); border-radius: var(--radius-sm); font-size: var(--font-size-sm); }
.version-tag { font-weight: var(--font-weight-semibold); color: var(--color-primary); }
.version-date { color: var(--color-text-tertiary); }
.version-type { margin-left: auto; color: var(--color-text-secondary); }
</style>
