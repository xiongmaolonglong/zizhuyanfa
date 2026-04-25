<template>
  <div>
    <h1 class="page-title">系统配置</h1>

    <el-tabs v-model="activeTab">
      <!-- Tab 1: Address Management -->
      <el-tab-pane label="地址库管理" name="address">
        <div class="tab-header">
          <span>四级地址数据管理（省/市/区/街道）</span>
          <el-button type="primary" disabled>导入地址库</el-button>
        </div>
        <el-empty description="地址库功能开发中" />
      </el-tab-pane>

      <!-- Tab 2: Notification Templates -->
      <el-tab-pane label="通知模板" name="templates">
        <el-empty description="通知模板功能开发中" />
      </el-tab-pane>

      <!-- Tab 3: Timeout Settings -->
      <el-tab-pane label="超时阈值" name="timeout">
        <el-card>
          <template #header><span>全局默认超时天数</span></template>
          <el-form :model="timeoutForm" label-width="120px" style="max-width:400px" v-loading="loading">
            <el-form-item label="测量超时">
              <el-input-number v-model="timeoutForm.measurement" :min="1" :max="30" />
              <span class="unit">天</span>
            </el-form-item>
            <el-form-item label="设计超时">
              <el-input-number v-model="timeoutForm.design" :min="1" :max="30" />
              <span class="unit">天</span>
            </el-form-item>
            <el-form-item label="生产超时">
              <el-input-number v-model="timeoutForm.production" :min="1" :max="30" />
              <span class="unit">天</span>
            </el-form-item>
            <el-form-item label="施工超时">
              <el-input-number v-model="timeoutForm.construction" :min="1" :max="30" />
              <span class="unit">天</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveTimeout" :loading="saving">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSettings, updateSettings } from '../api/tenants'

const activeTab = ref('address')
const loading = ref(false)
const saving = ref(false)

const timeoutForm = reactive({ measurement: 3, design: 5, production: 7, construction: 10 })

async function loadSettings() {
  loading.value = true
  try {
    const res = await getSettings()
    const data = res.data || {}
    if (data.timeout_threshold) {
      timeoutForm.measurement = data.timeout_threshold
      timeoutForm.design = data.timeout_threshold + 2
      timeoutForm.production = data.timeout_threshold + 4
      timeoutForm.construction = data.timeout_threshold + 7
    }
  } catch {
    // use defaults
  } finally {
    loading.value = false
  }
}

async function saveTimeout() {
  saving.value = true
  try {
    await updateSettings({
      timeout_threshold: timeoutForm.measurement,
      enable_notification: true,
      enable_auto_assign: false
    })
    ElMessage.success('超时阈值已保存')
  } catch {
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.page-title { font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px; }
.tab-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.unit { margin-left: 8px; color: #8c8c8c; }
</style>
