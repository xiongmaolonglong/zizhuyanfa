<template>
  <div class="work-orders-page">
    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="工单号 / 项目名"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 140px">
            <el-option label="待处理" value="pending" />
            <el-option label="已提交" value="submitted" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区域 -->
    <el-card shadow="never" class="table-card">
      <el-table :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="tenant_name" label="租户名称" min-width="160" />
        <el-table-column prop="work_order_no" label="工单号" width="160" />
        <el-table-column prop="title" label="项目名称" min-width="200" />
        <el-table-column prop="client_name" label="甲方名称" min-width="180" />
        <el-table-column prop="current_stage" label="当前环节" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ stageLabels[row.current_stage] || row.current_stage }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabels[row.status] || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="提交时间" width="170" />
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <!-- 工单详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="工单详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-if="detail" class="detail-content">
        <!-- 基本信息 -->
        <el-descriptions :column="2" border>
          <el-descriptions-item label="工单号">{{ detail.work_order_no }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(detail.status)" size="small">{{ statusLabels[detail.status] || detail.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="租户名称" :span="2">{{ detail.tenant?.name }}</el-descriptions-item>
          <el-descriptions-item label="项目名称" :span="2">{{ detail.title }}</el-descriptions-item>
          <el-descriptions-item label="甲方名称" :span="2">{{ detail.client?.name }}</el-descriptions-item>
          <el-descriptions-item label="当前环节">{{ stageLabels[detail.current_stage] || detail.current_stage }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ detail.created_at }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ detail.updated_at }}</el-descriptions-item>
          <el-descriptions-item label="截止日期" v-if="detail.deadline">{{ detail.deadline }}</el-descriptions-item>
        </el-descriptions>

        <!-- 操作日志 -->
        <div class="section-title" v-if="detail.logs && detail.logs.length">操作日志</div>
        <el-timeline v-if="detail.logs && detail.logs.length">
          <el-timeline-item
            v-for="(log, index) in detail.logs"
            :key="index"
            :timestamp="log.created_at"
            placement="top"
          >
            {{ log.action }} - {{ log.operator }}
            <span v-if="log.remark" class="log-remark">（{{ log.remark }}）</span>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { fetchWorkOrders, fetchWorkOrderDetail } from '../api/workOrders'

const loading = ref(false)
const tableData = ref([])
const detailVisible = ref(false)
const detail = ref(null)

const searchForm = reactive({
  keyword: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const stageLabels = {
  declaration: '申报',
  approval: '审批',
  assignment: '待分配',
  measurement: '测量',
  design: '设计',
  production: '生产',
  construction: '施工',
  finance: '财务',
  archive: '归档',
  aftersale: '售后'
}

const statusLabels = {
  pending: '待处理',
  submitted: '已提交',
  completed: '已完成',
  active: '进行中'
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined
    }

    const res = await fetchWorkOrders(params)
    const list = res.data?.list || res.data || []
    tableData.value = list.map(wo => ({
      id: wo.id,
      tenant_name: wo.tenant?.name || '',
      work_order_no: wo.work_order_no,
      title: wo.title,
      client_name: wo.client?.name || '',
      current_stage: wo.current_stage,
      status: wo.status,
      created_at: wo.created_at
    }))
    pagination.total = res.data?.total || res.pagination?.total || 0
  } catch (err) {
    ElMessage.error('获取工单列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchData()
}

function handleReset() {
  searchForm.keyword = ''
  searchForm.status = ''
  pagination.page = 1
  fetchData()
}

async function handleView(row) {
  try {
    const res = await fetchWorkOrderDetail(row.id)
    detail.value = res.data
    detailVisible.value = true
  } catch (err) {
    ElMessage.error('获取工单详情失败')
  }
}

function statusType(status) {
  const map = {
    pending: 'info',
    submitted: '',
    completed: 'success',
    active: 'warning'
  }
  return map[status] || 'info'
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.work-orders-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-card {
  margin-bottom: 0;
}

.search-card :deep(.el-card__body) {
  padding-bottom: 0;
}

.table-card {
  margin-top: 16px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.detail-content {
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 8px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  margin-top: 20px;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #722ed1;
}

.log-remark {
  color: #909399;
  font-size: 13px;
}
</style>
