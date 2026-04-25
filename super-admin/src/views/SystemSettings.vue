<template>
  <div>
    <h1 class="page-title">全局系统设置</h1>

    <el-card v-loading="loading">
      <el-form :model="form" label-width="120px">
        <el-form-item label="平台名称">
          <el-input v-model="form.platform_name" placeholder="广告工程全流程管理系统" />
        </el-form-item>
        <el-form-item label="工单号前缀">
          <el-input v-model="form.wo_prefix" placeholder="WO" />
        </el-form-item>
        <el-form-item label="默认超时天数">
          <el-input-number v-model="form.default_timeout_days" :min="1" :max="365" />
        </el-form-item>
        <el-form-item label="新租户自动开通">
          <el-switch v-model="form.auto_activate" active-text="开启" inactive-text="关闭" />
        </el-form-item>
        <el-form-item label="租户数量上限">
          <el-input-number v-model="form.tenant_limit" :min="0" :max="9999" />
          <span class="form-tip">0 表示不限制</span>
        </el-form-item>

        <el-divider />

        <el-form-item label="默认广告类型">
          <div v-for="(item, idx) in defaultAdTypes" :key="idx" class="tag-item">
            <el-tag closable @close="removeAdType(idx)">{{ item.label }}</el-tag>
          </div>
          <el-input v-model="newAdType" placeholder="输入后回车添加" style="width:200px" @keyup.enter="addAdType" />
        </el-form-item>
        <el-form-item label="默认项目模板">
          <div v-for="(item, idx) in defaultTemplates" :key="idx" class="tag-item">
            <el-tag closable @close="removeTemplate(idx)">{{ item }}</el-tag>
          </div>
          <el-input v-model="newTemplate" placeholder="输入后回车添加" style="width:200px" @keyup.enter="addTemplate" />
        </el-form-item>

        <el-divider />

        <el-form-item>
          <el-button type="primary" @click="saveSettings" :loading="saving">保存设置</el-button>
          <el-button @click="loadSettings">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const loading = ref(false)
const saving = ref(false)
const form = ref({
  platform_name: '广告工程全流程管理系统',
  wo_prefix: 'WO',
  default_timeout_days: 7,
  auto_activate: true,
  tenant_limit: 0,
})

const defaultAdTypes = ref([
  { value: 'daily', label: '日常' },
  { value: 'storefront', label: '门头招牌' },
  { value: 'indoor_ad', label: '室内广告' },
  { value: 'led_screen', label: 'LED大屏' },
])
const newAdType = ref('')

const defaultTemplates = ref(['日常', '节日活动', '门店开业'])
const newTemplate = ref('')

function addAdType() {
  const v = newAdType.value.trim()
  if (v && !defaultAdTypes.value.find(t => t.label === v)) {
    defaultAdTypes.value.push({ value: v, label: v })
  }
  newAdType.value = ''
}
function removeAdType(idx) {
  defaultAdTypes.value.splice(idx, 1)
}
function addTemplate() {
  const v = newTemplate.value.trim()
  if (v && !defaultTemplates.value.includes(v)) {
    defaultTemplates.value.push(v)
  }
  newTemplate.value = ''
}
function removeTemplate(idx) {
  defaultTemplates.value.splice(idx, 1)
}

async function loadSettings() {
  loading.value = true
  try {
    const res = await api.get('/admin/system-settings')
    if (res.code === 0 && res.data) {
      form.value = { ...form.value, ...res.data }
    }
  } catch {
    // 使用默认值
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  saving.value = true
  try {
    await api.put('/admin/system-settings', {
      ...form.value,
      default_ad_types: defaultAdTypes.value,
      default_templates: defaultTemplates.value,
    })
    ElMessage.success('设置已保存')
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => loadSettings())
</script>

<style scoped>
.page-title { font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 20px; }
.form-tip { color: #909399; font-size: 12px; margin-left: 8px; }
.tag-item { display: inline-block; margin: 4px; }
</style>
