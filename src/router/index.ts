// router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { useAuthStore } from "../store/auth";
import AdminLayout from "../layouts/AdminLayout.vue";
import ClientLayout from "../layouts/ClientLayout.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "Login",
    component: () => import("../pages/LoginView.vue"),
    meta: { guestOnly: true },
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("../pages/RegisterView.vue"),
    meta: { guestOnly: true },
  },
  {
    path: "/dashboard",
    component: ClientLayout,
    meta: { requiresAuth: true, roles: ["client", "admin"] },
    children: [
      { path: "", name: "Dashboard", component: () => import("../pages/DashboardView.vue") },
      { path: "custom-upload", name: "CustomUpload", component: () => import("../pages/CustomUploadView.vue") },
      { path: "size-measurements", name: "SizeMeasurements", component: () => import("../pages/SizeMeasurementsView.vue") },
      { path: "template-filler", name: "TemplateFiller", component: () => import("../pages/TemplateFillerView.vue") },
    ],
  },
  {
    path: "/admin",
    component: AdminLayout,
    meta: { requiresAuth: true, roles: ["admin"] },
    children: [
      { path: "", name: "AdminPanel", component: () => import("../pages/AdminPanelView.vue") },
    ],
  },
];

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    guestOnly?: boolean;
    roles?: string[];
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, _, next) => {
  const auth = useAuthStore();

  // 🔄 Si hay token pero no user, traer perfil
  if (auth.token && !auth.user) {
    await auth.fetchProfile();
  }

  // 🚫 Bloquea rutas solo para invitados si ya hay sesión
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return next("/dashboard");
  }

  // 🔒 Protege rutas privadas
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next("/login");
  }

  // 👥 Valida roles
  if (to.meta.roles && auth.user) {
    const role = auth.user.is_admin ? "admin" : "client";
    if (!to.meta.roles.includes(role)) {
      return next("/dashboard");
    }
  }

  next();
});

export default router;
