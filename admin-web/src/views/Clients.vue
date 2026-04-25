<template>
  <div>
    <div class="page-header flex-between">
      <h1 class="page-title">甲方管理</h1>
      <el-button type="primary" @click="showAddClient = true">+ 新增甲方企业</el-button>
    </div>

    <!-- 默认甲方企业 -->
    <el-card class="mb-16 default-client-card">
      <div class="default-client-row">
        <div>
          <div class="default-client-title">默认甲方企业</div>
          <div class="default-client-desc">设置后补录工单等环节自动带出该企业</div>
        </div>
        <div class="default-client-controls">
          <el-switch v-model="defaultClientEnabled" active-text="启用" @change="saveDefaultClient" />
          <el-select
            v-model="defaultClientId"
            placeholder="选择默认甲方"
            style="width: 220px; margin-left: 12px"
            :disabled="!defaultClientEnabled"
            @change="saveDefaultClient"
          >
            <el-option v-for="c in clientOptions" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </div>
      </div>
    </el-card>

    <!-- 甲方企业列表 -->
    <el-table :data="clients" stripe v-loading="loading" class="mb-20">
      <el-table-column prop="name" label="企业名称" min-width="180" />
      <el-table-column label="管理员权限" width="110" align="center">
        <template #default="{ row }">
          <el-switch
            v-model="row.is_admin"
            size="small"
            active-text="管理员"
            inactive-text="普通"
            @change="toggleClientAdmin(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="审批" width="80">
        <template #default="{ row }">
          <el-tag size="small" :type="row.approval_enabled ? 'success' : 'info'">
            {{ row.approval_enabled ? '需审批' : '无需' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="contact_name" label="联系人" width="100" />
      <el-table-column prop="contact_phone" label="联系电话" width="130" />
      <el-table-column label="登录链接" width="200">
        <template #default="{ row }">
          <div class="login-link-cell">
            <el-link :href="clientLoginUrl" target="_blank" type="primary">{{ clientLoginUrl }}</el-link>
            <el-button size="small" link type="success" @click="copyLoginLink(row)">复制</el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" link type="primary" @click="openDepartments(row)">部门管理</el-button>
          <el-button size="small" link type="primary" @click="editClient(row)">编辑</el-button>
          <el-button size="small" link type="danger" @click="deleteClient(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑甲方对话框 -->
    <el-dialog v-model="showAddClient" :title="editingClient ? '编辑甲方企业' : '新增甲方企业'" width="480px">
      <el-form :model="clientForm" label-width="80px" ref="clientFormRef" :rules="clientRules">
        <el-form-item label="企业名称" prop="name">
          <el-input v-model="clientForm.name" placeholder="请输入企业名称" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="clientForm.contact_name" placeholder="联系人姓名" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="clientForm.contact_phone" placeholder="联系电话" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="clientForm.contact_email" placeholder="邮箱地址" />
        </el-form-item>
        <el-form-item label="启用审批">
          <el-switch v-model="clientForm.approval_enabled" active-text="需审批" inactive-text="无需审批" />
          <div class="form-hint">启用后，甲方申报需内部审批通过才流转到派单环节</div>
        </el-form-item>
        <el-form-item label="管理员权限">
          <el-switch v-model="clientForm.is_admin" active-text="管理员" inactive-text="普通甲方" />
          <div class="form-hint">开启后，该甲方将拥有管理员权限，可访问管理功能和查看所有数据</div>
        </el-form-item>
      </el-form>

      <!-- 设置登录账号（仅编辑模式） -->
      <el-divider v-if="editingClient">设置登录账号</el-divider>
      <el-form v-if="editingClient" :model="accountForm" label-width="80px">
        <el-form-item label="登录手机">
          <el-input v-model="accountForm.phone" placeholder="甲方登录手机号" />
        </el-form-item>
        <el-form-item label="登录密码">
          <el-input v-model="accountForm.password" placeholder="留空则不修改密码" show-password />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="accountForm.name" placeholder="甲方登录姓名" />
        </el-form-item>
      </el-form>
      <el-alert v-if="editingClient && accountForm.phone" type="info" :closable="false" style="margin-top: 12px">
        <template #title>
          甲方登录地址：<strong>{{ clientLoginUrl }}</strong>
          <el-button size="small" link type="primary" style="margin-left: 8px" @click="copyLoginLink(editingClient)">复制链接</el-button>
        </template>
      </el-alert>

      <template #footer>
        <el-button @click="showAddClient = false">取消</el-button>
        <el-button type="primary" @click="saveClient" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 部门/人员管理对话框 -->
    <el-dialog v-model="showDeptDialog" :title="'部门与人员 — ' + (selectedClient?.name || '')" width="700px" top="5vh">
      <div class="dept-toolbar">
        <el-button size="small" type="primary" @click="showAddDept = true">+ 新增部门</el-button>
      </div>
      <div v-for="dept in depts" :key="dept.id" class="dept-card">
        <div class="dept-header">
          <span class="dept-name">{{ dept.name }}</span>
          <div>
            <el-button size="small" link type="primary" @click="showAddUser = dept.id">+ 添加人员</el-button>
            <el-button size="small" link type="danger" @click="deleteDept(dept)">删除</el-button>
          </div>
        </div>
        <el-table :data="getUsersForDept(dept)" size="small" v-if="getUsersForDept(dept).length" class="mt-8">
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="phone" label="电话" width="130" />
          <el-table-column label="角色" width="80">
            <template #default="{ row }">
              <el-tag size="small" :type="row.role === 'manager' ? 'warning' : 'info'">
                {{ row.role === 'manager' ? '管理员' : '普通' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="email" label="邮箱" min-width="120" />
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button size="small" link type="primary" @click="resetUserPassword(row)">重置密码</el-button>
              <el-button size="small" link type="danger" @click="deleteUser(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-else class="empty-hint">暂无人员</div>
      </div>
    </el-dialog>

    <!-- 添加部门 -->
    <el-dialog v-model="showAddDept" title="新增部门" width="400px" append-to-body>
      <el-form>
        <el-form-item label="部门名称">
          <el-input v-model="newDeptName" placeholder="如：市场部" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDept = false">取消</el-button>
        <el-button type="primary" @click="createDept">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加人员 -->
    <el-dialog v-model="showAddUser" title="添加人员" width="400px" append-to-body>
      <el-form :model="userForm" label-width="60px" ref="userFormRef" :rules="userRules">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="userForm.name" placeholder="姓名" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="userForm.phone" placeholder="手机号" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="userForm.password" placeholder="登录密码" show-password />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="userForm.role" style="width: 100%">
            <el-option label="管理员" value="manager" />
            <el-option label="普通用户" value="staff" />
          </el-select>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="userForm.email" placeholder="邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddUser = false">取消</el-button>
        <el-button type="primary" @click="createUser">确定</el-button>
      </template>
    </el-dialog>
    <!-- 重置密码 -->
    <el-dialog v-model="showResetPwd" :title="'重置密码 — ' + (resetTarget?.name || '')" width="400px" append-to-body>
      <el-form>
        <el-form-item label="新密码">
          <el-input v-model="newPassword" placeholder="输入新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showResetPwd = false">取消</el-button>
        <el-button type="primary" @click="submitResetPassword">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'
import { logger } from '../utils/logger'

const loading = ref(false)
const saving = ref(false)
const clients = ref([])

// 甲方登录地址
const clientLoginUrl = computed(() => {
  const host = window.location.hostname
  return `https://${host}/client/`
})

function copyLoginLink(row) {
  const text = `${clientLoginUrl.value}\n账号：用甲方人员手机号登录\n密码：创建人员时设置的密码`
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('登录链接已复制')
  }).catch(() => {
    ElMessage.warning('复制失败，请手动复制')
  })
}

// 默认甲方
const clientOptions = ref([])
const defaultClientId = ref(null)
const defaultClientEnabled = ref(false)

async function loadDefaultClient() {
  try {
    const res = await api.get('/clients/default')
    if (res.code === 0 && res.data) {
      defaultClientId.value = res.data.default_client_id || null
      defaultClientEnabled.value = !!res.data.default_client_id
    }
  } catch (e) {
    logger.error('加载默认甲方失败:', e)
  }
}

async function saveDefaultClient() {
  try {
    const clientId = defaultClientEnabled.value ? defaultClientId.value : null
    await api.put('/clients/default', { client_id: clientId })
    ElMessage.success('默认甲方设置已保存')
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '设置失败')
    loadDefaultClient()
  }
}

async function loadClientOptions() {
  try {
    const res = await api.get('/clients')
    const payload = res.data || {}
    clientOptions.value = Array.isArray(payload) ? payload : (payload.list || [])
  } catch (e) {
    logger.error('加载甲方列表失败:', e)
  }
}

const showAddClient = ref(false)
const editingClient = ref(null)
const clientForm = reactive({ name: '', contact_name: '', contact_phone: '', contact_email: '', approval_enabled: false, is_admin: false })
const accountForm = reactive({ name: '', phone: '', password: '', role: 'staff' })
const clientFormRef = ref(null)
const clientRules = {
  name: [{ required: true, message: '企业名称为必填项', trigger: 'blur' }]
}

// 部门与人员
const showDeptDialog = ref(false)
const showAddDept = ref(false)
const showAddUser = ref(false)
const selectedClient = ref(null)
const depts = ref([])
const deptUsers = ref([])
const newDeptName = ref('')
const userForm = reactive({ name: '', phone: '', password: '', email: '', role: 'staff' })
const userFormRef = ref(null)
const userRules = {
  name: [{ required: true, message: '姓名为必填项', trigger: 'blur' }],
  phone: [{ required: true, message: '手机号为必填项', trigger: 'blur' }],
  password: [{ required: true, message: '密码为必填项', trigger: 'blur' }]
}

// 重置密码
const showResetPwd = ref(false)
const resetTarget = ref(null)
const newPassword = ref('')

async function loadClients() {
  loading.value = true
  try {
    const res = await api.get('/clients')
    const payload = res.data || {}
    clients.value = Array.isArray(payload) ? payload : (payload.list || [])
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '加载失败')
  } finally {
    loading.value = false
  }
}

