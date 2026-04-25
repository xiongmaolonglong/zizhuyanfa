const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('WoWarehouse', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenant_id: { type: DataTypes.INTEGER, allowNull: false },
  work_order_id: { type: DataTypes.INTEGER },
  production_id: { type: DataTypes.INTEGER },
  // 出入库类型: inbound=入库, outbound=出库
  type: { type: DataTypes.ENUM('inbound', 'outbound'), allowNull: false },
  // 业务关联: production=生产入库, pickup=施工领料, return=退回
  source: { type: DataTypes.ENUM('production', 'pickup', 'return'), defaultValue: 'production' },
  // 材料信息
  material_type: { type: DataTypes.STRING(100) },
  spec: { type: DataTypes.STRING(200) },
  quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  unit: { type: DataTypes.STRING(20), defaultValue: '件' },
  // 仓库信息
  warehouse_location: { type: DataTypes.STRING(100), comment: '库位/仓库名称' },
  // 操作人
  operator_id: { type: DataTypes.INTEGER, comment: '操作人ID（租户用户）' },
  operator_name: { type: DataTypes.STRING(50), comment: '操作人姓名' },
  // 关联施工队（出库时）
  constructor_id: { type: DataTypes.INTEGER, comment: '施工队ID（出库时）' },
  constructor_name: { type: DataTypes.STRING(100), comment: '施工队名称（出库时）' },
  // 备注
  notes: { type: DataTypes.TEXT },
  // 单据号
  receipt_no: { type: DataTypes.STRING(50), comment: '出入库单号' },
}, {
  tableName: 'wo_warehouse',
  underscored: true,
  paranoid: true,
  freezeTableName: true,
  charset: 'utf8mb4',
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['type'] },
    { fields: ['work_order_id'] },
    { fields: ['receipt_no'] },
  ],
})
