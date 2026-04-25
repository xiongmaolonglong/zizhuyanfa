require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, Tenant, TenantDepartment, TenantUser, Client, ClientUser, ClientDepartment, AddressDict, WorkOrder, WoDeclaration } = require('./src/models');

async function seed() {
  console.log('Seeding database...');

  const hash = async (pw) => bcrypt.hash(pw, 10);

  // ========== Tenants ==========
  const t1 = await Tenant.create({ name: '盛世文化传媒有限公司', contact_name: '张总', contact_phone: '13800000001', status: 'active', modules: JSON.stringify(['measurement', 'design', 'production', 'construction', 'finance', 'archive']) });
  const t2 = await Tenant.create({ name: '华艺广告制作有限公司', contact_name: '王总', contact_phone: '13800000002', status: 'active', modules: JSON.stringify(['measurement', 'design', 'production', 'construction']) });
  const t3 = await Tenant.create({ name: '博视标识设计工程公司', contact_name: '李总', contact_phone: '13800000003', status: 'active', modules: JSON.stringify(['design', 'production', 'construction']) });
  console.log('Tenants created:', t1.name, t2.name, t3.name);

  // ========== Tenant Departments ==========
  await TenantDepartment.bulkCreate([
    { tenant_id: t1.id, name: '工程部' },
    { tenant_id: t1.id, name: '设计部' },
    { tenant_id: t1.id, name: '财务部' },
    { tenant_id: t2.id, name: '工程部' },
    { tenant_id: t2.id, name: '设计部' },
    { tenant_id: t3.id, name: '设计部' },
    { tenant_id: t3.id, name: '施工部' },
  ]);

  // ========== Tenant Users ==========
  const deptT1 = await TenantDepartment.findAll({ where: { tenant_id: t1.id } });
  const deptT2 = await TenantDepartment.findAll({ where: { tenant_id: t2.id } });
  const deptT3 = await TenantDepartment.findAll({ where: { tenant_id: t3.id } });

  const tenantUsers = await TenantUser.bulkCreate([
    // 盛世传媒
    { tenant_id: t1.id, name: '张管理', phone: '13800000101', password_hash: await hash('123456'), role: 'admin', department_id: deptT1[0].id, status: 'active' },
    { tenant_id: t1.id, name: '李派单', phone: '13800000102', password_hash: await hash('123456'), role: 'dispatcher', department_id: deptT1[0].id, status: 'active' },
    { tenant_id: t1.id, name: '王测量', phone: '13800000103', password_hash: await hash('123456'), role: 'measurer', department_id: deptT1[0].id, status: 'active' },
    { tenant_id: t1.id, name: '赵设计', phone: '13800000104', password_hash: await hash('123456'), role: 'designer', department_id: deptT1[1].id, status: 'active' },
    { tenant_id: t1.id, name: '刘施工', phone: '13800000105', password_hash: await hash('123456'), role: 'constructor', department_id: deptT1[0].id, status: 'active' },
    { tenant_id: t1.id, name: '陈财务', phone: '13800000106', password_hash: await hash('123456'), role: 'finance', department_id: deptT1[2].id, status: 'active' },
    // 华艺广告
    { tenant_id: t2.id, name: '王管理', phone: '13800000201', password_hash: await hash('123456'), role: 'admin', department_id: deptT2[0].id, status: 'active' },
    { tenant_id: t2.id, name: '孙测量', phone: '13800000202', password_hash: await hash('123456'), role: 'measurer', department_id: deptT2[0].id, status: 'active' },
    { tenant_id: t2.id, name: '周设计', phone: '13800000203', password_hash: await hash('123456'), role: 'designer', department_id: deptT2[1].id, status: 'active' },
    { tenant_id: t2.id, name: '吴施工', phone: '13800000204', password_hash: await hash('123456'), role: 'constructor', department_id: deptT2[0].id, status: 'active' },
    // 博视标识
    { tenant_id: t3.id, name: '李管理', phone: '13800000301', password_hash: await hash('123456'), role: 'admin', department_id: deptT3[0].id, status: 'active' },
    { tenant_id: t3.id, name: '郑设计', phone: '13800000302', password_hash: await hash('123456'), role: 'designer', department_id: deptT3[0].id, status: 'active' },
    { tenant_id: t3.id, name: '冯施工', phone: '13800000303', password_hash: await hash('123456'), role: 'constructor', department_id: deptT3[1].id, status: 'active' },
  ]);
  console.log('Tenant users created:', tenantUsers.length);

  // ========== Clients ==========
  const c1 = await Client.create({ tenant_id: t1.id, name: '北京华贸置业有限公司', contact_name: '张总', contact_phone: '13900000001', status: 'active', approval_enabled: true });
  const c2 = await Client.create({ tenant_id: t1.id, name: '广州天河城百货有限公司', contact_name: '李总', contact_phone: '13900000002', status: 'active', approval_enabled: true });
  const c3 = await Client.create({ tenant_id: t2.id, name: '上海申通地铁广告有限公司', contact_name: '王总', contact_phone: '13900000003', status: 'active', approval_enabled: false });
  const c4 = await Client.create({ tenant_id: t3.id, name: '深圳市高速公路广告有限公司', contact_name: '赵总', contact_phone: '13900000004', status: 'active', approval_enabled: false });
  console.log('Clients created:', c1.name, c2.name, c3.name, c4.name);

  // ========== Client Departments ==========
  const cd1 = await ClientDepartment.create({ client_id: c1.id, name: '市场部' });
  const cd2 = await ClientDepartment.create({ client_id: c2.id, name: '运营部' });
  const cd3 = await ClientDepartment.create({ client_id: c3.id, name: '广告部' });
  const cd4 = await ClientDepartment.create({ client_id: c4.id, name: '工程部' });

  // ========== Client Users ==========
  const clientUsers = await ClientUser.bulkCreate([
    { client_id: c1.id, name: '张三', phone: '13800001001', password_hash: await hash('123456'), role: 'manager', department_id: cd1.id, status: 'active' },
    { client_id: c1.id, name: '李四', phone: '13800001002', password_hash: await hash('123456'), role: 'staff', department_id: cd1.id, status: 'active' },
    { client_id: c2.id, name: '王五', phone: '13800001003', password_hash: await hash('123456'), role: 'manager', department_id: cd2.id, status: 'active' },
    { client_id: c3.id, name: '赵六', phone: '13800001004', password_hash: await hash('123456'), role: 'manager', department_id: cd3.id, status: 'active' },
    { client_id: c4.id, name: '孙七', phone: '13800001005', password_hash: await hash('123456'), role: 'staff', department_id: cd4.id, status: 'active' },
  ]);
  console.log('Client users created:', clientUsers.length);

  // ========== Address Data ==========
  const addresses = [
    // 广东省
    { code: '440000', parent_code: null, level: 'province', name: '广东省' },
    { code: '440100', parent_code: '440000', level: 'city', name: '广州市' },
    { code: '440300', parent_code: '440000', level: 'city', name: '深圳市' },
    { code: '440600', parent_code: '440000', level: 'city', name: '佛山市' },
    { code: '441900', parent_code: '440000', level: 'city', name: '东莞市' },
    { code: '440106', parent_code: '440100', level: 'district', name: '天河区' },
    { code: '440305', parent_code: '440300', level: 'district', name: '南山区' },
    { code: '440606', parent_code: '440600', level: 'district', name: '顺德区' },
    { code: '441901', parent_code: '441900', level: 'district', name: '南城区' },
    { code: '440106001', parent_code: '440106', level: 'street', name: '五山路街道' },
    { code: '440305001', parent_code: '440305', level: 'street', name: '科技园街道' },
    { code: '440606001', parent_code: '440606', level: 'street', name: '大良街道' },
    { code: '441901001', parent_code: '441901', level: 'street', name: '鸿福路街道' },
  ];
  await AddressDict.bulkCreate(addresses);
  console.log('Addresses created:', addresses.length);

  // ========== Work Orders ==========
  const { generateWorkOrderNo } = require('./src/services/workOrderNoService');

  const workOrders = [
    {
      wo: { work_order_no: 'GG-2026-0001', tenant_id: t1.id, client_id: c1.id, client_user_id: clientUsers[0].id, title: '北京CBD户外LED大屏', project_category: 'led_screen', description: '需要在外立面安装一块约50平米的LED显示屏，用于商业广告展示。', current_stage: 'design', status: 'designing', assigned_tenant_user_id: tenantUsers[2].id, deadline: '2026-05-01' },
      decl: { project_type: 'LED大屏', detail_address: '建国路88号SOHO现代城', contact_name: '张三', contact_phone: '13800001001', photos: JSON.stringify([]) }
    },
    {
      wo: { work_order_no: 'GG-2026-0002', tenant_id: t1.id, client_id: c2.id, client_user_id: clientUsers[2].id, title: '广州天河城商场导视系统', project_category: 'storefront', description: '商场内部导视系统更新，含楼层指示、店铺指引、安全出口等标识。', current_stage: 'measurement', status: 'measuring', assigned_tenant_user_id: tenantUsers[2].id, deadline: '2026-04-30' },
      decl: { project_type: '门头招牌', detail_address: '天河路天河城B1-L3层', contact_name: '王五', contact_phone: '13800001003', photos: JSON.stringify([]) }
    },
    {
      wo: { work_order_no: 'GG-2026-0003', tenant_id: t2.id, client_id: c3.id, client_user_id: clientUsers[3].id, title: '上海陆家嘴地铁站灯箱广告', project_category: 'lightbox', description: '地铁站通道内灯箱更换，需要6块灯箱，尺寸统一为2m*1m。', current_stage: 'measurement', status: 'measuring', assigned_tenant_user_id: tenantUsers[7].id, deadline: '2026-04-25' },
      decl: { project_type: '灯箱广告', detail_address: '陆家嘴地铁站2号出口通道', contact_name: '赵六', contact_phone: '13800001004', photos: JSON.stringify([]) }
    },
    {
      wo: { work_order_no: 'GG-2026-0004', tenant_id: t3.id, client_id: c4.id, client_user_id: clientUsers[4].id, title: '深圳南山区高速广告牌', project_category: 'outdoor_large', description: '高速出口大型户外广告牌制作安装，钢结构+喷绘画面。', current_stage: 'construction', status: 'constructing', assigned_tenant_user_id: tenantUsers[12].id, deadline: '2026-04-20' },
      decl: { project_type: '户外大牌', detail_address: '南头高速出口右侧', contact_name: '孙七', contact_phone: '13800001005', photos: JSON.stringify([]) }
    },
    {
      wo: { work_order_no: 'GG-2026-0005', tenant_id: t2.id, client_id: c3.id, client_user_id: clientUsers[3].id, title: '杭州西湖景区指示牌改造', project_category: 'other', description: '景区指示牌风格统一改造，采用仿古铜材质，约30块。', current_stage: 'declaration', status: 'submitted', deadline: '2026-05-10' },
      decl: { project_type: '其他', detail_address: '西湖风景名胜区各主要景点入口', contact_name: '赵六', contact_phone: '13800001004', photos: JSON.stringify([]) }
    },
    {
      wo: { work_order_no: 'GG-2026-0006', tenant_id: t1.id, client_id: c1.id, client_user_id: clientUsers[1].id, title: '成都春熙路商业街LED屏', project_category: 'led_screen', description: '商业街主入口安装弧形LED大屏，宽12米高4米。', current_stage: 'design', status: 'design_reviewed', assigned_tenant_user_id: tenantUsers[3].id, deadline: '2026-05-15' },
      decl: { project_type: 'LED大屏', detail_address: '春熙路步行街主入口', contact_name: '李四', contact_phone: '13800001002', photos: JSON.stringify([]) }
    },
  ];

  for (const item of workOrders) {
    const wo = await WorkOrder.create(item.wo);
    await WoDeclaration.create({ ...item.decl, work_order_id: wo.id });
  }
  console.log('Work orders created:', workOrders.length);

  console.log('\n===== Seed completed =====');
  console.log('Tenants:', 3);
  console.log('Tenant users:', tenantUsers.length);
  console.log('Clients:', 4);
  console.log('Client users:', clientUsers.length);
  console.log('Addresses:', addresses.length);
  console.log('Work orders:', workOrders.length);
  console.log('\nDefault passwords: 123456');
  console.log('Tenant admin login: 13800000101 / 123456');
  console.log('Client user login: 13800001001 / 123456');

  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
