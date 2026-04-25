<template>
  <div>
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="mb-20">
      <el-col :span="6" v-for="stat in statCards" :key="stat.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-body">
            <div class="stat-number" :style="{ color: stat.color }">{{ stat.count }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <!-- 待派单列表 -->
      <el-col :span="14">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="section-title">待派单工单</span>
              <el-button
                type="primary"
                size="small"
                :disabled="!selectedRows.length"
                @click="openBatchDispatch"
              >
                批量派单 ({{ selectedRows.length }})
              </el-button>
            </div>
          </template>
          <el-table
            ref="tableRef"
            :data="pendingList"
            stripe
            v-loading="loading"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="50" />
            <el-table-column prop="work_order_no" label="工单号" width="150">
              <template #default="{ row }">
                <router-link :to="`/work-orders/${row.id}`" class="wo-link">{{ row.work_order_no }}</router-link>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="店铺名" min-width="120" show-overflow-tooltip />
            <el-table-column prop="client_name" label="甲方" width="100" />
            <el-table-column prop="address" label="地址" min-width="150" show-overflow-tooltip />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="openDispatch(row)">派单</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!loading && !pendingList.length" description="暂无待派单工单" />
        </el-card>
      </el-col>

      <!-- 人员负载面板 -->
      <el-col :span="10">
        <el-card>
          <template #header>
            <span class="section-title">{{ staffLabel }}工作负载</span>
          </template>
          <div v-if="staffList.length" class="staff-list">
            <div
              v-for="staff in staffListWithLoad"
              :key="staff.id"
              class="staff-item"
              :class="{ 'is-overload': staff.taskCount > 4 }"
              @click="quickDispatch(staff)"
            >
              <div class="staff-info">
                <span class="staff-name">{{ staff.name }}</span>
                <span class="staff-count">{{ staff.taskCount || 0 }} 个任务</span>
              </div>
              <el-progress
                :percentage="Math.min((staff.taskCount || 0) * 20, 100)"
                :color="staff.taskCount > 4 ? '#dc2626' : '#16a34a'"
                :stroke-width="6"
              />
              <div class="staff-tip">点击快速派单</div>
            </div>
          </div>
          <el-empty v-else :description="`暂无可用${staffLabel}`" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 派单弹窗 -->
    <el-dialog
      v-model="dispatchDialogVisible"
      :title="isBatch ? '批量派单' : '派单'"
      width="500px"
      destroy-on-close
    >
      <el-form :model="dispatchForm" label-width="100px">
        <el-form-item label="派单对象" required>
          <el-select v-model="dispatchForm.staffId" placeholder="选择人员" style="width: 100%">
            <el-option
              v-for="staff in staffList"
              :key="staff.id"
              :label="`${staff.name} (${staff.taskCount || 0}个任务)`"
              :value="staff.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="type === 'measure'" label="预约时间">
          <el-date-picker
            v-model="dispatchForm.scheduleDate"
            type="datetime"
            placeholder="选择预约测量时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item v-else-if="type === 'design'" label="截止日期">
          <el-date-picker
            v-model="dispatchForm.scheduleDate"
            type="date"
            placeholder="选择设计截止日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item v-else-if="type === 'install'" label="施工日期">
          <el-date-picker
            v-model="dispatchForm.scheduleDate"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="dispatchForm.remark" type="textarea" :rows="3" placeholder="派单备注（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dispatchDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitDispatch">确认派单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const props = defineProps({
  type: { type: String, required: true }, // measure | design | install
  pendingList: { type: Array, default: () => [] },
  staffList: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['refresh'])

// 配置
const typeConfig = {
  measure: {
    staffLabel: '测量员',
    role: 'measurer',
    api: '/assignments',
    getPayload: (staffId, form) => ({
      work_order_id: null,
      assigned_to: staffId,
      deadline: form.scheduleDate || null,
      notes: form.remark || null
    })
  },
  design: {
    staffLabel: '设计师',
    role: 'designer',
    api: '/designs',
    getPayload: (staffId, form) => ({
      designer_id: staffId
    })
  },
  install: {
    staffLabel: '施工队',
    role: 'constructor',
    api: '/constructions',
    getPayload: (staffId, form) => ({
      constructor_id: staffId,
      start_date: form.scheduleDate?.[0] || null,
      end_date: form.scheduleDate?.[1] || null,
      remark: form.remark || null
    })
  }
}

const config = computed(() => typeConfig[props.type])
const staffLabel = computed(() => config.value.staffLabel)

// 统计卡片
const statCards = computed(() => {
  const totalTasks = props.staffList.reduce((s, m) => s + (m.taskCount || 0), 0)
  const avgLoad = props.staffList.length ? Math.round(totalTasks / props.staffList.length) : 0
  return [
    { label: '待派单', count: props.pendingList.length, color: '#e6a23c' },
    { label: `可派${config.value.staffLabel}`, count: props.staffList.length, color: '#2563eb' },
    { label: '已派单', count: totalTasks, color: '#16a34a' },
    { label: '平均负载', count: avgLoad, color: '#6b7280' }
  ]
})

// 人员列表带负载
const staffListWithLoad = computed(() => {
  return props.staffList.map(s => ({
    ...s,
    taskCount: s.taskCount || 0
  }))
})

// 选择
const tableRef = ref()
const selectedRows = ref([])
function handleSelectionChange(rows) {
  selectedRows.value = rows
}

// 派单弹窗
const dispatchDialogVisible = ref(false)
const isBatch = ref(false)
const currentRow = ref(null)
const dispatchForm = ref({
  staffId: null,
  scheduleDate: null,
  remark: ''
})
const submitting = ref(false)

function openDispatch(row) {
  isBatch.value = false
  currentRow.value = row
  dispatchForm.value = { staffId: null, scheduleDate: null, remark: '' }
  dispatchDialogVisible.value = true
}

function openBatchDispatch() {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先选择要派单的工单')
    return
  }
  isBatch.value = true
  currentRow.value = null
  dispatchForm.value = { staffId: null, scheduleDate: null, remark: '' }
  dispatchDialogVisible.value = true
}

function quickDispatch(staff) {
  if (!props.pendingList.length) {
    ElMessage.warning('暂无待派单工单')
    return
  }
  isBatch.value = false
  currentRow.value = props.pendingList[0]
  dispatchForm.value = {
    staffId: staff.id,
    scheduleDate: null,
    remark: ''
  }
  dispatchDialogVisible.value = true
}

async function submitDispatch() {
  if (!dispatchForm.value.staffId) {
    ElMessage.warning('请选择派单对象')
    return
  }

  const workOrderIds = isBatch.value
    ? selectedRows.value.map(r => r.id)
    : [currentRow.value.id]

  submitting.value = true
  try {
    const payload = config.value.getPayload(dispatchForm.value.staffId, dispatchForm.value)

    if (props.type === 'measure') {
      // 测量派单：逐个创建派单记录
      await Promise.all(
        workOrderIds.map(id =>
          api.post(config.value.api, { ...payload, work_order_id: id })
        )
      )
    } else if (props.type === 'design') {
      // 设计派单：逐个指派设计师
      await Promise.all(
        workOrderIds.map(id =>
          api.post(`${config.value.api}/${id}/assign`, payload)
        )
      )
    } else if (props.type === 'install') {
      // 施工派单：逐个指派施工队
      await Promise.all(
        workOrderIds.map(id =>
          api.post(`${config.value.api}/${id}/assign`, payload)
        )
      )
    }

    ElMessage.success(isBatch.value ? `成功派单 ${workOrderIds.length} 个工单` : '派单成功')
    dispatchDialogVisible.value = false
    tableRef.value?.clearSelection()
    emit('refresh')
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '派单失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.mb-20 { margin-bottom: var(--space-5); }
.section-title { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); }
.stat-card .stat-body { text-align: center; padding: var(--space-2) 0; }
.stat-number { font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); }
.stat-label { color: var(--color-text-tertiary); font-size: var(--font-size-sm); margin-top: var(--space-1); }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.wo-link { color: var(--color-primary); text-decoration: none; }
.wo-link:hover { text-decoration: underline; }
.staff-list { max-height: 450px; overflow-y: auto; }
.staff-item {
  padding: var(--space-3);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-3);
  cursor: pointer;
  transition: all 0.2s;
}
.staff-item:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
}
.staff-item.is-overload {
  background: #fef2f2;
  border-color: #fecaca;
}
.staff-info { display: flex; justify-content: space-between; margin-bottom: var(--space-2); }
.staff-name { font-weight: var(--font-weight-medium); }
.staff-count { color: var(--color-text-tertiary); font-size: var(--font-size-xs); }
.staff-tip { font-size: var(--font-size-xs); color: var(--color-primary); margin-top: var(--space-1); opacity: 0; transition: opacity 0.2s; }
.staff-item:hover .staff-tip { opacity: 1; }
</style>
