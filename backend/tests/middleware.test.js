const jwt = require('jsonwebtoken');
const { requireAuth, requireTenant, requireClient, requireAdmin } = require('../src/middleware/auth');
const { validate } = require('../src/middleware/validate');
const { injectTenant, buildTenantFilter } = require('../src/middleware/tenant');
const errorHandler = require('../src/middleware/errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Helper to create mock req/res/next
function mockReqRes(overrides = {}) {
  const req = { headers: {}, body: {}, ...overrides };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

// ==================== Auth Middleware ====================

describe('Auth Middleware', () => {
  describe('requireAuth', () => {
    test('rejects without Authorization header', () => {
      const { req, res, next } = mockReqRes();
      requireAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: '未登录或登录已过期' });
      expect(next).not.toHaveBeenCalled();
    });

    test('rejects with malformed Authorization header', () => {
      const { req, res, next } = mockReqRes({
        headers: { authorization: 'InvalidFormat token123' },
      });
      requireAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('rejects with invalid token', () => {
      const { req, res, next } = mockReqRes({
        headers: { authorization: 'Bearer totally-invalid-token' },
      });
      requireAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('accepts valid token and attaches user', () => {
      const token = jwt.sign(
        { user_id: 1, user_type: 'tenant', tenant_id: 5, role: 'admin' },
        JWT_SECRET
      );
      const { req, res, next } = mockReqRes({
        headers: { authorization: `Bearer ${token}` },
      });
      requireAuth(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({
        user_id: 1,
        user_type: 'tenant',
        tenant_id: 5,
        role: 'admin',
        client_id: undefined,
      });
    });

    test('accepts client token', () => {
      const token = jwt.sign(
        { user_id: 2, user_type: 'client', client_id: 3, role: 'contact' },
        JWT_SECRET
      );
      const { req, res, next } = mockReqRes({
        headers: { authorization: `Bearer ${token}` },
      });
      requireAuth(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user.user_type).toBe('client');
      expect(req.user.client_id).toBe(3);
    });
  });

  describe('requireTenant', () => {
    test('rejects without token', () => {
      const { req, res, next } = mockReqRes();
      requireTenant(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('rejects with invalid token', () => {
      const { req, res, next } = mockReqRes({
        headers: { authorization: 'Bearer bad-token' },
      });
      requireTenant(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('rejects client user with 403', () => {
      const token = jwt.sign(
        { user_id: 2, user_type: 'client', client_id: 3, role: 'contact' },
        JWT_SECRET
      );
      const { req, res, next } = mockReqRes({
        headers: { authorization: `Bearer ${token}` },
      });
      requireTenant(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: '无权访问此资源' });
      expect(next).not.toHaveBeenCalled();
    });

    test('accepts tenant user', () => {
      const token = jwt.sign(
        { user_id: 1, user_type: 'tenant', tenant_id: 5, role: 'editor' },
        JWT_SECRET
      );
      const { req, res, next } = mockReqRes({
        headers: { authorization: `Bearer ${token}` },
      });
      requireTenant(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user.user_type).toBe('tenant');
      expect(req.user.tenant_id).toBe(5);
    });

    test('accepts super_admin user', () => {
      const token = jwt.sign(
        { user_id: 99, user_type: 'tenant', tenant_id: 1, role: 'super_admin' },
        JWT_SECRET
      );
      const { req, res, next } = mockReqRes({
        headers: { authorization: `Bearer ${token}` },
      });
      requireTenant(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireClient', () => {
    test('rejects without token', () => {
      const { req, res, next } = mockReqRes();
      requireClient(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('rejects tenant user with 403', () => {
      const token = jwt.sign(
        { user_id: 1, user_type: 'tenant', tenant_id: 5, role: 'admin' },
        JWT_SECRET
      );
      const { req, res, next } = mockReqRes({
        headers: { authorization: `Bearer ${token}` },
      });
      requireClient(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('accepts client user', () => {
      const token = jwt.sign(
        { user_id: 2, user_type: 'client', client_id: 3, role: 'contact' },
        JWT_SECRET
      );
      const { req, res, next } = mockReqRes({
        headers: { authorization: `Bearer ${token}` },
      });
      requireClient(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user.user_type).toBe('client');
    });
  });

  describe('requireAdmin', () => {
    test('rejects without token', () => {
      const { req, res, next } = mockReqRes();
      requireAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('rejects non-admin tenant user', () => {
      const token = jwt.sign(
        { user_id: 1, user_type: 'tenant', tenant_id: 5, role: 'editor' },
        JWT_SECRET
      );
      const { req, res, next } = mockReqRes({
        headers: { authorization: `Bearer ${token}` },
      });
      requireAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: '需要管理员权限' });
    });

    test('accepts tenant admin', () => {
      const token = jwt.sign(
        { user_id: 1, user_type: 'tenant', tenant_id: 5, role: 'admin' },
        JWT_SECRET
      );
      const { req, res, next } = mockReqRes({
        headers: { authorization: `Bearer ${token}` },
      });
      requireAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('accepts super_admin', () => {
      const token = jwt.sign(
        { user_id: 99, user_type: 'tenant', tenant_id: 1, role: 'super_admin' },
        JWT_SECRET
      );
      const { req, res, next } = mockReqRes({
        headers: { authorization: `Bearer ${token}` },
      });
      requireAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user.role).toBe('super_admin');
    });
  });
});

// ==================== Validation Middleware ====================

describe('Validation Middleware', () => {
  test('validate passes with valid data', () => {
    const rules = {
      name: { required: true, type: 'string' },
      email: { required: true, type: 'email' },
    };
    const { req, res, next } = mockReqRes({
      body: { name: 'Test', email: 'test@example.com' },
    });
    validate(rules)(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('validate rejects missing required field', () => {
    const rules = {
      name: { required: true, type: 'string' },
    };
    const { req, res, next } = mockReqRes({ body: {} });
    validate(rules)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
    const errors = res.json.mock.calls[0][0];
    expect(errors.details).toHaveLength(1);
    expect(errors.details[0].field).toBe('name');
  });

  test('validate rejects invalid email', () => {
    const rules = {
      email: { required: true, type: 'email' },
    };
    const { req, res, next } = mockReqRes({
      body: { email: 'not-an-email' },
    });
    validate(rules)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    const errors = res.json.mock.calls[0][0];
    expect(errors.details[0].field).toBe('email');
  });

  test('validate rejects invalid phone', () => {
    const rules = {
      phone: { required: true, type: 'phone' },
    };
    const { req, res, next } = mockReqRes({
      body: { phone: '123456' },
    });
    validate(rules)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('validate accepts valid Chinese phone number', () => {
    const rules = {
      phone: { required: true, type: 'phone' },
    };
    const { req, res, next } = mockReqRes({
      body: { phone: '13800138000' },
    });
    validate(rules)(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('validate rejects invalid type', () => {
    const rules = {
      count: { required: true, type: 'number' },
    };
    const { req, res, next } = mockReqRes({
      body: { count: 'not-a-number' },
    });
    validate(rules)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('validate accepts valid number', () => {
    const rules = {
      count: { required: true, type: 'number' },
    };
    const { req, res, next } = mockReqRes({
      body: { count: 42 },
    });
    validate(rules)(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('validate rejects value outside enum', () => {
    const rules = {
      status: { required: true, type: 'string', enum: ['active', 'inactive'] },
    };
    const { req, res, next } = mockReqRes({
      body: { status: 'deleted' },
    });
    validate(rules)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('validate rejects string too short', () => {
    const rules = {
      name: { required: true, type: 'string', min: 2 },
    };
    const { req, res, next } = mockReqRes({
      body: { name: 'A' },
    });
    validate(rules)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('validate rejects string too long', () => {
    const rules = {
      name: { required: true, type: 'string', max: 5 },
    };
    const { req, res, next } = mockReqRes({
      body: { name: 'ThisIsTooLong' },
    });
    validate(rules)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('validate allows empty optional field', () => {
    const rules = {
      nickname: { required: false, type: 'string' },
    };
    const { req, res, next } = mockReqRes({ body: {} });
    validate(rules)(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('validate rejects invalid boolean', () => {
    const rules = {
      active: { required: true, type: 'boolean' },
    };
    const { req, res, next } = mockReqRes({
      body: { active: 'yes' },
    });
    validate(rules)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ==================== Tenant Middleware ====================

describe('Tenant Middleware', () => {
  test('injectTenant skips non-tenant users', () => {
    const { req, res, next } = mockReqRes({
      user: { user_type: 'client', client_id: 1 },
    });
    injectTenant(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.tenantId).toBeUndefined();
  });

  test('injectTenant sets tenant_id for tenant users', () => {
    const { req, res, next } = mockReqRes({
      user: { user_type: 'tenant', tenant_id: 42, role: 'editor' },
    });
    injectTenant(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.tenantId).toBe(42);
    expect(req.locals.tenant_id).toBe(42);
  });

  test('injectTenant skips tenant filter for super_admin', () => {
    const { req, res, next } = mockReqRes({
      user: { user_type: 'tenant', tenant_id: 1, role: 'super_admin' },
    });
    injectTenant(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.locals).toBeUndefined();
  });
});

// ==================== Error Handler Middleware ====================

describe('Error Handler Middleware', () => {
  test('returns 500 for generic errors', () => {
    const { req, res, next } = mockReqRes();
    const err = new Error('Something broke');
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Something broke' });
  });

  test('returns 400 for SequelizeValidationError', () => {
    const { req, res, next } = mockReqRes();
    const err = {
      name: 'SequelizeValidationError',
      errors: [{ message: 'name cannot be null' }],
    };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: '数据验证失败',
      details: ['name cannot be null'],
    });
  });

  test('returns 409 for SequelizeUniqueConstraintError', () => {
    const { req, res, next } = mockReqRes();
    const err = {
      name: 'SequelizeUniqueConstraintError',
      errors: [{ message: 'email must be unique' }],
    };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: '数据冲突',
      details: ['email must be unique'],
    });
  });

  test('returns 400 for SequelizeForeignKeyConstraintError', () => {
    const { req, res, next } = mockReqRes();
    const err = { name: 'SequelizeForeignKeyConstraintError' };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: '关联数据不存在' });
  });

  test('respects custom error status', () => {
    const { req, res, next } = mockReqRes();
    const err = new Error('Not found');
    err.status = 404;
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
  });
});
