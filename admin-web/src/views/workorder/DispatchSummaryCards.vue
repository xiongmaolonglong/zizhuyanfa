<template>
  <el-row :gutter="16" class="summary-cards mb-16">
    <el-col :span="8">
      <el-card shadow="hover" class="summary-card" :class="{ active: activeTab === 'measure' }" @click="$emit('update:activeTab', 'measure')">
        <div class="summary-body">
          <div class="summary-icon measure">📏</div>
          <div class="summary-info">
            <div class="summary-count">{{ measureCount }}</div>
            <div class="summary-label">测量待派单</div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="8">
      <el-card shadow="hover" class="summary-card" :class="{ active: activeTab === 'design' }" @click="$emit('update:activeTab', 'design')">
        <div class="summary-body">
          <div class="summary-icon design">🎨</div>
          <div class="summary-info">
            <div class="summary-count">{{ designCount }}</div>
            <div class="summary-label">设计待派单</div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="8">
      <el-card shadow="hover" class="summary-card" :class="{ active: activeTab === 'install' }" @click="$emit('update:activeTab', 'install')">
        <div class="summary-body">
          <div class="summary-icon install">🔧</div>
          <div class="summary-info">
            <div class="summary-count">{{ installCount }}</div>
            <div class="summary-label">安装待派单</div>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup>
defineProps({
  activeTab: { type: String, default: 'measure' },
  measureCount: { type: Number, default: 0 },
  designCount: { type: Number, default: 0 },
  installCount: { type: Number, default: 0 },
})

defineEmits(['update:activeTab'])
</script>

<style scoped>
.summary-cards { margin-bottom: var(--space-4); }
.mb-16 { margin-bottom: var(--space-4); }
.summary-card { cursor: pointer; transition: all 0.3s; border: 2px solid transparent; }
.summary-card:hover { transform: translateY(-2px); }
.summary-card.active { border-color: var(--color-primary); background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); }
.summary-body { display: flex; align-items: center; padding: var(--space-3); }
.summary-icon { font-size: 32px; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); margin-right: var(--space-3); }
.summary-icon.measure { background: #fef3c7; }
.summary-icon.design { background: #dbeafe; }
.summary-icon.install { background: #f3e8ff; }
.summary-info { flex: 1; }
.summary-count { font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); }
.summary-label { color: var(--color-text-tertiary); font-size: var(--font-size-sm); margin-top: var(--space-1); }
</style>
