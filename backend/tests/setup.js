/**
 * Jest 全局测试设置
 * Mock Sequelize 以避免依赖真实 MySQL 数据库
 */

// Create a factory for mock models
function createMockModel() {
  const mock = {
    findByPk: jest.fn().mockResolvedValue(null),
    findOne: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    findAndCountAll: jest.fn().mockResolvedValue({ rows: [], count: 0 }),
    create: jest.fn().mockResolvedValue({}),
    destroy: jest.fn().mockResolvedValue(0),
    update: jest.fn().mockResolvedValue([0]),
    count: jest.fn().mockResolvedValue(0),
    build: jest.fn().mockImplementation((data) => data || {}),
    rawAttributes: {},
    // Association methods (no-op, just return for model registration)
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
    hasOne: jest.fn(),
    belongsToMany: jest.fn(),
  };
  return mock;
}

// Mock Sequelize instance
const mockSequelize = {
  authenticate: jest.fn().mockResolvedValue(undefined),
  sync: jest.fn().mockResolvedValue(undefined),
  transaction: jest.fn().mockImplementation(async (callback) => {
    return callback({ commit: jest.fn(), rollback: jest.fn() });
  }),
  close: jest.fn().mockResolvedValue(undefined),
  define: jest.fn().mockImplementation(() => createMockModel()),
};

// Mock the database config
jest.mock('../src/config/database', () => mockSequelize);

// Helper to create a mock model module
function mockModelModule() {
  return createMockModel();
}

// Only mock models that actually exist
jest.mock('../src/models/Tenant', () => mockModelModule());
jest.mock('../src/models/TenantUser', () => mockModelModule());
jest.mock('../src/models/TenantDepartment', () => mockModelModule());
jest.mock('../src/models/TenantRegion', () => mockModelModule());
jest.mock('../src/models/Client', () => mockModelModule());
jest.mock('../src/models/ClientUser', () => mockModelModule());
jest.mock('../src/models/ClientDepartment', () => mockModelModule());
jest.mock('../src/models/ClientRegion', () => mockModelModule());
jest.mock('../src/models/AddressDict', () => mockModelModule());
jest.mock('../src/models/Notification', () => mockModelModule());
jest.mock('../src/models/WorkOrder', () => mockModelModule());
jest.mock('../src/models/WorkOrderLog', () => mockModelModule());
jest.mock('../src/models/WoAftersale', () => mockModelModule());
jest.mock('../src/models/WoApproval', () => mockModelModule());
jest.mock('../src/models/WoArchive', () => mockModelModule());
jest.mock('../src/models/WoAssignment', () => mockModelModule());
jest.mock('../src/models/WoConstruction', () => mockModelModule());
jest.mock('../src/models/WoDeclaration', () => mockModelModule());
jest.mock('../src/models/WoDesign', () => mockModelModule());
jest.mock('../src/models/WoFinance', () => mockModelModule());
jest.mock('../src/models/WoMeasurement', () => mockModelModule());
jest.mock('../src/models/WoProduction', () => mockModelModule());

// Export for use in tests
module.exports = { mockSequelize, createMockModel };
