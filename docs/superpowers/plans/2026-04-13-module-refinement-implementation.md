# 模块细化功能实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 按三阶段实现 16 个功能点，增强广告工程管理系统页面功能。第一阶段 6 个基础增强（无新表），第二阶段 5 个新表新功能，第三阶段 5 个设计师视角体验优化。

**架构：** 后端新增 4 张表（wo_change_logs, wo_materials, wo_construction_logs, wo_production_progress），修改 1 张表（work_orders 新增质保期字段）。新增 4 个控制器、4 组路由。前端主要在 WorkOrderDetail.vue（大幅修改）、Designs.vue、Construction.vue、Aftersale.vue、MeasureReview.vue、Production.vue、Dispatch.vue 等页面扩展功能区块。

**技术栈：** Express.js + Sequelize ORM + MySQL 8.0 | Vue 3 Composition API + Element Plus

---

## 数据库变更总览

### 第一阶段 SQL（直接 ALTER TABLE）
```sql
-- work_order_logs 表新增字段
ALTER TABLE work_order_logs ADD COLUMN log_type VARCHAR(30) DEFAULT NULL COMMENT '操作类型';
ALTER TABLE work_order_logs ADD COLUMN field_name VARCHAR(50) DEFAULT NULL COMMENT '变更字段名';
ALTER TABLE work_order_logs ADD COLUMN old_value TEXT DEFAULT NULL COMMENT '变更前值';
ALTER TABLE work_order_logs ADD COLUMN new_value TEXT DEFAULT NULL COMMENT '变更后值';
ALTER TABLE work_order_logs ADD COLUMN amount_change DECIMAL(10,2) DEFAULT NULL COMMENT '金额变化';

-- work_orders 表新增质保期字段
ALTER TABLE work_orders ADD COLUMN warranty_end_date DATE DEFAULT NULL COMMENT '质保到期日';

-- wo_constructions 表新增对比照片字段（如果不存在）
-- 注：已有 before_photos, after_photos JSON 字段，无需 ALTER
```

### 第二阶段 SQL（新建表）
```sql
CREATE TABLE wo_change_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  work_order_id INT NOT NULL,
  change_type ENUM('material_change','size_change','add_item','remove_item','other') NOT NULL,
  description TEXT,
  reason TEXT,
  cost_impact DECIMAL(10,2) DEFAULT 0,
  approved_by VARCHAR(50),
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL,
  INDEX idx_wo (work_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wo_materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  work_order_id INT NOT NULL,
  category VARCHAR(50),
  name VARCHAR(100) NOT NULL,
  spec VARCHAR(100),
  unit VARCHAR(20),
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL,
  INDEX idx_wo (work_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wo_construction_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  work_order_id INT NOT NULL,
  log_date DATE NOT NULL,
  content TEXT,
  labor_count INT,
  labor_hours DECIMAL(5,1),
  problem_description TEXT,
  photos JSON,
  weather VARCHAR(20),
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL,
  INDEX idx_wo (work_order_id),
  INDEX idx_date (log_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wo_production_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  work_order_id INT NOT NULL,
  step_name VARCHAR(50) NOT NULL,
  progress_pct INT DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_wo (work_order_id),
  INDEX idx_step (step_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 文件结构总览

| 文件 | 变更类型 | 涉及功能 |
|------|----------|---------|
| `backend/src/models/WoChangeLog.js` | 新建 | 功能7 |
| `backend/src/models/WoMaterial.js` | 新建 | 功能8 |
| `backend/src/models/WoConstructionLog.js` | 新建 | 功能9 |
| `backend/src/models/WoProductionProgress.js` | 新建 | 功能10 |
| `backend/src/models/WorkOrderLog.js` | 修改 | 功能1 |
| `backend/src/models/WorkOrder.js` | 修改 | 功能6 |
| `backend/src/models/index.js` | 修改 | 功能7-10（关联） |
| `backend/src/controllers/changeLogController.js` | 新建 | 功能7 |
| `backend/src/controllers/materialController.js` | 新建 | 功能8 |
| `backend/src/controllers/constructionLogController.js` | 新建 | 功能9 |
| `backend/src/controllers/productionProgressController.js` | 新建 | 功能10 |
| `backend/src/controllers/workOrderController.js` | 修改 | 功能1,6 |
| `backend/src/controllers/assignmentController.js` | 修改 | 功能5 |
| `backend/src/controllers/aftersaleController.js` | 修改 | 功能6 |
| `backend/src/routes/changeLog.js` | 新建 | 功能7 |
| `backend/src/routes/material.js` | 新建 | 功能8 |
| `backend/src/routes/constructionLog.js` | 新建 | 功能9 |
| `backend/src/routes/productionProgress.js` | 新建 | 功能10 |
| `backend/src/routes/index.js` | 修改 | 挂载4组新路由 |
| `admin-web/src/views/WorkOrderDetail.vue` | 大幅修改 | 功能1,7,8,2 |
| `admin-web/src/views/Designs.vue` | 大幅修改 | 功能2,10,12,13,11 |
| `admin-web/src/views/Construction.vue` | 修改 | 功能9 |
| `admin-web/src/views/Aftersale.vue` | 修改 | 功能6 |
| `admin-web/src/views/AftersaleDetail.vue` | 修改 | 功能4 |
| `admin-web/src/views/Dispatch.vue` | 修改 | 功能5 |
| `admin-web/src/views/MeasureReview.vue` | 大幅修改 | 功能15,16,12 |
| `admin-web/src/views/Production.vue` | 修改 | 功能10 |
| `admin-web/src/api/index.js` | 修改 | 新增API函数 |

---

## 第一阶段：基础增强

### 任务 1：操作日志增强

**文件：**
- 修改：`backend/src/models/WorkOrderLog.js`（新增字段）
- 修改：`backend/src/controllers/workOrderController.js`（createLog 函数增强）
- 修改：`admin-web/src/views/WorkOrderDetail.vue:75-83`（日志展示增强）

- [ ] **步骤 1：修改 WorkOrderLog 模型，新增字段**

```javascript
// backend/src/models/WorkOrderLog.js
// 在 ip_address 字段之后添加：
log_type: { type: DataTypes.STRING(30), comment: '操作类型' },
field_name: { type: DataTypes.STRING(50), comment: '变更字段名' },
old_value: { type: DataTypes.TEXT, comment: '变更前值' },
new_value: { type: DataTypes.TEXT, comment: '变更后值' },
amount_change: { type: DataTypes.DECIMAL(10, 2), comment: '金额变化' },
```

运行 SQL：
```bash
mysql -u root -e "USE ad_engineering; ALTER TABLE work_order_logs ADD COLUMN log_type VARCHAR(30) DEFAULT NULL, ADD COLUMN field_name VARCHAR(50) DEFAULT NULL, ADD COLUMN old_value TEXT DEFAULT NULL, ADD COLUMN new_value TEXT DEFAULT NULL, ADD COLUMN amount_change DECIMAL(10,2) DEFAULT NULL;"
```

- [ ] **步骤 2：增强 createLog 函数**

```javascript
// backend/src/controllers/workOrderController.js
// 替换 createLog 函数：
async function createLog(workOrderId, user, action, stage, detail, options = {}) {
  return WorkOrderLog.create({
    work_order_id: workOrderId,
    user_id: user.user_id,
    user_type: user.user_type,
    action,
    stage,
    detail,
    ip_address: user._ip || null,
    log_type: options.log_type || null,
    field_name: options.field_name || null,
    old_value: options.old_value || null,
    new_value: options.new_value || null,
    amount_change: options.amount_change || null,
  });
}
```

- [ ] **步骤 3：更新现有日志调用点，传入 log_type**

在 `advanceWorkOrder` 中：
```javascript
await createLog(wo.id, req.user, 'stage_advanced', target_stage,
  `推进到${STAGE_LABELS[target_stage]}`, { log_type: 'stage_change' });
