<template>
  <el-dialog v-model="visible" title="检测结果警告" width="600px" @close="$emit('close')">
    <!-- 尺寸警告 -->
    <div v-if="sizeWarnings.length > 0">
      <el-alert type="warning" :closable="false" show-icon style="margin-bottom: 12px">
        <template #title>尺寸不符合要求</template>
      </el-alert>
      <el-table :data="sizeWarnings" border size="small" style="margin-bottom: 16px">
        <el-table-column label="面" prop="label" width="100" />
        <el-table-column label="要求尺寸" prop="expected" width="140" />
        <el-table-column label="实际尺寸" prop="actual" width="140" />
        <el-table-column label="差异">
          <template #default="{ row }">
            <span style="color: var(--color-danger)">{{ row.diff }}%</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 颜色警告 -->
    <div v-if="colorWarnings.length > 0">
      <el-alert type="warning" :closable="false" show-icon style="margin-bottom: 12px">
        <template #title>颜色不符合要求</template>
      </el-alert>
      <el-table :data="colorWarnings" border size="small">
        <el-table-column label="要求颜色" prop="required" width="100" />
        <el-table-column label="实际主色调" prop="actual" width="100" />
        <el-table-column label="差异">
          <template #default="{ row }">
            <span style="color: var(--color-danger)">{{ row.diff }}%</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div style="margin-top: 16px; color: var(--color-text-secondary); font-size: 13px;">
      建议修改后重新上传，或确认无误后继续提交。
    </div>
    <template #footer>
      <el-button @click="$emit('cancel')">返回修改</el-button>
      <el-button type="warning" @click="$emit('confirm')">确认提交</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  sizeWarnings: { type: Array, default: () => [] },
  colorWarnings: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'close', 'cancel', 'confirm'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>
