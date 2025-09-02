// src/composables/useUsers.ts
import { ref } from "vue";
import { useApi } from "./useApi";
import type { User } from "../types/User";

export function useUsers() {
  const { api } = useApi();

  const users = ref<User[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Listar todos los usuarios
  const fetchUsers = async () => {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.get<User[]>("/admin/users/profile/");
      users.value = data;
    } catch (err: any) {
      error.value = err.response?.data?.detail || "Error al cargar usuarios";
    } finally {
      loading.value = false;
    }
  };

  // Actualizar un usuario
  const updateUser = async (id: string, payload: Partial<User>) => {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.put<User>(`/admin/users/profile/${id}/`, payload);
      // actualizar el listado local si existe
      const index = users.value.findIndex((u) => u.id === id);
      if (index !== -1) users.value[index] = data;
      return data;
    } catch (err: any) {
      error.value = err.response?.data?.detail || "Error al actualizar usuario";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Recargar saldo
  const rechargeBalance = async (id: string, amount: number) => {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.post(`/admin/users/${id}/recharge/`, { amount });
      return data;
    } catch (err: any) {
      error.value = err.response?.data?.detail || "Error al recargar saldo";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Descontar saldo
  const discountBalance = async (id: string, amount: number) => {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.post(`/admin/descontar-saldo/${id}/`, { amount });
      return data;
    } catch (err: any) {
      error.value = err.response?.data?.detail || "Error al descontar saldo";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    users,
    loading,
    error,
    fetchUsers,
    updateUser,
    rechargeBalance,
    discountBalance,
  };
}
