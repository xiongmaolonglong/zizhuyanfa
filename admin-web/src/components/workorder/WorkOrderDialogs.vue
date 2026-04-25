<template>
  <!-- 备注对话框 -->
  <el-dialog v-model="showRemark" title="添加备注" width="480px">
    <el-input v-model="remarkText" type="textarea" :rows="4" placeholder="输入备注内容..." />
    <template #footer>
      <el-button @click="showRemark = false">取消</el-button>
      <el-button type="primary" @click="submitRemark" :loading="submitting">提交</el-button>
    </template>
  </el-dialog>

  <!-- 转交负责人对话框 -->
  <el-dialog v-model="showReassign" title="转交负责人" width="400px">
    <el-select v-model="reassignUserId" placeholder="选择新的负责人" style="width:100%">
      <el-option v-for="u in userOptions" :key="u.id" :label="u.name" :value="u.id" />
    </el-select>
    <template #footer>
      <el-button @click="showReassign = false">取消</el-button>
      <el-button type="primary" @click="submitReassign" :loading="submitting">确认转交</el-button>
    </template>
  </el-dialog>

  <!-- 标签管理对话框 -->
  <el-dialog v-model="showTag" title="管理标签" width="400px">
    <el-tag v-for="t in tagForm.tags" :key="t" closable @close="tagForm.tags = tagForm.tags.filter(x => x !== t)" style="margin: 4px">{{ t }}</el-tag>
    <el-input v-model="tagForm.newTag" placeholder="输入新标签回车添加" @keyup.enter="addTag" style="margin-top: 8px" />
    <template #footer>
      <el-button @click="showTag = false">取消</el-button>
      <el-button type="primary" @click="saveTags" :loading="submitting">保存</el-button>
    </template>
  </el-dialog>

  <!-- 优先级对话框 -->
  <el-dialog v-model="showPriority" title="设置优先级" width="320px">
    <el-radio-group v-model="priorityForm.priority">
      <el-radio value="high">高优</el-radio>
      <el-radio value="normal">普通</el-radio>
      <el-radio value="low">低优</el-radio>
    </el-radio-group>
    <template #footer>
      <el-button @click="showPriority = false">取消</el-button>
      <el-button type="primary" @click="savePriority" :loading="submitting">确认</el-button>
    </template>
  </el-dialog>

  <!-- 截止日对话框 -->
  <el-dialog v-model="showDeadline" title="设置截止日" width="360px">
    <el-date-picker v-model="deadlineForm.deadline" type="date" placeholder="选择日期" style="width:100%" value-format="YYYY-MM-DD" />
    <template #footer>
      <el-button @click="showDeadline = false">取消</el-button>
      <el-button type="primary" @click="saveDeadline" :loading="submitting">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../../api'

const props = defineProps({
  woId: { type: Number, default: null },
  wo: { type: Object, default: null },
  dialogType: { type: String, default: '' },
  userOptions: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'refresh'])

const submitting = ref(false)
const showRemark = ref(false)
const showReassign = ref(false)
const showTag = ref(false)
const showPriority = ref(false)
const showDeadline = ref(false)

const remarkText = ref('')
const reassignUserId = ref('')
const tagForm = reactive({ tags: [], newTag: '' })
const priorityForm = reactive({ priority: 'normal' })
const deadlineForm = reactive({ deadline: '' })

watch(() => props.dialogType, (type) => {
  if (!type || !props.wo) return
  if (type === 'remark') showRemark.value = true
  else if (type === 'reassign') { reassignUserId.value = ''; showReassign.value = true }
  else if (type === 'tag') { tagForm.tags = [...(props.wo.custom_tags || [])]; tagForm.newTag = ''; showTag.value = true }
  else if (type === 'priority') { priorityForm.priority = props.wo.priority || 'normal'; showPriority.value = true }
  else if (type === 'deadline') { deadlineForm.deadline = props.wo.deadline || ''; showDeadline.value = true }
})

async function submitRemark() {
  if (!remarkText.value.trim()) return ElMessage.warning('请输入备注内容')
  submitting.value = true
  try {
    await api.post(`/work-orders/${props.woId}/remark`, { content: remarkText.value.trim() })
    ElMessage.success('备注已添加')
    showRemark.value = false
    emit('close')
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '添加备注失败')
  } finally {
    submitting.value = false
  }
}

async function submitReassign() {
  if (!reassignUserId.value) return ElMessage.warning('请选择负责人')
  submitting.value = true
  try {
    await api.put(`/work-orders/${props.woId}/assign`, { assigned_to: reassignUserId.value })
    ElMessage.success('已转交')
    showReassign.value = false
    emit('close')
    emit('refresh')
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '转交失败')
  } finally {
    submitting.value = false
  }
}

function addTag() {
  const t = tagForm.newTag.trim()
  if (t && !tagForm.tags.includes(t)) tagForm.tags.push(t)
  tagForm.newTag = ''
}

async function saveTags() {
  submitting.value = true
  try {
    await api.put(`/work-orders/${props.woId}/tags`, { tags: tagForm.tags })
    ElMessage.success('标签已更新')
    showTag.value = false
    emit('close')
    emit('refresh')
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '更新标签失败')
  } finally {
    submitting.value = false
  }
}

async function savePriority() {
  submitting.value = true
  try {
    await api.put(`/work-orders/${props.woId}/priority`, { priority: priorityForm.priority })
    ElMessage.success('优先级已更新')
    showPriority.value = false
    emit('close')
    emit('refresh')
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '更新优先级失败')
  } finally {
    submitting.value = false
  }
}

async function saveDeadline() {
  submitting.value = true
  try {
    await api.put(`/work-orders/${props.woId}/deadline`, { deadline: deadlineForm.deadline || null })
    ElMessage.success('截止日已更新')
    showDeadline.value = false
    emit('close')
    emit('refresh')
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '更新截止日失败')
  } finally {
    submitting.value = false
  }
}
</script>
