<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">系统配置</h1>
      <p class="page-desc">表单模板、项目模板、材料字典与设计规范</p>
    </div>

    <el-tabs v-model="activeTab">
      <!-- 表单与模板 -->
      <el-tab-pane label="表单与模板" name="form">
        <el-card class="mb-4">
          <template #header>
            <div class="card-header"><span>工单创建表单配置</span><div><el-button size="small" @click="resetFormConfig" :loading="resetting">重置为默认</el-button><el-button size="small" type="primary" @click="saveFormConfig" :loading="saving">保存配置</el-button></div></div>
          </template>
          <el-table :data="flatFieldList" row-key="field_key" border size="small" class="field-table">
            <el-table-column label="排序" width="80" align="center">
              <template #default="{ $index }">
                <el-button size="small" :disabled="$index === 0" @click="moveField($index, -1)" link>↑</el-button>
                <el-button size="small" :disabled="$index === flatFieldList.length - 1" @click="moveField($index, 1)" link>↓</el-button>
              </template>
            </el-table-column>
            <el-table-column label="显示名称" width="180">
              <template #default="{ row }"><span :style="{ paddingLeft: (row._depth || 0) * 20 + 'px' }">{{ row._depth ? '└ ' : '' }}{{ row.field_label }}</span></template>
            </el-table-column>
            <el-table-column label="字段类型" prop="field_type" width="120">
              <template #default="{ row }"><el-tag size="small" :type="row.field_type === 'subform' ? 'warning' : ''">{{ fieldTypeLabel(row.field_type) }}</el-tag></template>
            </el-table-column>
            <el-table-column label="必填" width="80" align="center">
              <template #default="{ row }"><el-switch v-if="row.field_type !== 'subform'" v-model="row.required" size="small" /></template>
            </el-table-column>
            <el-table-column label="显示" width="80" align="center">
              <template #default="{ row }"><el-switch v-model="row.visible" size="small" /></template>
            </el-table-column>
            <el-table-column label="占位提示" width="180">
              <template #default="{ row }"><el-input v-if="row.field_type !== 'subform'" v-model="row.placeholder" size="small" placeholder="可选" /><span v-else class="text-muted">-</span></template>
            </el-table-column>
            <el-table-column label="解析功能" width="100" align="center">
              <template #default="{ row }"><el-switch v-if="row.field_key === 'address'" v-model="row.enable_parse" size="small" /><span v-else class="text-muted">-</span></template>
            </el-table-column>
            <el-table-column label="下拉选项" min-width="200">
              <template #default="{ row }">
                <template v-if="row.field_type === 'select'">
                  <div class="option-tags">
                    <el-tag v-for="(opt, idx) in row.options" :key="idx" closable @close="removeOption(row, idx)" size="small" style="margin: 2px 4px 2px 0">{{ opt.label }}</el-tag>
                    <el-input v-model="row._optionInput" size="small" placeholder="输入后回车添加" style="width: 140px; display: inline-block; vertical-align: middle;" @keyup.enter="addOption(row)" @blur="addOption(row)" />
                  </div>
                </template>
                <template v-else-if="row.field_type === 'subform'">
                  <el-button size="small" type="primary" link @click="openSubformConfig(row)">配置子项 ({{ subformChildCount(row) }})</el-button>
                </template>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center">
              <template #default="{ row }"><el-button v-if="!isBuiltIn(row)" size="small" type="danger" link @click="removeField(row)">删除</el-button><span v-else class="text-muted">不可删除</span></template>
            </el-table-column>
          </el-table>
          <div class="add-field-row"><el-button size="small" type="primary" plain @click="showAddField = true">+ 添加自定义字段</el-button></div>
        </el-card>

        <!-- 项目模板 -->
        <el-card>
          <template #header>
            <div class="card-header"><span>项目模板管理</span><div><el-button size="small" type="primary" @click="saveProjectTemplates" :loading="templateSaving">保存模板</el-button><el-button size="small" type="primary" plain @click="addProjectTemplate">+ 新增项目</el-button></div></div>
          </template>
          <el-empty v-if="projectTemplates.length === 0" description="暂无项目模板，点击右上角添加" />
          <div v-for="(tmpl, tIdx) in projectTemplates" :key="tmpl.id || tIdx" class="project-tmpl" :class="{ 'tmpl-disabled': tmpl.enabled === false }">
            <div class="tmpl-header">
              <div class="tmpl-title-row"><span class="tmpl-index">{{ tIdx + 1 }}</span><el-input v-model="tmpl.name" size="small" style="width: 200px" placeholder="项目名称" /><el-tag size="small" :type="tmpl.enabled === false ? 'info' : 'success'" class="tmpl-status">{{ tmpl.enabled === false ? '已停用' : '已启用' }}</el-tag></div>
              <div><el-switch v-model="tmpl.enabled" active-text="启用" inactive-text="停用" size="small" style="margin-right: 12px" /><el-button size="small" type="primary" plain @click="addAdTypeToTemplate(tIdx)">+ 添加材料类型</el-button><el-button size="small" type="primary" plain @click="copyAdTypeToTemplate(tIdx)">复制材料类型</el-button><el-button size="small" type="danger" plain @click="removeProjectTemplate(tIdx)">删除项目</el-button></div>
            </div>
            <div v-for="(adType, aIdx) in tmpl.ad_types" :key="adType.key || aIdx" class="ad-type-card">
              <div class="ad-type-header" @click="toggleAdTypeExpand(tmpl.id, adType.key)">
                <div class="ad-type-title-row"><el-icon class="expand-icon" :class="{ 'is-expanded': isAdTypeExpanded(tmpl.id, adType.key) }"><ArrowRight /></el-icon><el-input v-model="adType.label" size="small" style="width: 180px" placeholder="材料类型名称" @click.stop /><el-tag size="small" type="info" class="field-count">{{ adType.face_fields?.length || 0 }} 个字段</el-tag></div>
                <div class="ad-type-actions"><el-button size="small" type="primary" link @click.stop="addFaceFieldToAdType(tmpl, aIdx)">+字段</el-button><el-button size="small" type="danger" link @click.stop="removeAdTypeFromTemplate(tmpl, aIdx)">删除</el-button></div>
              </div>
              <div v-show="isAdTypeExpanded(tmpl.id, adType.key)" class="ad-type-content">
                <el-table :data="adType.face_fields" border size="small" class="face-field-table">
                  <el-table-column label="排序" width="70" align="center"><template #default="{ $index: fIdx }"><el-button size="small" :disabled="fIdx === 0" @click="moveFaceField(tmpl, adType, fIdx, -1)" link>↑</el-button><el-button size="small" :disabled="fIdx === adType.face_fields.length - 1" @click="moveFaceField(tmpl, adType, fIdx, 1)" link>↓</el-button></template></el-table-column>
                  <el-table-column label="字段名" width="130"><template #default="{ row }"><el-input v-model="row.field_label" size="small" placeholder="如：长(m)" /></template></el-table-column>
                  <el-table-column label="类型" width="100"><template #default="{ row }"><el-select v-model="row.field_type" size="small"><el-option label="数字" value="number" /><el-option label="文本" value="text" /><el-option label="多行" value="textarea" /><el-option label="下拉" value="select" /><el-option label="图片" value="image" /><el-option label="日期" value="date" /></el-select></template></el-table-column>
                  <el-table-column label="单位" width="80" align="center"><template #default="{ row }"><el-select v-if="row.field_type === 'number'" v-model="row.field_unit" size="small" clearable><el-option label="m" value="m" /><el-option label="cm" value="cm" /><el-option label="mm" value="mm" /></el-select><span v-else class="text-muted">-</span></template></el-table-column>
                  <el-table-column label="必" width="50" align="center"><template #default="{ row }"><el-switch v-model="row.required" size="small" /></template></el-table-column>
                  <el-table-column label="占位提示" width="120"><template #default="{ row }"><el-input v-model="row.placeholder" size="small" placeholder="可选" /></template></el-table-column>
                  <el-table-column label="下拉选项" min-width="180"><template #default="{ row }"><template v-if="row.field_type === 'select'"><div class="option-tags"><el-tag v-for="(opt, idx) in row.options" :key="idx" closable @close="removeFaceOption(row, idx)" size="small" style="margin: 2px 4px 2px 0">{{ opt.label }}</el-tag><el-input v-model="row._optInput" size="small" placeholder="回车添加" style="width: 100px; display: inline-block;" @keyup.enter="addFaceOption(row)" @blur="addFaceOption(row)" /></div></template><span v-else class="text-muted">-</span></template></el-table-column>
                  <el-table-column label="操作" width="60" align="center"><template #default="{ $index: fIdx }"><el-button size="small" type="danger" link @click="removeFaceField(tmpl, adType, fIdx)">删</el-button></template></el-table-column>
                </el-table>
              </div>
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 地图配置 -->
      <el-tab-pane label="地图配置" name="map">
        <el-card>
          <template #header><div class="card-header"><span>腾讯地图 API Key</span><el-button size="small" type="primary" @click="saveMapApiKey" :loading="mapKeySaving">保存</el-button></div></template>
          <el-form label-width="120px" style="max-width: 600px">
            <el-form-item label="API Key"><el-input v-model="mapApiKey" placeholder="请输入腾讯位置服务 API Key" clearable /></el-form-item>
            <el-form-item>
              <div class="map-key-hint">
                <p>获取方式：</p>
                <ol><li>访问 <a href="https://lbs.qq.com/" target="_blank">lbs.qq.com</a> 注册登录</li><li>进入「控制台」→「应用管理」→「创建密钥」</li><li>选择「WebServiceAPI」，勾选「地址解析」和「地点搜索」</li><li>复制密钥粘贴到上方保存即可</li></ol>
              </div>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 材料字典 -->
      <el-tab-pane label="材料字典" name="material">
        <el-card>
          <template #header><div class="card-header"><span>材料字典管理</span><div><el-button size="small" type="primary" @click="saveMaterialDict" :loading="materialSaving">保存</el-button><el-button size="small" type="primary" plain @click="addMaterialCategory">+ 新增分类</el-button></div></div></template>
          <el-empty v-if="materialCategories.length === 0" description="暂无材料分类，点击右上角添加" />
          <div v-for="(cat, catIdx) in materialCategories" :key="catIdx" class="material-category">
            <div class="category-header">
              <el-input v-model="cat.name" size="small" style="width: 200px" placeholder="分类名称" />
              <el-button size="small" type="primary" plain @click="addMaterialItem(catIdx)">+ 添加材料</el-button>
              <el-button size="small" type="danger" plain @click="removeCategory(catIdx)">删除分类</el-button>
            </div>
            <el-table :data="cat.items" border size="small" class="mb-10">
              <el-table-column label="材料名称" width="200"><template #default="{ row }"><el-input v-model="row.name" size="small" /></template></el-table-column>
              <el-table-column label="规格" width="150"><template #default="{ row }"><el-input v-model="row.spec" size="small" /></template></el-table-column>
              <el-table-column label="单位" width="100"><template #default="{ row }"><el-input v-model="row.unit" size="small" /></template></el-table-column>
              <el-table-column label="参考单价" width="120"><template #default="{ row }"><el-input-number v-model="row.price" size="small" :min="0" :precision="2" controls-position="right" /></template></el-table-column>
              <el-table-column label="操作" width="80"><template #default="{ $index: itemIdx }"><el-button size="small" type="danger" link @click="removeMaterialItem(catIdx, itemIdx)">删除</el-button></template></el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 设计规范 -->
      <el-tab-pane label="设计规范" name="design">
        <el-card class="mb-4">
          <template #header><div class="card-header"><span>尺寸检测设置</span><el-button size="small" type="primary" @click="saveSizeCheckConfig" :loading="sizeCheckSaving">保存</el-button></div></template>
          <el-form label-width="140px" style="max-width: 600px">
            <el-form-item label="启用尺寸检测"><el-switch v-model="sizeCheckConfig.enabled" /></el-form-item>
            <el-form-item label="尺寸误差阈值"><el-input-number v-model="sizeCheckConfig.tolerance" :min="1" :max="50" :step="1" /></el-form-item>
            <el-form-item label="设计稿DPI"><el-select v-model="sizeCheckConfig.dpi" style="width: 120px"><el-option label="72 DPI" :value="72" /><el-option label="96 DPI" :value="96" /><el-option label="150 DPI" :value="150" /><el-option label="300 DPI" :value="300" /></el-select></el-form-item>
          </el-form>
        </el-card>
        <el-card class="mb-4">
          <template #header><div class="card-header"><span>颜色检测设置</span><el-button size="small" type="primary" @click="saveColorCheckConfig" :loading="colorCheckSaving">保存</el-button></div></template>
          <el-form label-width="140px" style="max-width: 600px">
            <el-form-item label="启用颜色检测"><el-switch v-model="colorCheckConfig.enabled" /></el-form-item>
            <el-form-item label="颜色误差阈值"><el-input-number v-model="colorCheckConfig.tolerance" :min="10" :max="100" :step="5" /></el-form-item>
          </el-form>
        </el-card>
        <el-card>
          <template #header><div class="card-header"><span>颜色要求配置</span><div><el-button size="small" type="primary" @click="saveDesignColorRules" :loading="designColorSaving">保存</el-button><el-button size="small" type="primary" plain @click="addDesignColorRule">+ 新增元素</el-button></div></div></template>
          <el-empty v-if="designColorRules.length === 0" description="暂无颜色规范，点击右上角添加" />
          <el-table :data="designColorRules" border size="small">
            <el-table-column label="元素名称" width="200"><template #default="{ row }"><el-input v-model="row.name" size="small" placeholder="如：合成元素" /></template></el-table-column>
            <el-table-column label="颜色要求" min-width="300"><template #default="{ row }"><el-input v-model="row.color" size="small" placeholder="如：主体黄色" /></template></el-table-column>
            <el-table-column label="操作" width="80" align="center"><template #default="{ $index }"><el-button size="small" type="danger" link @click="removeDesignColorRule($index)">删除</el-button></template></el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 添加自定义字段对话框 -->
    <el-dialog v-model="showAddField" title="添加自定义字段" width="500px">
      <el-form :model="newField" label-width="100px">
        <el-form-item label="显示名称"><el-input v-model="newField.field_label" placeholder="如：客户编号" @input="autoGenerateKey" /></el-form-item>
        <el-form-item label="字段标识"><el-input v-model="newField.field_key" readonly disabled style="color: var(--color-text-tertiary)" /><span class="field-key-hint">自动生成，无需手动填写</span></el-form-item>
        <el-form-item label="字段类型">
          <el-select v-model="newField.field_type" style="width: 100%">
            <el-option label="单行文本" value="text" />
            <el-option label="电话" value="phone" />
            <el-option label="多行文本" value="textarea" />
            <el-option label="数字" value="number" />
            <el-option label="日期" value="date" />
            <el-option label="下拉选择" value="select" />
            <el-option label="复选框" value="checkbox" />
            <el-option label="甲方选择" value="client_select" />
            <el-option label="审批人选择" value="approver_select" />
            <el-option label="地址选择" value="address" />
            <el-option label="图片上传" value="image" />
            <el-option label="文件上传" value="file" />
            <el-option label="子表单" value="subform" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否必填"><el-switch v-model="newField.required" /></el-form-item>
        <el-form-item label="占位提示"><el-input v-model="newField.placeholder" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="showAddField = false">取消</el-button><el-button type="primary" @click="confirmAddField">确定</el-button></template>
    </el-dialog>

    <!-- 子表单配置对话框 -->
    <!-- 复制材料类型对话框 -->
    <el-dialog v-model="showCopyAdType" title="复制材料类型" width="500px">
      <p style="margin-bottom: 12px; color: var(--color-text-secondary)">选择一个已有的材料类型，复制其所有字段到新项目中：</p>
      <el-table :data="allAdTypesForCopy" row-key="_copyId" highlight-current-row
        @current-change="handleCopySelect" max-height="350" border size="small">
        <el-table-column label="所属项目" prop="_tmplName" width="130" show-overflow-tooltip />
        <el-table-column label="材料类型" prop="label" />
        <el-table-column label="字段数" prop="fieldCount" width="80" align="center">
          <template #default="{ row }">{{ row.face_fields?.length || 0 }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="showCopyAdType = false">取消</el-button>
        <el-button type="primary" :disabled="!copyTargetAdType" @click="confirmCopyAdType">确认复制</el-button>
      </template>
    </el-dialog>

    <!-- 子表单配置对话框 -->
    <el-dialog v-model="showSubformConfig" :title="'子项配置 - ' + (currentSubformField?.field_label || '')" width="700px">
      <el-table :data="currentSubformChildren" row-key="field_key" border size="small" class="field-table">
        <el-table-column label="排序" width="80" align="center"><template #default="{ $index }"><el-button size="small" :disabled="$index === 0" @click="moveSubformChild($index, -1)" link>↑</el-button><el-button size="small" :disabled="$index === currentSubformChildren.value.length - 1" @click="moveSubformChild($index, 1)" link>↓</el-button></template></el-table-column>
        <el-table-column label="显示名称" width="180"><template #default="{ row }"><el-input v-model="row.field_label" size="small" /></template></el-table-column>
        <el-table-column label="字段类型" width="120"><template #default="{ row }"><el-select v-model="row.field_type" size="small" @change="onSubfieldTypeChange(row)"><el-option label="单行文本" value="text" /><el-option label="电话" value="phone" /><el-option label="多行文本" value="textarea" /><el-option label="数字" value="number" /><el-option label="日期" value="date" /><el-option label="下拉选择" value="select" /><el-option label="图片上传" value="image" /><el-option label="子表单" value="subform" /></el-select></template></el-table-column>
        <el-table-column label="必填" width="80" align="center"><template #default="{ row }"><el-switch v-if="row.field_type !== 'subform'" v-model="row.required" size="small" /></template></el-table-column>
        <el-table-column label="占位提示" width="160"><template #default="{ row }"><el-input v-if="row.field_type !== 'subform'" v-model="row.placeholder" size="small" placeholder="可选" /><span v-else class="text-muted">-</span></template></el-table-column>
        <el-table-column label="下拉选项" min-width="180"><template #default="{ row }"><template v-if="row.field_type === 'select'"><div class="option-tags"><el-tag v-for="(opt, idx) in row.options" :key="idx" closable @close="removeOption(row, idx)" size="small" style="margin: 2px 4px 2px 0">{{ opt.label }}</el-tag><el-input v-model="row._optionInput" size="small" placeholder="回车添加" style="width: 100px; display: inline-block;" @keyup.enter="addOption(row)" @blur="addOption(row)" /></div></template><template v-else-if="row.field_type === 'subform'"><el-button size="small" type="primary" link @click="openSubformConfig(row)">配置子项 ({{ subformChildCount(row) }})</el-button></template><span v-else class="text-muted">-</span></template></el-table-column>
        <el-table-column label="操作" width="80" align="center"><template #default="{ $index: rIdx }"><el-button size="small" type="danger" link @click="removeSubformChild(rIdx)">删除</el-button></template></el-table-column>
      </el-table>
      <div class="add-field-row"><el-button size="small" type="primary" plain @click="addSubformChild">+ 添加子项字段</el-button></div>
      <template #footer><el-button @click="showSubformConfig = false">关闭</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import api from '../api'
