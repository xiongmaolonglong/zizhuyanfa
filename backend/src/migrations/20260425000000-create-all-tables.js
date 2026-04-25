/**
 * 广告工程全流程管理系统 - 数据库初始化迁移
 * 按依赖顺序创建所有表
 */
'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    // ===== 基础表（无外键依赖）=====

    // 1. 租户表
    await queryInterface.createTable('tenants', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      contact_name: Sequelize.STRING(50),
      contact_phone: Sequelize.STRING(20),
      contact_email: Sequelize.STRING(100),
      status: { type: Sequelize.ENUM('active', 'suspended', 'expired'), defaultValue: 'active' },
      max_users: { type: Sequelize.INTEGER, defaultValue: 50 },
      order_code_prefix: { type: Sequelize.STRING(20), defaultValue: 'GG' },
      order_code_seq: { type: Sequelize.INTEGER, defaultValue: 0 },
      default_client_id: Sequelize.INTEGER,
      modules: { type: Sequelize.JSON, defaultValue: ['all'] },
      settings: Sequelize.JSON,
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // 2. 甲方企业表
    await queryInterface.createTable('clients', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false },
      contact_name: Sequelize.STRING(50),
      contact_phone: Sequelize.STRING(20),
      email: Sequelize.STRING(100),
      address: Sequelize.STRING(200),
      status: { type: Sequelize.ENUM('active', 'inactive'), defaultValue: 'active' },
      approval_enabled: { type: Sequelize.BOOLEAN, defaultValue: false },
      is_admin: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // 3. 地址字典表
    await queryInterface.createTable('address_dict', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      code: { type: Sequelize.STRING(20), unique: true, allowNull: false },
      parent_code: Sequelize.STRING(20),
      level: { type: Sequelize.ENUM('province', 'city', 'district', 'street'), allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // ===== 租户组织架构 =====

    // 4. 租户部门表
    await queryInterface.createTable('tenant_departments', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false },
      manager_id: Sequelize.INTEGER,
      region_codes: Sequelize.JSON,
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // 5. 租户管辖区域表
    await queryInterface.createTable('tenant_regions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: false },
      province_code: { type: Sequelize.STRING(20), allowNull: false },
      city_code: { type: Sequelize.STRING(20), allowNull: false },
      district_code: Sequelize.STRING(20),
      street_code: Sequelize.STRING(20),
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // 6. 租户人员表
    await queryInterface.createTable('tenant_users', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: false },
      name: { type: Sequelize.STRING(50), allowNull: false },
      phone: { type: Sequelize.STRING(20), unique: true },
      wechat_openid: { type: Sequelize.STRING(100), unique: true },
      email: Sequelize.STRING(100),
      real_name: Sequelize.STRING(50),
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      role: {
        type: Sequelize.ENUM('admin', 'dispatcher', 'measurer', 'designer', 'producer', 'constructor', 'finance'),
        defaultValue: 'admin',
      },
      department_id: Sequelize.INTEGER,
      status: { type: Sequelize.ENUM('active', 'disabled'), defaultValue: 'active' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // ===== 甲方组织架构 =====

    // 7. 甲方部门表
    await queryInterface.createTable('client_departments', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      client_id: { type: Sequelize.INTEGER, allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false },
      manager_id: Sequelize.INTEGER,
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // 8. 甲方人员表
    await queryInterface.createTable('client_users', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      client_id: { type: Sequelize.INTEGER, allowNull: false },
      name: { type: Sequelize.STRING(50), allowNull: false },
      phone: { type: Sequelize.STRING(20), unique: true },
      real_name: Sequelize.STRING(50),
      wechat_openid: { type: Sequelize.STRING(100), unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      role: { type: Sequelize.ENUM('staff', 'manager'), defaultValue: 'staff' },
      department_id: Sequelize.INTEGER,
      status: { type: Sequelize.ENUM('active', 'disabled'), defaultValue: 'active' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // 9. 甲方管辖区域表
    await queryInterface.createTable('client_regions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      client_id: { type: Sequelize.INTEGER, allowNull: false },
      user_id: Sequelize.INTEGER,
      province_code: { type: Sequelize.STRING(20), allowNull: false },
      city_code: { type: Sequelize.STRING(20), allowNull: false },
      district_code: Sequelize.STRING(20),
      street_code: Sequelize.STRING(20),
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // ===== 工单核心 =====

    // 10. 工单表
    await queryInterface.createTable('work_orders', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      work_order_no: { type: Sequelize.STRING(30), unique: true, allowNull: false },
      tenant_id: { type: Sequelize.INTEGER, allowNull: false },
      client_id: { type: Sequelize.INTEGER, allowNull: false },
      client_user_id: Sequelize.INTEGER,
      title: { type: Sequelize.STRING(200), allowNull: false },
      project_category: { type: Sequelize.STRING(50), comment: '已废弃，使用 activity_name' },
      activity_name: { type: Sequelize.STRING(100) },
      description: Sequelize.TEXT,
      current_stage: {
        type: Sequelize.ENUM(
          'declaration', 'approval', 'assignment', 'measurement',
          'design', 'production', 'construction', 'finance', 'archive', 'aftersale'
        ),
        defaultValue: 'declaration',
      },
      status: {
        type: Sequelize.ENUM(
          'draft', 'submitted', 'approved', 'rejected',
          'assigned', 'measuring', 'measured',
          'designing', 'design_reviewed', 'design_confirmed',
          'producing', 'produced', 'shipped',
          'constructing', 'completed', 'accepted',
          'quoting', 'quoted', 'paid', 'invoiced',
          'archiving', 'archived',
          'aftersale_pending', 'aftersale_resolved', 'aftersale_closed'
        ),
        defaultValue: 'draft',
      },
      approval_enabled: { type: Sequelize.BOOLEAN, defaultValue: true },
      budget_id: Sequelize.INTEGER,
      assigned_tenant_user_id: Sequelize.INTEGER,
      designer_id: Sequelize.INTEGER,
      constructor_id: Sequelize.INTEGER,
      construction_start_date: Sequelize.DATEONLY,
      construction_end_date: Sequelize.DATEONLY,
      deadline: Sequelize.DATEONLY,
      completed_at: Sequelize.DATEONLY,
      warranty_end_date: Sequelize.DATEONLY,
      priority: { type: Sequelize.ENUM('high', 'normal', 'low'), defaultValue: 'normal' },
      custom_tags: Sequelize.TEXT,
      remarks: Sequelize.TEXT,
      source: {
        type: Sequelize.ENUM('admin_created', 'field_created', 'declaration'),
        defaultValue: 'admin_created',
      },
      custom_data: Sequelize.TEXT,
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // 11. 工单操作日志表
    await queryInterface.createTable('work_order_logs', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      work_order_id: { type: Sequelize.INTEGER, allowNull: false },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      user_type: { type: Sequelize.ENUM('tenant', 'client'), allowNull: false },
      action: { type: Sequelize.STRING(50), allowNull: false },
      stage: Sequelize.STRING(50),
      detail: Sequelize.TEXT,
      ip_address: Sequelize.STRING(50),
      log_type: Sequelize.STRING(30),
      field_name: Sequelize.STRING(50),
      old_value: Sequelize.TEXT,
      new_value: Sequelize.TEXT,
      amount_change: Sequelize.DECIMAL(10, 2),
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // ===== 工单各阶段 =====

    // 12. 申报表
    await queryInterface.createTable('wo_declarations', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      work_order_id: { type: Sequelize.INTEGER, unique: true, allowNull: false },
      project_type: Sequelize.STRING(50),
      province_code: Sequelize.STRING(20),
      city_code: Sequelize.STRING(20),
      district_code: Sequelize.STRING(20),
      street_code: Sequelize.STRING(20),
      detail_address: Sequelize.STRING(500),
      address: Sequelize.TEXT,
      full_address: Sequelize.STRING(1000),
      contact_name: Sequelize.STRING(50),
      contact_phone: Sequelize.STRING(20),
      photos: Sequelize.JSON,
      attachments: Sequelize.JSON,
      created_by: Sequelize.INTEGER,
      received_at: Sequelize.DATE,
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // 13. 审批表
    await queryInterface.createTable('wo_approvals', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      work_order_id: { type: Sequelize.INTEGER, unique: true, allowNull: false },
      approver_id: { type: Sequelize.INTEGER, allowNull: false },
      status: { type: Sequelize.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
      comment: Sequelize.TEXT,
      approved_at: Sequelize.DATEONLY,
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // 14. 派单表
    await queryInterface.createTable('wo_assignments', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      work_order_id: { type: Sequelize.INTEGER, unique: true, allowNull: false },
      assigned_by: { type: Sequelize.INTEGER, allowNull: false },
      assigned_to: { type: Sequelize.INTEGER, allowNull: false },
      status: { type: Sequelize.ENUM('pending', 'assigned', 'received'), defaultValue: 'pending' },
      deadline: Sequelize.DATEONLY,
      notes: Sequelize.TEXT,
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // 15. 测量表
    await queryInterface.createTable('wo_measurements', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      work_order_id: { type: Sequelize.INTEGER, allowNull: false },
      measurer_id: { type: Sequelize.INTEGER, allowNull: false },
      basic_info: Sequelize.JSON,
      materials: Sequelize.JSON,
      face_name: Sequelize.STRING(200),
      width: Sequelize.DECIMAL(10, 2),
      height: Sequelize.DECIMAL(10, 2),
      area: Sequelize.DECIMAL(10, 2),
      depth: Sequelize.DECIMAL(10, 2),
      photos: Sequelize.JSON,
      notes: Sequelize.TEXT,
      signature_path: Sequelize.STRING(500),
      status: { type: Sequelize.ENUM('measuring', 'measured', 'rejected'), defaultValue: 'measuring' },
      rejection_reason: Sequelize.TEXT,
      measured_at: Sequelize.DATEONLY,
      is_proxy: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // 16. 设计表
    await queryInterface.createTable('wo_designs', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      work_order_id: { type: Sequelize.INTEGER, allowNull: false },
      designer_id: { type: Sequelize.INTEGER, allowNull: false },
      version: { type: Sequelize.INTEGER, defaultValue: 1 },
      effect_images: Sequelize.JSON,
      source_files: Sequelize.JSON,
      material_list: Sequelize.JSON,
      face_mapping: Sequelize.JSON,
      internal_notes: Sequelize.TEXT,
      status: {
        type: Sequelize.ENUM('designing', 'reviewing', 'approved', 'rejected', 'confirmed'),
        defaultValue: 'designing',
      },
      reviewer_id: Sequelize.INTEGER,
      review_comment: Sequelize.TEXT,
      reviewed_at: Sequelize.DATEONLY,
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // 17. 生产表
    await queryInterface.createTable('wo_productions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      work_order_id: { type: Sequelize.INTEGER, allowNull: false },
      production_task_no: Sequelize.STRING(50),
      task_ids: Sequelize.JSON,
      material_type: Sequelize.STRING(50),
      spec: Sequelize.STRING(200),
      quantity: Sequelize.INTEGER,
      status: {
        type: Sequelize.ENUM('scheduled', 'producing', 'completed', 'shipped', 'quality_checked', 'qualified', 'warehoused'),
        defaultValue: 'scheduled',
      },
      quality_result: { type: Sequelize.ENUM('合格', '不合格', '待复检') },
      quality_inspector: Sequelize.STRING(50),
      quality_date: Sequelize.DATEONLY,
      quality_notes: Sequelize.TEXT,
      produced_at: Sequelize.DATEONLY,
      shipped_at: Sequelize.DATEONLY,
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // 18. 施工表
    await queryInterface.createTable('wo_constructions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      work_order_id: { type: Sequelize.INTEGER, allowNull: false },
      constructor_id: Sequelize.INTEGER,
      before_photos: Sequelize.JSON,
      during_photos: Sequelize.JSON,
      after_photos: Sequelize.JSON,
      notes: Sequelize.TEXT,
      duration_minutes: Sequelize.INTEGER,
      signature_path: Sequelize.STRING(500),
      status: {
        type: Sequelize.ENUM('scheduled', 'installing', 'completed', 'accepted', 'internally_verified'),
        defaultValue: 'scheduled',
      },
      internal_verified_at: Sequelize.DATEONLY,
      client_verified_at: Sequelize.DATEONLY,
      auto_accept_days: { type: Sequelize.INTEGER, defaultValue: 3 },
      constructed_at: Sequelize.DATEONLY,
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // 19. 财务表
    await queryInterface.createTable('wo_finance', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      work_order_id: { type: Sequelize.INTEGER, allowNull: false },
      budget_total: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      budget_used: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      budget_remaining: Sequelize.DECIMAL(12, 2),
      quote_amount: Sequelize.DECIMAL(12, 2),
      quote_notes: Sequelize.TEXT,
      payment_records: Sequelize.JSON,
      invoice_number: Sequelize.STRING(100),
      invoice_file: Sequelize.STRING(500),
      status: { type: Sequelize.ENUM('quoting', 'quoted', 'paid', 'invoiced'), defaultValue: 'quoting' },
      settlement_template_id: Sequelize.INTEGER,
      settlement_status: { type: Sequelize.ENUM('pending', 'complete', 'rejected'), defaultValue: 'pending' },
      settlement_rejection_reason: Sequelize.TEXT,
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // 20. 归档表
    await queryInterface.createTable('wo_archives', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      work_order_id: { type: Sequelize.INTEGER, unique: true, allowNull: false },
      archive_no: { type: Sequelize.STRING(50), unique: true },
      file_urls: Sequelize.JSON,
      pdf_report_path: Sequelize.STRING(500),
      archive_status: { type: Sequelize.ENUM('archiving', 'archived'), defaultValue: 'archiving' },
      archived_at: Sequelize.DATEONLY,
      archived_by: Sequelize.INTEGER,
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // 21. 售后表
    await queryInterface.createTable('wo_aftersales', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      work_order_id: { type: Sequelize.INTEGER, allowNull: false },
      client_user_id: { type: Sequelize.INTEGER, allowNull: false },
      description: Sequelize.TEXT,
      photos: Sequelize.JSON,
      status: { type: Sequelize.ENUM('pending', 'processing', 'resolved', 'closed'), defaultValue: 'pending' },
      handler_id: Sequelize.INTEGER,
      handler_notes: Sequelize.TEXT,
      handler_photos: Sequelize.JSON,
      rating: Sequelize.INTEGER,
      resolved_at: Sequelize.DATEONLY,
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // ===== 扩展模块 =====

    // 22. 变更日志表
    await queryInterface.createTable('wo_change_logs', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      work_order_id: { type: Sequelize.INTEGER, allowNull: false },
      change_type: {
        type: Sequelize.ENUM('material_change', 'size_change', 'add_item', 'remove_item', 'other'),
        allowNull: false,
      },
      description: Sequelize.TEXT,
      reason: Sequelize.TEXT,
      cost_impact: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      approved_by: Sequelize.STRING(50),
      created_by: Sequelize.INTEGER,
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // 23. 施工日志表
    await queryInterface.createTable('wo_construction_logs', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      work_order_id: { type: Sequelize.INTEGER, allowNull: false },
      log_date: { type: Sequelize.DATEONLY, allowNull: false },
      content: Sequelize.TEXT,
      labor_count: Sequelize.INTEGER,
      labor_hours: Sequelize.DECIMAL(5, 1),
      problem_description: Sequelize.TEXT,
      photos: Sequelize.JSON,
      weather: Sequelize.STRING(20),
      created_by: Sequelize.INTEGER,
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // 24. 生产进度表（无 timestamps、无软删除）
    await queryInterface.createTable('wo_production_progress', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      work_order_id: { type: Sequelize.INTEGER, allowNull: false },
      step_name: { type: Sequelize.STRING(50), allowNull: false },
      progress_pct: { type: Sequelize.INTEGER, defaultValue: 0 },
    })

    // 25. 生产批次表
    await queryInterface.createTable('wo_production_batches', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      batch_no: { type: Sequelize.STRING(50), unique: true, allowNull: false },
      material_type: { type: Sequelize.STRING(50), allowNull: false },
      tenant_id: { type: Sequelize.INTEGER, allowNull: false },
      creator_id: { type: Sequelize.INTEGER, allowNull: false },
      creator_name: Sequelize.STRING(50),
      checklist: { type: Sequelize.JSON, allowNull: false },
      total_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      completed_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      notes: Sequelize.TEXT,
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // 26. 生产导出表
    await queryInterface.createTable('wo_production_exports', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      export_no: { type: Sequelize.STRING(50), unique: true, allowNull: false },
      material_type: { type: Sequelize.STRING(50), allowNull: false },
      tenant_id: { type: Sequelize.INTEGER, allowNull: false },
      creator_id: { type: Sequelize.INTEGER, allowNull: false },
      creator_name: Sequelize.STRING(50),
      work_orders: { type: Sequelize.JSON, allowNull: false },
      count: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // 27. 仓库出入库表
    await queryInterface.createTable('wo_warehouse', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: false },
      work_order_id: Sequelize.INTEGER,
      production_id: Sequelize.INTEGER,
      type: { type: Sequelize.ENUM('inbound', 'outbound'), allowNull: false },
      source: { type: Sequelize.ENUM('production', 'pickup', 'return'), defaultValue: 'production' },
      material_type: Sequelize.STRING(100),
      spec: Sequelize.STRING(200),
      quantity: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      unit: { type: Sequelize.STRING(20), defaultValue: '件' },
      warehouse_location: Sequelize.STRING(100),
      operator_id: Sequelize.INTEGER,
      operator_name: Sequelize.STRING(50),
      constructor_id: Sequelize.INTEGER,
      constructor_name: Sequelize.STRING(100),
      notes: Sequelize.TEXT,
      receipt_no: Sequelize.STRING(50),
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // 28. 表单配置表（无软删除）
    await queryInterface.createTable('form_configs', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: false },
      form_type: { type: Sequelize.STRING(50), allowNull: false },
      field_key: { type: Sequelize.STRING(50), allowNull: false },
      field_label: { type: Sequelize.STRING(50), allowNull: false },
      field_type: { type: Sequelize.STRING(30), allowNull: false },
      required: { type: Sequelize.BOOLEAN, defaultValue: false },
      visible: { type: Sequelize.BOOLEAN, defaultValue: true },
      sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
      default_value: Sequelize.JSON,
      options: Sequelize.JSON,
      placeholder: Sequelize.STRING(200),
      validation_rules: Sequelize.JSON,
      help_text: Sequelize.STRING(500),
      enable_parse: { type: Sequelize.BOOLEAN, defaultValue: true },
      parent_key: Sequelize.STRING(50),
      subform_template: Sequelize.JSON,
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, {
      indexes: [
        { fields: ['tenant_id', 'form_type'] },
        { fields: ['tenant_id', 'form_type', 'field_key'], unique: true },
      ],
    })

    // 29. 通知表
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      user_type: { type: Sequelize.ENUM('tenant', 'client'), allowNull: false },
      title: { type: Sequelize.STRING(200), allowNull: false },
      content: Sequelize.TEXT,
      type: Sequelize.STRING(50),
      work_order_id: Sequelize.INTEGER,
      is_read: { type: Sequelize.BOOLEAN, defaultValue: false },
      read_at: Sequelize.DATE,
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    })

    // ===== 索引 =====

    // 工单表常用查询索引
    await queryInterface.addIndex('work_orders', ['tenant_id'])
    await queryInterface.addIndex('work_orders', ['client_id'])
    await queryInterface.addIndex('work_orders', ['current_stage'])
    await queryInterface.addIndex('work_orders', ['status'])
    await queryInterface.addIndex('work_orders', ['deadline'])

    // 人员表查询索引
    await queryInterface.addIndex('tenant_users', ['tenant_id'])
    await queryInterface.addIndex('client_users', ['client_id'])
    await queryInterface.addIndex('wo_measurements', ['work_order_id'])
    await queryInterface.addIndex('wo_designs', ['work_order_id'])
    await queryInterface.addIndex('wo_productions', ['work_order_id'])
    await queryInterface.addIndex('wo_constructions', ['work_order_id'])
    await queryInterface.addIndex('wo_finance', ['work_order_id'])
    await queryInterface.addIndex('wo_aftersales', ['work_order_id'])
    await queryInterface.addIndex('work_order_logs', ['work_order_id'])
  },

  async down(queryInterface, Sequelize) {
    // 按创建逆序删除（外键依赖关系）
    const tables = [
      'notifications', 'form_configs', 'wo_warehouse', 'wo_production_exports',
      'wo_production_batches', 'wo_production_progress', 'wo_construction_logs',
      'wo_change_logs', 'wo_aftersales', 'wo_archives', 'wo_finance',
      'wo_constructions', 'wo_productions', 'wo_designs', 'wo_measurements',
      'wo_assignments', 'wo_approvals', 'wo_declarations', 'work_order_logs',
      'work_orders', 'client_regions', 'client_users', 'client_departments',
      'tenant_users', 'tenant_regions', 'tenant_departments', 'address_dict',
      'clients', 'tenants',
    ]
    for (const table of tables) {
      await queryInterface.dropTable(table).catch(() => {})
    }
  },
}
