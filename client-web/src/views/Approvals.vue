<template>
  <div>
    <h1 class="page-title">审批中心</h1>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="待我审批" name="pending">
        <el-table :data="pendingList" stripe>
          <el-table-column prop="work_order_no" label="工单号" width="160">
            <template #default="{ row }">
              <router-link :to="`/declarations/${row.id}`" class="link">{{ row.work_order_no }}</router-link>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="项目名称" min-width="200" />
          <el-table-column prop="creator_name" label="申报人" width="100" />
          <el-table-column label="提交时间" width="160">
            <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="openApproval(row)">审批</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="已审批" name="done">
        <el-table :data="doneList" stripe>
          <el-table-column prop="work_order_no" label="工单号" width="160">
            <template #default="{ row }">
              <router-link :to="`/declarations/${row.id}`" class="link">{{ row.work_order_no }}</router-link>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="项目名称" min-width="200" />
          <el-table-column prop="creator_name" label="申报人" width="100" />
          <el-table-column label="审批结果" width="100">
            <template #default="{ row }">
              <el-tag :type="row.result === 'approved' ? 'success' : 'danger'" size="small">
                {{ row.result === 'approved' ? '通过' : '驳回' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reviewed_at" label="审批时间" width="160" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="已驳回" name="rejected">
        <el-table :data="rejectedList" stripe>
          <el-table-column prop="work_order_no" label="工单号" width="160">
            <template #default="{ row }">
              <router-link :to="`/declarations/${row.id}`" class="link">{{ row.work_order_no }}</router-link>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="项目名称" min-width="200" />
          <el-table-column prop="creator_name" label="申报人" width="100" />
          <el-table-column prop="created_at" label="提交时间" width="160" />
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- Approval Dialog -->
    <el-dialog v-model="showDialog" title="审批" width="600px">
      <el-descriptions :column="2" border class="mb-16">
        <el-descriptions-item label="工单号">{{ currentRow.work_order_no }}</el-descriptions-item>
        <el-descriptions-item label="项目名称">{{ currentRow.title }}</el-descriptions-item>
        <el-descriptions-item label="申报人">{{ currentRow.creator_name }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ currentRow.created_at }}</el-descriptions-item>
        <el-descriptions-item label="项目地址" :span="2">{{ currentRow.address || '湖南省长沙市岳麓区望城坡街道 XXX 路' }}</el-descriptions-item>
        <el-descriptions-item label="需求描述" :span="2">{{ currentRow.description || '门店门头招牌改造' }}</el-descriptions-item>
      </el-descriptions>
      <el-form>
        <el-form-item label="审批意见">
          <el-input v-model="comment" type="textarea" :rows="3" placeholder="请输入审批意见（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="danger" @click="handleReject">驳回</el-button>
        <el-button type="primary" @click="handleApprove">通过</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const activeTab = ref('pending')
const showDialog = ref(false)
const comment = ref('')
const currentRow = reactive({})
const pendingList = ref([])
const doneList = ref([])
const rejectedList = ref([])

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleString('zh-CN')
}

onMounted(async () => {
  try {
    const pendingRes = await api.get('/declarations/my-approvals', { params: { tab: 'pending' } })
    pendingList.value = (pendingRes.data || []).map(d => ({
      id: d.id,
      work_order_id: d.work_order_id,
      work_order_no: d.work_order?.work_order_no,
      title: d.work_order?.title,
      creator_name: d.creator?.name,
      created_at: d.work_order?.created_at,
      address: d.full_address,
      description: d.work_order?.description,
    }))

    const doneRes = await api.get('/declarations/my-approvals', { params: { tab: 'approved' } })
    doneList.value = (doneRes.data || []).map(d => ({
      id: d.id,
      work_order_id: d.work_order_id,
      work_order_no: d.work_order?.work_order_no,
      title: d.work_order?.title,
      creator_name: d.creator?.name,
      result: 'approved',
      reviewed_at: d.work_order?.approval?.approved_at || d.created_at,
    }))

    const rejectedRes = await api.get('/declarations/my-approvals', { params: { tab: 'rejected' } })
    rejectedList.value = (rejectedRes.data || []).map(d => ({
      id: d.id,
      work_order_no: d.work_order?.work_order_no,
      title: d.work_order?.title,
      creator_name: d.creator?.name,
      created_at: d.created_at,
    }))
  } catch {
    pendingList.value = []
    doneList.value = []
    rejectedList.value = []
  }
})

function openApproval(row) {
  Object.assign(currentRow, row)
  comment.value = ''
  showDialog.value = true
}

async function handleApprove() {
  try {
    await api.post(`/declarations/${currentRow.id}/approve`, { comment: comment.value })
    ElMessage.success('审批通过')
    showDialog.value = false
    pendingList.value = pendingList.value.filter(r => r.id !== currentRow.id)
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '审批失败')
  }
}

async function handleReject() {
  try {
    await api.post(`/declarations/${currentRow.id}/reject`, { comment: comment.value })
    ElMessage.success('已驳回')
    showDialog.value = false
    pendingList.value = pendingList.value.filter(r => r.id !== currentRow.id)
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '驳回失败')
  }
}
</script>

<style scoped>
.page-title { font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px; }
.link { color: #67c23a; text-decoration: none; font-family: monospace; }
.mb-16 { margin-bottom: 16px; }
</style>