import { logger } from '../utils/logger'

const activeTab = ref('form')

// ========== 表单配置 ==========
const formFields = ref([])
const saving = ref(false)
const resetting = ref(false)
const showAddField = ref(false)
const newField = ref({ field_key: '', field_label: '', field_type: 'text', required: false, placeholder: '' })
const FORM_CONFIG_TYPE = 'work_order_create'
const fieldTypeMap = { text: '单行文本', phone: '电话', textarea: '多行文本', number: '数字', date: '日期', select: '下拉选择', checkbox: '复选框', image: '图片上传', file: '文件上传', client_select: '甲方选择', approver_select: '审批人选择', address: '地址选择', subform: '子表单' }
function fieldTypeLabel(type) { return fieldTypeMap[type] || type }
const builtInKeys = ['title', 'client_id', 'activity_name', 'project_type', 'address', 'description', 'approver_id']
function isBuiltIn(row) { return builtInKeys.includes(row.field_key) }

function autoGenerateKey() {
  const label = newField.value.field_label.trim()
  if (!label) { newField.value.field_key = ''; return }
  if (/^[\w\s]+$/.test(label)) newField.value.field_key = label.toLowerCase().replace(/\s+/g, '_')
  else { const customCount = formFields.value.filter(f => f.field_key.startsWith('field_')).length; newField.value.field_key = `field_${customCount + 1}` }
}

