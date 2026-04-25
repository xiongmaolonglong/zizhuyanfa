<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">派单管理</h1>
      <p class="page-desc">统一管理测量、设计、安装三种派单</p>
    </div>

    <!-- 顶部汇总统计卡片 -->
    <el-row :gutter="16" class="summary-cards">
      <el-col :span="8">
        <el-card
          shadow="hover"
          class="summary-card"
          :class="{ active: activeTab === 'measure' }"
          @click="switchTab('measure')"
        >
          <div class="summary-body">
            <div class="summary-icon measure">📏</div>
            <div class="summary-info">
              <div class="summary-count">{{ measureCount }}</div>
              <div class="summary-label">测量待派单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card
          shadow="hover"
          class="summary-card"
          :class="{ active: activeTab === 'design' }"
          @click="switchTab('design')"
        >
          <div class="summary-body">
            <div class="summary-icon design">🎨</div>
            <div class="summary-info">
              <div class="summary-count">{{ designCount }}</div>
              <div class="summary-label">设计待派单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card
          shadow="hover"
          class="summary-card"
          :class="{ active: activeTab === 'install' }"
          @click="switchTab('install')"
        >
          <div class="summary-body">
            <div class="summary-icon install">🔧</div>
            <div class="summary-info">
              <div class="summary-count">{{ installCount }}</div>
              <div class="summary-label">安装待派单</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" class="dispatch-tabs" @tab-change="handleTabChange">
      <el-tab-pane name="measure">
        <template #label>
          <span class="tab-label">
            测量派单
            <el-badge :value="measureCount" :hidden="measureCount === 0" type="warning" />
          </span>
        </template>
        <DispatchPanel
          type="measure"
          :pending-list="pendingList"
          :staff-list="staffList"
          :loading="loading"
          @refresh="fetchAllCounts"
        />
      </el-tab-pane>
      <el-tab-pane name="design">
        <template #label>
          <span class="tab-label">
            设计派单
            <el-badge :value="designCount" :hidden="designCount === 0" type="warning" />
          </span>
        </template>
        <DispatchPanel
          type="design"
          :pending-list="pendingList"
          :staff-list="staffList"
          :loading="loading"
          @refresh="fetchAllCounts"
        />
      </el-tab-pane>
      <el-tab-pane name="install">
        <template #label>
          <span class="tab-label">
            安装派单
            <el-badge :value="installCount" :hidden="installCount === 0" type="warning" />
          </span>
        </template>
        <DispatchPanel
          type="install"
          :pending-list="pendingList"
          :staff-list="staffList"
          :loading="loading"
          @refresh="fetchAllCounts"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'
import DispatchPanel from '../components/DispatchPanel.vue'

const activeTab = ref('measure')
const loading = ref(false)
const pendingList = ref([])
const staffList = ref([])

// 三种类型的待派单数量
const measureCount = ref(0)
const designCount = ref(0)
const installCount = ref(0)

// 获取所有类型的待派单数量
async function fetchAllCounts() {
  try {
    // 并行获取三种类型的数据
    const [measureRes, designRes, installRes] = await Promise.all([
      api.get('/work-orders', { params: { stage: 'assignment', limit: 100 } }),
      api.get('/work-orders', { params: { stage: 'design', limit: 100 } }),
      api.get('/work-orders', { params: { stage: 'construction', limit: 100 } })
    ])

    const measureData = measureRes.data?.list || measureRes.data || []
    const designData = designRes.data?.list || designRes.data || []
    const installData = installRes.data?.list || installRes.data || []

    measureCount.value = measureData.filter(w => !w.assigned_tenant_user_id).length
    designCount.value = designData.filter(w => !w.designer_id).length
    installCount.value = installData.filter(w => !w.constructor_id).length
  } catch {
    measureCount.value = 0
    designCount.value = 0
    installCount.value = 0
  }
}

// 获取当前 tab 的待派单列表
async function fetchPendingList() {
  loading.value = true
  try {
    const stageMap = {
      measure: 'assignment',
      design: 'design',
      install: 'construction'
    }
    const res = await api.get('/work-orders', {
      params: {
        stage: stageMap[activeTab.value],
        limit: 100
      }
    })
    const payload = res.data?.list || res.data || []
    // 根据类型过滤未派单的工单
    if (activeTab.value === 'measure') {
      pendingList.value = payload.filter(w => !w.assigned_tenant_user_id)
    } else if (activeTab.value === 'design') {
      pendingList.value = payload.filter(w => !w.designer_id)
    } else {
      pendingList.value = payload.filter(w => !w.constructor_id)
    }
  } catch {
    pendingList.value = []
  } finally {
    loading.value = false
  }
}

// 获取可派单人员列表
async function fetchStaffList() {
  try {
    const roleMap = {
      measure: 'measurer',
      design: 'designer',
      install: 'constructor'
    }
    const res = await api.get('/tenants/users')
    const users = res.data?.list || res.data || []
    staffList.value = users.filter(u =>
      u.role === roleMap[activeTab.value] && u.status === 'active'
    )
  } catch {
    staffList.value = []
  }
}

function fetchData() {
  fetchPendingList()
  fetchStaffList()
}

function handleTabChange() {
  pendingList.value = []
  staffList.value = []
  fetchData()
}

function switchTab(tab) {
  activeTab.value = tab
  handleTabChange()
}

onMounted(() => {
  fetchAllCounts()
  fetchData()
})
</script>

<style scoped>
.page-header { margin-bottom: var(--space-4); }
.page-desc { color: var(--color-text-tertiary); font-size: var(--font-size-sm); margin-top: var(--space-1); }

.summary-cards { margin-bottom: var(--space-4); }
.summary-card {
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}
.summary-card:hover {
  transform: translateY(-2px);
}
.summary-card.active {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}
.summary-body {
  display: flex;
  align-items: center;
  padding: var(--space-3);
}
.summary-icon {
  font-size: 32px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  margin-right: var(--space-3);
}
.summary-icon.measure { background: #fef3c7; }
.summary-icon.design { background: #dbeafe; }
.summary-icon.install { background: #f3e8ff; }
.summary-info { flex: 1; }
.summary-count {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
.summary-label {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
  margin-top: var(--space-1);
}

.dispatch-tabs :deep(.el-tabs__header) { margin-bottom: var(--space-4); }
.tab-label { display: flex; align-items: center; gap: 6px; }
</style>
