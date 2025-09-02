// composables/useNesting.ts
import { ref } from "vue";
import { useApi } from "./useApi";

export interface Nesting {
  id: number;
  costo: number;
  status: string;
  [key: string]: any;
}

export function useNesting() {
  const { api } = useApi();

  const nestings = ref<Nesting[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Listar todos los nestings
  const fetchNestings = async () => {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.get<Nesting[]>("/nestings/");
      nestings.value = data;
    } catch (err: any) {
      error.value = err.response?.data?.detail || "Error al cargar los nestings";
    } finally {
      loading.value = false;
    }
  };

  // Crear un nuevo nesting
  const createNesting = async (payload: { costo: number; [key: string]: any }) => {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.post<Nesting>("/nestings/", payload);
      nestings.value.push(data);
      return data;
    } catch (err: any) {
      error.value = err.response?.data?.detail || "Error al crear el nesting";
    } finally {
      loading.value = false;
    }
  };

  // Aprobar un nesting
  const approveNesting = async (id: number) => {
    error.value = null;
    try {
      const { data } = await api.post(`/nestings/${id}/approve/`);
      await fetchNestings();
      return data;
    } catch (err: any) {
      error.value = err.response?.data?.detail || "Error al aprobar el nesting";
    }
  };

  // Rechazar un nesting
  const rejectNesting = async (id: number) => {
    error.value = null;
    try {
      const { data } = await api.post(`/nestings/${id}/reject/`);
      await fetchNestings();
      return data;
    } catch (err: any) {
      error.value = err.response?.data?.detail || "Error al rechazar el nesting";
    }
  };

  return {
    nestings,
    loading,
    error,
    fetchNestings,
    createNesting,
    approveNesting,
    rejectNesting,
  };
}
