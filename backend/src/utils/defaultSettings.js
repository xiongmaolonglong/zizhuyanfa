/**
 * 租户默认配置
 * 新建租户时自动填充这些配置
 */

// 默认项目模板
const defaultProjectTemplates = [
  {
    id: 'tmpl_520',
    name: '520项目',
    ad_types: [
      {
        key: 'signboard',
        label: '门头招牌',
        face_fields: [
          { field_key: 'width', field_label: '宽度', field_type: 'number', field_unit: 'm', field_role: 'width', required: true, placeholder: '请输入宽度' },
          { field_key: 'height', field_label: '高度', field_type: 'number', field_unit: 'm', field_role: 'height', required: true, placeholder: '请输入高度' },
          { field_key: 'direction', field_label: '朝向', field_type: 'select', field_role: 'label', required: false,
            options: [
              { label: '东', value: '东' }, { label: '南', value: '南' }, { label: '西', value: '西' }, { label: '北', value: '北' },
              { label: '左侧', value: '左侧' }, { label: '右侧', value: '右侧' }, { label: '正面', value: '正面' }, { label: '背面', value: '背面' }
            ]
          },
          { field_key: 'note', field_label: '备注', field_type: 'textarea', required: false, placeholder: '该面特殊情况' },
        ]
      },
      {
        key: 'led_screen',
        label: 'LED大屏',
        face_fields: [
          { field_key: 'width', field_label: '宽度', field_type: 'number', field_unit: 'm', field_role: 'width', required: true, placeholder: '请输入宽度' },
          { field_key: 'height', field_label: '高度', field_type: 'number', field_unit: 'm', field_role: 'height', required: true, placeholder: '请输入高度' },
          { field_key: 'height_from_ground', field_label: '离地高度', field_type: 'number', field_unit: 'm', field_role: 'extra', required: false, placeholder: '可选' },
          { field_key: 'note', field_label: '备注', field_type: 'textarea', required: false, placeholder: '该面特殊情况' },
        ]
      },
      {
        key: 'light_box',
        label: '灯箱',
        face_fields: [
          { field_key: 'width', field_label: '宽度', field_type: 'number', field_unit: 'm', field_role: 'width', required: true, placeholder: '请输入宽度' },
          { field_key: 'height', field_label: '高度', field_type: 'number', field_unit: 'm', field_role: 'height', required: true, placeholder: '请输入高度' },
          { field_key: 'thickness', field_label: '厚度', field_type: 'number', field_unit: 'cm', field_role: 'extra', required: false, placeholder: '可选' },
          { field_key: 'note', field_label: '备注', field_type: 'textarea', required: false, placeholder: '该面特殊情况' },
        ]
      },
      {
        key: 'window_display',
        label: '橱窗展示',
        face_fields: [
          { field_key: 'width', field_label: '宽度', field_type: 'number', field_unit: 'm', field_role: 'width', required: true, placeholder: '请输入宽度' },
          { field_key: 'height', field_label: '高度', field_type: 'number', field_unit: 'm', field_role: 'height', required: true, placeholder: '请输入高度' },
          { field_key: 'note', field_label: '备注', field_type: 'textarea', required: false, placeholder: '该面特殊情况' },
        ]
      },
    ]
  },
]

// 默认材料字典
const defaultMaterialDict = [
  {
    name: '板材类',
    items: [
      { name: '铝塑板', spec: '3mm', unit: '㎡', price: 120 },
      { name: '铝塑板', spec: '4mm', unit: '㎡', price: 150 },
      { name: '亚克力板', spec: '3mm', unit: '㎡', price: 180 },
      { name: '亚克力板', spec: '5mm', unit: '㎡', price: 250 },
      { name: 'PVC板', spec: '3mm', unit: '㎡', price: 60 },
      { name: 'PVC板', spec: '5mm', unit: '㎡', price: 90 },
      { name: '不锈钢板', spec: '0.8mm', unit: '㎡', price: 280 },
      { name: '镀锌板', spec: '1.0mm', unit: '㎡', price: 150 },
    ]
  },
  {
    name: '灯箱材料',
    items: [
      { name: 'LED模组', spec: 'P10', unit: '块', price: 15 },
      { name: 'LED灯条', spec: '12V', unit: '米', price: 25 },
      { name: '灯箱布', spec: '550刀刮布', unit: '㎡', price: 45 },
      { name: '灯箱铝型材', spec: '9cm', unit: '米', price: 35 },
      { name: '电源', spec: '12V/350W', unit: '个', price: 85 },
    ]
  },
  {
    name: '发光字材料',
    items: [
      { name: '不锈钢发光字', spec: '冲孔字', unit: '米', price: 280 },
      { name: '不锈钢发光字', spec: '包边字', unit: '米', price: 320 },
      { name: '亚克力发光字', spec: '平面字', unit: '米', price: 180 },
      { name: '亚克力发光字', spec: '吸塑字', unit: '米', price: 250 },
      { name: '迷你字', spec: '斜边', unit: '米', price: 150 },
      { name: '背发光字', spec: '不锈钢', unit: '米', price: 350 },
    ]
  },
  {
    name: '辅料',
    items: [
      { name: '结构胶', spec: '中性', unit: '支', price: 18 },
      { name: '玻璃胶', spec: '中性', unit: '支', price: 15 },
      { name: '角钢', spec: '40*40', unit: '米', price: 12 },
      { name: '方管', spec: '40*60', unit: '米', price: 18 },
      { name: '膨胀螺丝', spec: 'M8*80', unit: '套', price: 1.5 },
      { name: '自攻钉', spec: '4*20', unit: '盒', price: 15 },
    ]
  },
]

