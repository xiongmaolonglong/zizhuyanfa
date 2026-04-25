<template>
  <div>
    <h1 class="page-title">个人设置</h1>

    <el-card class="mb-16">
      <template #header><span>基本信息</span></template>
      <el-form :model="form" label-width="80px" style="max-width:400px">
        <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model="form.phone" disabled /></el-form-item>
        <el-form-item label="角色"><el-tag>{{ roleText(form.role) }}</el-tag></el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <template #header><span>修改密码</span></template>
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordRef" label-width="100px" style="max-width:400px">
        <el-form-item label="当前密码" prop="old_password">
          <el-input v-model="passwordForm.old_password" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="new_password">
          <el-input v-model="passwordForm.new_password" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm_password">
          <el-input v-model="passwordForm.confirm_password" type="password" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleChangePassword">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '../store/auth'
import { ElMessage } from 'element-plus'
import api from '../api'

const auth = useAuthStore()
const form = reactive({
  name: auth.user?.name || '',
  phone: auth.user?.phone || '',
  role: auth.user?.role || ''
})
const passwordRef = ref()
const passwordForm = reactive({ old_password: '', new_password: '', confirm_password: '' })
const passwordRules = {
  old_password: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  new_password: [{ required: true, message: '请输入新密码', trigger: 'blur' }, { min: 6, message: '至少 6 位', trigger: 'blur' }],
  confirm_password: [{ required: true, message: '请再次输入新密码', trigger: 'blur' }]
}

function roleText(r) {
  const map = { leader: '部门领导', staff: '业务员', admin: '管理员', manager: '管理员' }
  return map[r] || r
}

async function handleChangePassword() {
  await passwordRef.value.validate()
  if (passwordForm.new_password !== passwordForm.confirm_password) {
    ElMessage.error('两次密码不一致')
    return
  }
  try {
    await api.post('/auth/change-password', { old_password: passwordForm.old_password, new_password: passwordForm.new_password })
    ElMessage.success('密码修改成功')
    passwordForm.old_password = ''
    passwordForm.new_password = ''
    passwordForm.confirm_password = ''
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '密码修改失败')
  }
  passwordForm.old_password = ''
  passwordForm.new_password = ''
  passwordForm.confirm_password = ''
}
</script>

<style scoped>
.page-title { font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px; }
.mb-16 { margin-bottom: 16px; }
</style>
