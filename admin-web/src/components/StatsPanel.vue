<template>
  <el-row :gutter="16" class="stats-panel">
    <el-col :span="6">
      <el-card shadow="hover">
        <div class="stat-card">
          <div class="stat-icon stat-icon-primary">
            <el-icon :size="24"><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">工单总数</div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card shadow="hover">
        <div class="stat-card">
          <div class="stat-icon stat-icon-success">
            <el-icon :size="24"><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.by_stage?.archive || 0 }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card shadow="hover">
        <div class="stat-card">
          <div class="stat-icon stat-icon-warning">
            <el-icon :size="24"><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value stat-value-warning">{{ stats.timeout_count }}</div>
            <div class="stat-label">超时工单</div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card shadow="hover">
        <div class="stat-card">
          <div class="stat-icon stat-icon-info">
            <el-icon :size="24"><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ completionRate }}%</div>
            <div class="stat-label">完成率</div>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Document, CircleCheck, Clock, TrendCharts } from '@element-plus/icons-vue'
import api from '../api'
import { logger } from '../utils/logger'

const stats = ref({ total: 0, by_stage: {}, by_status: {}, timeout_count: 0 })

const completionRate = computed(() => {
  const total = stats.value.total || 0
  const done = stats.value.by_stage?.archive || 0
  return total ? ((done / total) * 100).toFixed(1) : '0'
})

onMounted(async () => {
  try {
    const res = await api.get('/work-orders/stats')
    stats.value = res.data || {}
  } catch (e) {
    logger.error('加载统计失败:', e)
  }
})
</script>

<style scoped>
.stats-panel { margin-bottom: var(--space-4); }
.stat-card { display: flex; align-items: center; gap: 12px; }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.stat-icon-primary { background: rgba(37, 99, 235, 0.1); color: var(--color-primary); }
.stat-icon-success { background: rgba(22, 163, 74, 0.1); color: var(--color-success); }
.stat-icon-warning { background: rgba(234, 88, 12, 0.1); color: var(--color-warning); }
.stat-icon-info { background: rgba(114, 46, 209, 0.1); color: #722ed1; }
.stat-value { font-size: 24px; font-weight: 600; color: var(--color-text-primary); }
.stat-value-warning { color: var(--color-warning); }
.stat-label { font-size: 12px; color: var(--color-text-secondary, #8c8c8c); }
</style>
