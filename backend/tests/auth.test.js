const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const TenantUser = require('../src/models/TenantUser');
const ClientUser = require('../src/models/ClientUser');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

describe('Auth API', () => {
  // ==================== Health Check ====================

  test('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('GET /api/v1/health returns 200', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  // ==================== Tenant Login ====================

  test('POST /api/v1/auth/tenant/login fails without body', async () => {
    const res = await request(app)
      .post('/api/v1/auth/tenant/login')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('手机号和密码不能为空');
  });

  test('POST /api/v1/auth/tenant/login fails with missing password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/tenant/login')
      .send({ phone: '13800138000' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('手机号和密码不能为空');
  });

  test('POST /api/v1/auth/tenant/login returns 500 when DB unavailable', async () => {
    const res = await request(app)
      .post('/api/v1/auth/tenant/login')
      .send({ phone: '13800138000', password: 'test123' });
    // Without real DB, this hits the catch block -> 500
    expect([401, 500]).toContain(res.statusCode);
  });

  // ==================== Client Login ====================

  test('POST /api/v1/auth/client/login fails without body', async () => {
    const res = await request(app)
      .post('/api/v1/auth/client/login')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('手机号和密码不能为空');
  });

  // ==================== Auth-protected Endpoints ====================

  test('GET /api/v1/auth/me returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/未登录/);
  });

  test('GET /api/v1/auth/me returns 401 with empty header', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', '');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/v1/auth/me returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token-string');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/未登录/);
  });

  test('POST /api/v1/auth/change-password returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .send({ old_password: 'old', new_password: 'new123' });
    expect(res.statusCode).toBe(401);
  });

  // ==================== Login with mocked DB ====================

  test('POST /api/v1/auth/tenant/login succeeds with valid credentials', async () => {
    const mockUser = {
      id: 1,
      phone: '13800138000',
      password_hash: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
      tenant_id: 1,
      role: 'admin',
      status: 'active',
      name: '测试用户',
      toJSON() {
        return { ...this };
      },
    };

    jest.spyOn(TenantUser, 'findOne').mockResolvedValue(mockUser);
    jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true);

    const res = await request(app)
      .post('/api/v1/auth/tenant/login')
      .send({ phone: '13800138000', password: 'test123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data).toHaveProperty('user');
    expect(typeof res.body.data.token).toBe('string');

    // Verify token is valid JWT
    const decoded = jwt.verify(res.body.data.token, JWT_SECRET);
    expect(decoded.user_id).toBe(1);
    expect(decoded.user_type).toBe('tenant');
    expect(decoded.tenant_id).toBe(1);
  });

  test('POST /api/v1/auth/tenant/login returns 401 for wrong password', async () => {
    const mockUser = {
      id: 1,
      phone: '13800138000',
      password_hash: '$2b$10$wronghash',
      status: 'active',
    };

    jest.spyOn(TenantUser, 'findOne').mockResolvedValue(mockUser);
    jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(false);

    const res = await request(app)
      .post('/api/v1/auth/tenant/login')
      .send({ phone: '13800138000', password: 'wrongpass' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toContain('手机号或密码错误');
  });

  test('POST /api/v1/auth/tenant/login returns 401 for nonexistent user', async () => {
    jest.spyOn(TenantUser, 'findOne').mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/auth/tenant/login')
      .send({ phone: 'nonexistent', password: 'wrong' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toContain('手机号或密码错误');
  });

  test('POST /api/v1/auth/client/login succeeds with valid credentials', async () => {
    const mockUser = {
      id: 2,
      phone: '13900139000',
      password_hash: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
      client_id: 1,
      role: 'contact',
      status: 'active',
      name: '甲方用户',
      toJSON() {
        return { ...this };
      },
    };

    jest.spyOn(ClientUser, 'findOne').mockResolvedValue(mockUser);
    jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true);

    const res = await request(app)
      .post('/api/v1/auth/client/login')
      .send({ phone: '13900139000', password: 'test123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data).toHaveProperty('token');

    const decoded = jwt.verify(res.body.data.token, JWT_SECRET);
    expect(decoded.user_type).toBe('client');
    expect(decoded.client_id).toBe(1);
  });

  // ==================== Authenticated Endpoints ====================

  test('GET /api/v1/auth/me returns user with valid token', async () => {
    const mockUser = {
      id: 1,
      phone: '13800138000',
      name: '测试用户',
      tenant_id: 1,
      role: 'admin',
      status: 'active',
      toJSON() {
        const obj = { ...this };
        delete obj.password_hash;
        return obj;
      },
    };

    jest.spyOn(TenantUser, 'findByPk').mockResolvedValue(mockUser);

    const token = jwt.sign(
      { user_id: 1, user_type: 'tenant', tenant_id: 1, role: 'admin' },
      JWT_SECRET
    );

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data).toHaveProperty('name');
  });

  // ==================== Change Password ====================

  test('POST /api/v1/auth/change-password fails without fields', async () => {
    const token = jwt.sign(
      { user_id: 1, user_type: 'tenant', tenant_id: 1, role: 'admin' },
      JWT_SECRET
    );

    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('旧密码和新密码不能为空');
  });

  test('POST /api/v1/auth/change-password fails with short new password', async () => {
    const token = jwt.sign(
      { user_id: 1, user_type: 'tenant', tenant_id: 1, role: 'admin' },
      JWT_SECRET
    );

    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ old_password: 'oldpass', new_password: '123' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('至少 6 位');
  });
});