async function toggleClientAdmin(row) {
  try {
    await api.put(`/clients/${row.id}`, { is_admin: row.is_admin })
    // 同步更新该甲方下首个登录用户的角色
    try {
      const userRes = await api.get(`/clients/${row.id}/users`)
      const users = userRes.data || []
      const list = Array.isArray(users) ? users : (users.list || [])
      if (list.length > 0) {
        await api.put(`/clients/${row.id}/users/${list[0].id}`, {
          role: row.is_admin ? 'manager' : 'staff',
        })
      }
    } catch {}
    ElMessage.success(`${row.name} 管理员权限已${row.is_admin ? '开启' : '关闭'}`)
  } catch {
    ElMessage.error('设置失败')
    row.is_admin = !row.is_admin
  }
}

function editClient(row) {
  editingClient.value = row
  Object.assign(clientForm, { name: row.name, contact_name: row.contact_name || '', contact_phone: row.contact_phone || '', contact_email: row.contact_email || '', approval_enabled: row.approval_enabled || false, is_admin: !!row.is_admin })
  Object.assign(accountForm, { name: '', phone: '', password: '', role: !!row.is_admin ? 'manager' : 'staff' })
  // 加载该甲方的现有登录账号（会覆盖 role）
  loadClientAccount(row.id)
  showAddClient.value = true
}

