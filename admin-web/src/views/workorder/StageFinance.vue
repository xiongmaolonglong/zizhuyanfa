<template>
  <SectionBlock
    title="结算信息"
    :state="state"
    :default-expanded="isExpanded"
  >
    <template v-if="finances?.length">
      <div v-for="(f, i) in finances" :key="i" class="stage-item-box">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="材料费">{{ formatMoney(f.material_cost) }}</el-descriptions-item>
          <el-descriptions-item label="人工费">{{ formatMoney(f.labor_cost) }}</el-descriptions-item>
          <el-descriptions-item label="运输费">{{ formatMoney(f.transport_cost) }}</el-descriptions-item>
          <el-descriptions-item label="其他费用">{{ formatMoney(f.other_cost) }}</el-descriptions-item>
          <el-descriptions-item label="总成本"><span class="text-danger">{{ formatMoney(f.total_cost) }}</span></el-descriptions-item>
          <el-descriptions-item label="合同金额"><span class="text-success">{{ formatMoney(f.contract_amount) }}</span></el-descriptions-item>
          <el-descriptions-item label="利润"><span class="text-success">{{ formatMoney(f.profit) }}</span></el-descriptions-item>
          <el-descriptions-item label="已收款">{{ formatMoney(f.paid_amount) }}</el-descriptions-item>
          <el-descriptions-item label="付款状态">
            <el-tag :type="f.payment_status === 'paid' ? 'success' : f.payment_status === 'partial' ? 'warning' : 'info'" size="small">
              {{ f.payment_status === 'paid' ? '已结清' : f.payment_status === 'partial' ? '部分收款' : '未收款' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="开票状态">
            <el-tag :type="f.invoice_status === 'issued' ? 'success' : 'info'" size="small">
              {{ f.invoice_status === 'issued' ? '已开票' : '未开票' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ f.notes || '—' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </template>
    <template v-else>
      <div class="stage-empty">
        <div class="stage-empty-text">等待结算信息</div>
      </div>
    </template>
  </SectionBlock>
</template>

<script setup>
import SectionBlock from '../../components/SectionBlock.vue'
import { formatMoney } from '../../utils/format'

defineProps({
  finances: { type: Array, default: () => [] },
  state: { type: String, default: 'future' },
  isExpanded: { type: Boolean, default: false },
})
</script>

<style scoped>
.stage-empty { text-align: center; padding: 40px 20px; color: #9ca3af; }
.stage-empty-text { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 4px; }
.stage-item-box { margin-bottom: var(--space-3); }
.stage-item-box:last-child { margin-bottom: 0; }
.text-danger { color: var(--color-danger); }
.text-success { color: var(--color-success); }
</style>
