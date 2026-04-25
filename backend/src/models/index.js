const sequelize = require('../config/database')
const Tenant = require('./Tenant')
const TenantRegion = require('./TenantRegion')
const TenantDepartment = require('./TenantDepartment')
const TenantUser = require('./TenantUser')
const Client = require('./Client')
const ClientUser = require('./ClientUser')
const ClientDepartment = require('./ClientDepartment')
const ClientRegion = require('./ClientRegion')
const AddressDict = require('./AddressDict')

// Work Order models
const WorkOrder = require('./WorkOrder')
const WorkOrderLog = require('./WorkOrderLog')
const WoDeclaration = require('./WoDeclaration')
const WoApproval = require('./WoApproval')
const WoAssignment = require('./WoAssignment')
const WoMeasurement = require('./WoMeasurement')
const WoDesign = require('./WoDesign')
const WoProduction = require('./WoProduction')
const WoConstruction = require('./WoConstruction')
const WoFinance = require('./WoFinance')
const WoArchive = require('./WoArchive')
const WoAftersale = require('./WoAftersale')
const Notification = require('./Notification')
const FormConfig = require('./FormConfig')

// New models for module refinement
const WoChangeLog = require('./WoChangeLog')
const WoConstructionLog = require('./WoConstructionLog')
const WoProductionProgress = require('./WoProductionProgress')

const WoProductionBatch = require('./WoProductionBatch')
const WoProductionExport = require('./WoProductionExport')
const WoWarehouse = require('./WoWarehouse')
const AppVersion = require('./AppVersion')

// Tenant associations
Tenant.hasMany(TenantRegion, { foreignKey: 'tenant_id', as: 'regions' })
TenantRegion.belongsTo(Tenant, { foreignKey: 'tenant_id' })

Tenant.hasMany(TenantDepartment, { foreignKey: 'tenant_id', as: 'departments' })
TenantDepartment.belongsTo(Tenant, { foreignKey: 'tenant_id' })

Tenant.hasMany(TenantUser, { foreignKey: 'tenant_id', as: 'users' })
TenantUser.belongsTo(Tenant, { foreignKey: 'tenant_id' })
TenantUser.belongsTo(TenantDepartment, { foreignKey: 'department_id', as: 'department' })

Tenant.hasMany(Client, { foreignKey: 'tenant_id', as: 'clients' })
Client.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' })

// Client associations
Client.hasMany(ClientUser, { foreignKey: 'client_id', as: 'users' })
ClientUser.belongsTo(Client, { foreignKey: 'client_id' })

Client.hasMany(ClientDepartment, { foreignKey: 'client_id', as: 'departments' })
ClientDepartment.belongsTo(Client, { foreignKey: 'client_id' })

ClientDepartment.hasMany(ClientUser, { foreignKey: 'department_id', as: 'members' })
ClientUser.belongsTo(ClientDepartment, { foreignKey: 'department_id', as: 'department' })

Client.hasMany(ClientRegion, { foreignKey: 'client_id', as: 'regions' })
ClientRegion.belongsTo(Client, { foreignKey: 'client_id' })

// Work Order associations
// WorkOrder -> Tenant, Client, ClientUser, TenantUser
Tenant.hasMany(WorkOrder, { foreignKey: 'tenant_id', as: 'work_orders' })
WorkOrder.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' })

Client.hasMany(WorkOrder, { foreignKey: 'client_id', as: 'work_orders' })
WorkOrder.belongsTo(Client, { foreignKey: 'client_id', as: 'client' })

ClientUser.hasMany(WorkOrder, { foreignKey: 'client_user_id', as: 'created_orders' })
WorkOrder.belongsTo(ClientUser, { foreignKey: 'client_user_id', as: 'creator' })

TenantUser.hasMany(WorkOrder, { foreignKey: 'assigned_tenant_user_id', as: 'assigned_orders' })
WorkOrder.belongsTo(TenantUser, { foreignKey: 'assigned_tenant_user_id', as: 'assignee' })

TenantUser.hasMany(WorkOrder, { foreignKey: 'designer_id', as: 'design_orders' })
WorkOrder.belongsTo(TenantUser, { foreignKey: 'designer_id', as: 'designer' })

// WorkOrder has many stage records
WorkOrder.hasMany(WorkOrderLog, { foreignKey: 'work_order_id', as: 'logs' })
WorkOrderLog.belongsTo(WorkOrder, { foreignKey: 'work_order_id' })

WorkOrder.hasOne(WoDeclaration, { foreignKey: 'work_order_id', as: 'declaration' })
WoDeclaration.belongsTo(WorkOrder, { foreignKey: 'work_order_id', as: 'work_order' })

WorkOrder.hasOne(WoApproval, { foreignKey: 'work_order_id', as: 'approval' })
WoApproval.belongsTo(WorkOrder, { foreignKey: 'work_order_id' })