```

在 `updateStage` 中：
```javascript
await createLog(wo.id, req.user, 'stage_changed', target_stage,
  `从${STAGE_LABELS[oldStage]}拖拽到${STAGE_LABELS[target_stage]}`,
  { log_type: 'stage_change', field_name: 'current_stage', old_value: oldStage, new_value: target_stage });
```

在 `updateWorkOrder` 中：
```javascript
await createLog(wo.id, req.user, 'work_order_updated', 'assignment', '编辑工单信息',
  { log_type: 'edit' });
```

在 `deleteWorkOrder` 中：
```javascript
await createLog(wo.id, req.user, 'work_order_deleted', 'assignment', '删除工单',
  { log_type: 'delete' });
```

在 `createWorkOrder` 中：
```javascript
await createLog(workOrder.id, req.user, 'work_order_created', 'assignment',
  `补录工单：${title}`, { log_type: 'create' });
```

- [ ] **步骤 4：增强 WorkOrderDetail.vue 日志展示**

在 `admin-web/src/views/WorkOrderDetail.vue`，将日志时间线改为带图标和颜色的版本：

```vue
<!-- 替换原来的 el-timeline 部分 -->
<el-timeline>
  <el-timeline-item
    v-for="log in logs"
    :key="log.id"
    :timestamp="log.created_at"
    placement="top"
    :type="logTypeMap[log.log_type]?.type || 'primary'"
    :color="logTypeMap[log.log_type]?.color"
  >
    <div class="log-item">
      <div class="log-header">
        <el-icon class="log-icon" :style="{ color: logTypeMap[log.log_type]?.color }">
          <component :is="logTypeMap[log.log_type]?.icon || 'Document'" />
        </el-icon>
        <span class="log-action">{{ log.detail }}</span>
        <span class="log-user">{{ log.user_name }}</span>
      </div>
      <!-- 阶段变更：显示 旧值 → 新值 -->
      <div v-if="log.log_type === 'stage_change' && log.old_value && log.new_value" class="log-detail">
        <el-tag size="small">{{ log.old_value }}</el-tag>
        <span class="log-arrow">→</span>
        <el-tag size="small" type="success">{{ log.new_value }}</el-tag>
      </div>
      <!-- 金额变更 -->
      <div v-if="log.amount_change" class="log-amount" :class="log.amount_change > 0 ? 'amount-positive' : 'amount-negative'">
        {{ log.amount_change > 0 ? '+' : '' }}{{ formatMoney(log.amount_change) }}
      </div>
    </div>
  </el-timeline-item>
</el-timeline>
```

在 script 中添加映射：
```javascript
import { Document, ArrowRight, User, Check, Close, Edit } from '@element-plus/icons-vue'

