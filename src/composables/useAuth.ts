// src/composables/useAuth.ts
import { ref } from "vue";
import { useApi } from "./useApi";
import { useAuthStore } from "../store/auth";
import type { User } from "../types/User";

const loading = ref(false);
const error = ref<string | null>(null);

export function useAuth() {
  const { api } = useApi();
  const auth = useAuthStore();

  async function login(email: string, password: string) {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.post<{ access: string }>("/auth/login/", {
        email,
        password,
      });
      auth.setToken(data.access);
      await auth.fetchProfile();
      return true;
    } catch (err: any) {
      error.value = err.response?.data?.detail || "Error en login";
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function register({ email, password, full_name }: User) {
    loading.value = true;
    error.value = null;
    try {
      await api.post("/auth/register/", { full_name, email, password });
      return true;
    } catch (err: any) {
      error.value = err.response?.data || "Error en registro";
      return false;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    auth.logout();
  }

  return {
    user: auth.user,       // 🔑 ya viene del store
    loading,
    error,
    login,
    register,
    fetchProfile: auth.fetchProfile,
    logout,
  };
}
