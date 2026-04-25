<template>
  <div>
    <h1 class="page-title">用户管理</h1>

    <el-card>
      <template #header>
        <div class="filter-bar">
          <el-input v-model="filters.keyword" placeholder="搜索用户名 / 手机号" clearable style="width: 220px" @clear="loadData" @keyup.enter="loadData" />
          <el-select v-model="filters.role" placeholder="全部角色" clearable style="width: 140px" @change="loadData">
            <el-option label="租户" value="tenant" />
            <el-option label="设计师" value="designer" />
            <el-option label="施工员" value="constructor" />
            <el-option label="甲方" value="client" />
          </el-select>
          <el-button type="primary" @click="loadData">查询</el-button>
        </div>
      </template>

      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="name" label="用户名" width="160" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column label="角色" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="roleType(row.role)">{{ roleLabel(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="所属租户" width="180">
          <template #default="{ row }">{{ row.tenant?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="邮箱" min-width="180">
          <template #default="{ row }">{{ row.email || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          layout="total, prev, pager, next"
          :total="total"
          :page-size="filters.limit"
          :current-page="filters.page"
          @current-change="onPageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getUsers } from '../api/users'

const loading = ref(false)
const list = ref([])
const total = ref(0)

const filters = reactive({ page: 1, limit: 15, keyword: '', role: '' })

const roleMap = { tenant: '租户', designer: '设计师', constructor: '施工员', client: '甲方', admin: '管理员' }
const roleTypeMap = { tenant: '', designer: 'primary', constructor: 'warning', client: 'success', admin: 'danger' }
function roleLabel(r) { return roleMap[r] || r }
function roleType(r) { return roleTypeMap[r] || '' }
function formatDate(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }

async function loadData() {
  loading.value = true
  try {
    const res = await getUsers({ page: filters.page, limit: filters.limit, keyword: filters.keyword, role: filters.role })
    const items = res.data?.list || res.data || []
    list.value = items
    total.value = res.data?.total || items.length
  } catch (err) {
    console.error('Load users failed:', err)
    list.value = []
  } finally {
    loading.value = false
  }
}

function onPageChange(page) {
  filters.page = page
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
.page-title { font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 20px; }
.mt-16 { margin-top: 16px; }
.filter-bar { display: flex; gap: 12px; align-items: center; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
