<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getTenantDetail, getTenantList } from '@/api/tenants'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const activeTab = ref('workOrders')

const tenantInfo = ref(null)

const stats = reactive({
  totalOrders: 0,
  activeUsers: 0,
  activeClients: 0,
  ordersByStage: {}
})

const workOrders = ref([])
const clients = ref([])
const departments = ref([])

const stageLabels = {
  declaration: '申报',
  approval: '审批',
  assignment: '分配',
  measurement: '测量',
  design: '设计',
  production: '生产',
  construction: '施工',
  finance: '财务',
  archive: '归档',
  aftersale: '售后'
}

function statusTag(status) {
  const map = {
    completed: { label: '已完成', type: 'success' },
    submitted: { label: '已提交', type: 'primary' },
    pending: { label: '待处理', type: 'warning' },
    active: { label: '正常', type: 'success' },
    suspended: { label: '已暂停', type: 'danger' }
  }
  return map[status] || { label: status, type: 'info' }
}

async function fetchData() {
  loading.value = true
  try {
    const tenantId = route.params.id
    const res = await getTenantDetail(tenantId)
    const data = res.data
    tenantInfo.value = {
      id: data.id,
      name: data.name,
      contact: data.contact_name,
      phone: data.contact_phone,
      email: data.contact_email,
      region: '',
      status: data.status,
      createdAt: data.created_at,
      userCount: data.stats?.active_users || 0,
      workOrderCount: data.stats?.total_orders || 0
    }
    Object.assign(stats, {
      totalOrders: data.stats?.total_orders || 0,
      activeUsers: data.stats?.active_users || 0,
      activeClients: data.stats?.active_clients || 0,
      ordersByStage: data.stats?.orders_by_stage || {}
    })
    workOrders.value = []
    clients.value = []
    departments.value = []
  } catch (err) {
    ElMessage.error('获取租户详情失败')
  } finally {
    loading.value = false
  }
}

async function fetchWorkOrders() {
  const tenantId = route.params.id
  try {
    const api = (await import('@/api/workOrders')).default
    const res = await api.get(`/work-orders?tenant_id=${tenantId}&limit=50`)
    const list = res.data?.list || res.data || []
    workOrders.value = list.map(wo => ({
      id: wo.work_order_no || wo.id,
      title: wo.title,
      client: wo.client?.name || '',
      assignee: '',
      status: wo.status,
      currentStage: wo.current_stage,
      createdAt: wo.created_at,
      deadline: wo.deadline
    }))
  } catch {
    workOrders.value = []
  }
}

async function fetchClients() {
  const tenantId = route.params.id
  try {
    const apiModule = await import('@/api/tenants')
    const res = await apiModule.getClients({ tenant_id: tenantId, limit: 50 })
    const list = res.data?.list || res.data || []
    clients.value = list.map(c => ({
      id: c.id,
      name: c.name,
      contact: c.contact_name,
      phone: c.contact_phone,
      workOrders: 0,
      status: c.status
    }))
  } catch {
    clients.value = []
  }
}

function handleDeptChange(dept) {
  // 部门人员明细功能待后端接口完善
  ElMessage.info('部门人员明细功能开发中')
}

function goBack() {
  router.back()
}

onMounted(() => {
  fetchData()
})

watch(activeTab, async (tab) => {
  if (tab === 'workOrders' && workOrders.value.length === 0) {
    await fetchWorkOrders()
  }
  if (tab === 'clients' && clients.value.length === 0) {
    await fetchClients()
  }
})
</script>

<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" circle @click="goBack" />
        <h2>{{ tenantInfo?.name || '租户详情' }}</h2>
      </div>
      <el-tag :type="tenantInfo?.status === 'active' ? 'success' : 'danger'" size="large">
        {{ tenantInfo?.status === 'active' ? '正常' : '已暂停' }}
      </el-tag>
    </div>

    <el-card shadow="never" class="info-card">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="租户名称">{{ tenantInfo?.name }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ tenantInfo?.contact }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ tenantInfo?.phone }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ tenantInfo?.email }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="tenantInfo?.status === 'active' ? 'success' : 'danger'" size="small">
            {{ tenantInfo?.status === 'active' ? '正常' : '已暂停' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="开通日期">{{ tenantInfo?.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="用户数">{{ tenantInfo?.userCount }}</el-descriptions-item>
        <el-descriptions-item label="工单数">{{ tenantInfo?.workOrderCount }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="never" class="stat-card stat-blue">
          <div class="stat-value">{{ stats.totalOrders }}</div>
          <div class="stat-label">总工单</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card stat-green">
          <div class="stat-value">{{ stats.activeUsers }}</div>
          <div class="stat-label">活跃用户</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card stat-orange">
          <div class="stat-value">{{ stats.activeClients }}</div>
          <div class="stat-label">活跃甲方</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card stat-red">
          <div class="stat-value">{{ Object.keys(stats.ordersByStage).length }}</div>
          <div class="stat-label">活跃环节</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="工单列表" name="workOrders">
          <el-table :data="workOrders" stripe v-loading="workOrders.length === 0 && loading">
            <el-table-column prop="id" label="工单编号" width="160" />
            <el-table-column prop="title" label="工单标题" min-width="240" show-overflow-tooltip />
            <el-table-column prop="client" label="甲方" width="160" show-overflow-tooltip />
            <el-table-column prop="currentStage" label="当前环节" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ stageLabels[row.currentStage] || row.currentStage }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="statusTag(row.status).type" size="small">
                  {{ statusTag(row.status).label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建日期" width="120" />
            <el-table-column prop="deadline" label="截止日期" width="120" />
          </el-table>
          <div v-if="workOrders.length === 0" class="empty-hint">暂无工单数据</div>
        </el-tab-pane>

        <el-tab-pane label="甲方列表" name="clients">
          <el-table :data="clients" stripe v-loading="clients.length === 0 && loading">
            <el-table-column prop="name" label="甲方名称" min-width="240" show-overflow-tooltip />
            <el-table-column prop="contact" label="联系人" width="100" />
            <el-table-column prop="phone" label="电话" width="140" />
            <el-table-column prop="status" label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="statusTag(row.status).type" size="small">
                  {{ statusTag(row.status).label }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="clients.length === 0" class="empty-hint">暂无甲方数据</div>
        </el-tab-pane>

        <el-tab-pane label="部门人员" name="departments">
          <div class="empty-hint" style="padding: 40px; text-align: center; color: #86909c;">
            部门人员明细功能开发中
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
.page-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #1d2129;
}

.info-card {
  margin-bottom: 16px;
}

.stats-row {
  margin-bottom: 16px;
}

.stat-card {
  text-align: center;
  padding: 8px 0;
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #86909c;
}

.stat-blue .stat-value { color: #165dff; }
.stat-green .stat-value { color: #00b42a; }
.stat-orange .stat-value { color: #ff7d00; }
.stat-red .stat-value { color: #f53f3f; }

.empty-hint {
  color: #86909c;
  font-weight: 400;
}
</style>
