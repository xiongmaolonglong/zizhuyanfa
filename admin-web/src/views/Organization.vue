<template>
  <div>
    <div class="page-header"><h1 class="page-title">组织架构</h1></div>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="部门管理" name="departments">
        <div class="toolbar mb-16"><el-button type="primary" @click="openDeptDialog()">+ 创建部门</el-button></div>
        <el-table :data="departments" stripe v-loading="deptLoading">
          <el-table-column prop="name" label="部门名称" min-width="150" />
          <el-table-column prop="manager_name" label="负责人" width="100" />
          <el-table-column prop="user_count" label="人员数" width="80" />
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button size="small" @click="openDeptDialog(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDeleteDept(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-dialog v-model="showDeptDialog" :title="editingDept ? '编辑部门' : '创建部门'" width="480px">
          <el-form label-width="80px">
            <el-form-item label="部门名称"><el-input v-model="deptForm.name" placeholder="请输入部门名称" /></el-form-item>
            <el-form-item label="负责人">
              <el-select v-model="deptForm.manager_id" placeholder="请选择" style="width:100%" clearable>
                <el-option v-for="u in users" :key="u.id" :label="u.name" :value="u.id" />
              </el-select>
            </el-form-item>
          </el-form>
          <template #footer><el-button @click="showDeptDialog = false">取消</el-button><el-button type="primary" @click="handleSaveDept">确认</el-button></template>
        </el-dialog>
      </el-tab-pane>

      <el-tab-pane label="人员管理" name="users">
        <div class="toolbar mb-16">
          <el-input v-model="userFilter.keyword" placeholder="搜索姓名/手机号" clearable style="width:180px" class="mr-8" @change="fetchUsers" />
          <el-select v-model="userFilter.role" placeholder="全部角色" clearable class="mr-8" style="width:120px" @change="fetchUsers">
            <el-option label="管理员" value="admin" />
            <el-option label="派单员" value="dispatcher" />
            <el-option label="测量员" value="measurer" />
            <el-option label="设计师" value="designer" />
            <el-option label="生产管理员" value="producer" />
            <el-option label="施工队长" value="constructor" />
            <el-option label="财务" value="finance" />
          </el-select>
          <el-button type="primary" @click="openUserDialog()">+ 添加人员</el-button>
          <el-button type="danger" :disabled="!selectedUsers.length" @click="batchDelete">批量删除（{{ selectedUsers.length }}）</el-button>
        </div>
        <el-table :data="users" stripe v-loading="userLoading" @selection-change="handleUserSelection">
          <el-table-column type="selection" width="55" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="phone" label="手机号" width="130" />
          <el-table-column label="角色" width="120"><template #default="{ row }"><el-tag size="small" type="info">{{ roleLabel(row.role) }}</el-tag></template></el-table-column>
          <el-table-column prop="department_name" label="部门" width="100" />
          <el-table-column label="状态" width="90"><template #default="{ row }"><el-tag size="small" :type="row.status === 'active' ? 'success' : 'danger'">{{ row.status === 'active' ? '正常' : '禁用' }}</el-tag></template></el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button size="small" @click="openUserDialog(row)">编辑</el-button>
              <el-button size="small" @click="handleResetPassword(row)">重置密码</el-button>
              <el-button size="small" type="danger" @click="handleDeleteUser(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-if="userTotal > userFilter.limit"
          class="mt-16"
          layout="prev, pager, next"
          :total="userTotal"
          :page-size="userFilter.limit"
          :current-page="userFilter.page"
          @current-change="handleUserPageChange"
        />
        <el-dialog v-model="showUserDialog" :title="editingUser ? '编辑人员' : '添加人员'" width="480px">
          <el-form label-width="80px">
            <el-form-item label="姓名"><el-input v-model="userForm.name" /></el-form-item>
            <el-form-item label="手机号"><el-input v-model="userForm.phone" /></el-form-item>
            <el-form-item v-if="!editingUser" label="密码"><el-input v-model="userForm.password" type="password" /></el-form-item>
            <el-form-item label="角色">
              <el-select v-model="userForm.role" style="width:100%">
                <el-option label="管理员" value="admin" />
                <el-option label="派单员" value="dispatcher" />
                <el-option label="测量员/施工员" value="measurer" />
                <el-option label="设计师" value="designer" />
                <el-option label="生产管理员" value="producer" />
                <el-option label="施工队长" value="constructor" />
                <el-option label="财务" value="finance" />
              </el-select>
            </el-form-item>
            <el-form-item label="部门">
              <el-select v-model="userForm.department_id" style="width:100%" clearable>
                <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
              </el-select>
            </el-form-item>
          </el-form>
          <template #footer><el-button @click="showUserDialog = false">取消</el-button><el-button type="primary" @click="handleSaveUser">确认</el-button></template>
        </el-dialog>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

const ROLE_MAP = {
  admin: '管理员', dispatcher: '派单员', measurer: '测量员',
  designer: '设计师', producer: '生产管理员', constructor: '施工队长',
  finance: '财务',
}
function roleLabel(r) { return ROLE_MAP[r] || r }

const activeTab = ref('departments')

// ========== 部门 ==========
const departments = ref([])
const deptLoading = ref(false)
const showDeptDialog = ref(false)
const editingDept = ref(null)
const deptForm = reactive({ name: '', manager_id: '' })

