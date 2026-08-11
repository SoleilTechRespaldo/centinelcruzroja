import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [{ path: '', name: 'login', component: () => import('@/features/auth/LoginPage.vue') }],
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'dashboard', component: () => import('@/features/dashboard/DashboardPage.vue') },
      { path: 'incidents', name: 'incidents', component: () => import('@/features/incidents/IncidentsPage.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
