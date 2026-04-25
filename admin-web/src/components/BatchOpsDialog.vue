<template>
  <el-dialog v-model="visible" :title="'批量操作（已选 ' + count + ' 项）'" width="480px">
    <el-radio-group v-model="batchAction" style="margin-bottom: 16px">
      <el-radio label="dispatch">批量派单</el-radio>
      <el-radio label="delete">批量删除</el-radio>
    </el-radio-group>

    <el-form v-if="batchAction === 'dispatch'" label-width="80px">
      <el-form-item label="负责人">
        <el-select v-model="batchForm.assigned_to" placeholder="选择人员" style="width:100%">
          <el-option v-for="u in userOptions" :key="u.id" :label="u.name" :value="u.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="截止日">
        <el-date-picker v-model="batchForm.deadline" type="date" value-format="YYYY-MM-DD" style="width:100%" />
      </el-form-item>
    </el-form>

    <el-alert v-if="batchAction === 'delete'" type="warning" show-icon :closable="false" style="margin-bottom: 16px">
      已归档的工单不可删除
    </el-alert>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="executeBatch" :loading="executing">执行</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

const props = defineProps({ modelValue: Boolean, count: Number, selections: Array, userOptions: Array })
const emit = defineEmits(['update:modelValue', 'done'])

const visible = ref(false)
const batchAction = ref('dispatch')
const executing = ref(false)
const batchForm = reactive({ assigned_to: '', deadline: '' })

watch(() => props.modelValue, (val) => { visible.value = val })
watch(visible, (val) => { emit('update:modelValue', val) })

async function executeBatch() {
  if (batchAction.value === 'dispatch' && !batchForm.assigned_to) {
    return ElMessage.warning('请选择负责人')
  }

  // 删除操作需要二次确认
  if (batchAction.value === 'delete') {
    // 过滤出可删除的工单（排除已归档）
    const deletable = props.selections.filter(s => s.current_stage !== 'archive')
    const skipped = props.selections.filter(s => s.current_stage === 'archive')
    if (!deletable.length) {
      return ElMessage.warning('选中的工单均已归档，不可删除')
    }
    let msg = `确定要删除 ${deletable.length} 项工单？`
    if (skipped.length) msg += `\n（已跳过 ${skipped.length} 项已归档工单）`
    try {
      await ElMessageBox.confirm(msg, '确认删除', { type: 'warning', confirmButtonText: '确定删除', cancelButtonText: '取消' })
    } catch {
      return
    }
  }

  executing.value = true
  const ids = props.selections.map(s => s.id)

  try {
    if (batchAction.value === 'dispatch') {
      await Promise.all(ids.map(id => api.post('/assignments', {
        work_order_id: id,
        assigned_to: batchForm.assigned_to,
        deadline: batchForm.deadline || null,
      })))
    } else if (batchAction.value === 'delete') {
      const deletableIds = props.selections
        .filter(s => s.current_stage !== 'archive')
        .map(s => s.id)
      const skippedCount = ids.length - deletableIds.length
      await Promise.all(deletableIds.map(id => api.delete(`/work-orders/${id}`)))
      let msg = `成功删除 ${deletableIds.length} 项`
      if (skippedCount) msg += `，跳过 ${skippedCount} 项已归档工单`
      ElMessage.success(msg)
      emit('done')
      visible.value = false
      executing.value = false
      return
    }
    ElMessage.success(`成功执行 ${ids.length} 项`)
    emit('done')
    visible.value = false
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '批量操作失败')
  } finally {
    executing.value = false
  }
}
</script>
