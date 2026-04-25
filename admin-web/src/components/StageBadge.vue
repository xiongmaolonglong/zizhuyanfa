<template>
  <el-tag :type="type" size="small" effect="light">
    {{ label }}
  </el-tag>
</template>

<script setup>
import { computed } from 'vue'
import { STAGE_MAP } from '../utils/format'

const props = defineProps({
  stage: { type: String, required: true },
})

const label = computed(() => STAGE_MAP[props.stage] || props.stage)

const typeMap = {
  declaration: '', approval: 'success', assignment: 'warning',
  measurement: 'primary', design: '', production: 'info',
  construction: 'warning', finance: 'success', archive: 'info',
  aftersale: 'danger'
}
const type = computed(() => typeMap[props.stage] || 'info')
</script>
