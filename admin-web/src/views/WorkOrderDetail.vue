<template>
  <div v-loading="loading">
    <!-- Header -->
    <div class="flex-between mb-20">
      <div>
        <el-button @click="$router.back()" class="mb-8">&larr; 返回</el-button>
        <h1 class="page-title"><span class="wo-no">{{ detail.work_order_no }}</span> {{ detail.title }}</h1>
      </div>
      <div>
        <el-button v-if="canEdit" @click="showEditDialog = true">编辑</el-button>
        <el-button v-if="canDelete" type="danger" @click="deleteWorkOrder">删除</el-button>
      </div>
    </div>

    <!-- Progress Steps -->
    <el-card class="mb-20">
      <el-steps :active="currentStepIndex" finish-status="success" align-center class="clickable-steps">
        <el-step v-for="s in stages" :key="s.key" :title="s.label"
          @click="handleStageClick(s.key)" style="cursor:pointer" />
      </el-steps>
    </el-card>

    <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;">
      <div>
        <!-- 基本信息（动态渲染后台配置的字段） -->
        <SectionBlock
          title="基本信息"
          state="done"
          :default-expanded="true"
        >
          <el-descriptions :column="2" border v-if="basicDisplayFields.length">
            <el-descriptions-item
              v-for="f in basicDisplayFields"
              :key="f.key"
              :label="f.label"
            >
              <template v-if="f.type === 'image' && f.value?.length">
                <div class="basic-photo-grid">
                  <el-image
                    v-for="(url, i) in f.value"
                    :key="i"
                    :src="url"
                    :preview-src-list="f.value"
                    :initial-index="i"
                    fit="cover"
                    class="basic-photo-thumb"
                  />
                </div>
              </template>
              <template v-else-if="f.type === 'file' && f.value?.length">
                <div v-for="(url, i) in f.value" :key="i">
                  <a :href="url" target="_blank" class="file-link">{{ url.split('/').pop() }}</a>
                </div>
              </template>
              <template v-else-if="f.type === 'select'">
                {{ resolveSelectLabel(f) || '-' }}
              </template>
              <template v-else>
                {{ f.value || '-' }}
              </template>
            </el-descriptions-item>
          </el-descriptions>
          <el-descriptions :column="2" border v-else>
            <el-descriptions-item label="甲方企业">{{ detail.client_name }}</el-descriptions-item>
            <el-descriptions-item label="活动项目">{{ detail.activity_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="元素">{{ projectTypeLabel(detail.project_type) || '-' }}</el-descriptions-item>
            <el-descriptions-item label="项目地址">{{ detail.address }}</el-descriptions-item>
            <el-descriptions-item label="联系人">{{ detail.contact_name }} {{ detail.contact_phone }}</el-descriptions-item>
            <el-descriptions-item label="需求描述" :span="2">{{ detail.description }}</el-descriptions-item>
          </el-descriptions>
        </SectionBlock>

        <!-- Photos -->
        <el-card v-if="detail.photos?.length" class="mb-20">
          <template #header><span class="section-title">现场照片（{{ detail.photos.length }}张）</span></template>
          <div class="photo-grid">
            <el-image v-for="(url, i) in detail.photos" :key="i" :src="url" :preview-src-list="detail.photos"
              fit="cover" class="photo-item" />
          </div>
        </el-card>

        <!-- 审批信息 -->
        <SectionBlock
          title="审批记录"
          :state="getStageState('approval')"
          :default-expanded="detail.current_stage === 'approval'"
        >
          <template v-if="hasApproval">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="审批人">{{ detail.approval?.approver_name || detail.approval?.approver?.name || '—' }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="approvalStatusType(detail.approval)">
                  {{ approvalStatusLabel(detail.approval) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="审批意见" :span="2">{{ detail.approval?.comment || '—' }}</el-descriptions-item>
              <el-descriptions-item label="审批日期">{{ detail.approval?.approved_at || '—' }}</el-descriptions-item>
            </el-descriptions>
          </template>
          <template v-else>
            <div class="stage-empty">
              <div class="stage-empty-text">暂无审批记录</div>
            </div>
          </template>
        </SectionBlock>

        <!-- 派单信息 -->
        <SectionBlock
          title="派单信息"
          :state="getStageState('assignment')"
          :default-expanded="detail.current_stage === 'assignment'"
        >
          <template v-if="detail.assignment">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="派单给">{{ detail.assignment.assignee_name || 'ID:' + detail.assignment.assigned_to }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="isAssignmentCompleted ? 'success' : 'warning'">
                  {{ isAssignmentCompleted ? '已完成' : '进行中' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="派单人">{{ detail.assignment.assigner_name || '—' }}</el-descriptions-item>
              <el-descriptions-item label="派单日期">{{ formatDate(detail.assignment.assigned_at) }}</el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">{{ detail.assignment.notes || '—' }}</el-descriptions-item>
            </el-descriptions>
          </template>
          <template v-else>
            <div class="stage-empty">
              <div class="stage-empty-text">等待派单</div>
            </div>
          </template>
        </SectionBlock>

        <!-- 测量数据 -->
        <SectionBlock
          title="测量数据"
          :state="getStageState('measurement')"
          :default-expanded="detail.current_stage === 'measurement'"
        >
          <template #header-action>
            <el-button
              v-if="detail.current_stage === 'measurement' && !measurementData"
              type="primary"
              size="small"
              @click="showProxyDialog = true"
            >代录测量数据</el-button>
            <el-button
              v-if="detail.current_stage === 'measurement' && measurementData && measurementData.status !== 'approved'"
              type="warning"
              size="small"
              @click="showProxyDialog = true"
            >{{ measurementData.status === 'rejected' ? '修改测量数据' : '编辑测量数据' }}</el-button>
            <el-button
              v-if="isAdmin && detail.current_stage === 'measurement' && measurementData?.status === 'measured'"
              type="success"
              size="small"
              @click="approveMeasurement"
              :loading="submitting"
            >审核通过</el-button>
            <el-button
              v-if="isAdmin && detail.current_stage === 'measurement' && measurementData?.status === 'measured'"
              type="danger"
              size="small"
              @click="openRejectDialog"
            >驳回</el-button>
            <el-button
              v-if="isAdmin && detail.current_stage === 'measurement' && measurementData?.status === 'measured'"
              link
              type="primary"
              size="small"
              @click="$router.push('/audit')"
            >去审核中心</el-button>
          </template>
          <template v-if="measurementData">
            <el-descriptions :column="2" border class="mb-16">
              <el-descriptions-item label="测量员">{{ measurementData.measurer_name || '—' }}</el-descriptions-item>
              <el-descriptions-item label="测量日期">{{ formatDate(measurementData.measured_at) }}</el-descriptions-item>
              <el-descriptions-item label="面积">{{ measurementTotalArea > 0 ? measurementTotalArea.toFixed(2) : '—' }} m²</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="measurementData.status === 'approved' ? 'success' : measurementData.status === 'rejected' ? 'danger' : 'warning'">
                  {{ measurementData.status === 'approved' ? '已审核' : measurementData.status === 'rejected' ? '已驳回' : '待审核' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">{{ measurementData.notes || '—' }}</el-descriptions-item>
              <el-descriptions-item v-if="measurementData.status === 'rejected'" label="驳回原因" :span="2">
                <span class="text-danger">{{ measurementData.rejection_reason || '—' }}</span>
              </el-descriptions-item>
            </el-descriptions>
            <div class="material-section" v-for="(mat, mi) in measurementGroupedMaterials" :key="mi">
              <div class="mat-header">
                <span>{{ resolveAdTypeLabel(mat) }} — {{ mat.groups.reduce((c, g) => c + g.faces.length, 0) }}面 &nbsp;
                  <el-tag size="small">合计 {{ mat.totalArea.toFixed(2) }}m²</el-tag>
                </span>
              </div>
              <div class="mat-body">
                <div v-for="(group, gi) in mat.groups" :key="gi" class="meas-group">
                  <div class="meas-group-header">
                    <span class="meas-group-name">{{ group.name || ('分组' + (gi + 1)) }}</span>
                    <el-tag v-if="group.isUnified" size="small" type="primary" effect="dark">一体</el-tag>
                    <el-tag v-else size="small" type="info">独立</el-tag>
                  </div>
                  <div class="face-row" v-for="(face, fi) in group.faces" :key="fi">
                    <span class="face-label">{{ face.label }}</span>
                    <span>{{ Number(face.width||0).toFixed(2) }} × {{ Number(face.height||0).toFixed(2) }}cm</span>
                    <span class="face-area">{{ face.area || ((face.width * face.height) / 10000).toFixed(2) }}m²</span>
                    <span class="face-extra" v-if="getExtraFields(face).length">
	                      <template v-for="ef in getExtraFields(face)" :key="ef.key">
	                        <el-tag size="small" effect="plain" class="extra-tag">{{ ef.value }}{{ ef.label }}</el-tag>
	                      </template>
	                    </span>
	                    <span class="text-muted" v-else>{{ face.notes || '—' }}</span>
                    <span class="face-photos" v-if="face.photos?.length">
                      <el-image
                        v-for="(url, pi) in face.photos.slice(0, 3)"
                        :key="pi"
                        :src="url"
                        :preview-src-list="face.photos"
                        :initial-index="pi"
                        fit="cover"
                        class="face-thumb"
                      />
                      <span v-if="face.photos.length > 3" class="more-photos">+{{ face.photos.length - 3 }}</span>
                    </span>
                    <span v-else class="text-muted">0张</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="stage-empty">
              <div class="stage-empty-text">等待测量数据</div>
            </div>
          </template>
        </SectionBlock>

        <!-- 设计信息 -->
        <SectionBlock
          title="设计稿"
          :state="getStageState('design')"
          :default-expanded="detail.current_stage === 'design'"
        >
          <template v-if="detail.designs?.length">
            <div v-for="(d, i) in detail.designs" :key="i" class="stage-item-box">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="设计师">{{ d.designer_name || d.designer?.name || 'ID:' + d.designer_id }}</el-descriptions-item>
                <el-descriptions-item label="类型">{{ d.design_type || '—' }}</el-descriptions-item>
                <el-descriptions-item label="描述" :span="2">{{ d.description || '—' }}</el-descriptions-item>
                <el-descriptions-item label="审核人">{{ d.reviewer_name || d.reviewer?.name || '—' }}</el-descriptions-item>
                <el-descriptions-item label="审核意见">{{ d.review_comment || '—' }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                  <el-tag :type="d.status === 'approved' ? 'success' : d.status === 'rejected' ? 'danger' : 'warning'">
                    {{ d.status === 'approved' ? '已通过' : d.status === 'rejected' ? '已驳回' : '待审核' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="提交日期">{{ d.submitted_at || d.created_at || '—' }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
          <template v-else-if="detail.design_images?.length">
            <div class="design-photo-grid">
              <el-image v-for="(img, i) in detail.design_images" :key="i" :src="img.url || img" :preview-src-list="detail.design_images.map(d => d.url || d)"
                fit="cover" class="design-photo-item" lazy />
            </div>
          </template>
          <template v-else>
            <div class="stage-empty">
              <div class="stage-empty-text">等待设计稿</div>
            </div>
          </template>
        </SectionBlock>

        <!-- 生产信息 -->
        <SectionBlock
          title="生产记录"
          :state="getStageState('production')"
          :default-expanded="detail.current_stage === 'production'"
        >
          <template v-if="detail.productions?.length">
            <div v-for="(p, i) in detail.productions" :key="i" class="stage-item-box">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="描述" :span="2">{{ p.description || '—' }}</el-descriptions-item>
                <el-descriptions-item label="材料">{{ p.material || '—' }}</el-descriptions-item>
                <el-descriptions-item label="数量">{{ p.quantity || '—' }} {{ p.unit || '' }}</el-descriptions-item>
                <el-descriptions-item label="开始日期">{{ p.start_date || '—' }}</el-descriptions-item>
                <el-descriptions-item label="完成日期">{{ p.complete_date || '—' }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                  <el-tag :type="p.status === 'completed' ? 'success' : 'warning'">
                    {{ p.status === 'completed' ? '已完成' : '进行中' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="备注" :span="2">{{ p.notes || '—' }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
          <template v-else>
            <div class="stage-empty">
              <div class="stage-empty-text">等待生产记录</div>
            </div>
          </template>
        </SectionBlock>

        <!-- 施工信息 -->
        <SectionBlock
          title="施工记录"
          :state="getStageState('construction')"
          :default-expanded="detail.current_stage === 'construction'"
        >
          <template v-if="detail.constructions?.length">
            <div v-for="(c, i) in detail.constructions" :key="i" class="stage-item-box">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="施工人">{{ c.constructor_name || c.constructor?.name || 'ID:' + c.constructor_id }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                  <el-tag :type="c.status === 'completed' ? 'success' : 'warning'">
                    {{ c.status === 'completed' ? '已完成' : '进行中' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="开始日期">{{ c.start_date || '—' }}</el-descriptions-item>
                <el-descriptions-item label="完成日期">{{ c.end_date || '—' }}</el-descriptions-item>
                <el-descriptions-item label="描述" :span="2">{{ c.description || '—' }}</el-descriptions-item>
                <el-descriptions-item label="验收结果">{{ c.acceptance_result || '—' }}</el-descriptions-item>
                <el-descriptions-item label="安全检查">
                  <el-tag v-if="c.safety_check" type="success" size="small">已检查</el-tag>
                  <span v-else class="text-muted">未检查</span>
                </el-descriptions-item>
                <el-descriptions-item label="备注" :span="2">{{ c.notes || '—' }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
          <template v-else>
            <div class="stage-empty">
              <div class="stage-empty-text">等待施工记录</div>
            </div>
          </template>
        </SectionBlock>

        <!-- 结算信息 -->
        <SectionBlock
          title="结算信息"
          :state="getStageState('finance')"
          :default-expanded="detail.current_stage === 'finance'"
        >
          <template v-if="detail.finances?.length">
            <div v-for="(f, i) in detail.finances" :key="i" class="stage-item-box">
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

        <!-- 归档信息 -->
        <SectionBlock
          title="归档信息"
          :state="getStageState('archive')"
          :default-expanded="detail.current_stage === 'archive'"
        >
          <template v-if="detail.archive">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="归档人">{{ detail.archive.archiver_name || detail.archive.archiver?.name || 'ID:' + detail.archive.archived_by }}</el-descriptions-item>
              <el-descriptions-item label="归档日期">{{ detail.archive.archive_date || '—' }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag type="info" size="small">已归档</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">{{ detail.archive.notes || '—' }}</el-descriptions-item>
            </el-descriptions>
          </template>
          <template v-else>
            <div class="stage-empty">
              <div class="stage-empty-text">等待归档</div>
            </div>
          </template>
        </SectionBlock>

        <!-- 售后记录 -->
        <SectionBlock
          title="售后记录"
          :state="getStageState('aftersale')"
          :default-expanded="detail.current_stage === 'aftersale'"
        >
          <template v-if="detail.aftersales?.length">
            <div v-for="(a, i) in detail.aftersales" :key="i" class="stage-item-box">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="问题类型">{{ a.issue_type || '—' }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                  <el-tag :type="a.status === 'resolved' ? 'success' : 'warning'" size="small">
                    {{ a.status === 'resolved' ? '已解决' : a.status === 'processing' ? '处理中' : '待处理' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="问题描述" :span="2">{{ a.description || '—' }}</el-descriptions-item>
                <el-descriptions-item label="处理人">{{ a.handler_name || a.handler?.name || '—' }}</el-descriptions-item>
                <el-descriptions-item label="解决日期">{{ a.resolved_at || '—' }}</el-descriptions-item>
                <el-descriptions-item label="解决方案" :span="2">{{ a.solution || '—' }}</el-descriptions-item>
                <el-descriptions-item label="客户反馈">{{ a.feedback || '—' }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
          <template v-else>
            <div class="stage-empty">
              <div class="stage-empty-text">暂无售后记录</div>
            </div>
          </template>
        </SectionBlock>
      </div>

      <!-- Right Panel -->
      <div>
        <!-- 当前环节 - 操作卡片 -->
        <el-card class="mb-20 stage-action-card" :class="`stage-${detail.current_stage}`" @click="handleStageAction">
          <div class="stage-action-content">
            <div class="stage-action-icon">{{ stageActionIcon }}</div>
            <div class="stage-action-text">
              <div class="stage-action-title">{{ currentStageLabel }}</div>
              <div class="stage-action-hint">{{ stageActionHint }}</div>
            </div>
          </div>
        </el-card>

        <!-- 编辑/删除按钮（仅待派单且未派单状态） -->
        <div v-if="canEdit" class="edit-actions mb-20">
          <el-button type="primary" style="width:100%" @click="showEditDialog = true">编辑工单</el-button>
        </div>

        <el-card class="mb-20">
          <template #header><span class="section-title">关联数据</span></template>
          <el-descriptions :column="1">
            <el-descriptions-item label="项目" v-if="projectName">
              <el-tag type="primary" effect="plain">{{ projectName }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="设计稿">{{ detail.design_count || 0 }} 份</el-descriptions-item>
            <el-descriptions-item label="施工记录">{{ detail.construction_count || 0 }} 次</el-descriptions-item>
            <el-descriptions-item label="售后工单">{{ detail.aftersale_count || 0 }} 个</el-descriptions-item>
            <el-descriptions-item label="报价" v-if="detail.finance_summary">
              {{ formatMoney(detail.finance_summary.quote_amount) }}
              <el-tag size="small" :type="detail.finance_summary.status === 'paid' ? 'success' : 'warning'">
                {{ financeStatus(detail.finance_summary.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="甲方" v-if="detail.client_name">
              <el-button type="primary" text size="small" @click="$router.push(`/clients/${detail.client_id || ''}`)">
                {{ detail.client_name }}
              </el-button>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 操作日志 -->
        <el-card>
          <template #header><span class="section-title">操作日志</span></template>
          <div v-if="logs.length > 5" class="log-expand-hint">
            <span class="text-muted">最近 5 条，</span>
            <el-button type="primary" text size="small" @click="showAllLogs = !showAllLogs">
              {{ showAllLogs ? '收起' : '展开全部 ' + logs.length + ' 条' }}
            </el-button>
          </div>
          <el-timeline>
            <el-timeline-item v-for="log in showAllLogs ? logs : logs.slice(0, 5)" :key="log.id"
              :timestamp="log.created_at" placement="top"
              :type="logTypeColor(log.log_type || log.action)"
              :icon="logTypeIcon(log.log_type || log.action)">
              <div class="log-item">
                <div class="log-header">
                  <el-tag size="small" :type="logTypeColor(log.log_type || log.action)" effect="plain">
                    {{ logTypeLabel(log.log_type || log.action) }}
                  </el-tag>
                  <span class="log-detail">{{ log.detail }}</span>
                  <span class="text-muted">— {{ log.user_name }}</span>
                </div>
                <div v-if="log.old_value && log.new_value" class="log-change">
                  <span class="text-muted">{{ log.field_name || '字段' }}:</span>
                  <span class="log-old">{{ log.old_value }}</span>
                  <span class="text-muted">→</span>
                  <span class="log-new">{{ log.new_value }}</span>
                </div>
                <div v-if="log.amount_change" class="log-amount" :class="log.amount_change > 0 ? 'amount-positive' : 'amount-negative'">
                  {{ log.amount_change > 0 ? '+' : '' }}¥{{ Math.abs(log.amount_change).toFixed(2) }}
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-if="!logs.length" description="暂无操作日志" :image-size="40" />
        </el-card>
      </div>
    </div>

    <!-- 派单对话框 -->
    <el-dialog v-model="showDispatchDialog" title="派单" width="520px">
      <!-- 推荐测量员 -->
      <div class="measurer-section" v-if="measurerGroups.length">
        <div class="measurer-group" v-for="group in measurerGroups" :key="group.level">
          <div class="group-label">
            <el-tag :type="group.tagType" size="small">{{ group.label }}</el-tag>
            <span class="text-muted">{{ group.users.length }}人</span>
          </div>
          <div class="measurer-list">
            <el-tag v-for="u in group.users" :key="u.id"
              :class="['measurer-tag', { 'measurer-selected': dispatchForm.assigned_to === u.id }]"
              @click="dispatchForm.assigned_to = u.id"
              effect="plain">
              {{ u.name }} <span class="text-muted">{{ u.roleLabel }}</span>
            </el-tag>
          </div>
        </div>
      </div>
      <el-divider v-if="measurerGroups.length" content-position="center">或手动选择</el-divider>

      <el-form :model="dispatchForm" label-width="80px" ref="dispatchFormRef" :rules="dispatchRules">
        <el-form-item label="负责人" prop="assigned_to">
          <el-select v-model="dispatchForm.assigned_to" placeholder="选择测量员" style="width:100%">
            <el-option v-for="u in userOptions" :key="u.id" :label="u.name" :value="u.id">
              <span>{{ u.name }}</span>
              <span style="float:right;color:#8c8c8c;font-size:12px">{{ u.roleLabel }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="截止日">
          <el-date-picker v-model="dispatchForm.deadline" type="date" placeholder="可选"
            value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="dispatchForm.notes" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDispatchDialog = false">取消</el-button>
        <el-button type="primary" @click="submitDispatch" :loading="dispatching">确认派单</el-button>
      </template>
    </el-dialog>

    <!-- 编辑工单对话框（动态渲染后台配置的字段） -->
    <el-dialog v-model="showEditDialog" title="编辑工单" width="480px">
      <el-form :model="editForm" label-width="100px" ref="editFormRef">
        <el-form-item
          v-for="f in editableFields"
          :key="f.key"
          :label="f.label"
          :required="f.required"
        >
          <!-- 图片 -->
          <el-upload v-if="f.type === 'image'"
            action="/api/v1/files" list-type="picture-card"
            :file-list="editFileLists[f.key] || []"
            :on-success="(res, file) => onEditFileSuccess(res, file, f.key)"
            :on-error="onFileError" :headers="uploadHeaders" name="file">
            <el-icon><Plus /></el-icon>
          </el-upload>
          <!-- textarea -->
          <el-input v-else-if="f.type === 'textarea'"
            v-model="editForm[f.key]" type="textarea" :rows="3" />
          <!-- select -->
          <el-select v-else-if="f.type === 'select'"
            v-model="editForm[f.key]" style="width:100%">
            <el-option v-for="opt in (f.options || [])" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
          <!-- number -->
          <el-input-number v-else-if="f.type === 'number'"
            v-model="editForm[f.key]" :min="0" :precision="2" controls-position="right" style="width:100%" />
          <!-- date -->
          <el-date-picker v-else-if="f.type === 'date'"
            v-model="editForm[f.key]" type="date" style="width:100%" value-format="YYYY-MM-DD" />
          <!-- address -->
          <AddressPicker v-else-if="f.enable_parse"
            v-model="editForm[f.key]" :field-label="f.label" />
          <!-- 默认 text -->
          <el-input v-else v-model="editForm[f.key]" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="submitEdit" :loading="editing">保存</el-button>
      </template>
    </el-dialog>

    <!-- 驳回测量对话框 -->
    <el-dialog v-model="showRejectDialog" title="驳回测量数据" width="480px">
      <el-form>
        <el-form-item label="驳回原因" required>
          <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请详细说明驳回原因及修改要求" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmReject" :loading="submitting">确认驳回</el-button>
      </template>
    </el-dialog>

    <!-- 代录测量数据对话框 -->
    <ProxyMeasureDialog
      v-model="showProxyDialog"
      :work-order-id="id"
      :existing-data="measurementDataForEdit"
      @success="loadWorkOrder"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import api from '../api'
import { logger } from '../utils/logger'
import { formatMoney, formatDate } from '../utils/format'
import SectionBlock from '../components/SectionBlock.vue'
import AddressPicker from '../components/AddressPicker.vue'
import ProxyMeasureDialog from '../components/ProxyMeasureDialog.vue'
import { useAuthStore } from '../store/auth'

// 环节顺序（用于判断完成/当前/未来状态）
const stageOrder = [
  'declaration', 'approval', 'assignment', 'measurement',
  'design', 'production', 'construction', 'finance', 'archive', 'aftersale',
]

function getStageState(stageKey) {
  const currentIdx = stageOrder.indexOf(detail.value.current_stage)
  const stageIdx = stageOrder.indexOf(stageKey)
  if (stageIdx < currentIdx) return 'done'
  if (stageIdx === currentIdx) return 'current'
  return 'future'
}

function approvalStatusType(approval) {
  if (!approval) return 'info'
  if (approval.status === 'approved') return 'success'
  if (approval.status === 'rejected') return 'danger'
  return 'warning'
}

function approvalStatusLabel(approval) {
  if (!approval) return '待审批'
  if (approval.status === 'approved') return '已通过'
  if (approval.status === 'rejected') return '已驳回'
  return '待审批'
}

const hasApproval = computed(() => {
  const a = detail.value.approval
  return a && (a.approver_id || a.approver_name || a.status)
})

const route = useRoute()
const router = useRouter()
const id = route.params.id
const loading = ref(true)
const detail = ref({})
const logs = ref([])
const showAllLogs = ref(false)

// 自定义字段（从 custom_data 解析，已合并到 basicDisplayFields，保留备用）
const createFormFields = ref([])

// 元素类型（project_type）value → label 映射
const projectTypeOptions = ref({})
function projectTypeLabel(v) {
  if (!v) return ''
  return projectTypeOptions.value[v] || v
}

// 内置字段取值映射
function getBuiltInValue(key) {
  const map = {
    client_id: detail.value.client_name,
    title: detail.value.title,
    project_type: projectTypeLabel(detail.value.project_type),
    address: detail.value.address,
    description: detail.value.description,
    activity_name: detail.value.activity_name,
    contact_name: detail.value.contact_name,
    contact_phone: detail.value.contact_phone,
  }
  return map[key]
}

// 基本信息展示字段列表
const basicDisplayFields = computed(() => {
  if (!createFormFields.value.length) return []
  const cd = detail.value.custom_data || {}
  const result = []
  createFormFields.value.forEach(f => {
    if (f.field_key === 'client_id') {
      // client_id 映射为 client_name 展示
      const val = detail.value.client_name
      if (val) result.push({ key: 'client_id', label: f.field_label, type: 'text', value: val })
      return
    }
    const rawVal = getBuiltInValue(f.field_key) ?? cd[f.field_key]
    const isEmpty = rawVal === undefined || rawVal === null || rawVal === '' || (Array.isArray(rawVal) && !rawVal.length)
    if (isEmpty && !f.required) return
    // 地址字段后面自动跟联系人
    if (f.field_key === 'address') {
      const contactInfo = (detail.value.contact_name || '') + (detail.value.contact_phone ? ' ' + detail.value.contact_phone : '')
      result.push({ key: 'address', label: f.field_label, type: 'text', value: rawVal })
      if (contactInfo.trim()) {
        result.push({ key: 'contact', label: '联系人', type: 'text', value: contactInfo.trim() })
      }
      return
    }
    result.push({ key: f.field_key, label: f.field_label, type: f.field_type, value: rawVal })
  })
  return result
})

// 下拉选 label 解析
function resolveSelectLabel(field) {
  const meta = createFormFields.value.find(f => f.field_key === field.key)
  if (!meta?.options?.length) return field.value
  const opt = meta.options.find(o => o.value === field.value)
  return opt?.label || field.value
}

// 推荐测量员
const measurerGroups = ref([])

// 编辑/删除
const showEditDialog = ref(false)
const editing = ref(false)
const editFormRef = ref(null)
const editForm = reactive({})

// 测量审核
const submitting = ref(false)
const showRejectDialog = ref(false)
const showProxyDialog = ref(false)
const rejectReason = ref('')

const auth = useAuthStore()

// 仅管理员可审核测量
const isAdmin = computed(() => auth.user?.role === 'admin' || auth.user?.role === 'super_admin')

// 编辑时的文件上传列表
const editFileLists = ref({})
const uploadHeaders = computed(() => ({ Authorization: `Bearer ${auth.token}` }))

function onEditFileSuccess(res, file, fieldKey) {
  const url = res.url || res.data?.url
  if (!url) return ElMessage.error('上传成功但未返回文件地址')
  if (!editForm[fieldKey]) editForm[fieldKey] = []
  if (!editForm[fieldKey].includes(url)) editForm[fieldKey].push(url)
  if (!editFileLists.value[fieldKey]) editFileLists.value[fieldKey] = []
  if (!editFileLists.value[fieldKey].find(f => f.url === url)) {
    editFileLists.value[fieldKey].push({ name: file.name || url.split('/').pop(), url })
  }
}

function onFileError(err) {
  const msg = err?.response?.data?.error || err?.message || '上传失败'
  ElMessage.error(msg)
}

// 可编辑字段列表（从后台配置中过滤）
const editableFields = computed(() => {
  if (!createFormFields.value.length) {
    // 降级：默认字段
    return [
      { key: 'title', label: '店铺名字', type: 'text', required: true },
      { key: 'project_category', label: '项目分类', type: 'select', required: false,
        options: [
          { label: '日常', value: 'daily' }, { label: '门头招牌', value: 'storefront' },
          { label: '室内广告', value: 'indoor_ad' }, { label: 'LED大屏', value: 'led_screen' },
          { label: '520', value: '520' }, { label: '国庆', value: 'national_day' },
          { label: '春节', value: 'spring_festival' },
        ]
      },
      { key: 'description', label: '需求描述', type: 'textarea', required: false },
    ]
  }
  return createFormFields.value
    .filter(f => f.field_type !== 'client_select') // 甲方不可编辑
    .map(f => ({
      key: f.field_key,
      label: f.field_label,
      type: f.field_type,
      required: f.required,
      options: f.options,
      enable_parse: f.enable_parse,
    }))
})

const canEdit = computed(() =>
  detail.value.current_stage === 'assignment' && !detail.value.assigned_tenant_user_id
)
const canDelete = computed(() =>
  detail.value.current_stage && detail.value.current_stage !== 'archive'
)

watch(showEditDialog, (val) => {
  if (val) {
    // 清空
    Object.keys(editForm).forEach(k => delete editForm[k])
    editFileLists.value = {}
    // 从表单配置填充值
    const cd = detail.value.custom_data || {}
    editableFields.value.forEach(f => {
      if (f.key === 'title') editForm[f.key] = detail.value.title || ''
      else if (f.key === 'project_category') editForm[f.key] = detail.value.project_category || ''
      else if (f.key === 'description') editForm[f.key] = detail.value.description || ''
      else if (f.key === 'activity_name') editForm[f.key] = detail.value.activity_name || ''
      else if (f.key === 'deadline') editForm[f.key] = detail.value.deadline || ''
      else if (f.key === 'project_type') editForm[f.key] = detail.value.project_type || ''
      else if (f.key === 'address') editForm[f.key] = detail.value.address || ''
      else if (f.key === 'contact_name') editForm[f.key] = detail.value.contact_name || ''
      else if (f.key === 'contact_phone') editForm[f.key] = detail.value.contact_phone || ''
      else editForm[f.key] = cd[f.key] || ''

      // 初始化图片文件列表
      if (f.type === 'image' && editForm[f.key] && editForm[f.key].length) {
        editFileLists.value[f.key] = editForm[f.key].map(url => ({ name: url.split('/').pop(), url }))
      }
    })
  }
})

// 审核通过
async function approveMeasurement() {
  submitting.value = true
  try {
    await api.post(`/measurements/${id}/review`, { action: 'approve' })
    ElMessage.success('审核通过')
    await loadWorkOrder()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

// 打开驳回对话框
function openRejectDialog() {
  rejectReason.value = ''
  showRejectDialog.value = true
}

// 确认驳回
async function confirmReject() {
  if (!rejectReason.value.trim()) return ElMessage.warning('请填写驳回原因')
  submitting.value = true
  try {
    await api.post(`/measurements/${id}/review`, { action: 'reject', reason: rejectReason.value.trim() })
    ElMessage.success('已驳回')
    showRejectDialog.value = false
    await loadWorkOrder()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function submitEdit() {
  editing.value = true
  try {
    // 分离主表字段和自定义字段
    const woBody = {}
    const customData = {}
    const declBody = {}

    editableFields.value.forEach(f => {
      const val = editForm[f.key]
      if (f.key === 'address') declBody.address = val
      else if (f.key === 'project_type') declBody.project_type = val
      else if (f.key === 'contact_name') declBody.contact_name = val
      else if (f.key === 'contact_phone') declBody.contact_phone = val
      else if (['title', 'project_category', 'description', 'activity_name', 'deadline'].includes(f.key)) woBody[f.key] = val
      else customData[f.key] = val
    })

    // 合并自定义字段
    Object.assign(woBody, customData)
    if (Object.keys(customData).length > 0) woBody.custom_data = customData

    await api.put(`/work-orders/${id}`, woBody)
    ElMessage.success('更新成功')
    showEditDialog.value = false
    await loadWorkOrder()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '更新失败')
  } finally {
    editing.value = false
  }
}

async function deleteWorkOrder() {
  try {
    await ElMessageBox.confirm('确定删除此工单吗？此操作不可恢复。', '提示', { type: 'warning' })
    await api.delete(`/work-orders/${id}`)
    ElMessage.success('已删除')
    router.back()
  } catch (err) {
    if (err !== 'cancel' && err !== 'close') {
      ElMessage.error(err.response?.data?.error || '删除失败')
    }
  }
}

// 派单
const showDispatchDialog = ref(false)
const dispatching = ref(false)
const dispatchFormRef = ref(null)
const userOptions = ref([])
const dispatchForm = reactive({ assigned_to: '', deadline: '', notes: '' })
const dispatchRules = {
  assigned_to: [{ required: true, message: '请选择负责人', trigger: 'change' }]
}
const roleMap = { admin: '管理员', dispatcher: '调度员', measurer: '测量员', designer: '设计师', producer: '生产', constructor: '施工', finance: '财务' }

async function loadWorkOrder() {
  try {
    const [woRes, logRes] = await Promise.all([
      api.get(`/work-orders/${id}`),
      api.get(`/work-orders/${id}/logs`)
    ])
    detail.value = woRes.data || {}
    logs.value = logRes.data || []
  } catch (e) {
    logger.error('加载工单失败:', e)
  }
}

async function loadTenantUsers() {
  try {
    const res = await api.get('/tenants/users')
    const payload = res.data || {}
    const users = Array.isArray(payload) ? payload : (payload.list || [])
    userOptions.value = users.filter(u => u.status === 'active').map(u => ({
      ...u,
      roleLabel: roleMap[u.role] || u.role
    }))
  } catch (e) {
    logger.error('加载人员列表失败:', e)
  }
}

async function submitDispatch() {
  const valid = await dispatchFormRef.value.validate().catch(() => false)
  if (!valid) return
  dispatching.value = true
  try {
    await api.post('/assignments', {
      work_order_id: parseInt(id),
      assigned_to: dispatchForm.assigned_to,
      deadline: dispatchForm.deadline || null,
      notes: dispatchForm.notes || null,
    })
    ElMessage.success('派单成功')
    showDispatchDialog.value = false
    // 重新加载详情
    const woRes = await api.get(`/work-orders/${id}`)
    detail.value = woRes.data || {}
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '派单失败')
  } finally {
    dispatching.value = false
  }
}

watch(showDispatchDialog, (val) => {
  if (val) {
    dispatchForm.assigned_to = ''
    dispatchForm.deadline = ''
    dispatchForm.notes = ''
    // 打开派单对话框时加载推荐测量员
    loadRecommendedMeasurers()
  }
})

// 日志类型图标
function logTypeIcon(type) {
  const map = { create: 'Plus', edit: 'Edit', delete: 'Delete', stage_change: 'Top', stage_changed: 'Top', approval: 'Check', dispatch: 'Share' }
  return map[type] || 'Document'
}

function logTypeColor(type) {
  const map = { create: 'success', edit: '', delete: 'danger', stage_change: 'warning', stage_changed: 'warning', approval: 'success', dispatch: 'primary', design_upload: '', design_approve: 'success', design_reject: 'danger', upload_design: '', design_approved: 'success', design_confirm: 'success', archived: 'success', aftersale_created: 'warning', aftersale_resolved: 'success', aftersale_closed: 'info', aftersale_rated: 'success', construction_submitted: 'success', internal_verified: 'success', internal_verify_rejected: 'danger', client_accepted: 'success', client_verify_rejected: 'danger', construction_exception: 'danger', work_order_created: 'success', work_order_updated: '', work_order_deleted: 'danger', stage_advanced: 'warning', remark_added: 'info', work_order_reassigned: 'warning', tags_updated: 'info', priority_updated: 'info', deadline_updated: 'info', production_task_created: 'info', production_warehoused: 'success', production_status_updated: 'info', material_pickup: 'info', quote_created: 'info', payment_recorded: 'success', invoice_created: 'info', settlement_submitted: 'warning', settlement_rejected: 'danger', create_assignment: 'primary', receive_assignment: 'success', proxy_submit_measurement: 'warning', approve_measurement: 'success', reject_measurement: 'danger', measurement_rejected: 'danger', resubmit_measurement: 'info' }
  return map[type] || 'info'
}

function logTypeLabel(type) {
  const map = {
    // 通用类型
    create: '创建', edit: '编辑', delete: '删除', stage_change: '阶段变更', stage_changed: '阶段变更',
    approval: '审批', dispatch: '派单', remark_added: '备注', remark: '备注',
    priority_updated: '优先级变更', priority_change: '优先级变更',
    deadline_updated: '截止日变更', deadline_change: '截止日变更',
    tags_updated: '标签变更', tag_change: '标签变更',
    work_order_reassigned: '转交负责人', reassign: '转交负责人',
    // 工单
    work_order_created: '创建工单', work_order_updated: '编辑工单', work_order_deleted: '删除工单',
    // 阶段
    stage_advanced: '阶段推进', stage_reverted: '阶段回退', batch_stage_changed: '批量阶段变更',
    // 派单/测量
    create_assignment: '创建派单', receive_assignment: '确认接派单',
    approve_measurement: '测量审核通过', reject_measurement: '测量驳回', measurement_rejected: '测量驳回', resubmit_measurement: '重新提交测量',
    proxy_submit_measurement: '代录测量数据',
    // 设计
    designer_assign: '指派设计师', upload_design: '上传设计稿',
    design_approve: '设计审核通过', design_reject: '设计审核驳回',
    design_confirm: '设计确认定稿', design_update: '修改设计稿',
    design_approved: '设计审核通过', design_upload: '上传设计',
    material_change: '材料变更',
    // 生产
    production_task_created: '创建生产任务', production_status_updated: '更新生产状态',
    production_warehoused: '生产入库', material_pickup: '材料领取',
    // 施工
    construction_submitted: '提交施工', internal_verified: '内验通过',
    internal_verify_rejected: '内验驳回', client_accepted: '甲方验收通过',
    client_verify_rejected: '甲方验收驳回', construction_exception: '施工异常',
    // 费用
    quote_created: '创建报价', payment_recorded: '录入收款',
    invoice_created: '创建发票', settlement_submitted: '提交结算',
    settlement_rejected: '结算驳回',
    // 归档/售后
    archived: '工单归档', aftersale_created: '创建售后', aftersale_resolved: '售后已解决',
    aftersale_closed: '售后已关闭', aftersale_rated: '售后评价',
  }
  return map[type] || type || '操作'
}

// 加载推荐测量员
async function loadRecommendedMeasurers() {
  try {
    const res = await api.get('/assignments/recommended-measurers')
    const measurers = res.data || []
    // 按负载分组
    const groups = { free: [], moderate: [], busy: [] }
    for (const m of measurers) {
      const match = userOptions.value.find(u => u.id === m.id)
      if (match) {
        groups[m.load_level || 'free'].push({ ...match, task_count: m.task_count || 0 })
      }
    }
    measurerGroups.value = [
      { level: 'free', label: '空闲', tagType: 'success', users: groups.free },
      { level: 'moderate', label: '适中', tagType: '', users: groups.moderate },
      { level: 'busy', label: '繁忙', tagType: 'danger', users: groups.busy },
    ].filter(g => g.users.length)
  } catch (e) {
    logger.error('加载推荐测量员失败:', e)
    measurerGroups.value = []
  }
}

const stages = [
  { key: 'declaration', label: '申报' },
  { key: 'approval', label: '审批' },
  { key: 'assignment', label: '派单' },
  { key: 'measurement', label: '测量' },
  { key: 'design', label: '设计' },
  { key: 'production', label: '生产' },
  { key: 'construction', label: '施工' },
  { key: 'archive', label: '归档' }
]

const currentStepIndex = computed(() => stages.findIndex(s => s.key === detail.value.current_stage))
const currentStageLabel = computed(() => {
  const s = stages.find(s => s.key === detail.value.current_stage)
  return s ? s.label : '未知'
})

// 环节操作配置
const stageActionConfig = {
  declaration: { icon: '📋', hint: '查看申报详情', action: 'view' },
  approval:    { icon: '✅', hint: '查看审批结果', action: 'view' },
  assignment:  { icon: '📤', hint: '点击指派负责人', action: 'dispatch' },
  measurement: { icon: '📐', hint: '点击录入测量数据', action: 'measure' },
  design:      { icon: '🎨', hint: '点击查看设计稿', action: 'view' },
  production:  { icon: '🏭', hint: '查看生产进度', action: 'view' },
  construction:{ icon: '🔧', hint: '查看施工记录', action: 'view' },
  finance:     { icon: '💰', hint: '查看结算信息', action: 'view' },
  archive:     { icon: '📁', hint: '查看归档信息', action: 'view' },
  aftersale:   { icon: '🔧', hint: '查看售后记录', action: 'view' },
}

const stageActionIcon = computed(() => {
  return stageActionConfig[detail.value.current_stage]?.icon || '📋'
})

const stageActionHint = computed(() => {
  return stageActionConfig[detail.value.current_stage]?.hint || ''
})

function handleStageAction() {
  const action = stageActionConfig[detail.value.current_stage]?.action
  if (action === 'dispatch') {
    showDispatchDialog.value = true
  } else if (action === 'measure') {
    showProxyDialog.value = true
  } else {
    // view actions - navigate to corresponding page
    const route = stageRouteMap[detail.value.current_stage]
    if (route) router.push(route)
  }
}
// 测量数据取第一条
const measurementData = computed(() => {
  const list = detail.value.measurements
  if (!list || !list.length) return null
  return list[0]
})

// 用于编辑的测量数据
const measurementDataForEdit = computed(() => {
  if (!measurementData.value) return null
  const md = measurementData.value
  // 优先从 materials 取，其次从 basic_info.proxy_data 取
  let templateId = md.materials?.[0]?.template_id
    || md.basic_info?.proxy_data?.template_id
    || null
  return {
    materials: md.materials || [],
    template_id: templateId,
    basic_info: md.basic_info || {},
  }
})

// 项目名称（从工单 custom_data 中获取）
const projectName = computed(() => detail.value.custom_data?.project_name || null)

// 从 materials 计算总面积
const measurementTotalArea = computed(() => {
  const m = measurementData.value
  if (!m?.materials) return 0
  return m.materials.reduce((sum, mat) => {
    return sum + (mat.faces || []).reduce((s, f) => s + (Number(f.area) || 0), 0)
  }, 0)
})

// 按材料+分组展示测量数据
const measurementGroupedMaterials = computed(() => {
  const m = measurementData.value
  if (!m?.materials) return []
  const result = []
  for (const mat of m.materials) {
    const type = mat.material_type || mat.type || '未分类'
    const faceGroups = {}
    let totalArea = 0
    for (const face of (mat.faces || [])) {
      const groupName = face.group_name || ''
      if (!faceGroups[groupName]) {
        faceGroups[groupName] = { name: groupName, isUnified: !!face.is_unified, faces: [] }
      }
      const area = Number(face.area) || 0
      faceGroups[groupName].faces.push(face)
      totalArea += area
    }
    result.push({ type, groups: Object.values(faceGroups), totalArea })
  }
  return result
})

// 派单是否已完成（当前环节在派单之后）
const isAssignmentCompleted = computed(() => {
  const currentIdx = stageOrder.indexOf(detail.value.current_stage)
  return currentIdx > stageOrder.indexOf('assignment')
})

// 是否有未显示的后续环节
const stageRouteMap = {
  declaration: '/declarations',
  measurement: '/audit',
  design: '/designs',
  production: '/production',
  construction: '/construction',
  finance: '/finance',
  archive: '/archive',
  aftersale: '/aftersale',
}

function handleStageClick(stage) {
  const route = stageRouteMap[stage]
  if (route) router.push(route)
}

const FINANCE_STATUS = { quoted: '报价中', paid: '已结清', invoiced: '已开票', settlement_complete: '结算完成' }
function financeStatus(s) { return FINANCE_STATUS[s] || s }

// 广告类型标签映射
const adTypeLabels = ref({})
async function loadAdTypeLabels() {
  try {
    const res = await api.get('/tenant/settings/project-templates')
    const map = {}
    ;(res.data?.templates || []).forEach(tmpl => {
      tmpl.ad_types?.forEach(ad => { map[ad.key] = ad.label })
    })
    adTypeLabels.value = map
  } catch {}
}
function resolveAdTypeLabel(mat) {
  const key = mat.material_type || mat.type
  return adTypeLabels.value[key] || key || '-'
}

// 提取测量面的额外字段（张、单价等）
const extraFieldLabels = ref({})
const defaultFieldLabels = {
  quantity: '张',
  unit: '单位',
  unit_price: '单价',
  price: '价格',
  material: '材料',
  thickness: '厚度',
  color: '颜色',
  remark: '备注',
  position: '位置',
  floor: '楼层',
}
function getExtraFields(face) {
  const standardKeys = ['label', 'width', 'height', 'area', 'photos', 'notes', 'group_name', 'is_unified', 'special_flag', '_widthM', '_heightM', 'id', 'created_at', 'updated_at']
  const result = []
  for (const [key, val] of Object.entries(face)) {
    if (standardKeys.includes(key)) continue
    if (key.endsWith('_meter')) continue // 跳过单位转换字段
    if (val === null || val === undefined || val === '') continue
    // 跳过纯技术字段
    if (['unit', 'id', 'createdAt', 'updatedAt'].includes(key)) continue
    const label = extraFieldLabels.value[key] || defaultFieldLabels[key] || key
    result.push({ key, label, value: val })
  }
  return result
}

async function loadExtraFieldLabels() {
  try {
    const res = await api.get('/tenant/settings/project-templates')
    const map = {}
    ;(res.data?.templates || []).forEach(tmpl => {
      tmpl.ad_types?.forEach(ad => {
        (ad.face_fields || []).forEach(f => {
          map[f.field_key] = f.field_label
        })
      })
    })
    extraFieldLabels.value = map
  } catch {}
}

onMounted(async () => {
  loadTenantUsers()
  loadAdTypeLabels()
  loadExtraFieldLabels()
  // 加载补录工单表单配置，用于解析 custom_data
  try {
    const formRes = await api.get('/tenant/form-config/work_order_create')
    if (formRes.code === 0 && formRes.data) {
      createFormFields.value = formRes.data.fields || []
      // 提取 project_type options 映射
      const ptField = formRes.data.fields?.find(f => f.field_key === 'project_type')
      if (ptField?.options) {
        for (const opt of ptField.options) {
          if (opt.value && opt.label) projectTypeOptions.value[opt.value] = opt.label
        }
      }
    }
  } catch {}
  try {
    const [woRes, logRes] = await Promise.all([
      api.get(`/work-orders/${id}`),
      api.get(`/work-orders/${id}/logs`)
    ])
    detail.value = woRes.data || {}
    logs.value = logRes.data || []
  } catch {
    ElMessage.error('加载失败')
    detail.value = {}
    logs.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.mb-8 { margin-bottom: var(--space-2); }
.mb-16 { margin-bottom: var(--space-4); }
.mb-20 { margin-bottom: var(--space-5); }
.section-title { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); }
.mt-16 { margin-top: var(--space-4); }
.text-muted { color: var(--color-text-tertiary); font-size: var(--font-size-xs); }
.text-danger { color: var(--color-danger); }
.action-link { color: var(--color-primary); cursor: pointer; }
.photo-grid { display: grid; grid-template-columns: repeat(5, 80px); gap: var(--space-2); }
.photo-item { width: 80px; height: 80px; border-radius: var(--radius-sm); cursor: pointer; }
.current-stage-box { text-align: center; padding: var(--space-4); }
.stage-icon { font-size: var(--font-size-xl); margin-bottom: var(--space-2); }
.stage-name { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); }

/* 当前环节操作卡片 */
.stage-action-card {
  cursor: pointer;
  transition: all 0.2s;
  background: var(--color-primary);
  color: white;
  overflow: hidden;
  position: relative;
}
.stage-action-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}
.stage-action-card::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -10%;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
}
.stage-action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.35);
}
.stage-action-card:active {
  transform: translateY(0);
}
.stage-action-card :deep(.el-card__header) {
  background: transparent;
  border-bottom-color: rgba(255, 255, 255, 0.2);
  padding: 12px 20px;
}
.stage-action-card :deep(.el-card__header .section-title) {
  color: rgba(255, 255, 255, 0.8);
  font-weight: 400;
  font-size: var(--font-size-sm);
}
.stage-action-card :deep(.el-card__body) {
  padding: 24px 20px;
}
.stage-action-content {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 1;
}
.stage-action-icon {
  font-size: 40px;
  flex-shrink: 0;
}
.stage-action-text {
  flex: 1;
}
.stage-action-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: white;
  margin-bottom: 4px;
}
.stage-action-hint {
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.7);
}

.edit-actions { display: flex; gap: 8px; }
.stage-item-box { margin-bottom: var(--space-3); }
.stage-item-box:last-child { margin-bottom: 0; }
.material-section { border: 1px solid var(--color-border-light); border-radius: var(--radius-sm); margin-bottom: var(--space-3); overflow: hidden; }
.mat-header { background: var(--color-bg-page); padding: var(--space-3) var(--space-4); font-weight: var(--font-weight-medium); font-size: var(--font-size-sm); }
.mat-body { padding: 0 var(--space-4); }
.meas-group { margin: 8px 0; }
.meas-group-header { display: flex; align-items: center; gap: 8px; padding: 6px 8px; background: var(--color-bg-page); border-left: 3px solid var(--color-primary); margin-bottom: 4px; }
.meas-group-name { font-weight: var(--font-weight-medium); font-size: var(--font-size-xs); flex: 1; }
.face-row { display: grid; grid-template-columns: 60px 120px 80px 1fr auto; gap: var(--space-2); padding: var(--space-2) 0; border-bottom: 1px solid var(--color-border-light); font-size: var(--font-size-xs); align-items: center; }
.face-row:last-child { border-bottom: none; }
.face-label { color: var(--color-text-tertiary); }
.face-area { color: var(--color-primary); font-weight: var(--font-weight-medium); }
.face-extra { display: flex; gap: 4px; flex-wrap: wrap; }
.extra-tag { font-size: 11px; }
.face-photos { display: flex; gap: 4px; align-items: center; }
.face-thumb { width: 36px; height: 36px; border-radius: 4px; cursor: pointer; }
.more-photos { font-size: 10px; color: var(--color-text-tertiary); }
.action-buttons { display: flex; flex-direction: column; gap: var(--space-2); margin-top: var(--space-4); }
.clickable-steps :deep(.el-step__title) { cursor: pointer; }
.clickable-steps :deep(.el-step__head) { cursor: pointer; }
.log-item { line-height: 1.6; }
.log-header { display: flex; align-items: center; gap: var(--space-2); }
.log-detail { flex: 1; font-size: var(--font-size-sm); }
.log-expand-hint { text-align: center; margin-bottom: 12px; }
.log-change { margin-top: 4px; font-size: var(--font-size-xs); color: var(--color-text-secondary); }
.log-old { color: var(--color-text-tertiary); text-decoration: line-through; margin: 0 4px; }
.log-new { color: var(--color-primary); margin: 0 4px; font-weight: var(--font-weight-medium); }
.log-amount { margin-top: 2px; font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); }
.amount-positive { color: var(--color-danger); }
.amount-negative { color: var(--color-success); }
.design-photo-grid { display: grid; grid-template-columns: repeat(4, 160px); gap: var(--space-3); }
.design-photo-item { width: 160px; height: 120px; border-radius: var(--radius-sm); cursor: pointer; }
.measurer-section { margin-bottom: 12px; }
.measurer-group { margin-bottom: 12px; }
.group-label { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.measurer-list { display: flex; flex-wrap: wrap; gap: 8px; }
.measurer-tag { cursor: pointer; padding: 6px 14px; transition: all 0.15s; user-select: none; }
.measurer-tag:hover { border-color: var(--color-primary); }
.measurer-selected { border-color: var(--color-primary) !important; color: var(--color-primary) !important; background: var(--color-primary-light-9) !important; }

/* 环节空状态 */
.stage-empty {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
}
.stage-empty-icon {
  font-size: 36px;
  margin-bottom: 12px;
}
.stage-empty-text {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
}
.stage-empty-hint {
  font-size: 13px;
  color: #6b7280;
}

/* 后续环节提示 */
.future-hint {
  text-align: center;
  padding: 16px;
  color: #9ca3af;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* 基本信息照片 */
.basic-photo-grid { display: flex; gap: 8px; flex-wrap: wrap; }
.basic-photo-thumb { width: 100px; height: 100px; border-radius: var(--radius-sm); cursor: pointer; }
.file-link { color: var(--color-primary); font-size: 13px; }
</style>
