const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('WoFinance', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  work_order_id: { type: DataTypes.INTEGER, allowNull: false },
  budget_total: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  budget_used: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  budget_remaining: { type: DataTypes.DECIMAL(12, 2) },
  quote_amount: { type: DataTypes.DECIMAL(12, 2) },
  quote_notes: { type: DataTypes.TEXT },
  payment_records: { type: DataTypes.JSON },
  invoice_number: { type: DataTypes.STRING(100) },
  invoice_file: { type: DataTypes.STRING(500) },
  status: { type: DataTypes.ENUM('quoting', 'quoted', 'paid', 'invoiced'), defaultValue: 'quoting' },
  settlement_template_id: { type: DataTypes.INTEGER },
  settlement_status: { type: DataTypes.ENUM('pending', 'complete', 'rejected'), defaultValue: 'pending' },
  settlement_rejection_reason: { type: DataTypes.TEXT },
}, {
  tableName: 'wo_finance',
  underscored: true,
  paranoid: true,
  freezeTableName: true,
  charset: 'utf8mb4',
  hooks: {
    beforeSave: async (finance) => {
      if (finance.budget_total != null && finance.budget_used != null) {
        finance.budget_remaining = finance.budget_total - finance.budget_used
      }
    },
  },
})
