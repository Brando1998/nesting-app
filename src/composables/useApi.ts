// src/composables/useApi.ts
import axios, { type AxiosInstance } from "axios";
import { ref } from "vue";
import { useAuthStore } from "../store/auth";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/";

const api: AxiosInstance = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Interceptor de request: agrega token
api.interceptors.request.use((config) => {
  const auth = useAuthStore();
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

// ❌ Interceptor de response: detecta token inválido
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const auth = useAuthStore();

    if (error.response?.status === 401) {
      // El backend dice que el token es inválido o expiró
      auth.logout();
      auth.user = null;
    }

    return Promise.reject(error);
  }
);

/**
 * 🔹 Hook genérico para manejar llamadas API con estados
 */
function useApiRequest<T = any>() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const data = ref<T | null>(null);

  const request = async (fn: () => Promise<any>) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await fn();
      data.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.detail || err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    data,
    request,
  };
}

export function useApi() {
  return {
    api,
    useApiRequest,
  };
}
