<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="login-bg-pattern"></div>
    </div>
    <div class="login-card">
      <div class="login-header">
        <div class="logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </div>
        <h1>邦和广告管理系统</h1>
        <p>广告商后台</p>
      </div>
      <el-form :model="form" :rules="rules" ref="formRef" class="login-form">
        <el-form-item prop="phone">
          <el-input v-model="form.phone" placeholder="手机号" size="large" clearable>
            <template #prefix>
              <el-icon><Phone /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" size="large"
            show-password @keyup.enter="handleLogin">
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="rememberMe">记住手机号</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width:100%" :loading="loading"
            @click="handleLogin">登 录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { ElMessage } from 'element-plus'
import { Phone, Lock } from '@element-plus/icons-vue'
import api from '../api'

const router = useRouter()
const auth = useAuthStore()
const formRef = ref()
const loading = ref(false)

const form = reactive({ phone: '', password: '' })
const rememberMe = ref(false)
const rules = {
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

// 记住手机号
onMounted(() => {
  const saved = localStorage.getItem('remembered_phone')
  if (saved) {
    form.phone = saved
    rememberMe.value = true
  }
})

async function handleLogin() {
  await formRef.value.validate()
  loading.value = true
  // 记住/清除手机号
  if (rememberMe.value) {
    localStorage.setItem('remembered_phone', form.phone)
  } else {
    localStorage.removeItem('remembered_phone')
  }
  try {
    const res = await api.post('/auth/tenant/login', form)
    auth.login(res.data.token, res.data.user)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (err) {
    ElMessage.error('账号或密码错误')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e293b 100%);
}

.login-bg-pattern {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 50%, rgba(37, 99, 235, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 40%),
    radial-gradient(circle at 60% 80%, rgba(16, 185, 129, 0.08) 0%, transparent 40%);
}

.login-card {
  position: relative;
  z-index: 1;
  width: 420px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-lg);
  padding: var(--space-10) var(--space-8);
  box-shadow: var(--shadow-lg), 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.login-header { text-align: center; margin-bottom: var(--space-8); }

.logo-icon {
  width: 56px;
  height: 56px;
  background: var(--color-primary);
  border-radius: var(--radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: var(--space-4);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.login-header h1 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}

.login-header p {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}

.login-form { margin-top: var(--space-6); }

.login-form :deep(.el-input__wrapper) {
  padding: var(--space-1) var(--space-3);
  box-shadow: 0 0 0 1px var(--color-border-base) inset;
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--color-primary-light) inset;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--color-primary) inset;
}

.login-form :deep(.el-form-item) {
  margin-bottom: var(--space-5);
}

.login-form :deep(.el-button--primary) {
  height: 44px;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.05em;
}

</style>
