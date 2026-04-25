<template>
  <div>
    <h1 class="page-title">组织架构</h1>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="部门管理" name="departments">
        <div class="toolbar" v-if="isManager">
          <el-button type="primary" @click="openDeptDialog()">添加部门</el-button>
        </div>
        <el-table :data="departments" stripe v-loading="deptLoading">
          <el-table-column prop="name" label="部门名称" />
          <el-table-column prop="user_count" label="人数" width="100" />
          <el-table-column label="操作" width="150" v-if="isManager">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDeptDialog(row)">编辑</el-button>
              <el-popconfirm title="确定删除该部门吗？" @confirm="deleteDept(row.id)">
                <template #reference>
                  <el-button link type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="人员管理" name="users">
        <div class="toolbar" v-if="isManager">
          <el-button type="primary" @click="openUserDialog()">添加人员</el-button>
        </div>
        <el-table :data="users" stripe v-loading="userLoading">
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="phone" label="手机号" width="140" />
          <el-table-column label="部门" width="120">
            <template #default="{ row }">
              {{ getDeptName(row.department_id) || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="角色" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="row.role === 'manager' ? 'warning' : 'info'">
                {{ row.role === 'manager' ? '管理员' : '普通用户' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="row.status === 'active' ? 'success' : 'danger'">
                {{ row.status === 'active' ? '正常' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" v-if="isManager">
            <template #default="{ row }">
              <el-button link type="primary" @click="openUserDialog(row)">编辑</el-button>
              <el-button link type="warning" @click="openResetPwdDialog(row)">重置密码</el-button>
              <el-popconfirm title="确定删除该人员吗？" @confirm="deleteUser(row.id)">
                <template #reference>
                  <el-button link type="danger" :disabled="row.id === currentUserId">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 部门对话框 -->
    <el-dialog v-model="deptDialogVisible" :title="deptForm.id ? '编辑部门' : '添加部门'" width="400px">
      <el-form :model="deptForm" label-width="80px">
        <el-form-item label="部门名称" required>
          <el-input v-model="deptForm.name" placeholder="请输入部门名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="deptDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveDept" :loading="deptSaving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 人员对话框 -->
    <el-dialog v-model="userDialogVisible" :title="userForm.id ? '编辑人员' : '添加人员'" width="500px">
      <el-form :model="userForm" label-width="80px">
        <el-form-item label="姓名" required>
          <el-input v-model="userForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号" required>
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="密码" :required="!userForm.id">
          <el-input v-model="userForm.password" :placeholder="userForm.id ? '留空则不修改' : '请输入密码'" type="password" />
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="userForm.department_id" placeholder="请选择部门" clearable style="width: 100%">
            <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="userForm.role" style="width: 100%">
            <el-option label="普通用户" value="staff" />
            <el-option label="管理员" value="manager" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" v-if="userForm.id">
          <el-select v-model="userForm.status" style="width: 100%">
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser" :loading="userSaving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog v-model="resetPwdVisible" title="重置密码" width="400px">
      <el-form :model="resetPwdForm" label-width="80px">
        <el-form-item label="人员">
          <span>{{ resetPwdForm.name }}</span>
        </el-form-item>
        <el-form-item label="新密码" required>
          <el-input v-model="resetPwdForm.password" placeholder="请输入新密码" type="password" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPwdVisible = false">取消</el-button>
        <el-button type="primary" @click="resetPassword" :loading="resetPwdSaving">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import { ElMessage } from 'element-plus'
import api from '../api'

const auth = useAuthStore()
const isManager = computed(() => auth.user?.role === 'manager')
const currentUserId = computed(() => auth.user?.id)

const activeTab = ref('departments')
const deptLoading = ref(false)
const userLoading = ref(false)
const departments = ref([])
const users = ref([])

// 部门对话框
const deptDialogVisible = ref(false)
const deptSaving = ref(false)
const deptForm = ref({ id: null, name: '' })

// 人员对话框
const userDialogVisible = ref(false)
const userSaving = ref(false)
const userForm = ref({ id: null, name: '', phone: '', password: '', department_id: null, role: 'staff', status: 'active' })

// 重置密码
const resetPwdVisible = ref(false)
const resetPwdSaving = ref(false)
const resetPwdForm = ref({ id: null, name: '', password: '' })

function getDeptName(deptId) {
  const dept = departments.value.find(d => d.id === deptId)
  return dept?.name || ''
}

async function fetchDepts() {
  deptLoading.value = true
  try {
    const res = await api.get('/client-organization/departments')
    departments.value = res.data || []
  } catch { departments.value = [] }
  finally { deptLoading.value = false }
}

async function fetchUsers() {
  userLoading.value = true
  try {
    const res = await api.get('/client-organization/users')
    users.value = res.data || []
  } catch { users.value = [] }
  finally { userLoading.value = false }
}

// 部门操作
function openDeptDialog(dept = null) {
  deptForm.value = dept ? { id: dept.id, name: dept.name } : { id: null, name: '' }
  deptDialogVisible.value = true
}

async function saveDept() {
  if (!deptForm.value.name.trim()) {
    return ElMessage.warning('请输入部门名称')
  }
  deptSaving.value = true
  try {
    if (deptForm.value.id) {
      await api.put(`/client-organization/departments/${deptForm.value.id}`, { name: deptForm.value.name })
    } else {
      await api.post('/client-organization/departments', { name: deptForm.value.name })
    }
    ElMessage.success('保存成功')
    deptDialogVisible.value = false
    fetchDepts()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '保存失败')
  } finally {
    deptSaving.value = false
  }
}

async function deleteDept(id) {
  try {
    await api.delete(`/client-organization/departments/${id}`)
    ElMessage.success('删除成功')
    fetchDepts()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '删除失败')
  }
}

// 人员操作
function openUserDialog(user = null) {
  if (user) {
    userForm.value = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      password: '',
      department_id: user.department_id,
      role: user.role,
      status: user.status
    }
  } else {
    userForm.value = { id: null, name: '', phone: '', password: '', department_id: null, role: 'staff', status: 'active' }
  }
  userDialogVisible.value = true
}

async function saveUser() {
  if (!userForm.value.name.trim()) {
    return ElMessage.warning('请输入姓名')
  }
  if (!userForm.value.phone.trim()) {
    return ElMessage.warning('请输入手机号')
  }
  if (!userForm.value.id && !userForm.value.password) {
    return ElMessage.warning('请输入密码')
  }

  userSaving.value = true
  try {
    const data = {
      name: userForm.value.name,
      phone: userForm.value.phone,
      department_id: userForm.value.department_id,
      role: userForm.value.role,
    }
    if (userForm.value.password) {
      data.password = userForm.value.password
    }
    if (userForm.value.id) {
      data.status = userForm.value.status
      await api.put(`/client-organization/users/${userForm.value.id}`, data)
    } else {
      await api.post('/client-organization/users', data)
    }
    ElMessage.success('保存成功')
    userDialogVisible.value = false
    fetchUsers()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '保存失败')
  } finally {
    userSaving.value = false
  }
}

async function deleteUser(id) {
  try {
    await api.delete(`/client-organization/users/${id}`)
    ElMessage.success('删除成功')
    fetchUsers()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '删除失败')
  }
}

function openResetPwdDialog(user) {
  resetPwdForm.value = { id: user.id, name: user.name, password: '' }
  resetPwdVisible.value = true
}

async function resetPassword() {
  if (!resetPwdForm.value.password) {
    return ElMessage.warning('请输入新密码')
  }
  resetPwdSaving.value = true
  try {
    await api.post(`/client-organization/users/${resetPwdForm.value.id}/reset-password`, {
      password: resetPwdForm.value.password
    })
    ElMessage.success('密码重置成功')
    resetPwdVisible.value = false
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '重置失败')
  } finally {
    resetPwdSaving.value = false
  }
}

onMounted(() => { fetchDepts(); fetchUsers() })
</script>

<style scoped>
.page-title { font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px; }
.toolbar { margin-bottom: 16px; }
</style>
