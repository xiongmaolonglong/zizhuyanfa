import { STAGE_MAP } from '../utils/format'

const STAGE_ORDER = ['declaration', 'approval', 'assignment', 'measurement', 'design', 'production', 'construction', 'archive', 'finance']
const BLOCKED_STAGES = ['finance', 'aftersale']

export function useStageOptions() {
  function stageLabel(s) {
    return STAGE_MAP[s] || s
  }

  function canAdvance(row) {
    return !BLOCKED_STAGES.includes(row.current_stage)
  }

  function getNextStages(row) {
    const curIdx = STAGE_ORDER.indexOf(row.current_stage)
    if (curIdx < 0) return []
    const stages = []
    for (let i = curIdx + 1; i < Math.min(curIdx + 2, STAGE_ORDER.length); i++) {
      const stage = STAGE_ORDER[i]
      if (!BLOCKED_STAGES.includes(stage)) {
        stages.push({ key: stage, label: stageLabel(stage) })
      }
    }
    return stages
  }

  function displayStageLabel(row) {
    if (row.current_stage === 'measurement') {
      if (row.measurement?.status === 'measured' || row.status === 'measured') return '待审核'
      if (row.measurement?.status === 'rejected') return '驳回重测'
      return stageLabel('measurement')
    }
    return stageLabel(row.current_stage)
  }

  function displayStageTagType(row) {
    if (row.current_stage === 'measurement') {
      if (row.measurement?.status === 'measured' || row.status === 'measured') return 'success'
      if (row.measurement?.status === 'rejected') return 'danger'
      return 'warning'
    }
    const map = { declaration: '', assignment: 'info', measurement: 'warning', design: 'primary', production: 'success' }
    return map[row.current_stage] || 'info'
  }

  return {
    stageLabels: STAGE_MAP,
    stageOrder: STAGE_ORDER,
    stageLabel,
    canAdvance,
    getNextStages,
    displayStageLabel,
    displayStageTagType,
  }
}