const logTypeMap = {
  create: { type: 'success', color: '#16a34a', icon: 'Check' },
  stage_change: { type: 'primary', color: '#2563eb', icon: 'ArrowRight' },
  dispatch: { type: 'primary', color: '#7c3aed', icon: 'User' },
  submit: { type: 'warning', color: '#ea580c', icon: 'Edit' },
  approve: { type: 'success', color: '#16a34a', icon: 'Check' },
  reject: { type: 'danger', color: '#dc2626', icon: 'Close' },
  edit: { type: 'primary', color: '#2563eb', icon: 'Edit' },
  delete: { type: 'danger', color: '#dc2626', icon: 'Close' },
}
```

添加样式：
```css
.log-item { }
.log-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.log-icon { font-size: 16px; }
.log-action { font-weight: 500; flex: 1; }
.log-user { color: var(--color-text-tertiary); font-size: 12px; }
.log-detail { margin-top: 4px; }
.log-arrow { margin: 0 4px; color: var(--color-text-tertiary); }
.log-amount { margin-top: 4px; font-weight: 600; font-size: 14px; }
.amount-positive { color: #16a34a; }
.amount-negative { color: #dc2626; }
```

- [ ] **步骤 5：Commit**

```bash
git add backend/src/models/WorkOrderLog.js backend/src/controllers/workOrderController.js admin-web/src/views/WorkOrderDetail.vue
git commit -m "feat: 增强操作日志，支持类型图标、前后值对比、金额高亮"
```

---

### 任务 2：设计稿在线预览

**文件：**
- 修改：`admin-web/src/views/Designs.vue`（查看按钮改为 el-image 预览）
- 修改：`admin-web/src/views/WorkOrderDetail.vue`（设计稿缩略图网格）

- [ ] **步骤 1：Designs.vue 设计稿预览**

在 Designs.vue 中找到"查看"按钮，改为点击后弹出对话框使用 el-image 预览：

```vue
<!-- 替换原有的查看按钮点击行为 -->
<el-dialog v-model="showPreviewDialog" title="设计稿预览" width="80%">
  <div class="preview-gallery">
    <el-image
      v-for="(url, i) in previewImages"
      :key="i"
      :src="url"
      :preview-src-list="previewImages"
      :initial-index="i"
      fit="contain"
      class="preview-item"
    />
  </div>
</el-dialog>
```

```javascript
const showPreviewDialog = ref(false)
const previewImages = ref([])

function previewDesign(images) {
  previewImages.value = images || []
  showPreviewDialog.value = true
}
```

```css
.preview-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.preview-item {
  width: 100%;
  height: 200px;
  border-radius: 4px;
  cursor: pointer;
}
```

- [ ] **步骤 2：WorkOrderDetail.vue 设计稿展示**

在基本信息卡片下方，新增设计稿区块（当工单有 design_count > 0 时显示）：

```vue
<el-card class="mb-20" v-if="detail.design_count > 0">
  <template #header><span class="section-title">设计稿</span></template>
  <div class="photo-grid">
    <el-image v-for="(url, i) in designImages" :key="i" :src="url"
      :preview-src-list="designImages" :initial-index="i"
      fit="cover" class="photo-item" />
  </div>
</el-card>
```

需要在获取详情时加载设计图片（后端目前只返回 id/status/created_at，需要修改 include 以返回 effect_images）。

- [ ] **步骤 3：后端返回设计稿图片**

修改 `backend/src/controllers/workOrderController.js` 的 `getWorkOrder` 函数中 designs include：

```javascript
{ model: WoDesign, as: 'designs', required: false },
```

在 flattenWorkOrder 中提取设计图片：
```javascript
design_images: obj.designs?.flatMap(d => d.effect_images || []) || [],
```

- [ ] **步骤 4：Commit**

```bash
git add admin-web/src/views/Designs.vue admin-web/src/views/WorkOrderDetail.vue backend/src/controllers/workOrderController.js
git commit -m "feat: 设计稿在线预览，支持 el-image 大图浏览"
```

---

### 任务 3：施工前后对比

**文件：**
- 修改：`admin-web/src/views/Construction.vue`（新增对比 Tab/区块）

- [ ] **步骤 1：在 Construction.vue 列表页，每行新增"对比"按钮**

在施工记录列表中，操作列新增"对比"按钮：

```vue
<el-button size="small" type="info" @click="showContrast(row)">前后对比</el-button>
```

- [ ] **步骤 2：对比对话框**

```vue
<el-dialog v-model="showContrastDialog" title="施工前后对比" width="90%">
  <div class="contrast-container">
    <div class="contrast-pair" v-for="(pair, i) in contrastPairs" :key="i">
      <div class="contrast-side">
        <h4>施工前</h4>
        <el-image v-if="pair.before?.length" :src="pair.before[0]"
          :preview-src-list="pair.before" fit="contain" class="contrast-img" />
        <el-empty v-else description="无施工前照片" :image-size="80" />
      </div>
      <div class="contrast-arrow">→</div>
      <div class="contrast-side">
        <h4>施工后</h4>
        <el-image v-if="pair.after?.length" :src="pair.after[0]"
          :preview-src-list="pair.after" fit="contain" class="contrast-img" />
        <el-empty v-else description="无施工后照片" :image-size="80" />
      </div>
    </div>
  </div>
</el-dialog>
```

```javascript
const showContrastDialog = ref(false)
const contrastPairs = ref([])

function showContrast(row) {
  contrastPairs.value = [{
    before: row.before_photos || [],
    after: row.after_photos || [],
  }]
  showContrastDialog.value = true
}
```

```css
.contrast-container { display: flex; flex-direction: column; gap: 24px; }
.contrast-pair { display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: center; }
.contrast-side { text-align: center; }
.contrast-side h4 { margin-bottom: 8px; color: var(--color-text-secondary); }
.contrast-arrow { font-size: 24px; color: var(--color-primary); }
.contrast-img { width: 100%; height: 300px; border-radius: 4px; cursor: pointer; }
```

- [ ] **步骤 3：Commit**

```bash
git add admin-web/src/views/Construction.vue
git commit -m "feat: 施工前后对比照片展示"
```

---

### 任务 4：关联原工单（售后）

**文件：**
- 修改：`admin-web/src/views/Aftersale.vue`（新增质保状态列）
- 需要创建：`admin-web/src/views/AftersaleDetail.vue`（如果不存在）

- [ ] **步骤 1：检查 AftersaleDetail.vue 是否存在**

```bash
ls admin-web/src/views/AftersaleDetail.vue
```

如果不存在，需要创建。

- [ ] **步骤 2：Aftersale.vue 列表新增质保状态列**

在状态列之后新增：

```vue
<el-table-column label="质保状态" width="120">
  <template #default="{ row }">
    <el-tag v-if="row.workOrder?.warranty_end_date"
      :type="getWarrantyType(row.workOrder.warranty_end_date)"
      size="small">
      {{ getWarrantyText(row.workOrder.warranty_end_date) }}
    </el-tag>
    <el-tag v-else size="small" type="info">—</el-tag>
  </template>
</el-table-column>
```

```javascript
function getWarrantyType(endDate) {
  const diff = daysDiff(new Date(), new Date(endDate))
  if (diff > 0) return 'success'  // 质保期内
  return 'danger'  // 已过期
}

function getWarrantyText(endDate) {
  const diff = daysDiff(new Date(), new Date(endDate))
  if (diff > 0) return `剩余${diff}天`
  return `已过期${Math.abs(diff)}天`
}

function daysDiff(d1, d2) {
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24))
}
```

- [ ] **步骤 3：后端返回 warranty_end_date**

修改 `backend/src/controllers/workOrderController.js` 的 `flattenWorkOrder`，加入：
```javascript
warranty_end_date: obj.warranty_end_date || null,
```

修改 `getWorkOrder` 的 designs include 改为完整字段：
```javascript
{ model: WoDesign, as: 'designs', required: false },
```

- [ ] **步骤 4：Commit**

```bash
git add admin-web/src/views/Aftersale.vue backend/src/controllers/workOrderController.js
git commit -m "feat: 售后列表新增质保状态展示"
```

---

### 任务 5：智能推荐测量员

**文件：**
- 修改：`backend/src/controllers/assignmentController.js`（新增推荐接口）
- 修改：`backend/src/routes/assignment.js`（挂载推荐路由）
- 修改：`admin-web/src/views/WorkOrderDetail.vue`（派单对话框增强）

- [ ] **步骤 1：后端新增推荐接口**

在 `assignmentController.js` 末尾添加：

```javascript
/**
 * GET /api/v1/assignments/recommended-measurers
 * 返回推荐的测量员列表（按当前任务数排序）
 */
async function getRecommendedMeasurers(req, res) {
  try {
    const tenantId = req.user.tenant_id;

    // 获取所有 active 的测量员
    const measurers = await TenantUser.findAll({
      where: { tenant_id: tenantId, role: 'measurer', status: 'active' },
      attributes: ['id', 'name', 'phone', 'role'],
    });

    // 统计每人的当前任务数（current_stage = 'measurement' 且未完成的工单）
    const counts = await WorkOrder.findAll({
      where: { tenant_id: tenantId, current_stage: 'measurement' },
      attributes: ['assigned_tenant_user_id', [fn('COUNT', col('id')), 'task_count']],
      group: ['assigned_tenant_user_id'],
      raw: true,
    });

    const taskMap = {};
    for (const c of counts) {
      taskMap[c.assigned_tenant_user_id] = parseInt(c.task_count, 10);
    }

    const result = measurers.map(m => {
      const taskCount = taskMap[m.id] || 0;
      let loadLevel = 'free';
      if (taskCount >= 3) loadLevel = 'busy';
      else if (taskCount >= 1) loadLevel = 'moderate';

      return {
        ...m.toJSON(),
        task_count: taskCount,
        load_level: loadLevel,
        load_label: loadLevel === 'free' ? '空闲' : loadLevel === 'moderate' ? `${taskCount}个任务` : '繁忙',
      };
    });

    // 排序：空闲 → 适中 → 繁忙
    const order = { free: 0, moderate: 1, busy: 2 };
    result.sort((a, b) => order[a.load_level] - order[b.load_level]);

    return success(res, result);
  } catch (err) {
    console.error('getRecommendedMeasurers error:', err);
    return error(res, '获取推荐测量员失败');
  }
}
```

在 `module.exports` 中导出 `getRecommendedMeasurers`。

- [ ] **步骤 2：挂载推荐路由**

`backend/src/routes/assignment.js` 中，在列表路由之后、:id 路由之前添加：

```javascript
router.get('/recommended-measurers', controller.getRecommendedMeasurers);
```

注意：必须在 `/:id` 路由之前。

- [ ] **步骤 3：前端派单对话框增强**

修改 WorkOrderDetail.vue 的派单对话框中测量员下拉列表：

```vue
<el-select v-model="dispatchForm.assigned_to" placeholder="选择测量员" style="width:100%">
  <el-option-group v-if="measurerGroups.free.length" label="空闲">
    <el-option v-for="u in measurerGroups.free" :key="u.id" :label="u.name" :value="u.id">
      <span>{{ u.name }}</span>
      <el-tag size="small" type="success" style="float:right;margin-left:8px">空闲</el-tag>
    </el-option>
  </el-option-group>
  <el-option-group v-if="measurerGroups.moderate.length" label="适中">
    <el-option v-for="u in measurerGroups.moderate" :key="u.id" :label="u.name" :value="u.id">
      <span>{{ u.name }}</span>
      <el-tag size="small" type="primary" style="float:right;margin-left:8px">{{ u.load_label }}</el-tag>
    </el-option>
  </el-option-group>
  <el-option-group v-if="measurerGroups.busy.length" label="繁忙">
    <el-option v-for="u in measurerGroups.busy" :key="u.id" :label="u.name" :value="u.id">
      <span>{{ u.name }}</span>
      <el-tag size="small" type="danger" style="float:right;margin-left:8px">繁忙</el-tag>
    </el-option>
  </el-option-group>
  <!-- 降级方案 -->
  <el-option v-if="!measurerGroups.free && !measurerGroups.moderate && !measurerGroups.busy"
    v-for="u in userOptions.filter(u => u.role === 'measurer')" :key="u.id" :label="u.name" :value="u.id">
    <span>{{ u.name }}</span>
    <span style="float:right;color:#8c8c8c;font-size:12px">{{ u.roleLabel }}</span>
  </el-option>