async function loadClientAccount(clientId) {
  try {
    const res = await api.get(`/clients/${clientId}/users`)
    const users = res.data || []
    const list = Array.isArray(users) ? users : (users.list || [])
    if (list.length > 0) {
      Object.assign(accountForm, {
        name: list[0].name || '',
        phone: list[0].phone || '',
        password: '',
        role: list[0].role || 'staff'
      })
    }
  } catch {}
}

async function saveClient() {
  const valid = await clientFormRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (editingClient.value) {
      await api.put(`/clients/${editingClient.value.id}`, clientForm)
      // 同步保存登录账号
      if (accountForm.phone || accountForm.password) {
        const res = await api.get(`/clients/${editingClient.value.id}/users`)
        const users = res.data || []
        const list = Array.isArray(users) ? users : (users.list || [])
        if (list.length > 0) {
          // 更新已有账号（同步 is_admin 到 role）
          await api.put(`/clients/${editingClient.value.id}/users/${list[0].id}`, {
            name: accountForm.name || list[0].name,
            phone: accountForm.phone || list[0].phone,
            role: clientForm.is_admin ? 'manager' : 'staff',
            ...(accountForm.password ? { password: accountForm.password } : {}),
          })
        } else {
          // 创建新账号（根据 is_admin 设置角色）
          await api.post(`/clients/${editingClient.value.id}/users`, {
            name: accountForm.name || clientForm.contact_name || clientForm.name,
            phone: accountForm.phone,
            password: accountForm.password,
            role: clientForm.is_admin ? 'manager' : 'staff',
            department_id: null,
          })
        }
      }
      ElMessage.success('编辑成功')
    } else {
      await api.post('/clients', clientForm)
      ElMessage.success('创建成功')
    }
    showAddClient.value = false
    resetClientForm()
    loadClients()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  } finally {
    saving.value = false
  }
}

function resetClientForm() {
  editingClient.value = null
  Object.assign(clientForm, { name: '', contact_name: '', contact_phone: '', contact_email: '', approval_enabled: false, is_admin: false })
  Object.assign(accountForm, { name: '', phone: '', password: '', role: 'staff' })
}

