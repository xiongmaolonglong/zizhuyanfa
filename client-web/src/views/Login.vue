<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-icon">C</div>
        <h1>邦和广告管理系统</h1>
        <p>甲方管理后台</p>
      </div>
      <el-form :model="form" :rules="rules" ref="formRef" class="login-form">
        <el-form-item prop="phone">
          <el-input v-model="form.phone" placeholder="手机号" size="large" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" size="large"
            prefix-icon="Lock" show-password @keyup.enter="handleLogin" />
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
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { ElMessage } from 'element-plus'
import api from '../api'

const router = useRouter()
const auth = useAuthStore()
const formRef = ref()
const loading = ref(false)

const form = reactive({ phone: '', password: '' })
const rules = {
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  await formRef.value.validate()
  loading.value = true
  try {
    const res = await api.post('/auth/client/login', form)
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
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ed 100%);
}
.login-card {
  width: 400px; background: #fff; border-radius: 12px; padding: 48px 36px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}
.login-header { text-align: center; margin-bottom: 36px; }
.logo-icon {
  width: 48px; height: 48px; background: #67c23a; border-radius: 12px;
  display: inline-flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-size: 22px; margin-bottom: 16px;
}
.login-header h1 { font-size: 22px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; }
.login-header p { color: #8c8c8c; font-size: 14px; }
.login-form { margin-top: 24px; }
</style>