</el-select>
```

```javascript
const measurerGroups = reactive({ free: [], moderate: [], busy: [] })

async function loadRecommendedMeasurers() {
  try {
    const res = await api.get('/assignments/recommended-measurers')
    const users = res.data || []
    measurerGroups.free = users.filter(u => u.load_level === 'free')
    measurerGroups.moderate = users.filter(u => u.load_level === 'moderate')
    measurerGroups.busy = users.filter(u => u.load_level === 'busy')
  } catch (e) {
    console.error('加载推荐测量员失败:', e)
  }
}
```

在 `watch(showDispatchDialog)` 中调用 `loadRecommendedMeasurers()`。

- [ ] **步骤 4：Commit**

```bash
git add backend/src/controllers/assignmentController.js backend/src/routes/assignment.js admin-web/src/views/WorkOrderDetail.vue
git commit -m "feat: 智能推荐测量员，按任务负载分组显示"
```

---

### 任务 6：质保期管理

**文件：**
- 修改：`backend/src/models/WorkOrder.js`（新增 warranty_end_date 字段）
- 修改：`backend/src/controllers/aftersaleController.js`（归档时计算质保到期日）
- 修改：`admin-web/src/views/Aftersale.vue`（已在任务4中部分实现）

- [ ] **步骤 1：修改 WorkOrder 模型**

```javascript
// backend/src/models/WorkOrder.js
// 在 completed_at 之后添加：
warranty_end_date: { type: DataTypes.DATEONLY, comment: '质保到期日' },
```

运行 SQL：
```bash
mysql -u root -e "USE ad_engineering; ALTER TABLE work_orders ADD COLUMN warranty_end_date DATE DEFAULT NULL COMMENT '质保到期日';"
```

- [ ] **步骤 2：归档时自动计算质保到期日**

找到归档相关的控制器（可能是 `archiveController.js` 或 `workOrderController.js`），在归档操作时：

```javascript
// 假设默认质保天数为 365（可从租户 settings 读取）
const warrantyDays = 365;
const archiveDate = new Date();
const warrantyEndDate = new Date(archiveDate);
warrantyEndDate.setDate(warrantyEndDate.getDate() + warrantyDays);

await workOrder.update({
  warranty_end_date: warrantyEndDate.toISOString().slice(0, 10),
});
```

- [ ] **步骤 3：AftersaleDetail 显示原工单质保信息**

在 AftersaleDetail 页面显示质保到期日。

- [ ] **步骤 4：Commit**

```bash
git add backend/src/models/WorkOrder.js backend/src/controllers/archiveController.js
git commit -m "feat: 质保期管理，归档时自动计算质保到期日"
```

---

## 第二阶段：新表新功能

### 任务 7：变更记录

**文件：**
- 创建：`backend/src/models/WoChangeLog.js`
- 创建：`backend/src/controllers/changeLogController.js`
- 创建：`backend/src/routes/changeLog.js`
- 修改：`backend/src/models/index.js`
- 修改：`backend/src/routes/index.js`
- 修改：`admin-web/src/views/WorkOrderDetail.vue`

- [ ] **步骤 1：创建 WoChangeLog 模型**

```javascript
// backend/src/models/WoChangeLog.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('WoChangeLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  work_order_id: { type: DataTypes.INTEGER, allowNull: false },
  change_type: {
    type: DataTypes.ENUM('material_change', 'size_change', 'add_item', 'remove_item', 'other'),
    allowNull: false,
  },
  description: { type: DataTypes.TEXT },
  reason: { type: DataTypes.TEXT },
  cost_impact: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  approved_by: { type: DataTypes.STRING(50) },
  created_by: { type: DataTypes.INTEGER },
}, {
  tableName: 'wo_change_logs',
  underscored: true,
  paranoid: true,
  freezeTableName: true,
  charset: 'utf8mb4',
});
```

- [ ] **步骤 2：添加模型关联**

在 `backend/src/models/index.js` 中：

```javascript
// 在 exports 前添加：
WorkOrder.hasMany(WoChangeLog, { foreignKey: 'work_order_id', as: 'changeLogs' });
WoChangeLog.belongsTo(WorkOrder, { foreignKey: 'work_order_id' });
```

在 exports 中添加 `WoChangeLog`。

- [ ] **步骤 3：创建控制器**

```javascript
// backend/src/controllers/changeLogController.js
const WoChangeLog = require('../models/WoChangeLog');
const WorkOrder = require('../models/WorkOrder');
const { success, error, paginate } = require('../utils/response');
const { buildTenantFilter } = require('../middleware/tenant');

async function listChangeLogs(req, res) {
  const { id } = req.params;
  const where = { work_order_id: parseInt(id) };
  buildTenantFilter(WorkOrder, { id: parseInt(id) })(req);

  const wo = await WorkOrder.findOne({ where: { id: parseInt(id) } });
  if (!wo) return error(res, '工单不存在', 404);

  const logs = await WoChangeLog.findAll({
    where: { work_order_id: wo.id },
    order: [['created_at', 'DESC']],
  });
  return success(res, logs);
}

async function createChangeLog(req, res) {
  const { id } = req.params;
  const { change_type, description, reason, cost_impact, approved_by } = req.body;

  if (!change_type || !description) return error(res, '变更类型和描述为必填', 400);

  const wo = await WorkOrder.findOne({ where: { id: parseInt(id) } });
  if (!wo) return error(res, '工单不存在', 404);

  const log = await WoChangeLog.create({
    work_order_id: wo.id,
    change_type,
    description,
    reason: reason || null,
    cost_impact: cost_impact || 0,
    approved_by: approved_by || null,
    created_by: req.user.user_id,
  });
  return success(res, log, '变更已记录', 201);
}

async function updateChangeLog(req, res) {
  const { logId } = req.params;
  const { change_type, description, reason, cost_impact, approved_by } = req.body;

  const log = await WoChangeLog.findByPk(logId);
  if (!log) return error(res, '变更记录不存在', 404);

  await log.update({
    change_type: change_type || log.change_type,
    description: description ?? log.description,
    reason: reason ?? log.reason,
    cost_impact: cost_impact ?? log.cost_impact,
    approved_by: approved_by ?? log.approved_by,
  });
  return success(res, log, '更新成功');
}

async function deleteChangeLog(req, res) {
  const { logId } = req.params;
  const log = await WoChangeLog.findByPk(logId);
  if (!log) return error(res, '变更记录不存在', 404);

  await log.destroy();
  return success(res, null, '删除成功');
}

module.exports = { listChangeLogs, createChangeLog, updateChangeLog, deleteChangeLog };
```

- [ ] **步骤 4：创建路由**

```javascript
// backend/src/routes/changeLog.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { injectTenant } = require('../middleware/tenant');
const controller = require('../controllers/changeLogController');

