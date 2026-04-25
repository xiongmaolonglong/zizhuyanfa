<template>
  <div>
    <div class="page-header flex-between">
      <h1 class="page-title">消息通知</h1>
      <div class="page-actions">
        <el-button @click="markAllRead" :disabled="!unreadCount">全部已读</el-button>
        <el-button @click="loadNotifications" :loading="loading">
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
      </div>
    </div>

    <!-- 筛选 -->
    <el-card class="filter-card">
      <el-form :inline="true">
        <el-form-item>
          <el-select v-model="filterRead" placeholder="全部状态" clearable style="width:120px" @change="loadNotifications">
            <el-option label="未读" :value="false" />
            <el-option label="已读" :value="true" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="filterType" placeholder="全部类型" clearable style="width:120px" @change="loadNotifications">
            <el-option label="工单通知" value="work_order" />
            <el-option label="派单通知" value="assignment" />
            <el-option label="审核通知" value="review" />
            <el-option label="系统通知" value="system" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 通知列表 -->
    <el-card>
      <div class="notification-list" v-loading="loading">
        <div v-if="notifications.length" class="notif-item" :class="{ 'notif-unread': !n.is_read }"
          v-for="n in notifications" :key="n.id" @click="handleClick(n)">
          <el-badge is-dot :hidden="n.is_read" class="notif-badge">
            <div class="notif-content">
              <div class="notif-header">
                <span class="notif-title">{{ n.title }}</span>
                <el-tag size="small" :type="typeTag(n.type)">{{ typeLabel(n.type) }}</el-tag>
              </div>
              <p class="notif-body">{{ n.content }}</p>
              <div class="notif-meta">
                <span class="text-muted">{{ timeAgo(n.created_at) }}</span>
                <span v-if="n.work_order_id" class="notif-wo-link" @click.stop="$router.push(`/work-orders/${n.work_order_id}`)">
                  查看工单
                </span>
              </div>
            </div>
          </el-badge>
        </div>
        <el-empty v-else description="暂无通知" />
      </div>

      <div class="pagination-wrap" v-if="total > pageSize">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
          :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next"
          @size-change="loadNotifications" @current-change="loadNotifications" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import api from '../api'
import { getNotifications, getUnreadCount, markAllAsRead as markAllApi } from '../api/notifications'

const loading = ref(false)
const notifications = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const unreadCount = ref(0)
const filterRead = ref('')
const filterType = ref('')

const typeMap = {
  work_order: '工单通知', assignment: '派单通知', review: '审核通知', system: '系统通知'
}
function typeLabel(t) { return typeMap[t] || t || '通知' }
function typeTag(t) {
  const map = { work_order: 'primary', assignment: 'warning', review: 'success', system: 'info' }
  return map[t] || undefined
}

function timeAgo(date) {
  if (!date) return ''
  const now = new Date()
  const d = new Date(date)
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`
  return d.toLocaleDateString('zh-CN')
}

async function loadNotifications() {
  loading.value = true
  try {
    const params = { page: page.value, limit: pageSize.value }
    if (filterRead.value !== '') params.is_read = filterRead.value
    if (filterType.value) params.type = filterType.value
    const res = await getNotifications(params)
    notifications.value = res.data?.list || res.data || []
    total.value = res.pagination?.total || 0
  } catch {
    notifications.value = []
  } finally {
    loading.value = false
  }
}

async function loadUnreadCount() {
  try {
    const res = await getUnreadCount()
    unreadCount.value = res.data?.unread_count || 0
  } catch {
    unreadCount.value = 0
  }
}

async function handleClick(n) {
  if (!n.is_read) {
    await api.put(`/notifications/${n.id}/read`).catch(() => {})
    n.is_read = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }
}

async function markAllRead() {
  try {
    await markAllApi()
    ElMessage.success('已全部标记为已读')
    notifications.value.forEach(n => n.is_read = true)
    unreadCount.value = 0
  } catch {
    ElMessage.error('操作失败')
  }
}

let timer = null
onMounted(() => {
  loadNotifications()
  loadUnreadCount()
  timer = setInterval(loadUnreadCount, 60000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.page-header { margin-bottom: var(--space-6); }
.filter-card { margin-bottom: var(--space-4); }

.notification-list { max-height: 600px; overflow-y: auto; }
.notif-item {
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--color-border-light);
  cursor: pointer;
  transition: background 0.15s;
}
.notif-item:last-child { border-bottom: none; }
.notif-item:hover { background: #f9fafb; }
.notif-unread { background: #f0f5ff; }
.notif-badge { display: block; }
.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}
.notif-title {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}
.notif-body {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-2) 0;
  line-height: 1.5;
}
.notif-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.notif-wo-link {
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  cursor: pointer;
  text-decoration: none;
}
.notif-wo-link:hover { text-decoration: underline; }
.text-muted { color: var(--color-text-tertiary); font-size: var(--font-size-xs); }
</style>