const flatFieldList = computed(() => {
  const result = []
  function flatten(fields, depth) {
    fields.forEach(f => {
      f._depth = depth
      result.push(f)
      if (f.field_type === 'subform' && f.subform_template?.children?.length) flatten(f.subform_template.children, depth + 1)
    })
  }
  flatten(formFields.value.filter(f => !f.parent_key), 0)
  return result
})

function initOptionsText(fields) {
  fields.forEach(f => {
    if (!Array.isArray(f.options)) f.options = []
    f._optionInput = ''
    if (f.enable_parse === undefined) f.enable_parse = false
    if (f.field_key === 'address') f.enable_parse = true
    if (f.subform_template?.children) initOptionsText(f.subform_template.children)
  })
}

function addOption(row) {
  const label = row._optionInput.trim()
  if (!label) return
  if (row.options.some(o => o.label === label)) { row._optionInput = ''; return }
  row.options.push({ label, value: label })
  row._optionInput = ''
}
function removeOption(row, idx) { row.options.splice(idx, 1) }

function moveField(index, direction) {
  const flat = flatFieldList.value
  const row = flat[index]
  if (!row) return
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= flat.length) return
  const flatTarget = flat[newIndex]
  const srcIdx = formFields.value.indexOf(row)
  const tgtIdx = formFields.value.indexOf(flatTarget)
  if (srcIdx === -1 || tgtIdx === -1) return
  const temp = formFields.value[srcIdx]
  formFields.value.splice(srcIdx, 1)
  formFields.value.splice(tgtIdx, 0, temp)
}