router.use(requireAuth, injectTenant);

router.get('/work-orders/:id/change-logs', controller.listChangeLogs);
router.post('/work-orders/:id/change-logs', controller.createChangeLog);
router.put('/work-orders/change-logs/:logId', controller.updateChangeLog);
router.delete('/work-orders/change-logs/:logId', controller.deleteChangeLog);

module.exports = router;
```

- [ ] **步骤 5：挂载路由**

在 `backend/src/routes/index.js` 中添加：

```javascript
const changeLogRoutes = require('./changeLog');
// ...
router.use('/work-orders', changeLogRoutes);
```

**注意：** 因为 changeLog 路由使用 `/work-orders/:id/change-logs` 前缀，挂载在 `/work-orders` 下，需要确保它在 `workOrder.js` 的 `/:id` 路由之前被匹配。由于 Express 按注册顺序匹配路由，且 changeLog 路由是精确路径（有 `/change-logs` 后缀），不会有冲突。

**实际上更安全的做法**是直接在 workOrder.js 路由文件中添加变更日志路由，避免跨文件路由排序问题。让我调整方案：

**调整：** 变更日志路由直接添加到 `backend/src/routes/workOrder.js` 中，在 `/:id` 之前。

```javascript
// 在 workOrder.js 中，getWorkOrderLogs 之后添加：
const changeLogController = require('../controllers/changeLogController');
router.get('/:id/change-logs', changeLogController.listChangeLogs);
router.post('/:id/change-logs', changeLogController.createChangeLog);
router.put('/change-logs/:logId', changeLogController.updateChangeLog);
router.delete('/change-logs/:logId', changeLogController.deleteChangeLog);
```

- [ ] **步骤 6：前端 WorkOrderDetail.vue 新增变更记录卡片**

在操作日志卡片之后新增：

```vue
<el-card class="mt-20">
  <template #header>
    <div class="flex-between">
      <span class="section-title">变更记录</span>
      <el-button type="primary" size="small" @click="showAddChange = true">添加变更</el-button>
    </div>
  </template>
  <el-table :data="changeLogs" stripe size="small">
    <el-table-column label="类型" width="120">
      <template #default="{ row }">
        <el-tag size="small">{{ changeTypeLabel(row.change_type) }}</el-tag>
      </template>
    </el-table-column>
    <el-table-column label="描述" min-width="200" show-overflow-tooltip>
      <template #default="{ row }">{{ row.description }}</template>
    </el-table-column>
    <el-table-column label="费用影响" width="120">
      <template #default="{ row }">
        <span :class="row.cost_impact > 0 ? 'amount-positive' : row.cost_impact < 0 ? 'amount-negative' : ''">
          {{ row.cost_impact > 0 ? '+' : '' }}{{ formatMoney(row.cost_impact) }}
        </span>
      </template>
    </el-table-column>
    <el-table-column label="批准人" width="100">
      <template #default="{ row }">{{ row.approved_by || '-' }}</template>
    </el-table-column>
    <el-table-column label="时间" width="160">
      <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
    </el-table-column>
  </el-table>
</el-card>

<!-- 添加变更对话框 -->
<el-dialog v-model="showAddChange" title="添加变更" width="500px">
  <el-form :model="changeForm" label-width="80px">
    <el-form-item label="变更类型" required>
      <el-select v-model="changeForm.change_type" style="width:100%">
        <el-option label="材料变更" value="material_change" />
        <el-option label="尺寸变更" value="size_change" />
        <el-option label="增项" value="add_item" />
        <el-option label="减项" value="remove_item" />
        <el-option label="其他" value="other" />
      </el-select>
    </el-form-item>
    <el-form-item label="变更描述" required>
      <el-input v-model="changeForm.description" type="textarea" :rows="3" />
    </el-form-item>
    <el-form-item label="变更原因">
      <el-input v-model="changeForm.reason" type="textarea" :rows="2" />
    </el-form-item>
    <el-form-item label="费用影响">
      <el-input-number v-model="changeForm.cost_impact" :precision="2" :step="100" style="width:100%" />
      <div class="text-muted">正数=增加费用，负数=减少</div>
    </el-form-item>
    <el-form-item label="批准人">
      <el-input v-model="changeForm.approved_by" />
    </el-form-item>
  </el-form>
  <template #footer>
    <el-button @click="showAddChange = false">取消</el-button>
    <el-button type="primary" @click="submitChange" :loading="submitting">确认</el-button>
  </template>
</el-dialog>
```

```javascript
const changeLogs = ref([])
const showAddChange = ref(false)
const changeForm = reactive({
  change_type: 'other',
  description: '',
  reason: '',
  cost_impact: 0,
  approved_by: '',
})

const changeTypeMap = {
  material_change: '材料变更',
  size_change: '尺寸变更',
  add_item: '增项',
  remove_item: '减项',
  other: '其他',
}
function changeTypeLabel(t) { return changeTypeMap[t] || t }

async function loadChangeLogs() {
  try {
    const res = await api.get(`/work-orders/${id}/change-logs`)
    changeLogs.value = res.data || []
  } catch {}
}

async function submitChange() {
  if (!changeForm.description) return ElMessage.warning('请填写变更描述')
  try {
    await api.post(`/work-orders/${id}/change-logs`, changeForm)
    ElMessage.success('变更已记录')
    showAddChange.value = false
    Object.assign(changeForm, { change_type: 'other', description: '', reason: '', cost_impact: 0, approved_by: '' })
    await loadChangeLogs()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '添加失败')
  }
}
```

在 `onMounted` 中调用 `loadChangeLogs()`。

- [ ] **步骤 7：Commit**

```bash
git add backend/src/models/WoChangeLog.js backend/src/models/index.js backend/src/controllers/changeLogController.js backend/src/routes/workOrder.js admin-web/src/views/WorkOrderDetail.vue
git commit -m "feat: 变更记录功能，支持增项/减项/材料变更"
```

---

### 任务 8：材料清单 BOM

**文件：**
- 创建：`backend/src/models/WoMaterial.js`
- 创建：`backend/src/controllers/materialController.js`
- 修改：`backend/src/models/index.js`
- 修改：`backend/src/routes/workOrder.js`
- 修改：`admin-web/src/views/WorkOrderDetail.vue`

- [ ] **步骤 1：创建 WoMaterial 模型**

```javascript
// backend/src/models/WoMaterial.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('WoMaterial', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  work_order_id: { type: DataTypes.INTEGER, allowNull: false },
  category: { type: DataTypes.STRING(50) },
  name: { type: DataTypes.STRING(100), allowNull: false },
  spec: { type: DataTypes.STRING(100) },
  unit: { type: DataTypes.STRING(20) },
  quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  unit_price: { type: DataTypes.DECIMAL(10, 2) },
  total_price: { type: DataTypes.DECIMAL(10, 2) },
  notes: { type: DataTypes.TEXT },
}, {
  tableName: 'wo_materials',
  underscored: true,
  paranoid: true,
  freezeTableName: true,
  charset: 'utf8mb4',
  hooks: {
    beforeSave: async (material) => {
      if (material.quantity && material.unit_price) {
        material.total_price = (material.quantity * material.unit_price).toFixed(2);
      }
    },
  },
});
```

- [ ] **步骤 2：模型关联 + exports**

在 `index.js` 中添加关联和导出。

- [ ] **步骤 3：创建控制器**

```javascript
// backend/src/controllers/materialController.js
const WoMaterial = require('../models/WoMaterial');
const WorkOrder = require('../models/WorkOrder');
const { success, error } = require('../utils/response');

