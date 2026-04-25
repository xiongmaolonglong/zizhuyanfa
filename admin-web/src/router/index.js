import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/',
    component: () => import('../components/Layout.vue'),
    redirect: '/dashboard',
    children: [
      // 1. 数据看板
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '数据看板' }
      },
      // 2. 工单看板（合并派单）
      {
        path: 'work-orders',
        name: 'WorkOrders',
        component: () => import('../views/WorkOrders.vue'),
        meta: { title: '工单管理' }
      },
      {
        path: 'work-orders/:id',
        name: 'WorkOrderDetail',
        component: () => import('../views/WorkOrderDetail.vue'),
        meta: { title: '工单详情' }
      },
      // 3. 申报接收
      {
        path: 'declarations',
        name: 'Declarations',
        component: () => import('../views/Declarations.vue'),
        meta: { title: '申报接收' }
      },
      // 4. 设计管理
      {
        path: 'designs',
        name: 'Designs',
        component: () => import('../views/Designs.vue'),
        meta: { title: '设计管理' }
      },
      {
        path: 'designs/:workOrderId',
        name: 'DesignDetail',
        component: () => import('../views/DesignDetail.vue'),
        meta: { title: '设计详情' }
      },
      // 5. 生产管理（合并仓库）
      {
        path: 'production',
        name: 'Production',
        component: () => import('../views/Production.vue'),
        meta: { title: '生产管理' }
      },
      {
        path: 'production/:id',
        name: 'ProductionDetail',
        component: () => import('../views/ProductionDetail.vue'),
        meta: { title: '生产任务详情' }
      },
      {
        path: 'production-view/:materialType',
        name: 'ProductionView',
        component: () => import('../views/ProductionView.vue'),
        meta: { title: '生产清单' }
      },
      // 6. 施工管理
      {
        path: 'construction',
        name: 'Construction',
        component: () => import('../views/Construction.vue'),
        meta: { title: '施工管理' }
      },
      {
        path: 'construction/:workOrderId',
        name: 'ConstructionDetail',
        component: () => import('../views/ConstructionDetail.vue'),
        meta: { title: '施工详情' }
      },
      // 7. 财务中心（费用 + 归档 + 售后）
      {
        path: 'finance',
        name: 'Finance',
        component: () => import('../views/Finance.vue'),
        meta: { title: '财务中心' }
      },
      {
        path: 'archive',
        name: 'Archive',
        component: () => import('../views/Archive.vue'),
        meta: { title: '归档管理' }
      },
      {
        path: 'archive/:workOrderId',
        name: 'ArchiveDetail',
        component: () => import('../views/ArchiveDetail.vue'),
        meta: { title: '归档详情' }
      },
      {
        path: 'aftersale/:id',
        name: 'AftersaleDetail',
        component: () => import('../views/AftersaleDetail.vue'),
        meta: { title: '售后详情' }
      },
      // 7.5 售后管理
      {
        path: 'aftersale',
        name: 'Aftersale',
        component: () => import('../views/Aftersale.vue'),
        meta: { title: '售后管理' }
      },
      // 8. 系统设置（拆分为三个独立页面）
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../views/SettingsOrganization.vue'),
        meta: { title: '组织架构' }
      },
      {
        path: 'settings-config',
        name: 'SettingsConfig',
        component: () => import('../views/SettingsConfig.vue'),
        meta: { title: '系统配置' }
      },
      {
        path: 'audit-logs',
        name: 'AuditLogs',
        component: () => import('../views/AuditLogs.vue'),
        meta: { title: '操作日志' }
      },
      // 9. 客户管理（从 Settings 拆分）
      {
        path: 'clients',
        name: 'Clients',
        component: () => import('../views/Clients.vue'),
        meta: { title: '客户管理' }
      },
      {
        path: 'clients/:id',
        name: 'ClientDetail',
        component: () => import('../views/ClientDetail.vue'),
        meta: { title: '客户详情' }
      },
      // 10. 仓库管理
      {
        path: 'warehouse',
        name: 'Warehouse',
        component: () => import('../views/Warehouse.vue'),
        meta: { title: '仓库管理' }
      },
      // 11. 消息通知
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('../views/Notifications.vue'),
        meta: { title: '消息通知' }
      },
      // 派单（从 CreateDialog 跳转）
      {
        path: 'dispatch',
        name: 'Dispatch',
        component: () => import('../views/WorkOrders.vue'),
        meta: { title: '派单管理' }
      },
      // 审核中心（列表页）
      {
        path: 'audit',
        name: 'AuditCenter',
        component: () => import('../views/AuditCenter.vue'),
        meta: { title: '审核中心' }
      },
      // 审核详情（从工单详情tab进入）
      {
        path: 'audit/:id',
        name: 'AuditDetail',
        component: () => import('../views/AuditDetail.vue'),
        meta: { title: '审核详情' }
      },
      // APP 版本管理
      {
        path: 'app-versions',
        name: 'AppVersions',
        component: () => import('../views/AppVersions.vue'),
        meta: { title: 'APP 版本管理' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (to.path !== '/login' && !auth.isLoggedIn) {
    next('/login')
    return
  }
  // 设计师只能访问设计相关页面
  const designerAllowed = ['Designs', 'DesignDetail']
  if (auth.user?.role === 'designer' && !designerAllowed.includes(to.name)) {
    next('/designs')
    return
  }
  next()
})

export default router
