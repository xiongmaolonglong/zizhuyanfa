const { generateWorkOrderNo } = require('../src/services/workOrderNoService');
const Tenant = require('../src/models/Tenant');
const WorkOrder = require('../src/models/WorkOrder');

// Mock Date to get predictable year
const realDate = global.Date;
beforeAll(() => {
  global.Date = class extends realDate {
    constructor(...args) {
      super(...args);
    }
    getFullYear() {
      return 2026;
    }
    static now() {
      return new realDate('2026-04-12').getTime();
    }
  };
});
afterAll(() => {
  global.Date = realDate;
});

describe('WorkOrderNoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('generateWorkOrderNo generates correct format for first order', async () => {
    const mockTenant = {
      id: 1,
      name: 'Test Company',
      order_code_prefix: 'GG',
    };

    // Mock sequelize.transaction to execute callback with mock transaction
    const sequelize = require('../src/config/database');
    sequelize.transaction.mockImplementation(async (callback) => {
      return callback({});
    });

    Tenant.findByPk = jest.fn().mockResolvedValue(mockTenant);
    WorkOrder.findAll = jest.fn().mockResolvedValue([]);

    const result = await generateWorkOrderNo(1);

    expect(result).toEqual({
      work_order_no: 'GG-2026-0001',
      prefix: 'GG',
      year: 2026,
      seq: 1,
    });
  });

  test('generateWorkOrderNo increments sequence correctly', async () => {
    const mockTenant = {
      id: 1,
      name: 'Test Company',
      order_code_prefix: 'GG',
    };

    const sequelize = require('../src/config/database');
    sequelize.transaction.mockImplementation(async (callback) => {
      return callback({});
    });

    Tenant.findByPk = jest.fn().mockResolvedValue(mockTenant);
    WorkOrder.findAll = jest.fn().mockResolvedValue([
      { work_order_no: 'GG-2026-0001' },
      { work_order_no: 'GG-2026-0005' },
      { work_order_no: 'GG-2026-0003' },
    ]);

    const result = await generateWorkOrderNo(1);

    expect(result).toEqual({
      work_order_no: 'GG-2026-0006',
      prefix: 'GG',
      year: 2026,
      seq: 6,
    });
  });

  test('generateWorkOrderNo uses custom prefix', async () => {
    const mockTenant = {
      id: 2,
      name: 'Custom Corp',
      order_code_prefix: 'AD',
    };

    const sequelize = require('../src/config/database');
    sequelize.transaction.mockImplementation(async (callback) => {
      return callback({});
    });

    Tenant.findByPk = jest.fn().mockResolvedValue(mockTenant);
    WorkOrder.findAll = jest.fn().mockResolvedValue([
      { work_order_no: 'AD-2026-0010' },
    ]);

    const result = await generateWorkOrderNo(2);

    expect(result.work_order_no).toBe('AD-2026-0011');
    expect(result.prefix).toBe('AD');
    expect(result.seq).toBe(11);
  });

  test('generateWorkOrderNo uses default prefix when not set', async () => {
    const mockTenant = {
      id: 3,
      name: 'No Prefix Corp',
      order_code_prefix: null,
    };

    const sequelize = require('../src/config/database');
    sequelize.transaction.mockImplementation(async (callback) => {
      return callback({});
    });

    Tenant.findByPk = jest.fn().mockResolvedValue(mockTenant);
    WorkOrder.findAll = jest.fn().mockResolvedValue([]);

    const result = await generateWorkOrderNo(3);

    expect(result.work_order_no).toBe('GG-2026-0001');
    expect(result.prefix).toBe('GG');
  });

  test('generateWorkOrderNo throws when tenant not found', async () => {
    const sequelize = require('../src/config/database');
    sequelize.transaction.mockImplementation(async (callback) => {
      return callback({});
    });

    Tenant.findByPk = jest.fn().mockResolvedValue(null);

    await expect(generateWorkOrderNo(999)).rejects.toThrow(
      'Tenant with id 999 not found'
    );
  });

  test('generateWorkOrderNo ignores non-matching work order numbers', async () => {
    const mockTenant = {
      id: 1,
      name: 'Test Company',
      order_code_prefix: 'GG',
    };

    const sequelize = require('../src/config/database');
    sequelize.transaction.mockImplementation(async (callback) => {
      return callback({});
    });

    Tenant.findByPk = jest.fn().mockResolvedValue(mockTenant);
    // Mix of matching and non-matching entries
    WorkOrder.findAll = jest.fn().mockResolvedValue([
      { work_order_no: 'GG-2026-0003' },
      { work_order_no: 'GG-2025-0099' },  // wrong year
      { work_order_no: 'XX-2026-0001' },  // wrong prefix (should be filtered by DB)
      { work_order_no: 'GG-2026-INVALID' }, // invalid format
    ]);

    const result = await generateWorkOrderNo(1);

    // Should be 0004 because only GG-2026-0003 matches the regex
    expect(result.seq).toBe(4);
    expect(result.work_order_no).toBe('GG-2026-0004');
  });

  test('generateWorkOrderNo pads sequence to 4 digits', async () => {
    const mockTenant = {
      id: 1,
      name: 'Test Company',
      order_code_prefix: 'GG',
    };

    const sequelize = require('../src/config/database');
    sequelize.transaction.mockImplementation(async (callback) => {
      return callback({});
    });

    Tenant.findByPk = jest.fn().mockResolvedValue(mockTenant);
    // Simulate seq 99 exists
    WorkOrder.findAll = jest.fn().mockResolvedValue(
      Array.from({ length: 99 }, (_, i) => ({
        work_order_no: `GG-2026-${String(i + 1).padStart(4, '0')}`,
      }))
    );

    const result = await generateWorkOrderNo(1);

    expect(result.work_order_no).toBe('GG-2026-0100');
    expect(result.seq).toBe(100);
  });
});