async function listMaterials(req, res) {
  const { id } = req.params;
  const wo = await WorkOrder.findOne({ where: { id: parseInt(id) } });
  if (!wo) return error(res, '工单不存在', 404);

  const materials = await WoMaterial.findAll({
    where: { work_order_id: wo.id },
    order: [['id', 'ASC']],
  });

  // 汇总
  const totalItems = materials.length;
  const totalPrice = materials.reduce((sum, m) => sum + parseFloat(m.total_price || 0), 0);

  return success(res, { list: materials, summary: { totalItems, totalPrice: totalPrice.toFixed(2) } });
}

async function createMaterial(req, res) {
  const { id } = req.params;
  const { category, name, spec, unit, quantity, unit_price, notes } = req.body;

  if (!name || quantity == null) return error(res, '材料名称和数量为必填', 400);

  const wo = await WorkOrder.findOne({ where: { id: parseInt(id) } });
  if (!wo) return error(res, '工单不存在', 404);

  const material = await WoMaterial.create({
    work_order_id: wo.id,
    category: category || null,
    name,
    spec: spec || null,
    unit: unit || null,
    quantity,
    unit_price: unit_price || null,
    notes: notes || null,
  });
  return success(res, material, '材料已添加', 201);
}

async function updateMaterial(req, res) {
  const { materialId } = req.params;
  const { category, name, spec, unit, quantity, unit_price, notes } = req.body;

  const material = await WoMaterial.findByPk(materialId);
  if (!material) return error(res, '材料不存在', 404);

  await material.update({
    category: category ?? material.category,
    name: name ?? material.name,
    spec: spec ?? material.spec,
    unit: unit ?? material.unit,
    quantity: quantity ?? material.quantity,
    unit_price: unit_price ?? material.unit_price,
    notes: notes ?? material.notes,
  });
  return success(res, material, '更新成功');
}

async function deleteMaterial(req, res) {
  const { materialId } = req.params;
  const material = await WoMaterial.findByPk(materialId);
  if (!material) return error(res, '材料不存在', 404);

  await material.destroy();
  return success(res, null, '删除成功');
}

module.exports = { listMaterials, createMaterial, updateMaterial, deleteMaterial };
```

- [ ] **步骤 4：添加路由到 workOrder.js**

在 `workOrder.js` 中，`/:id/logs` 之后添加：

```javascript
const materialController = require('../controllers/materialController');
router.get('/:id/materials', materialController.listMaterials);
router.post('/:id/materials', materialController.createMaterial);
router.put('/materials/:materialId', materialController.updateMaterial);
router.delete('/materials/:materialId', materialController.deleteMaterial);
```

- [ ] **步骤 5：前端 WorkOrderDetail.vue 新增材料清单卡片**

在基本信息卡片和照片卡片之间新增：

```vue
<el-card class="mb-20">
  <template #header>
    <div class="flex-between">
      <span class="section-title">材料清单</span>
      <div>
        <el-tag size="small">共 {{ materialSummary.totalItems }} 项</el-tag>
        <el-tag size="small" type="primary" class="ml-8">合计 ¥{{ materialSummary.totalPrice }}</el-tag>
        <el-button type="primary" size="small" class="ml-8" @click="showAddMaterial = true">添加材料</el-button>
      </div>
    </div>
  </template>
  <el-table :data="materials" stripe size="empty">
    <el-table-column label="分类" width="100">
      <template #default="{ row }">{{ row.category || '-' }}</template>
    </el-table-column>
    <el-table-column label="名称" min-width="120">
      <template #default="{ row }">{{ row.name }}</template>
    </el-table-column>
    <el-table-column label="规格" width="100">
      <template #default="{ row }">{{ row.spec || '-' }}</template>
    </el-table-column>
    <el-table-column label="数量" width="80">
      <template #default="{ row }">{{ row.quantity }}</template>
    </el-table-column>
    <el-table-column label="单位" width="60">
      <template #default="{ row }">{{ row.unit || '-' }}</template>
    </el-table-column>
    <el-table-column label="单价" width="100">
      <template #default="{ row }">{{ row.unit_price ? '¥' + row.unit_price : '-' }}</template>
    </el-table-column>
    <el-table-column label="总价" width="100">
      <template #default="{ row }"><span class="amount-positive">{{ row.total_price ? '¥' + row.total_price : '-' }}</span></template>
    </el-table-column>
    <el-table-column label="操作" width="100">
      <template #default="{ row }">
        <el-button size="small" text @click="editMaterial(row)">编辑</el-button>
        <el-button size="small" text type="danger" @click="deleteMaterial(row)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>
</el-card>
```

```javascript
const materials = ref([])
const materialSummary = reactive({ totalItems: 0, totalPrice: '0.00' })
const showAddMaterial = ref(false)
const materialForm = reactive({
  category: '', name: '', spec: '', unit: '㎡', quantity: 0, unit_price: 0, notes: '',
})

async function loadMaterials() {
  try {
    const res = await api.get(`/work-orders/${id}/materials`)
    const data = res.data || {}
    materials.value = data.list || []
    materialSummary.totalItems = data.summary?.totalItems || 0
    materialSummary.totalPrice = data.summary?.totalPrice || '0.00'
  } catch {}
}

async function submitMaterial() {
  if (!materialForm.name || !materialForm.quantity) return ElMessage.warning('名称和数量为必填')
  try {
    await api.post(`/work-orders/${id}/materials`, materialForm)
    ElMessage.success('材料已添加')
    showAddMaterial.value = false
    Object.assign(materialForm, { category: '', name: '', spec: '', unit: '㎡', quantity: 0, unit_price: 0, notes: '' })
    await loadMaterials()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '添加失败')
  }
}
```

- [ ] **步骤 6：Commit**

```bash
git add backend/src/models/WoMaterial.js backend/src/models/index.js backend/src/controllers/materialController.js backend/src/routes/workOrder.js admin-web/src/views/WorkOrderDetail.vue
git commit -m "feat: 材料清单BOM，支持增删改查和自动汇总"
```

---

### 任务 9：施工日志

**文件：**
- 创建：`backend/src/models/WoConstructionLog.js`
- 创建：`backend/src/controllers/constructionLogController.js`
- 修改：`backend/src/models/index.js`
- 修改：`backend/src/routes/construction.js`
- 修改：`admin-web/src/views/Construction.vue`

- [ ] **步骤 1：创建模型**

```javascript
// backend/src/models/WoConstructionLog.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('WoConstructionLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  work_order_id: { type: DataTypes.INTEGER, allowNull: false },
  log_date: { type: DataTypes.DATEONLY, allowNull: false },
  content: { type: DataTypes.TEXT },
  labor_count: { type: DataTypes.INTEGER },
  labor_hours: { type: DataTypes.DECIMAL(5, 1) },
  problem_description: { type: DataTypes.TEXT },
  photos: { type: DataTypes.JSON },
  weather: { type: DataTypes.STRING(20) },
  created_by: { type: DataTypes.INTEGER },
}, {
  tableName: 'wo_construction_logs',
  underscored: true,
  paranoid: true,
  freezeTableName: true,
  charset: 'utf8mb4',
});
```

- [ ] **步骤 2：模型关联 + 控制器 + 路由**

关联在 index.js 中添加。控制器和路由参照变更记录的模式，创建 CRUD 接口。

路由挂在 `backend/src/routes/construction.js` 中，在 `/:id` 之前。

- [ ] **步骤 3：前端 Construction.vue 新增施工日志区域**

在施工记录列表下方或通过详情页进入施工日志。

在 Construction 列表页，每行新增"日志"按钮，点击后弹出对话框：

```vue
<el-button size="small" @click="showLogs(row)">施工日志</el-button>

