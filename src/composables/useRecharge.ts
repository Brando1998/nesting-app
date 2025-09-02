// src/composables/useRecharge.ts
import { ref } from "vue";
import { useApi } from "./useApi";

export interface RechargePreference {
  id: string;
  [key: string]: any;
}

export function useRecharge() {
  const { api } = useApi();

  const loading = ref(false);
  const error = ref<string | null>(null);
  const preference = ref<RechargePreference | null>(null);

  const createRecharge = async (amount: number) => {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.post<RechargePreference>("/recharges/", { amount });
      preference.value = data;
      return data;
    } catch (err: any) {
      error.value = err.response?.data?.detail || "Error al crear la recarga";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    preference,
    createRecharge,
  };
}
