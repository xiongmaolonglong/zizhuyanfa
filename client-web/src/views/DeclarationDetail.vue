<template>
  <div>
    <div class="page-header">
      <div>
        <el-button link @click="router.back()" class="back-btn">&larr; 返回</el-button>
        <h1 class="page-title">{{ detail.work_order_no }} {{ detail.title }}</h1>
      </div>
      <el-tag :type="statusType(detail.status)" size="large">{{ statusText(detail.status) }}</el-tag>
    </div>

    <!-- Workflow Steps -->
    <el-card class="mb-16">
      <el-steps :active="stepIndex" finish-status="success" simple>
        <el-step v-for="s in steps" :key="s.key" :title="s.label" />
      </el-steps>
    </el-card>

    <el-row :gutter="16">
      <!-- Left: Declaration Info -->
      <el-col :span="16">
        <el-card class="mb-16">
          <template #header><span>申报信息</span></template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="项目名称">{{ detail.title }}</el-descriptions-item>
            <el-descriptions-item label="项目类型">{{ typeText(detail.type) }}</el-descriptions-item>
            <el-descriptions-item label="项目地址" :span="2">{{ detail.full_address || '湖南省长沙市岳麓区望城坡街道 XXX 路 123 号' }}</el-descriptions-item>
            <el-descriptions-item label="需求描述" :span="2">{{ detail.description || '门店门头招牌改造，包含设计、制作、安装全流程' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- Measurement Data (visible when measurement is done) -->
        <el-card class="mb-16" v-if="stepIndex >= 4">
          <template #header>
            <span>测量数据</span>
            <el-tag size="small" type="success" class="ml-8">已完成</el-tag>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="测量员">{{ detail.measurer || '李四' }}</el-descriptions-item>
            <el-descriptions-item label="测量日期">{{ detail.measured_at || '2026-04-12' }}</el-descriptions-item>
            <el-descriptions-item label="总面积">{{ detail.total_area || '12.5' }} m²</el-descriptions-item>
          </el-descriptions>
          <div class="material-table mt-16">
            <h4>材料明细</h4>
            <el-table :data="materials" size="small" border>
              <el-table-column prop="name" label="材料名称" />
              <el-table-column prop="width" label="宽(m)" width="80" />
              <el-table-column prop="height" label="高(m)" width="80" />
              <el-table-column prop="area" label="面积(m²)" width="90" />
              <el-table-column prop="face" label="画面" width="80" />
              <el-table-column prop="notes" label="备注" />
            </el-table>
          </div>
        </el-card>

        <!-- Design Review (visible when design is done) -->
        <el-card class="mb-16" v-if="stepIndex >= 5">
          <template #header>
            <span>设计方案</span>
            <div style="float:right">
              <el-tag size="small" type="success" class="ml-8">已确认</el-tag>
            </div>
          </template>
          <div class="design-images">
            <div v-for="(img, i) in designImages" :key="i" class="design-img-placeholder">
              效果图 {{ i + 1 }}
            </div>
          </div>
        </el-card>

        <!-- Construction Photos (visible when construction is done) -->
        <el-card class="mb-16" v-if="stepIndex >= 7">
          <template #header><span>施工记录</span></template>
          <div class="construction-section">
            <h4>施工前</h4>
            <div class="photo-row">
              <div class="photo-placeholder">施工前 1</div>
              <div class="photo-placeholder">施工前 2</div>
            </div>
            <h4>施工中</h4>
            <div class="photo-row">
              <div class="photo-placeholder">施工中 1</div>
            </div>
            <h4>施工后</h4>
            <div class="photo-row">
              <div class="photo-placeholder">施工后 1</div>
              <div class="photo-placeholder">施工后 2</div>
            </div>
            <el-alert v-if="detail.construction_verified" title="客户已验收" type="success" show-icon class="mt-16" />
          </div>
        </el-card>
      </el-col>

      <!-- Right: Timeline -->
      <el-col :span="8">
        <el-card>
          <template #header><span>进度记录</span></template>
          <el-timeline>
            <el-timeline-item v-for="(log, i) in timeline" :key="i" :timestamp="log.time" placement="top"
              :color="log.color" :type="log.type">
              {{ log.content }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'

const route = useRoute()
const router = useRouter()

const steps = [
  { key: 'declaration', label: '申报' },
  { key: 'approval', label: '审批' },
  { key: 'assignment', label: '派单' },
  { key: 'measurement', label: '测量' },
  { key: 'design', label: '设计' },
  { key: 'production', label: '生产' },
  { key: 'construction', label: '施工' },
  { key: 'archive', label: '归档' }
]

const detail = ref({})
const materials = ref([])
const designImages = ref([])
const timeline = ref([])

const stepIndex = computed(() => {
  const map = { declaration: 1, approval: 2, assignment: 3, measurement: 4, design: 5, production: 6, construction: 7, archive: 8 }
  return map[detail.value.current_stage] || 1
})

function statusType(s) {
  const map = { pending_approval: 'warning', submitted: 'warning', in_progress: '', completed: 'info', rejected: 'danger', archived: 'info' }
  return map[s] || 'info'
}
function statusText(s) {
  const map = { draft: '草稿', pending_approval: '审批中', submitted: '待审批', in_progress: '流转中', approved: '已通过', completed: '已完成', rejected: '已驳回', archived: '已归档' }
  return map[s] || s
}
function typeText(t) {
  const map = { '门头招牌': '门头招牌', '灯箱': '灯箱', 'LED显示屏': 'LED显示屏', '室内广告': '室内广告', '其他': '其他' }
  return map[t] || t
}

onMounted(async () => {
  try {
    const res = await api.get(`/work-orders/${route.params.id}`)
    const data = res.data || {}
    detail.value = data
    // Parse measurement materials from work order
    const measurements = data.measurements || []
    if (measurements.length > 0) {
      const latest = measurements[0]
      materials.value = (latest.materials || []).map(mat =>
        mat.faces.map(f => ({
          name: mat.type,
          width: f.width?.toFixed(2) || '0',
          height: f.height?.toFixed(2) || '0',
          area: (f.area || f.width * f.height).toFixed(2),
          face: f.label,
          notes: f.notes || '-'
        }))
      ).flat()
    }
    // Parse timeline from logs
    const logs = data.logs || []
    timeline.value = logs.map(log => ({
      time: log.created_at,
      content: log.detail,
      color: log.action?.includes('reject') ? '#f56c6c' : log.action?.includes('approve') ? '#67c23a' : '#409eff'
    }))
  } catch {
    detail.value = {}
    materials.value = []
    timeline.value = []
  }
})
</script>

<style scoped>
.page-title { font-size: 20px; font-weight: 600; color: #1a1a1a; display: inline; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.back-btn { font-size: 14px; color: #606266; padding: 0; margin-right: 12px; }
.mb-16 { margin-bottom: 16px; }
.mt-16 { margin-top: 16px; }
.ml-8 { margin-left: 8px; }
.material-table h4 { margin-bottom: 8px; color: #303133; }
.design-images { display: flex; gap: 12px; }
.design-img-placeholder {
  width: 200px; height: 150px; background: #f5f7fa; border: 1px dashed #dcdfe6;
  display: flex; align-items: center; justify-content: center;
  color: #909399; font-size: 14px; border-radius: 4px;
}
.construction-section h4 { margin: 12px 0 8px; color: #303133; }
.photo-row { display: flex; gap: 12px; margin-bottom: 8px; }
.photo-placeholder {
  width: 120px; height: 90px; background: #f5f7fa; border: 1px dashed #dcdfe6;
  display: flex; align-items: center; justify-content: center;
  color: #909399; font-size: 12px; border-radius: 4px;
}
</style>