<!-- 施工日志对话框 -->
<el-dialog v-model="showLogDialog" title="施工日志" width="700px">
  <div class="mb-16">
    <el-button type="primary" size="small" @click="showAddLog = true">添加日志</el-button>
  </div>
  <el-timeline>
    <el-timeline-item v-for="log in constructionLogs" :key="log.id"
      :timestamp="`${log.log_date} ${weatherIcon(log.weather)}`" placement="top">
      <p>{{ log.content }}</p>
      <div class="text-muted">
        人工：{{ log.labor_count }}人 | 工时：{{ log.labor_hours }}h
        <span v-if="log.problem_description"> | 问题：{{ log.problem_description }}</span>
      </div>
    </el-timeline-item>
  </el-timeline>
</el-dialog>
```

- [ ] **步骤 4：Commit**

```bash
git add backend/src/models/WoConstructionLog.js backend/src/models/index.js backend/src/controllers/constructionLogController.js backend/src/routes/construction.js admin-web/src/views/Construction.vue
git commit -m "feat: 施工日志，支持按日期记录和查看"
```

---

### 任务 10：生产进度跟踪

**文件：**
- 创建：`backend/src/models/WoProductionProgress.js`
- 创建：`backend/src/controllers/productionProgressController.js`
- 修改：`backend/src/models/index.js`
- 修改：`backend/src/routes/production.js`
- 修改：`admin-web/src/views/Production.vue`

- [ ] **步骤 1：创建模型**

```javascript
// backend/src/models/WoProductionProgress.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('WoProductionProgress', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  work_order_id: { type: DataTypes.INTEGER, allowNull: false },
  step_name: { type: DataTypes.STRING(50), allowNull: false },
  progress_pct: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'wo_production_progress',
  underscored: true,
  paranoid: true,
  freezeTableName: true,
  charset: 'utf8mb4',
});
```

- [ ] **步骤 2：模型关联 + 控制器 + 路由**

控制器提供：
- `GET /api/v1/production/:workOrderId/progress` — 查询进度
- `PUT /api/v1/production/:workOrderId/progress` — 更新进度

默认 4 个工序：下料、制作、组装、质检。首次查询时如果无记录，自动创建 4 条 0% 记录。

- [ ] **步骤 3：前端 Production.vue 新增进度条列**

```vue
<el-table-column label="进度" width="200">
  <template #default="{ row }">
    <el-progress :percentage="row.progress_pct || 0" :stroke-width="12"
      :color="progressColor" />
  </template>
</el-table-column>
```

在列表中展开详情可查看各工序步骤进度。

- [ ] **步骤 4：Commit**

```bash
git add backend/src/models/WoProductionProgress.js backend/src/models/index.js backend/src/controllers/productionProgressController.js backend/src/routes/production.js admin-web/src/views/Production.vue
git commit -m "feat: 生产进度跟踪，默认4工序进度条展示"
```

---

### 任务 11：设计版本对比

**文件：**
- 修改：`backend/src/models/WoDesign.js`（新增 version 字段，如不存在）
- 修改：`admin-web/src/views/Designs.vue`

- [ ] **步骤 1：检查并添加 version 字段**

检查 wo_designs 表是否有 version 字段，没有则添加：

```bash
mysql -u root -e "USE ad_engineering; ALTER TABLE wo_designs ADD COLUMN version INT DEFAULT 1 COMMENT '版本号' AFTER id;"
```

同时更新模型定义。

- [ ] **步骤 2：上传新设计稿时 version +1**

在 designController 的上传/更新方法中，查询当前最大 version，新记录 version = max + 1。

- [ ] **步骤 3：Designs.vue 版本对比**

在已完成 Tab，每个工单显示版本号，点击"对比"弹出对话框：

```vue
<el-dialog v-model="showVersionCompare" title="设计版本对比" width="90%">
  <div class="version-compare">
    <div class="version-panel">
      <h4>v{{ compareFrom.version }} - {{ compareFrom.created_at }}</h4>
      <div class="version-images">
        <el-image v-for="(url, i) in (compareFrom.effect_images || [])" :key="i"
          :src="url" :preview-src-list="compareFrom.effect_images" fit="contain" class="compare-img" />
      </div>
    </div>
    <div class="version-divider">VS</div>
    <div class="version-panel">
      <h4>v{{ compareTo.version }} - {{ compareTo.created_at }}</h4>
      <div class="version-images">
        <el-image v-for="(url, i) in (compareTo.effect_images || [])" :key="i"
          :src="url" :preview-src-list="compareTo.effect_images" fit="contain" class="compare-img" />
      </div>
    </div>
  </div>
</el-dialog>
```

- [ ] **步骤 4：Commit**

```bash
git add backend/src/models/WoDesign.js backend/src/controllers/designController.js admin-web/src/views/Designs.vue
git commit -m "feat: 设计版本对比，支持双版本并排查看"
```

---

## 第三阶段：体验优化

### 任务 12：测量数据可视化（设计师视角）

**文件：**
- 修改：`admin-web/src/views/Designs.vue`（待设计 Tab 增加测量数据查看）
- 修改：`admin-web/src/views/WorkOrderDetail.vue`（增加测量可视化）

- [ ] **步骤 1：Designs.vue 待设计 Tab 增加查看测量数据按钮**

在待设计工单的操作列新增"查看测量"按钮：

```vue
<el-button size="small" type="info" @click="viewMeasurement(row)">查看测量</el-button>
```

弹出对话框展示：
- 材料类型分组
- 每种材料下列出所有面（label | 宽 | 高 | 面积 | 照片数）
- 总面积汇总
- 现场照片网格（点击预览）
- 按组分组展示（如果有 group_id）

- [ ] **步骤 2：Commit**

```bash
git add admin-web/src/views/Designs.vue
git commit -m "feat: 设计师视角测量数据可视化，按材料分组展示"
```

---

### 任务 13：照片标注位置

**文件：**
- 修改：`backend/src/models/WoMeasurement.js`（face 结构扩展）
- 修改：`admin-web/src/views/MeasureReview.vue`

- [ ] **步骤 1：WoMeasurement.js face 结构扩展**

在 WoMeasurement 的 beforeSave hook 中，确保 face 对象支持 position_label、is_group、group_id 字段。由于是 JSON 存储，不需要 ALTER TABLE，只需前端支持。

- [ ] **步骤 2：MeasureReview.vue 增加位置标注**

在测量数据审核页面，每个面的行编辑中增加：

```vue
<!-- 在 face-row 中增加位置列 -->
<el-select v-model="face.position_label" size="small" style="width:100px" @change="markModified">
  <el-option label="正立面" value="front" />
  <el-option label="左侧面" value="left" />
  <el-option label="右侧面" value="right" />
  <el-option label="顶面" value="top" />
  <el-option label="其他" value="other" />
</el-select>

<!-- 组标注 -->
<el-input-number v-model="face.group_id" :min="1" size="small" style="width:60px"
  @change="markModified" />
