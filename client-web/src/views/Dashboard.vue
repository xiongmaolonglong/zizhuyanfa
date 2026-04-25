<template>
  <div>
    <h1 class="page-title">工作台</h1>

    <!-- Stat Cards -->
    <div class="stat-grid">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-value">{{ stats.pendingApproval }}</div>
        <div class="stat-label">待审批</div>
      </el-card>
      <div class="stat-card in-progress">
        <div class="stat-value">{{ stats.inProgress }}</div>
        <div class="stat-label">进行中</div>
      </div>
      <div class="stat-card completed">
        <div class="stat-value">{{ stats.completed }}</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-card archived">
        <div class="stat-value">{{ stats.archived }}</div>
        <div class="stat-label">已归档</div>
      </div>
    </div>

    <!-- Recent Declarations -->
    <el-card class="mt-16">
      <template #header>
        <div class="card-header">
          <span>最近申报</span>
          <router-link to="/my-declarations" class="more-link">查看全部</router-link>
        </div>
      </template>
      <el-table :data="recentList" stripe>
        <el-table-column prop="work_order_no" label="工单号" width="160">
          <template #default="{ row }">
            <router-link :to="`/declarations/${row.id}`" class="link">{{ row.work_order_no }}</router-link>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="项目名称" min-width="200" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="current_stage" label="当前环节" width="100" />
        <el-table-column prop="created_at" label="提交时间" width="160" />
      </el-table>
    </el-card>

    <!-- Pending Approvals -->
    <el-card class="mt-16" v-if="pendingList.length > 0">
      <template #header>
        <div class="card-header">
          <span>待我审批</span>
          <router-link to="/approvals" class="more-link">查看全部</router-link>
        </div>
      </template>
      <el-table :data="pendingList" stripe>
        <el-table-column prop="work_order_no" label="工单号" width="160">
          <template #default="{ row }">
            <router-link :to="`/declarations/${row.id}`" class="link">{{ row.work_order_no }}</router-link>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="项目名称" min-width="200" />
        <el-table-column prop="creator_name" label="申报人" width="100" />
        <el-table-column prop="created_at" label="提交时间" width="160" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <router-link :to="`/declarations/${row.id}?action=approve`">
              <el-button type="primary" size="small">审批</el-button>
            </router-link>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'

const stats = ref({ pendingApproval: 0, inProgress: 0, completed: 0, archived: 0 })
const recentList = ref([])
const pendingList = ref([])

onMounted(async () => {
  try {
    // 获取最近申报
    const recentRes = await api.get('/declarations', { params: { limit: 5 } })
    const declarations = recentRes.data || []
    recentList.value = declarations.map(d => ({
      id: d.id,
      work_order_no: d.work_order?.work_order_no || '',
      title: d.work_order?.title || '',
      status: d.work_order?.status || '',
      current_stage: d.work_order?.current_stage || '',
      created_at: d.created_at,
    })).slice(0, 5)

    // 统计
    const allRes = await api.get('/declarations', { params: { limit: 200 } })
    const allList = allRes.data || []
    stats.value = {
      pendingApproval: allList.filter(d => d.work_order?.status === 'pending_approval').length,
      inProgress: allList.filter(d => ['submitted', 'in_progress'].includes(d.work_order?.status)).length,
      completed: allList.filter(d => d.work_order?.status === 'completed').length,
      archived: allList.filter(d => d.work_order?.status === 'archived').length,
    }

    // 获取待审批
    try {
      const pendingRes = await api.get('/declarations', { params: { status: 'pending_approval', limit: 5 } })
      pendingList.value = (pendingRes.data || []).map(d => ({
        id: d.id,
        work_order_no: d.work_order?.work_order_no || '',
        title: d.work_order?.title || '',
        creator_name: d.creator?.name || '',
        created_at: d.created_at,
      }))
    } catch { pendingList.value = [] }
  } catch {
    recentList.value = []
    pendingList.value = []
  }
})

function statusType(s) {
  const map = { pending_approval: 'warning', submitted: '', in_progress: '', approved: 'success', completed: 'info', rejected: 'danger', archived: 'info' }
  return map[s] || 'info'
}
function statusText(s) {
  const map = { draft: '草稿', pending_approval: '审批中', submitted: '已提交', in_progress: '流转中', approved: '已通过', completed: '已完成', rejected: '已驳回', archived: '已归档' }
  return map[s] || s
}
</script>

<style scoped>
.page-title { font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 20px; }
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-card { text-align: center; padding: 20px 0; }
.stat-value { font-size: 32px; font-weight: 700; color: #409eff; }
.stat-label { margin-top: 4px; color: #8c8c8c; font-size: 14px; }
.stat-card.in-progress .stat-value { color: #e6a23c; }
.stat-card.completed .stat-value { color: #67c23a; }
.stat-card.archived .stat-value { color: #909399; }
.mt-16 { margin-top: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.more-link { color: #409eff; text-decoration: none; font-size: 14px; }
.link { color: #409eff; text-decoration: none; font-family: monospace; }
</style>
