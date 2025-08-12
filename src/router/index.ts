import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../store/auth';
import AdminLayout from '../layouts/AdminLayout.vue';
import ClientLayout from '../layouts/ClientLayout.vue';
import 'vue-router';

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'Login', component: () => import('../pages/LoginView.vue') },
  { path: '/register', name: 'Register', component: () => import('../pages/RegisterView.vue') },

  {
    path: '/dashboard',
    component: ClientLayout,
    meta: { requiresAuth: true, roles: ['client', 'admin'] },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../pages/DashboardView.vue')
      },
      {
        path: 'custom-upload',
        name: 'CustomUpload',
        component: () => import('../pages/CustomUploadView.vue')
      },
      {
        path: 'size-measurements',
        name: 'SizeMeasurements',
        component: ()=> import('../pages/SizeMeasurementsView.vue')
      }
    ]
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      {
        path: '',
        name: 'AdminPanel',
        component: () => import('../pages/AdminPanelView.vue')
      }
    ]
  }
];

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    roles?: string[];
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, _, next) => {
  const authStore = useAuthStore();
  if (!authStore.isAuthenticated) {
    authStore.loadUserFromStorage();
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login');
  }

  if (to.meta.roles && authStore.user && !to.meta.roles.includes(authStore.user.role)) {
    return next('/dashboard');
  }

  next();
});

export default router;