```

CSS 为同组的面添加相同颜色的边框：
```css
.face-row[data-group="1"] { border-left: 3px solid #2563eb; }
.face-row[data-group="2"] { border-left: 3px solid #16a34a; }
.face-row[data-group="3"] { border-left: 3px solid #ea580c; }
```

- [ ] **步骤 3：Commit**

```bash
git add backend/src/models/WoMeasurement.js admin-web/src/views/MeasureReview.vue
git commit -m "feat: 照片标注位置和分组，同组面用颜色边框标注"
```

---

### 任务 14：数据与设计对照

**文件：**
- 修改：`admin-web/src/views/Designs.vue`

- [ ] **步骤 1：Designs.vue 新增左右分栏对照**

在上传设计稿或审核设计时，新增对照视图：

```vue
<el-dialog v-model="showDataDesignCompare" title="测量数据与设计稿对照" width="95%">
  <div class="compare-layout">
    <div class="compare-left">
      <h4>测量数据</h4>
      <!-- 复用测量数据展示 -->
      <div v-for="(mat, mi) in measurementMaterials" :key="mi" class="material-block">
        <h5>{{ mat.type }} ({{ mat.faces.length }}面)</h5>
        <div class="face-list">
          <div v-for="(face, fi) in mat.faces" :key="fi" class="face-item">
            <span>{{ face.label }}: {{ face.width }}×{{ face.height }}m = {{ face.area }}㎡</span>
          </div>
        </div>
      </div>
    </div>
    <div class="compare-divider"></div>
    <div class="compare-right">
      <h4>设计稿</h4>
      <div class="design-images">
        <el-image v-for="(url, i) in designImages" :key="i" :src="url"
          :preview-src-list="designImages" fit="contain" class="design-img" />
      </div>
    </div>
  </div>
</el-dialog>
```

- [ ] **步骤 2：Commit**

```bash
git add admin-web/src/views/Designs.vue
git commit -m "feat: 测量数据与设计稿左右对照展示"
```

---

### 任务 15：测量可视化审核

**文件：**
- 修改：`admin-web/src/views/MeasureReview.vue`

- [ ] **步骤 1：重构审核页面为卡片列表**

将当前单工单审核改为列表式卡片审核（如果需要的话，或者在现有页面增强）：

每个工单用卡片形式：
```vue
<el-card v-for="task in reviewTasks" :key="task.id" class="review-card mb-12">
  <template #header>
    <div class="flex-between">
      <div>
        <span class="wo-no">{{ task.work_order_no }}</span>
        <span class="ml-8">{{ task.title }}</span>
      </div>
      <div>
        <el-button size="small" type="success" @click="approveSingle(task.id)">&#10003; 通过</el-button>
        <el-button size="small" type="danger" @click="rejectSingle(task.id)">&#10007; 驳回</el-button>
      </div>
    </div>
  </template>
  <el-row :gutter="16">
    <el-col :span="8">
      <div class="stat-box">
        <div class="stat-label">材料类型</div>
        <div class="stat-value">{{ materialTypes(task) }}</div>
      </div>
    </el-col>
    <el-col :span="8">
      <div class="stat-box">
        <div class="stat-label">总面积</div>
        <div class="stat-value">{{ totalArea(task) }}㎡</div>
      </div>
    </el-col>
    <el-col :span="8">
      <div class="stat-box">
        <div class="stat-label">总面数</div>
        <div class="stat-value">{{ totalFaces(task) }}</div>
      </div>
    </el-col>
  </el-row>
  <!-- 展开详情 -->
  <el-collapse v-model="expandedCards">
    <el-collapse-item :name="task.id">
      <!-- 详细测量数据 -->
    </el-collapse-item>
  </el-collapse>
</el-card>
```

- [ ] **步骤 2：Commit**

```bash
git add admin-web/src/views/MeasureReview.vue
git commit -m "feat: 测量可视化审核，卡片式展示+展开详情"
```

---

### 任务 16：批量审核

**文件：**
- 修改：`admin-web/src/views/MeasureReview.vue`
- 修改：`backend/src/controllers/assignmentController.js`（或单独创建 measurementController）

- [ ] **步骤 1：后端批量审核接口**

```javascript
// 在 assignmentController.js 或新文件中
async function batchReviewMeasurements(req, res) {
  const { ids, action, reason } = req.body;
  if (!ids?.length) return error(res, '工单ID列表不能为空', 400);
  if (!['approve', 'reject'].includes(action)) return error(res, '操作类型无效', 400);
  if (action === 'reject' && !reason) return error(res, '驳回时必须填写原因', 400);

  const results = { approved: [], rejected: [], failed: [] };

  for (const woId of ids) {
    try {
      // 复用单个审核逻辑
      const measurement = await WoMeasurement.findOne({
        where: { work_order_id: woId },
        order: [['id', 'DESC']],
      });
      if (!measurement) { results.failed.push({ id: woId, reason: '无测量记录' }); continue; }

      const workOrder = await WorkOrder.findByPk(woId);
      if (!workOrder) { results.failed.push({ id: woId, reason: '工单不存在' }); continue; }

      if (action === 'approve') {
        await workOrder.update({ current_stage: 'design', status: 'measured' });
        await measurement.update({ status: 'measured' });
        results.approved.push(woId);
      } else {
        await measurement.update({ status: 'rejected', rejection_reason: reason });
        await workOrder.update({ status: 'rejected' });
        results.rejected.push(woId);
      }
    } catch (e) {
      results.failed.push({ id: woId, reason: e.message });
    }
  }

  return success(res, results, `通过 ${results.approved.length} 个，驳回 ${results.rejected.length} 个`);
}
```

路由：`POST /api/v1/tenant/measurements/batch-review`

- [ ] **步骤 2：前端多选 + 批量操作**

在 MeasureReview 页面增加 checkbox 多选：

```vue
<el-table :data="reviewTasks" stripe @selection-change="handleSelectionChange">
  <el-table-column type="selection" width="50" />
  <!-- 其他列 -->
</el-table>

<div v-if="selectedIds.length" class="batch-actions">
  <el-checkbox :indeterminate="isIndeterminate" v-model="checkAll" @change="handleCheckAll">全选</el-checkbox>
  <span>已选择 {{ selectedIds.length }} 项</span>
  <el-button type="success" @click="batchApprove">批量通过</el-button>
  <el-button type="danger" @click="showBatchReject = true">批量驳回</el-button>
</div>
```

- [ ] **步骤 3：Commit**

```bash
git add backend/src/controllers/assignmentController.js admin-web/src/views/MeasureReview.vue
git commit -m "feat: 测量数据批量审核，支持多选批量通过/驳回"
```

---

## 实施注意事项

1. **路由排序**：workOrder.js 中所有带参数的路由（`/:id/*`）必须在 `/:id` 详情路由之前注册
2. **模型关联**：每新增一个 Model，必须在 `models/index.js` 中同时添加 `hasMany` 和 `belongsTo`
3. **软删除**：所有新模型启用 `paranoid: true`，删除时用 `destroy()` 而非 `delete()`
4. **Sequelize 同步**：生产环境 `alter: false`，所有表结构变更用 SQL 手动执行
5. **前端 CSS 变量**：使用 `global.css` 中定义的变量，不写死颜色值
6. **金额显示**：统一使用 `formatMoney()` 工具函数
7. **日期格式**：后端 DATEONLY 返回 `YYYY-MM-DD` 字符串，前端直接展示