function removeField(row) {
  if (isBuiltIn(row)) return
  ElMessageBox.confirm(`确定删除字段「${row.field_label}」吗？`, '提示', { type: 'warning' }).then(() => {
    if (row.field_type === 'subform') formFields.value = formFields.value.filter(f => f.field_key !== row.field_key && f.parent_key !== row.field_key)
    else formFields.value = formFields.value.filter(f => f.field_key !== row.field_key)
  }).catch(() => {})
}

async function loadFormConfig() {
  try {
    const res = await api.get(`/tenant/form-config/${FORM_CONFIG_TYPE}`)
    if (res.code === 0 && res.data) {
      formFields.value = res.data.fields || []
      initOptionsText(formFields.value)
    }
  } catch (err) { logger.error('加载表单配置失败:', err) }
}

async function saveFormConfig() {
  saving.value = true
  try {
    const flatFields = []
    function flattenToSave(fields, parentKey) {
      fields.forEach((f, i) => {
        const { _depth, _optionInput, ...rest } = f
        const saved = { ...rest, sort_order: i, parent_key: parentKey || null }
        if (saved.field_type === 'subform') saved.subform_template = saved.subform_template || null
        flatFields.push(saved)
        if (f.field_type === 'subform' && f.subform_template?.children?.length) flattenToSave(f.subform_template.children, f.field_key)
      })
    }
    flattenToSave(formFields.value, null)
    await api.put(`/tenant/form-config/${FORM_CONFIG_TYPE}`, { fields: flatFields })
    await loadFormConfig()
    ElMessage.success('表单配置已保存')
  } catch (err) { ElMessage.error(err.response?.data?.message || err.response?.data?.error || '保存失败') }
  finally { saving.value = false }
}

