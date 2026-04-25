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
    component: () => import('../components/ClientLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '工作台' }
      },
      {
        path: 'my-declarations',
        name: 'MyDeclarations',
        component: () => import('../views/MyDeclarations.vue'),
        meta: { title: '我的申报' }
      },
      {
        path: 'my-work-orders',
        name: 'MyWorkOrders',
        component: () => import('../views/MyWorkOrders.vue'),
        meta: { title: '我的工单' }
      },
      {
        path: 'my-work-orders/:id',
        name: 'WorkOrderProgress',
        component: () => import('../views/WorkOrderProgress.vue'),
        meta: { title: '工单进度' }
      },
      {
        path: 'new-declaration',
        name: 'NewDeclaration',
        component: () => import('../views/NewDeclaration.vue'),
        meta: { title: '新建申报' }
      },
      {
        path: 'declarations/:id',
        name: 'DeclarationDetail',
        component: () => import('../views/DeclarationDetail.vue'),
        meta: { title: '申报详情' }
      },
      {
        path: 'approvals',
        name: 'Approvals',
        component: () => import('../views/Approvals.vue'),
        meta: { title: '审批中心' }
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('../views/Notifications.vue'),
        meta: { title: '消息通知' }
      },
      {
        path: 'organization',
        name: 'Organization',
        component: () => import('../views/Organization.vue'),
        meta: { title: '组织架构' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../views/Settings.vue'),
        meta: { title: '个人设置' }
      },
      {
        path: 'aftersales',
        name: 'Aftersales',
        component: () => import('../views/Aftersales.vue'),
        meta: { title: '售后服务' }
      },
      {
        path: 'aftersales/new',
        name: 'AftersaleNew',
        component: () => import('../views/AftersaleNew.vue'),
        meta: { title: '新建售后' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory('/client/'),
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
