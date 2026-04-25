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
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '全局工作台' }
      },
      {
        path: 'tenants',
        name: 'Tenants',
        component: () => import('../views/Tenants.vue'),
        meta: { title: '租户管理' }
      },
      {
        path: 'tenants/:id',
        name: 'TenantDetail',
        component: () => import('../views/TenantDetail.vue'),
        meta: { title: '租户详情' }
      },
      {
        path: 'work-orders',
        name: 'WorkOrders',
        component: () => import('../views/WorkOrders.vue'),
        meta: { title: '工单穿透' }
      },
      {
        path: 'clients',
        name: 'Clients',
        component: () => import('../views/Clients.vue'),
        meta: { title: '甲方监管' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../views/Settings.vue'),
        meta: { title: '系统配置' }
      },
      {
        path: 'system-settings',
        name: 'SystemSettings',
        component: () => import('../views/SystemSettings.vue'),
        meta: { title: '全局系统设置' }
      }
    ]
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
  } else {
    next()
  }
})

export default router