async function resetFormConfig() {
  try {
    await ElMessageBox.confirm('确定重置为默认配置吗？', '提示', { type: 'warning' })
    resetting.value = true
    const res = await api.post(`/tenant/form-config/${FORM_CONFIG_TYPE}/reset`)
    if (res.code === 0 && res.data) {
      formFields.value = res.data.fields || []
      initOptionsText(formFields.value)
      ElMessage.success('已重置为默认配置')
    }
  } catch (err) { if (err !== 'cancel') ElMessage.error('重置失败') }
  finally { resetting.value = false }
}

function confirmAddField() {
  const f = newField.value
  if (!f.field_label) { ElMessage.warning('请输入显示名称'); return }
  if (!f.field_key) autoGenerateKey()
  if (formFields.value.some(existing => existing.field_key === f.field_key)) { ElMessage.warning('字段标识已存在'); return }
  formFields.value.push({
    field_key: f.field_key, field_label: f.field_label, field_type: f.field_type,
    required: f.required, visible: true, sort_order: formFields.value.length,
    placeholder: f.placeholder, options: [], default_value: null, validation_rules: null,
    help_text: null, enable_parse: f.field_key === 'address', parent_key: null,
    subform_template: f.field_type === 'subform' ? { children: [] } : null,
  })
  showAddField.value = false
  newField.value = { field_key: '', field_label: '', field_type: 'text', required: false, placeholder: '' }
}