async function deleteClient(row) {
  try {
    await ElMessageBox.confirm(`确定删除甲方企业「${row.name}」吗？`, '提示', { type: 'warning' })
    await api.delete(`/clients/${row.id}`)
    ElMessage.success('已删除')
    loadClients()
  } catch {
    ElMessage.error('操作失败')
  }
}

async function openDepartments(row) {
  selectedClient.value = row
  showDeptDialog.value = true
  try {
    const [deptRes, userRes] = await Promise.all([
      api.get(`/clients/${row.id}/departments`),
      api.get(`/clients/${row.id}/users`)
    ])
    const dp = deptRes.data || {}
    depts.value = Array.isArray(dp) ? dp : (dp.list || [])
    const up = userRes.data || {}
    deptUsers.value = Array.isArray(up) ? up : (up.list || [])
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '加载部门失败')
  }
}

function getUsersForDept(dept) {
  return deptUsers.value.filter(u => u.department_id === dept.id)
}

async function createDept() {
  if (!newDeptName.value) return ElMessage.warning('部门名称不能为空')
  try {
    await api.post(`/clients/${selectedClient.value.id}/departments`, { name: newDeptName.value })
    ElMessage.success('部门已创建')
    showAddDept.value = false
    newDeptName.value = ''
    openDepartments(selectedClient.value)
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '创建失败')
  }
}

async function deleteDept(dept) {
  try {
    await ElMessageBox.confirm(`确定删除部门「${dept.name}」吗？`, '提示', { type: 'warning' })
    await api.delete(`/clients/${selectedClient.value.id}/departments/${dept.id}`)
    ElMessage.success('已删除')
    openDepartments(selectedClient.value)
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.response?.data?.error || '操作失败')
  }
}

async function createUser() {
  const valid = await userFormRef.value.validate().catch(() => false)
  if (!valid) return
  try {
    await api.post(`/clients/${selectedClient.value.id}/users`, { ...userForm })
    ElMessage.success('人员已添加')
    showAddUser.value = false
    Object.assign(userForm, { name: '', phone: '', password: '', email: '', role: 'staff' })
    openDepartments(selectedClient.value)
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '添加失败')
  }
}

async function deleteUser(row) {
  try {
    await ElMessageBox.confirm(`确定删除人员「${row.name}」吗？`, '提示', { type: 'warning' })
    await api.delete(`/clients/${selectedClient.value.id}/users/${row.id}`)
    ElMessage.success('已删除')
    openDepartments(selectedClient.value)
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.response?.data?.error || '操作失败')
  }
}

function resetUserPassword(row) {
  resetTarget.value = row
  newPassword.value = ''
  showResetPwd.value = true
}

async function submitResetPassword() {
  if (!newPassword.value) return ElMessage.warning('密码不能为空')
  try {
    await api.put(`/clients/${selectedClient.value.id}/users/${resetTarget.value.id}`, { password: newPassword.value })
    ElMessage.success(`「${resetTarget.value.name}」的密码已重置为「${newPassword.value}」`)
    showResetPwd.value = false
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '重置失败')
  }
}

onMounted(() => {
  loadClients()
  loadDefaultClient()
  loadClientOptions()
})
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.mb-20 { margin-bottom: 20px; }
.mb-16 { margin-bottom: 16px; }
.dept-toolbar { margin-bottom: 12px; }
.dept-card { border: 1px solid var(--color-border-light); border-radius: var(--radius-sm); padding: var(--space-3) var(--space-4); margin-bottom: var(--space-3); }
.dept-header { display: flex; justify-content: space-between; align-items: center; }
.dept-name { font-weight: var(--font-weight-medium); font-size: var(--font-size-base); }
.mt-8 { margin-top: 8px; }
.empty-hint { color: var(--color-text-placeholder); font-size: var(--font-size-sm); text-align: center; padding: var(--space-2) 0; }
.default-client-card { background: var(--color-bg-page); }
.default-client-row { display: flex; justify-content: space-between; align-items: center; }
.default-client-title { font-weight: var(--font-weight-medium); font-size: var(--font-size-base); }
.default-client-desc { font-size: var(--font-size-xs); color: var(--color-text-tertiary); margin-top: var(--space-1); }
.default-client-controls { display: flex; align-items: center; }
.login-link-cell { display: flex; align-items: center; gap: 8px; }
.form-hint { font-size: 12px; color: var(--color-text-tertiary); margin-top: 4px; }
</style>
