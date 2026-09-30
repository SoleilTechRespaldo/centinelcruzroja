import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useSessionStore } from '@/stores/session'

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
      { path: '', redirect: '/estadisticas' },
      { path: 'estadisticas', name: 'estadisticas', component: () => import('@/features/dashboard/DashboardPage.vue') },
      { path: 'incidents', name: 'incidents', component: () => import('@/features/incidents/IncidentsPage.vue') },
      { path: 'incidents/new', name: 'incident-new', component: () => import('@/features/incidents/NewIncidentPage.vue') },
      { path: 'incidents/:id', name: 'incident-detail', component: () => import('@/features/incidents/IncidentDetailPage.vue') },
      { path: 'bandeja', name: 'bandeja', component: () => import('@/features/indicios/BandejaPage.vue') },
      { path: 'bie', name: 'bie', component: () => import('@/features/bie/GenerateBiePage.vue') },
      { path: 'bie/preview', name: 'bie-preview', component: () => import('@/features/bie/BiePreviewPage.vue') },
      { path: 'expediente', name: 'expediente', component: () => import('@/features/expediente/ExpedientePage.vue') },
      { path: 'map', name: 'map', component: () => import('@/features/map/MapPage.vue') },
      { path: 'cameras', name: 'cameras', component: () => import('@/features/cameras/CamerasPage.vue') },
      { path: 'catalogs', name: 'catalogs', component: () => import('@/features/catalogs/CatalogsPage.vue') },
      { path: 'users', name: 'users', component: () => import('@/features/users/UsersPage.vue') },
      { path: 'states', name: 'states', component: () => import('@/features/misc/StatesPage.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/estadisticas' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// La sesión vive en una cookie HttpOnly: hay que validarla contra /auth/me (async).
// El guard espera ese restore UNA vez, para no decidir antes de saber si hay sesión.
let restored: Promise<void> | null = null
router.beforeEach(async (to) => {
  const session = useSessionStore()
  if (!restored) restored = session.restore()
  await restored
  if (to.path !== '/login' && !session.isAuthenticated) return { path: '/login' }
  if (to.path === '/login' && session.isAuthenticated) return { path: '/estadisticas' }
})

export default router