WorkOrder.hasOne(WoAssignment, { foreignKey: 'work_order_id', as: 'assignment' })
WoAssignment.belongsTo(WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' })

WorkOrder.hasMany(WoMeasurement, { foreignKey: 'work_order_id', as: 'measurements' })
WoMeasurement.belongsTo(WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' })

WorkOrder.hasMany(WoDesign, { foreignKey: 'work_order_id', as: 'designs' })
WoDesign.belongsTo(WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' })

WorkOrder.hasMany(WoProduction, { foreignKey: 'work_order_id', as: 'productions' })
WoProduction.belongsTo(WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' })

WorkOrder.hasMany(WoConstruction, { foreignKey: 'work_order_id', as: 'constructions' })
WoConstruction.belongsTo(WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' })

WorkOrder.hasMany(WoFinance, { foreignKey: 'work_order_id', as: 'finances' })
WoFinance.belongsTo(WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' })

WorkOrder.hasOne(WoArchive, { foreignKey: 'work_order_id', as: 'archive' })
WoArchive.belongsTo(WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' })

WorkOrder.hasMany(WoAftersale, { foreignKey: 'work_order_id', as: 'aftersales' })
WoAftersale.belongsTo(WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' })

// WoDeclaration -> ClientUser
ClientUser.hasMany(WoDeclaration, { foreignKey: 'created_by', as: 'declarations' })
WoDeclaration.belongsTo(ClientUser, { foreignKey: 'created_by', as: 'creator' })

// WoApproval -> ClientUser
ClientUser.hasMany(WoApproval, { foreignKey: 'approver_id', as: 'approvals' })
WoApproval.belongsTo(ClientUser, { foreignKey: 'approver_id', as: 'approver' })

// WoAssignment -> TenantUser
TenantUser.hasMany(WoAssignment, { foreignKey: 'assigned_by', as: 'assignments_made' })
WoAssignment.belongsTo(TenantUser, { foreignKey: 'assigned_by', as: 'assigner' })

TenantUser.hasMany(WoAssignment, { foreignKey: 'assigned_to', as: 'assignments_received' })
WoAssignment.belongsTo(TenantUser, { foreignKey: 'assigned_to', as: 'assignee' })

// WoMeasurement -> TenantUser
TenantUser.hasMany(WoMeasurement, { foreignKey: 'measurer_id', as: 'measurements' })
WoMeasurement.belongsTo(TenantUser, { foreignKey: 'measurer_id', as: 'measurer' })

// WoDesign -> TenantUser
TenantUser.hasMany(WoDesign, { foreignKey: 'designer_id', as: 'designs' })
WoDesign.belongsTo(TenantUser, { foreignKey: 'designer_id', as: 'designer' })

TenantUser.hasMany(WoDesign, { foreignKey: 'reviewer_id', as: 'reviewed_designs' })
WoDesign.belongsTo(TenantUser, { foreignKey: 'reviewer_id', as: 'reviewer' })

// WoConstruction -> TenantUser
TenantUser.hasMany(WoConstruction, { foreignKey: 'constructor_id', as: 'constructions' })
WoConstruction.belongsTo(TenantUser, { foreignKey: 'constructor_id', as: 'constructor' })

// WoArchive -> TenantUser
TenantUser.hasMany(WoArchive, { foreignKey: 'archived_by', as: 'archives' })
WoArchive.belongsTo(TenantUser, { foreignKey: 'archived_by', as: 'archiver' })

// WoAftersale -> ClientUser, TenantUser
ClientUser.hasMany(WoAftersale, { foreignKey: 'client_user_id', as: 'aftersales' })
WoAftersale.belongsTo(ClientUser, { foreignKey: 'client_user_id', as: 'clientRequester' })

TenantUser.hasMany(WoAftersale, { foreignKey: 'handler_id', as: 'handled_aftersales' })
WoAftersale.belongsTo(TenantUser, { foreignKey: 'handler_id', as: 'handler' })

// New associations for module refinement
WorkOrder.hasMany(WoChangeLog, { foreignKey: 'work_order_id', as: 'changeLogs' })
WoChangeLog.belongsTo(WorkOrder, { foreignKey: 'work_order_id' })

WorkOrder.hasMany(WoConstructionLog, { foreignKey: 'work_order_id', as: 'constructionLogs' })
WoConstructionLog.belongsTo(WorkOrder, { foreignKey: 'work_order_id' })

WorkOrder.hasMany(WoProductionProgress, { foreignKey: 'work_order_id', as: 'productionProgress' })
WoProductionProgress.belongsTo(WorkOrder, { foreignKey: 'work_order_id' })

// WoProductionBatch -> WorkOrder (checklist references work orders)
TenantUser.hasMany(WoProductionBatch, { foreignKey: 'creator_id', as: 'createdBatches' })
WoProductionBatch.belongsTo(TenantUser, { foreignKey: 'creator_id', as: 'creator' })

// Notification (polymorphic user_type, no FK association to user tables)

module.exports = {
  sequelize,
  // Existing models
  Tenant, TenantRegion, TenantDepartment, TenantUser,
  Client, ClientUser, ClientDepartment, ClientRegion,
  AddressDict,
  // Work Order models
  WorkOrder, WorkOrderLog,
  WoDeclaration, WoApproval, WoAssignment,
  WoMeasurement, WoDesign, WoProduction,
  WoConstruction, WoFinance, WoArchive,
  WoAftersale, Notification, FormConfig,
  // Module refinement models
  WoChangeLog, WoConstructionLog, WoProductionProgress,
  WoProductionBatch, WoProductionExport, WoWarehouse,
  AppVersion,
}