// ========== 子表单 ==========
const showSubformConfig = ref(false)
const currentSubformField = ref(null)
const currentSubformChildren = ref([])
function subformChildCount(field) { return field.subform_template?.children?.length || 0 }
function openSubformConfig(field) {
  currentSubformField.value = field
  if (!field.subform_template) field.subform_template = { children: [] }
  currentSubformChildren.value = field.subform_template.children
  showSubformConfig.value = true
}
function addSubformChild() { currentSubformChildren.value.push({ field_key: 'field_' + (currentSubformChildren.value.length + 1), field_label: '新字段', field_type: 'text', required: false, visible: true, sort_order: currentSubformChildren.value.length, placeholder: '', options: [], _optionInput: '', parent_key: currentSubformField.value.field_key }) }
function removeSubformChild(index) { ElMessageBox.confirm('确定删除此子项字段吗？', '提示', { type: 'warning' }).then(() => { if (index >= 0 && index < currentSubformChildren.value.length) currentSubformChildren.value.splice(index, 1) }).catch(() => {}) }
function moveSubformChild(index, direction) { const newIndex = index + direction; if (newIndex < 0 || newIndex >= currentSubformChildren.value.length) return; const [moved] = currentSubformChildren.value.splice(index, 1); currentSubformChildren.value.splice(newIndex, 0, moved) }
function onSubfieldTypeChange(row) { if (row.field_type === 'subform' && !row.subform_template) row.subform_template = { children: [] } }

// ========== 项目模板 ==========
const projectTemplates = ref([])
const templateSaving = ref(false)
const expandedAdTypes = ref(new Set())
function isAdTypeExpanded(tmplId, adTypeKey) { return expandedAdTypes.value.has(`${tmplId}_${adTypeKey}`) }
function toggleAdTypeExpand(tmplId, adTypeKey) { const key = `${tmplId}_${adTypeKey}`; if (expandedAdTypes.value.has(key)) expandedAdTypes.value.delete(key); else expandedAdTypes.value.add(key) }
const defaultTemplates = [{ id: 'tmpl_520', name: '520项目', ad_types: [{ key: 'signboard', label: '门头招牌', face_fields: [{ field_key: 'width', field_label: '宽度', field_type: 'number', field_unit: 'm', field_role: 'width', required: true }, { field_key: 'height', field_label: '高度', field_type: 'number', field_unit: 'm', field_role: 'height', required: true }, { field_key: 'direction', field_label: '朝向', field_type: 'select', field_role: 'label', required: false, options: [{ label: '东', value: '东' }, { label: '南', value: '南' }, { label: '西', value: '西' }, { label: '北', value: '北' }, { label: '左侧', value: '左侧' }, { label: '右侧', value: '右侧' }, { label: '正面', value: '正面' }, { label: '背面', value: '背面' }] }, { field_key: 'note', field_label: '备注', field_type: 'textarea', required: false }] }, { key: 'led_screen', label: 'LED大屏', face_fields: [{ field_key: 'width', field_label: '宽度', field_type: 'number', field_unit: 'm', field_role: 'width', required: true }, { field_key: 'height', field_label: '高度', field_type: 'number', field_unit: 'm', field_role: 'height', required: true }, { field_key: 'height_from_ground', field_label: '离地高度', field_type: 'number', field_unit: 'm', field_role: 'extra', required: false }, { field_key: 'note', field_label: '备注', field_type: 'textarea', required: false }] }] }]
function initTemplateOptions(tmpls) { tmpls.forEach(tmpl => { tmpl.ad_types?.forEach(adType => { adType.face_fields?.forEach(f => { if (f.field_unit === undefined) f.field_unit = ''; if (f.field_role === undefined) f.field_role = ''; if (f.field_type === 'select') { if (!Array.isArray(f.options)) f.options = []; f._optInput = '' } }) }) }) }
function loadProjectTemplatesFrom(settings) { const pt = settings['project-templates'] || settings.project_templates; if (pt && pt.length) { projectTemplates.value = pt } else { projectTemplates.value = JSON.parse(JSON.stringify(defaultTemplates)) } projectTemplates.value.forEach(t => { if (t.enabled === undefined) t.enabled = true }); initTemplateOptions(projectTemplates.value) }
async function saveProjectTemplates() { templateSaving.value = true; try { const clean = JSON.parse(JSON.stringify(projectTemplates.value)); await api.patch('/tenant/settings/project-templates', { value: clean }); ElMessage.success('项目模板已保存') } catch { ElMessage.error('保存失败') } finally { templateSaving.value = false } }
function addProjectTemplate() { const id = 'tmpl_' + Date.now(); projectTemplates.value.push({ id, name: '新项目', enabled: true, ad_types: [] }) }
function removeProjectTemplate(idx) { ElMessageBox.confirm('确定删除此项目模板吗？', '提示', { type: 'warning' }).then(() => { projectTemplates.value.splice(idx, 1) }).catch(() => {}) }
function addAdTypeToTemplate(tIdx) { const key = 'adtype_' + Date.now(); projectTemplates.value[tIdx].ad_types.push({ key, label: '新材料类型', face_fields: [] }) }

