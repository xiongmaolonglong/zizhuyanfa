<template>
  <div>
    <div class="page-header flex-between">
      <div>
        <h1 class="page-title">APP 版本管理</h1>
        <p class="page-desc">管理移动端应用的版本发布与更新策略</p>
      </div>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>新增版本
      </el-button>
    </div>

    <!-- 筛选 -->
    <el-card class="filter-card">
      <el-form :inline="true">
        <el-form-item label="应用">
          <el-select v-model="filters.app_name" placeholder="全部应用" clearable style="width: 160px" @change="loadVersions">
            <el-option label="measure-app" value="measure-app" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台">
          <el-select v-model="filters.platform" placeholder="全部平台" clearable style="width: 120px" @change="loadVersions">
            <el-option label="Android" value="android" />
            <el-option label="iOS" value="ios" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 120px" @change="loadVersions">
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 版本列表 -->
    <el-card>
      <el-table :data="versions" v-loading="loading" stripe border>
        <el-table-column label="应用" prop="app_name" width="120">
          <template #default="{ row }">{{ row.app_name }}</template>
        </el-table-column>
        <el-table-column label="平台" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.platform === 'android' ? 'success' : ''" size="small">
              {{ row.platform === 'android' ? 'Android' : 'iOS' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="版本号" prop="version" width="100" align="center">
          <template #default="{ row }">
            <span class="version-text">{{ row.version }}</span>
          </template>
        </el-table-column>
        <el-table-column label="构建号" prop="build_number" width="90" align="center" />
        <el-table-column label="更新类型" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="updateTypeTag(row.update_type)" size="small">
              {{ updateTypeLabel(row.update_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新日志" min-width="200">
          <template #default="{ row }">
            <span v-if="row.changelog && row.changelog.length" class="changelog-text">
              {{ row.changelog.join('；') }}
            </span>
            <span v-else class="text-muted">无</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" width="170">
          <template #default="{ row }">
            <span v-if="row.published_at">{{ formatDate(row.published_at) }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="openEditDialog(row)">编辑</el-button>
            <el-button v-if="row.status === 'draft'" size="small" type="success" link @click="publishVersion(row)">发布</el-button>
            <el-button v-if="row.status === 'published'" size="small" type="warning" link @click="archiveVersion(row)">下架</el-button>
            <el-button v-if="row.status === 'draft'" size="small" type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap" v-if="total > pageSize">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
          :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next"
          @size-change="loadVersions" @current-change="loadVersions" />
      </div>
    </el-card>

    <!-- 新增/编辑版本对话框 -->
    <el-dialog v-model="showDialog" :title="editingId ? '编辑版本' : '新增版本'" width="600px" @close="resetForm">
      <el-form :model="form" label-width="110px">
        <el-form-item label="应用标识" :rules="[{ required: true, message: '必填' }]" :prop="editingId ? undefined : 'app_name'">
          <el-select v-model="form.app_name" style="width: 100%" :disabled="!!editingId">
            <el-option label="measure-app" value="measure-app" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台" :rules="[{ required: true, message: '必填' }]" :prop="editingId ? undefined : 'platform'">
          <el-select v-model="form.platform" style="width: 100%" :disabled="!!editingId">
            <el-option label="Android" value="android" />
            <el-option label="iOS" value="ios" />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="版本号" :rules="[{ required: true, message: '必填' }]" prop="version">
              <el-input v-model="form.version" placeholder="如 1.2.0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="构建号" :rules="[{ required: true, message: '必填' }]" prop="build_number">
              <el-input-number v-model="form.build_number" :min="1" :step="1" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="更新类型">
          <el-select v-model="form.update_type" style="width: 100%">
            <el-option label="推荐更新" value="recommended" />
            <el-option label="强制更新" value="required" />
          </el-select>
        </el-form-item>
        <el-form-item label="最低兼容版本">
          <el-input v-model="form.min_required_version" placeholder="如 1.0.0，低于此版本强制更新" />
        </el-form-item>
        <el-form-item label="下载地址">
          <el-input v-model="form.download_url" placeholder="APK 或 TestFlight 链接" />
        </el-form-item>
        <el-form-item label="更新日志">
          <div class="changelog-editor">
            <div v-for="(line, idx) in form.changelog" :key="idx" class="changelog-line">
              <el-input v-model="form.changelog[idx]" size="small" placeholder="输入更新内容" />
              <el-icon class="remove-line" @click="form.changelog.splice(idx, 1)"><Close /></el-icon>
            </div>
            <el-button size="small" type="primary" plain @click="form.changelog.push('')">+ 添加一条</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Close } from '@element-plus/icons-vue'
import {
  getAppVersions,
  createAppVersion,
  updateAppVersion,
  updateVersionStatus,
  deleteAppVersion,
} from '../api/appVersions'

const loading = ref(false)
const saving = ref(false)
const versions = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const filters = reactive({ app_name: '', platform: '', status: '' })
const showDialog = ref(false)
const editingId = ref(null)
const form = reactive({
  app_name: 'measure-app',
  platform: 'android',
  version: '',
  build_number: 1,
  min_required_version: '',
  update_type: 'recommended',
  download_url: '',
  changelog: [],
})

const statusMap = { draft: '草稿', published: '已发布', archived: '已归档' }
const statusTypeMap = { draft: 'info', published: 'success', archived: 'warning' }
const updateTypeMap = { none: '无更新', recommended: '推荐更新', required: '强制更新' }
const updateTypeTagMap = { none: 'info', recommended: 'primary', required: 'danger' }

function statusLabel(s) { return statusMap[s] || s }
function statusTag(s) { return statusTypeMap[s] || 'info' }
function updateTypeLabel(t) { return updateTypeMap[t] || t }
function updateTypeTag(t) { return updateTypeTagMap[t] || 'info' }
function formatDate(d) { return d ? new Date(d).toLocaleString('zh-CN') : '' }

async function loadVersions() {
  loading.value = true
  try {
    const params = { page: page.value, limit: pageSize.value }
    if (filters.app_name) params.app_name = filters.app_name
    if (filters.platform) params.platform = filters.platform
    if (filters.status) params.status = filters.status
    const res = await getAppVersions(params)
    versions.value = res.data || []
    total.value = res.pagination?.total || 0
  } catch {
    versions.value = []
  } finally {
    loading.value = false
  }
}

function resetForm() {
  editingId.value = null
  form.app_name = 'measure-app'
  form.platform = 'android'
  form.version = ''
  form.build_number = 1
  form.min_required_version = ''
  form.update_type = 'recommended'
  form.download_url = ''
  form.changelog = []
}

function openCreateDialog() {
  resetForm()
  showDialog.value = true
}

function openEditDialog(row) {
  editingId.value = row.id
  form.app_name = row.app_name
  form.platform = row.platform
  form.version = row.version
  form.build_number = row.build_number
  form.min_required_version = row.min_required_version || ''
  form.update_type = row.update_type || 'recommended'
  form.download_url = row.download_url || ''
  form.changelog = row.changelog ? [...row.changelog] : []
  showDialog.value = true
}

async function handleSave() {
  if (!form.version) return ElMessage.warning('请填写版本号')
  if (!form.build_number) return ElMessage.warning('请填写构建号')

  saving.value = true
  try {
    const payload = {
      app_name: form.app_name,
      platform: form.platform,
      version: form.version,
      build_number: form.build_number,
      min_required_version: form.min_required_version || null,
      update_type: form.update_type,
      download_url: form.download_url || null,
      changelog: form.changelog.filter(Boolean),
    }

    if (editingId.value) {
      await updateAppVersion(editingId.value, payload)
      ElMessage.success('版本更新成功')
    } else {
      await createAppVersion(payload)
      ElMessage.success('版本创建成功')
    }
    showDialog.value = false
    loadVersions()
  } catch (err) {
    ElMessage.error(err.response?.data?.message || err.response?.data?.error || '操作失败')
  } finally {
    saving.value = false
  }
}

async function publishVersion(row) {
  try {
    await ElMessageBox.confirm(`确定发布版本 ${row.version} 吗？发布后用户将收到更新提示。`, '确认发布', { type: 'warning' })
    await updateVersionStatus(row.id, 'published')
    ElMessage.success('版本已发布')
    loadVersions()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('发布失败')
  }
}

async function archiveVersion(row) {
  try {
    await ElMessageBox.confirm(`确定下架版本 ${row.version} 吗？`, '确认下架', { type: 'warning' })
    await updateVersionStatus(row.id, 'archived')
    ElMessage.success('版本已下架')
    loadVersions()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('下架失败')
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除版本 ${row.version} 吗？此操作不可恢复。`, '确认删除', { type: 'warning' })
    await deleteAppVersion(row.id)
    ElMessage.success('版本已删除')
    loadVersions()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error(err.response?.data?.message || err.response?.data?.error || '删除失败')
  }
}

onMounted(() => { loadVersions() })
</script>

<style scoped>
.page-desc { color: var(--color-text-tertiary); font-size: var(--font-size-sm); margin-top: var(--space-1); }
.filter-card { margin-bottom: var(--space-4); }
.version-text { font-family: 'SF Mono', 'Consolas', monospace; font-weight: 600; }
.changelog-text { color: var(--color-text-secondary); font-size: var(--font-size-xs); }
.text-muted { color: var(--color-text-placeholder); font-size: var(--font-size-xs); }

.changelog-editor { width: 100%; }
.changelog-line { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.changelog-line .el-input { flex: 1; }
.remove-line { color: var(--color-text-tertiary); cursor: pointer; font-size: 16px; transition: color 0.15s; }
.remove-line:hover { color: var(--color-danger); }
</style>
