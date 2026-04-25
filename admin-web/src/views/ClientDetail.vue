<template>
  <div v-loading="loading">
    <div class="page-header flex-between">
      <div>
        <el-button @click="$router.back()" class="mb-8">&larr; 返回</el-button>
        <h1 class="page-title">甲方详情 <span class="client-name">{{ client.name }}</span></h1>
      </div>
    </div>

    <!-- 基本信息 -->
    <el-card class="mb-20">
      <template #header><span class="section-title">企业信息</span></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="企业名称">{{ client.name }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ client.contact_name || '—' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ client.contact_phone || '—' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ client.contact_email || '—' }}</el-descriptions-item>
        <el-descriptions-item label="创建日期">{{ formatDate(client.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="client.status === 'active' ? 'success' : 'danger'">{{ client.status === 'active' ? '正常' : '禁用' }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 关联工单 -->
    <el-card class="mb-20">
      <template #header><span class="section-title">关联工单（{{ workOrders.length }}个）</span></template>
      <el-table :data="workOrders" stripe v-if="workOrders.length">
        <el-table-column prop="work_order_no" label="工单号" width="160">
          <template #default="{ row }">
            <router-link :to="`/work-orders/${row.id}`" class="wo-link">{{ row.work_order_no }}</router-link>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="店铺名字" min-width="150" />
        <el-table-column label="当前环节" width="100">
          <template #default="{ row }"><el-tag size="small">{{ stageLabel(row.current_stage) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="120" />
      </el-table>
      <el-empty v-else description="暂无关联工单" />
    </el-card>

    <!-- 部门 -->
    <el-card>
      <template #header><span class="section-title">甲方部门（{{ depts.length }}个）</span></template>
      <el-table :data="depts" stripe v-if="depts.length">
        <el-table-column prop="name" label="部门名称" min-width="150" />
        <el-table-column prop="manager_name" label="负责人" width="120" />
        <el-table-column prop="user_count" label="人员数" width="80" />
      </el-table>
      <el-empty v-else description="暂无部门" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api'
import { formatDate } from '../utils/format'
import { STAGE_MAP } from '../utils/format'

const route = useRoute()
const loading = ref(true)

const client = ref({})
const workOrders = ref([])
const depts = ref([])

function stageLabel(s) { return STAGE_MAP[s] || s }

async function fetchDetail() {
  loading.value = true
  try {
    const [clientRes, woRes, deptRes] = await Promise.all([
      api.get(`/clients/${route.params.id}`),
      api.get('/work-orders', { params: { client_id: route.params.id, limit: 50 } }),
      api.get(`/clients/${route.params.id}/departments`),
    ])
    client.value = clientRes.data || {}
    const woPayload = woRes.data?.list || woRes.data || []
    workOrders.value = Array.isArray(woPayload) ? woPayload : []
    const deptPayload = deptRes.data || {}
    depts.value = Array.isArray(deptPayload) ? deptPayload : (deptPayload.list || [])
  } catch {
    client.value = {}
    workOrders.value = []
    depts.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchDetail)
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.mb-8 { margin-bottom: var(--space-2); }
.mb-20 { margin-bottom: var(--space-5); }
.section-title { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); }
.client-name { font-size: var(--font-size-sm); color: var(--color-text-tertiary); font-weight: var(--font-weight-normal); }
.wo-link { color: var(--color-primary); text-decoration: none; }
.wo-link:hover { text-decoration: underline; }
</style>
