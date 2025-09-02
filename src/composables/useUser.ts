// src/composables/useUser.ts
import { ref } from "vue";
import { useApi } from "./useApi";
import type { User } from "../types/User";

export function useUser() {
  const { api } = useApi();

  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Obtener perfil
  const fetchProfile = async () => {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.get<User>("/users/me/");
      user.value = data;
    } catch (err: any) {
      error.value = err.response?.data?.detail || "Error al cargar el perfil";
      user.value = null;
    } finally {
      loading.value = false;
    }
  };

  // Actualizar perfil
  const updateProfile = async (payload: {
    full_name?: string | null;
    phone?: string | null;
    company_name?: string | null;
  }) => {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.put<User>("/profile/", payload);
      user.value = data; // sobrescribimos con los nuevos datos
      return data;
    } catch (err: any) {
      error.value = err.response?.data?.detail || "Error al actualizar el perfil";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    user,
    loading,
    error,
    fetchProfile,
    updateProfile,
  };
}
