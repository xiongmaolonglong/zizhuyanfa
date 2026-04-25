<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { getTenantList, createTenant, updateTenantStatus } from '@/api/tenants'

const router = useRouter()

// --- Filter & pagination ---
const filters = reactive({
  status: '',
  keyword: ''
})

const loading = ref(false)
const tableData = ref([])
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0
})

// --- Create dialog ---
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const form = reactive({
  name: '',
  contact_name: '',
  contact_phone: '',
  email: '',
  order_code_prefix: ''
})

const formRules = {
  name: [{ required: true, message: '请输入租户名称', trigger: 'blur' }],
  contact_name: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contact_phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  order_code_prefix: [{ required: true, message: '请输入工单编号前缀', trigger: 'blur' }]
}

// --- Methods ---
async function fetchData() {
  loading.value = true
  try {
    const res = await getTenantList({
      status: filters.status || undefined,
      keyword: filters.keyword || undefined,
      page: pagination.current,
      limit: pagination.pageSize
    })
    const list = res.data?.list || res.data || []
    tableData.value = list.map(t => ({
      id: t.id,
      name: t.name,
      contact: t.contact_name,
      phone: t.contact_phone,
      email: t.contact_email,
      region: '',
      userCount: t.stats?.user_count || 0,
      workOrderCount: t.stats?.order_count || 0,
      clientCount: t.stats?.client_count || 0,
      status: t.status,
      createdAt: t.created_at
    }))
    pagination.total = res.data?.total || res.pagination?.total || 0
  } catch (err) {
    ElMessage.error('获取租户列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.current = 1
  fetchData()
}

function handleReset() {
  filters.status = ''
  filters.keyword = ''
  handleSearch()
}

function handlePageChange(page) {
  pagination.current = page
  fetchData()
}

function handleSizeChange(size) {
  pagination.pageSize = size
  pagination.current = 1
  fetchData()
}

function handleView(row) {
  router.push(`/tenants/${row.id}`)
}

async function handlePause(row) {
  const action = row.status === 'active' ? '暂停' : '恢复'
  const newStatus = row.status === 'active' ? 'suspended' : 'active'
  try {
    await ElMessageBox.confirm(
      `确定要${action}租户「${row.name}」吗？`,
      `确认${action}`,
      { type: 'warning' }
    )
    await updateTenantStatus(row.id, newStatus)
    row.status = newStatus
    ElMessage.success(`${action}成功`)
  } catch {
    // cancelled or error
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitting.value = true
    const payload = {
      name: form.name,
      contact_name: form.contact_name,
      contact_phone: form.contact_phone,
      email: form.email,
      order_code_prefix: form.order_code_prefix
    }
    await createTenant(payload)
    ElMessage.success('租户开通成功')
    dialogVisible.value = false
    resetForm()
    fetchData()
  } catch (err) {
    if (err !== false) {
      ElMessage.error(err.response?.data?.error || '开通失败，请重试')
    }
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  form.name = ''
  form.contact_name = ''
  form.contact_phone = ''
  form.email = ''
  form.order_code_prefix = ''
}

function handleDialogClose() {
  resetForm()
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="page-container">
    <!-- Header -->
    <div class="page-header">
      <h2>租户管理</h2>
      <el-button type="primary" :icon="Plus" @click="dialogVisible = true">
        开通租户
      </el-button>
    </div>

    <!-- Filters -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters">
        <el-form-item label="状态">
          <el-select
            v-model="filters.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option label="正常" value="active" />
            <el-option label="已暂停" value="suspended" />
          </el-select>
        </el-form-item>

        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索租户名称 / 联系人 / 电话"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Table -->
    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="name" label="租户名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="contact" label="联系人" width="120" />
        <el-table-column prop="phone" label="电话" width="140" />
        <el-table-column prop="userCount" label="用户数" width="90" align="center" />
        <el-table-column prop="workOrderCount" label="工单数" width="90" align="center" />
        <el-table-column prop="clientCount" label="甲方数" width="90" align="center" />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '正常' : '已暂停' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button
              link
              :type="row.status === 'active' ? 'warning' : 'success'"
              size="small"
              @click="handlePause(row)"
            >
              {{ row.status === 'active' ? '暂停' : '恢复' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- Create Dialog -->
    <el-dialog
      v-model="dialogVisible"
      title="开通租户"
      width="680px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="110px"
        label-position="right"
      >
        <el-form-item label="租户名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入租户名称" />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="联系人" prop="contact_name">
              <el-input v-model="form.contact_name" placeholder="请输入联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contact_phone">
              <el-input v-model="form.contact_phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱地址" />
        </el-form-item>

        <el-form-item label="工单前缀" prop="order_code_prefix">
          <el-input v-model="form.order_code_prefix" placeholder="如: SSWH" style="width: 200px" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          确认开通
        </el-button>
      </template>
    </el-dialog>
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

.page-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #1d2129;
}

.filter-card {
  margin-bottom: 16px;
}

.filter-card :deep(.el-card__body) {
  padding-bottom: 2px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
