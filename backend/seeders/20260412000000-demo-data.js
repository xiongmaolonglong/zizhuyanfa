'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    // 1. 地址字典（湖南省长沙市部分数据）
    await queryInterface.bulkInsert('address_dict', [
      // 湖南省
      { code: '430000', parent_code: null, level: 'province', name: '湖南省', created_at: now, updated_at: now },
      // 长沙市
      { code: '430100', parent_code: '430000', level: 'city', name: '长沙市', created_at: now, updated_at: now },
      // 岳麓区
      { code: '430104', parent_code: '430100', level: 'district', name: '岳麓区', created_at: now, updated_at: now },
      // 天心区
      { code: '430103', parent_code: '430100', level: 'district', name: '天心区', created_at: now, updated_at: now },
      // 岳麓街道
      { code: '430104001', parent_code: '430104', level: 'street', name: '岳麓街道', created_at: now, updated_at: now },
      // 坡子街街道
      { code: '430103001', parent_code: '430103', level: 'street', name: '坡子街街道', created_at: now, updated_at: now },
    ]);

    // 2. 租户（广告商）
    await queryInterface.bulkInsert('tenants', [
      {
        name: '湖南鼎盛广告传媒',
        contact_name: '王五',
        contact_phone: '13800000001',
        contact_email: 'wangwu@dingsheng.com',
        status: 'active',
        max_users: 50,
        order_code_prefix: 'GG',
        order_code_seq: 0,
        modules: JSON.stringify(['all']),
        created_at: now,
        updated_at: now,
      },
      {
        name: '长沙创意广告有限公司',
        contact_name: '孙七',
        contact_phone: '13800000004',
        contact_email: 'sunqi@chuangyi.com',
        status: 'active',
        max_users: 30,
        order_code_prefix: 'GG',
        order_code_seq: 0,
        modules: JSON.stringify(['all']),
        created_at: now,
        updated_at: now,
      },
    ]);

    // 3. 租户部门（归属第一个租户）
    await queryInterface.bulkInsert('tenant_departments', [
      { tenant_id: 1, name: '设计部', manager_id: null, region_codes: null, created_at: now, updated_at: now },
      { tenant_id: 1, name: '工程部', manager_id: null, region_codes: null, created_at: now, updated_at: now },
      { tenant_id: 1, name: '市场部', manager_id: null, region_codes: null, created_at: now, updated_at: now },
    ]);

    // 4. 租户用户
    const pwdHash = '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36OQMwqblq8EQPi0rS.5hW2';
    await queryInterface.bulkInsert('tenant_users', [
      {
        tenant_id: 1,
        name: '王五',
        phone: '13800000001',
        email: 'wangwu@dingsheng.com',
        password_hash: pwdHash,
        role: 'admin',
        department_id: 3,
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        tenant_id: 1,
        name: '李四',
        phone: '13800000002',
        email: 'lisi@dingsheng.com',
        password_hash: pwdHash,
        role: 'measurer',
        department_id: 1,
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        tenant_id: 1,
        name: '赵六',
        phone: '13800000003',
        email: 'zhaoliu@dingsheng.com',
        password_hash: pwdHash,
        role: 'constructor',
        department_id: 2,
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        tenant_id: 2,
        name: '孙七',
        phone: '13800000004',
        email: 'sunqi@chuangyi.com',
        password_hash: pwdHash,
        role: 'producer',
        department_id: null,
        status: 'active',
        created_at: now,
        updated_at: now,
      },
    ]);

    // 5. 甲方企业（归属第一个租户）
    await queryInterface.bulkInsert('clients', [
      {
        tenant_id: 1,
        name: '步步高商业连锁',
        contact_name: '张三',
        contact_phone: '13900000001',
        email: 'zhangsan@bbg.com',
        address: '长沙市岳麓区岳麓街道',
        status: 'active',
        approval_enabled: true,
        created_at: now,
        updated_at: now,
      },
      {
        tenant_id: 1,
        name: '茶颜悦色',
        contact_name: '刘八',
        contact_phone: '13900000002',
        email: 'liuba@chayan.com',
        address: '长沙市天心区坡子街街道',
        status: 'active',
        approval_enabled: true,
        created_at: now,
        updated_at: now,
      },
    ]);

    // 6. 甲方部门
    await queryInterface.bulkInsert('client_departments', [
      { client_id: 1, name: '市场部', manager_id: null, created_at: now, updated_at: now },
      { client_id: 1, name: '运营部', manager_id: null, created_at: now, updated_at: now },
    ]);

    // 7. 甲方用户
    await queryInterface.bulkInsert('client_users', [
      {
        client_id: 1,
        name: '张三',
        phone: '13900000001',
        password_hash: pwdHash,
        role: 'manager',
        department_id: 1,
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        client_id: 2,
        name: '刘八',
        phone: '13900000002',
        password_hash: pwdHash,
        role: 'staff',
        department_id: null,
        status: 'active',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('client_users', null, {});
    await queryInterface.bulkDelete('client_departments', null, {});
    await queryInterface.bulkDelete('clients', null, {});
    await queryInterface.bulkDelete('tenant_users', null, {});
    await queryInterface.bulkDelete('tenant_departments', null, {});
    await queryInterface.bulkDelete('tenants', null, {});
    await queryInterface.bulkDelete('address_dict', null, {});
  },
};
