/**
 * 初始数据种子 — 创建默认租户、管理员、甲方企业
 * 首次部署后运行: npx sequelize-cli db:seed:all
 */
'use strict'

const bcrypt = require('bcrypt')

module.exports = {
  async up(queryInterface) {
    const now = new Date()

    // 1. 创建默认租户（广告商）
    await queryInterface.bulkInsert('tenants', [{
      name: '默认广告商',
      contact_name: '管理员',
      contact_phone: '13800138000',
      status: 'active',
      max_users: 50,
      order_code_prefix: 'GG',
      order_code_seq: 0,
      modules: JSON.stringify(['all']),
      created_at: now,
      updated_at: now,
    }], {})

    // 2. 创建默认租户管理员（密码: Admin@123456）
    const passwordHash = await bcrypt.hash('Admin@123456', 10)
    await queryInterface.bulkInsert('tenant_users', [{
      tenant_id: 1,
      name: '管理员',
      phone: '13800138000',
      password_hash: passwordHash,
      role: 'admin',
      status: 'active',
      created_at: now,
      updated_at: now,
    }], {})

    // 3. 创建默认甲方企业
    await queryInterface.bulkInsert('clients', [{
      tenant_id: 1,
      name: '演示甲方',
      contact_name: '张三',
      contact_phone: '13900000001',
      status: 'active',
      approval_enabled: false,
      created_at: now,
      updated_at: now,
    }], {})

    // 4. 创建默认甲方用户（密码: Client@123456）
    const clientPasswordHash = await bcrypt.hash('Client@123456', 10)
    await queryInterface.bulkInsert('client_users', [{
      client_id: 1,
      name: '张三',
      phone: '13900000001',
      password_hash: clientPasswordHash,
      role: 'manager',
      status: 'active',
      created_at: now,
      updated_at: now,
    }], {})
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('client_users', null, {})
    await queryInterface.bulkDelete('clients', null, {})
    await queryInterface.bulkDelete('tenant_users', null, {})
    await queryInterface.bulkDelete('tenants', null, {})
  },
}