// ========== 复制材料类型 ==========
const showCopyAdType = ref(false)
const copyTargetIdx = ref(-1)
const copyTargetAdType = ref(null)
const allAdTypesForCopy = computed(() => {
  const list = []
  projectTemplates.value.forEach(tmpl => {
    tmpl.ad_types?.forEach((adType, idx) => {
      if (adType.face_fields?.length > 0) {
        list.push({ ...adType, _tmplName: tmpl.name, _tmplIdx: projectTemplates.value.indexOf(tmpl), _adTypeIdx: idx, _copyId: `${tmpl.id}_${adType.key}`, fieldCount: adType.face_fields.length })
      }
    })
  })
  return list
})
function handleCopySelect(row) { copyTargetAdType.value = row }
function copyAdTypeToTemplate(tIdx) {
  if (allAdTypesForCopy.value.length === 0) return ElMessage.warning('当前没有可复制的材料类型，请先创建至少一个带字段的材料类型')
  copyTargetIdx.value = tIdx
  copyTargetAdType.value = null
  showCopyAdType.value = true
}
function confirmCopyAdType() {
  if (!copyTargetAdType.value) return
  const src = copyTargetAdType.value
  const newKey = 'adtype_' + Date.now()
  const newType = {
    key: newKey,
    label: src.label + ' (复制)',
    face_fields: JSON.parse(JSON.stringify(src.face_fields || []))
  }
  projectTemplates.value[copyTargetIdx.value].ad_types.push(newType)
  showCopyAdType.value = false
  ElMessage.success(`已复制材料类型「${src.label}」，修改名称和字段后即可保存`)
}
function removeAdTypeFromTemplate(tmpl, aIdx) { ElMessageBox.confirm('确定删除此元素类型吗？', '提示', { type: 'warning' }).then(() => { tmpl.ad_types.splice(aIdx, 1) }).catch(() => {}) }
function addFaceFieldToAdType(tmpl, aIdx) { tmpl.ad_types[aIdx].face_fields.push({ field_key: 'field_' + (tmpl.ad_types[aIdx].face_fields.length + 1), field_label: '新字段', field_type: 'text', field_unit: '', field_role: '', required: false, placeholder: '', options: [], _optInput: '' }) }
function removeFaceField(tmpl, adType, fIdx) { ElMessageBox.confirm('确定删除此面字段吗？', '提示', { type: 'warning' }).then(() => { adType.face_fields.splice(fIdx, 1) }).catch(() => {}) }
function moveFaceField(tmpl, adType, fIdx, dir) { const newIdx = fIdx + dir; if (newIdx < 0 || newIdx >= adType.face_fields.length) return; const [moved] = adType.face_fields.splice(fIdx, 1); adType.face_fields.splice(newIdx, 0, moved) }
function addFaceOption(row) { const label = row._optInput; if (!label) return; if (row.options.some(o => o.label === label)) { row._optInput = ''; return }; row.options.push({ label, value: label }); row._optInput = '' }
function removeFaceOption(row, idx) { row.options.splice(idx, 1) }

// ========== 地图配置 ==========
const mapApiKey = ref('')
const mapKeySaving = ref(false)
function loadMapKeyFrom(settings) { mapApiKey.value = settings.map_api_key || '' }
async function saveMapApiKey() { mapKeySaving.value = true; try { await api.patch('/tenant/settings/map_api_key', { value: mapApiKey.value }); ElMessage.success('地图 Key 已保存') } catch { ElMessage.error('保存失败') } finally { mapKeySaving.value = false } }

// ========== 材料字典 ==========
const materialCategories = ref([])
const materialSaving = ref(false)
function loadMaterialDictFrom(settings) { materialCategories.value = settings.material_dict || [] }
async function saveMaterialDict() { materialSaving.value = true; try { await api.patch('/tenant/settings/material_dict', { value: materialCategories.value }); ElMessage.success('材料字典已保存') } catch { ElMessage.error('保存失败') } finally { materialSaving.value = false } }
function addMaterialCategory() { materialCategories.value.push({ name: '新分类', items: [] }) }
function removeCategory(index) { ElMessageBox.confirm('确定删除此分类吗？', '提示', { type: 'warning' }).then(() => { materialCategories.value.splice(index, 1) }).catch(() => {}) }
function addMaterialItem(catIdx) { materialCategories.value[catIdx].items.push({ name: '', spec: '', unit: '', price: 0 }) }
function removeMaterialItem(catIdx, itemIdx) { materialCategories.value[catIdx].items.splice(itemIdx, 1) }

