<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">消息通知</h1>
      <el-button @click="markAllRead">全部已读</el-button>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="全部" name="all">
        <el-table :data="filteredList" stripe>
          <el-table-column width="40">
            <template #default="{ row }">
              <el-icon v-if="!row.is_read" class="unread-dot"><Bell /></el-icon>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="标题" min-width="200">
            <template #default="{ row }">
              <span :class="{ 'unread-text': !row.is_read }">{{ row.title }}</span>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="typeTag(row.type)">{{ typeText(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="时间" width="160" />
          <el-table-column label="操作" width="80">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="goToDetail(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="审批待办" name="approval">
        <el-empty v-if="approvalList.length === 0" description="暂无审批通知" />
        <el-table v-else :data="approvalList" stripe>
          <el-table-column prop="title" label="标题" min-width="250" />
          <el-table-column prop="created_at" label="时间" width="160" />
          <el-table-column label="操作" width="80">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="goToDetail(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="进度更新" name="progress">
        <el-empty v-if="progressList.length === 0" description="暂无进度通知" />
        <el-table v-else :data="progressList" stripe>
          <el-table-column prop="title" label="标题" min-width="250" />
          <el-table-column prop="created_at" label="时间" width="160" />
          <el-table-column label="操作" width="80">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="goToDetail(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'

const router = useRouter()
const activeTab = ref('all')
const notifications = ref([])

onMounted(async () => {
  try {
    const res = await api.get('/notifications')
    notifications.value = res.data || []
  } catch {
    notifications.value = []
  }
})

const approvalList = computed(() => notifications.value.filter(n => n.type === 'approval'))
const progressList = computed(() => notifications.value.filter(n => n.type === 'progress'))
const filteredList = computed(() => {
  if (activeTab.value === 'approval') return approvalList.value
  if (activeTab.value === 'progress') return progressList.value
  return notifications.value
})

function typeTag(t) {
  const map = { approval: 'warning', progress: '', archive: 'info', construction: 'success' }
  return map[t] || 'info'
}
function typeText(t) {
  const map = { approval: '审批', progress: '进度', archive: '归档', construction: '施工' }
  return map[t] || t
}

async function markAllRead() {
  try {
    await api.post('/notifications/read-all')
    notifications.value.forEach(n => n.is_read = true)
    ElMessage.success('已全部标记为已读')
  } catch {
    ElMessage.error('操作失败')
  }
}

function goToDetail(row) {
  row.is_read = true
  if (row.work_order_id) {
    router.push(`/declarations/${row.work_order_id}`)
  }
}
</script>

<style scoped>
.page-title { font-size: 20px; font-weight: 600; color: #1a1a1a; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.unread-dot { color: #409eff; }
.unread-text { font-weight: 600; color: #1a1a1a; }
</style>