// 默认设计颜色规范
const defaultDesignColorRules = [
  { name: '合成元素', color: '主体黄色，边框红色' },
  { name: '卡通元素', color: '彩色，需与效果图一致' },
  { name: '公司Logo', color: '按照VI规范执行' },
  { name: '产品图片', color: '清晰无色差' },
]

// 默认尺寸检测配置
const defaultSizeCheckConfig = {
  enabled: true,
  tolerance: 10,
  dpi: 96,
}

// 默认颜色检测配置
const defaultColorCheckConfig = {
  enabled: true,
  tolerance: 30,
}

// 工单创建表单默认配置
const defaultFormFields = [
  { field_key: 'title', field_label: '工单标题', field_type: 'text', required: true, visible: true, sort_order: 0, placeholder: '请输入工单标题', options: [], default_value: null, validation_rules: null, help_text: null, enable_parse: false, parent_key: null },
  { field_key: 'client_id', field_label: '甲方', field_type: 'client_select', required: true, visible: true, sort_order: 1, placeholder: '选择甲方', options: [], default_value: null, validation_rules: null, help_text: null, enable_parse: false, parent_key: null },
  { field_key: 'project_type', field_label: '项目类型', field_type: 'select', required: true, visible: true, sort_order: 2, placeholder: '选择项目类型', options: [
    { label: '招牌', value: '招牌' },
    { label: '灯箱', value: '灯箱' },
    { label: 'LED大屏', value: 'LED大屏' },
    { label: '发光字', value: '发光字' },
    { label: '展览展示', value: '展览展示' },
    { label: '其他', value: '其他' }
  ], default_value: null, validation_rules: null, help_text: null, enable_parse: false, parent_key: null },
  { field_key: 'address', field_label: '施工地址', field_type: 'address', required: true, visible: true, sort_order: 3, placeholder: '输入地址搜索或手动填写', options: [], default_value: null, validation_rules: null, help_text: null, enable_parse: true, parent_key: null },
  { field_key: 'description', field_label: '工单说明', field_type: 'textarea', required: false, visible: true, sort_order: 4, placeholder: '详细描述工单内容', options: [], default_value: null, validation_rules: null, help_text: null, enable_parse: false, parent_key: null },
  { field_key: 'approver_id', field_label: '审批人', field_type: 'approver_select', required: false, visible: true, sort_order: 5, placeholder: '选择审批人', options: [], default_value: null, validation_rules: null, help_text: null, enable_parse: false, parent_key: null },
]

// 完整的默认租户设置
function getDefaultTenantSettings() {
  return {
    project_templates: JSON.parse(JSON.stringify(defaultProjectTemplates)),
    material_dict: JSON.parse(JSON.stringify(defaultMaterialDict)),
    map_api_key: '',
    design_color_rules: JSON.parse(JSON.stringify(defaultDesignColorRules)),
    size_check_config: { ...defaultSizeCheckConfig },
    color_check_config: { ...defaultColorCheckConfig },
  }
}

// 默认表单配置
function getDefaultFormFields() {
  return JSON.parse(JSON.stringify(defaultFormFields))
}

module.exports = {
  defaultProjectTemplates,
  defaultMaterialDict,
  defaultDesignColorRules,
  defaultSizeCheckConfig,
  defaultColorCheckConfig,
  defaultFormFields,
  getDefaultTenantSettings,
  getDefaultFormFields,
}