// ========== 设计规范 ==========
const designColorRules = ref([])
const designColorSaving = ref(false)
const sizeCheckConfig = reactive({ enabled: true, tolerance: 10, dpi: 96 })
const sizeCheckSaving = ref(false)
const colorCheckConfig = reactive({ enabled: true, tolerance: 30 })
const colorCheckSaving = ref(false)

function loadDesignSettingsFrom(settings) {
  designColorRules.value = settings.design_color_rules || []
  if (settings.size_check_config) Object.assign(sizeCheckConfig, settings.size_check_config)
  if (settings.color_check_config) Object.assign(colorCheckConfig, settings.color_check_config)
}
async function saveDesignColorRules() { designColorSaving.value = true; try { await api.patch('/tenant/settings/design_color_rules', { value: designColorRules.value }); ElMessage.success('设计颜色规范已保存') } catch (e) { ElMessage.error(e.response?.data?.error || '保存失败') } finally { designColorSaving.value = false } }
function addDesignColorRule() { designColorRules.value.push({ name: '', color: '' }) }
function removeDesignColorRule(index) { ElMessageBox.confirm('确定删除此颜色要求吗？', '提示', { type: 'warning' }).then(() => { designColorRules.value.splice(index, 1) }).catch(() => {}) }
async function saveSizeCheckConfig() { sizeCheckSaving.value = true; try { await api.patch('/tenant/settings/size_check_config', { value: { ...sizeCheckConfig } }); ElMessage.success('尺寸检测设置已保存') } catch (e) { ElMessage.error(e.response?.data?.error || '保存失败') } finally { sizeCheckSaving.value = false } }
async function saveColorCheckConfig() { colorCheckSaving.value = true; try { await api.patch('/tenant/settings/color_check_config', { value: { ...colorCheckConfig } }); ElMessage.success('颜色检测设置已保存') } catch (e) { ElMessage.error(e.response?.data?.error || '保存失败') } finally { colorCheckSaving.value = false } }

// ========== 加载全部 ==========
async function loadAllSettings() {
  try {
    const res = await api.get('/tenant/settings')
    const settings = res.data || {}
    loadProjectTemplatesFrom(settings)
    loadMapKeyFrom(settings)
    loadMaterialDictFrom(settings)
    loadDesignSettingsFrom(settings)
  } catch {}
}

onMounted(() => { loadFormConfig(); loadAllSettings() })
</script>

<style scoped>
.page-desc { color: var(--color-text-tertiary); font-size: var(--font-size-sm); margin-top: var(--space-1); }
.mb-4 { margin-bottom: var(--space-4); }
.mb-10 { margin-bottom: var(--space-2); }
.text-muted { color: var(--color-text-placeholder); font-size: var(--font-size-xs); }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.field-table { margin-bottom: var(--space-3); }
.add-field-row { margin-top: var(--space-3); }
.material-category { margin-bottom: var(--space-5); }
.category-header { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2); }
.option-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; min-height: 28px; }
.map-key-hint { color: var(--color-text-tertiary); font-size: 13px; line-height: 1.8; }
.map-key-hint a { color: var(--color-primary); text-decoration: underline; }
.map-key-hint ol { padding-left: var(--space-4); margin-top: var(--space-1); }
.field-key-hint { font-size: 12px; color: var(--color-text-tertiary); }
.project-tmpl { margin-bottom: var(--space-6); border: 1px solid #e5e7eb; border-radius: 8px; padding: var(--space-4); background: #fafbfc; }
.tmpl-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); padding-bottom: var(--space-3); border-bottom: 1px solid #e5e7eb; }
.tmpl-title-row { display: flex; align-items: center; gap: var(--space-2); }
.tmpl-index { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: var(--color-primary); color: #fff; font-size: 12px; font-weight: 600; flex-shrink: 0; }
.tmpl-status { margin-left: 4px; }
.project-tmpl.tmpl-disabled { opacity: 0.55; }
.ad-type-card { margin-bottom: var(--space-2); border: 1px solid #e0e0e0; border-radius: 6px; background: #fff; overflow: hidden; }
.ad-type-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; cursor: pointer; transition: background-color var(--transition-base); }
.ad-type-header:hover { background: #f5f7fa; }
.ad-type-title-row { display: flex; align-items: center; gap: var(--space-2); flex: 1; }
.ad-type-actions { display: flex; align-items: center; gap: 4px; opacity: 0; transition: opacity var(--transition-base); }
.ad-type-card:hover .ad-type-actions { opacity: 1; }
.ad-type-content { padding: 0 12px var(--space-3); border-top: 1px solid #f0f0f0; }
.expand-icon { font-size: 12px; color: var(--color-text-tertiary); transition: transform var(--transition-base); }
.expand-icon.is-expanded { transform: rotate(90deg); }
.field-count { margin-left: 8px; font-size: 11px; }
.face-field-table { margin-top: var(--space-2); }
</style>