async function fetchDepts() {
  deptLoading.value = true
  try {
    const res = await api.get('/tenant/departments')
    departments.value = res.data || res || []
  } catch {
    departments.value = []
  } finally {
    deptLoading.value = false
  }
}

function openDeptDialog(row) {
  if (row) {
    editingDept.value = row
    deptForm.name = row.name
    deptForm.manager_id = row.manager_id || ''
  } else {
    editingDept.value = null
    deptForm.name = ''
    deptForm.manager_id = ''
  }
  showDeptDialog.value = true
}

async function handleSaveDept() {
  if (!deptForm.name) return ElMessage.warning('部门名称不能为空')
  try {
    if (editingDept.value) {
      await api.put(`/tenant/departments/${editingDept.value.id}`, deptForm)
      ElMessage.success('部门更新成功')
    } else {
      await api.post('/tenant/departments', deptForm)
      ElMessage.success('部门创建成功')
    }
    showDeptDialog.value = false
    await fetchDepts()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  }
}

async function handleDeleteDept(row) {
  try {
    await ElMessageBox.confirm(`确定删除部门「${row.name}」吗？`, '确认删除', { type: 'warning' })
    await api.delete(`/tenant/departments/${row.id}`)
    ElMessage.success('部门已删除')
    await fetchDepts()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.response?.data?.error || '删除失败')
  }
}

// ========== 人员 ==========
const users = ref([])
const userLoading = ref(false)
const userTotal = ref(0)
const showUserDialog = ref(false)
const editingUser = ref(null)
const userForm = reactive({ name: '', phone: '', password: '', role: '', department_id: '' })
const userFilter = reactive({ role: '', page: 1, limit: 20, keyword: '' })
const selectedUsers = ref([])

function handleUserSelection(rows) {
  selectedUsers.value = rows
}

async function batchDelete() {
  if (!selectedUsers.value.length) return
  try {
    await ElMessageBox.confirm(`确定删除 ${selectedUsers.value.length} 名人员吗？`, '确认删除', { type: 'warning' })
    for (const user of selectedUsers.value) {
      await api.delete(`/tenant/users/${user.id}`)
    }
    ElMessage.success(`${selectedUsers.value.length} 名人员已删除`)
    selectedUsers.value = []
    await fetchUsers()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.response?.data?.error || '批量删除失败')
  }
}

async function fetchUsers() {
  userLoading.value = true
  try {
    const params = { page: userFilter.page, limit: userFilter.limit }
    if (userFilter.role) params.role = userFilter.role
    const res = await api.get('/tenant/users', { params })
    users.value = res.data || res || []
    userTotal.value = res.pagination?.total || 0
  } catch {
    users.value = []
    userTotal.value = 0
  } finally {
    userLoading.value = false
  }
}

function handleUserPageChange(p) {
  userFilter.page = p
  fetchUsers()
}

function openUserDialog(row) {
  if (row) {
    editingUser.value = row
    userForm.name = row.name
    userForm.phone = row.phone
    userForm.password = ''
    userForm.role = row.role
    userForm.department_id = row.department_id || ''
  } else {
    editingUser.value = null
    userForm.name = ''
    userForm.phone = ''
    userForm.password = ''
    userForm.role = 'admin'
    userForm.department_id = ''
  }
  showUserDialog.value = true
}

async function handleSaveUser() {
  if (!userForm.name || !userForm.phone) return ElMessage.warning('姓名和手机号不能为空')
  if (!editingUser.value && !userForm.password) return ElMessage.warning('请输入初始密码')
  try {
    if (editingUser.value) {
      const payload = { name: userForm.name, phone: userForm.phone, role: userForm.role, department_id: userForm.department_id || null }
      if (userForm.password) payload.password = userForm.password
      await api.put(`/tenant/users/${editingUser.value.id}`, payload)
      ElMessage.success('人员更新成功')
    } else {
      await api.post('/tenant/users', { name: userForm.name, phone: userForm.phone, password: userForm.password, role: userForm.role, department_id: userForm.department_id || null })
      ElMessage.success('人员添加成功')
    }
    showUserDialog.value = false
    await fetchUsers()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  }
}

async function handleResetPassword(row) {
  try {
    const { value } = await ElMessageBox.prompt('请输入新密码', `重置 ${row.name} 的密码`, { inputType: 'password' })
    if (!value) return ElMessage.warning('密码不能为空')
    await api.put(`/tenant/users/${row.id}`, { password: value })
    ElMessage.success('密码已重置')
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.response?.data?.error || '重置失败')
  }
}

async function handleDeleteUser(row) {
  try {
    await ElMessageBox.confirm(`确定删除人员「${row.name}」吗？`, '确认删除', { type: 'warning' })
    await api.delete(`/tenant/users/${row.id}`)
    ElMessage.success('人员已删除')
    await fetchUsers()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.response?.data?.error || '删除失败')
  }
}

onMounted(() => { fetchDepts(); fetchUsers() })
</script>
<style scoped>
.toolbar { display: flex; align-items: center; gap: var(--space-2); }
.mr-8 { margin-right: var(--space-2); }
.mb-16 { margin-bottom: 16px; }
.mt-16 { margin-top: 16px; }
</style>
