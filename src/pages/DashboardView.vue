<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";
import mercadopagoIcon from "../assets/icons/mercadopago.svg";
import { useUser } from "../composables/useUser";
import { useRecharge } from "../composables/useRecharge";
import { dbService } from "../services/database.service";
import type { Molde } from "../types/Molde";

const { user, loading, error, fetchProfile, updateProfile } = useUser();
const cliente = computed(() => ({
  empresa: user.value?.company_name || "",
  altoMax: 50, // por ahora fijo, hasta que lo manejes en el back
  anchoMax: 70,
  saldo: user.value ? Number(user.value.balance) : 0,
}));
const proyectos = ref<Molde[]>([]);
const creditos = computed(() => {
  return user.value ? Math.floor(Number(user.value.balance) / 1000) : 0;
});

async function cargarProyectos() {
  proyectos.value = await dbService.obtenerMoldes();
}

function recargarCuenta() {
  alert("Redirigiendo a MercadoPago...");
}

onMounted(async () => {
  await fetchProfile();
  await cargarProyectos();
});
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Columna izquierda: Información del cliente -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold mb-6">Perfil de usuario</h2>

      <!-- Formulario de información -->
      <form class="space-y-4 text-lg text-gray-700">
        <div>
          <label class="block font-semibold mb-1">Empresa</label>
          <input
            v-model="cliente.empresa"
            type="text"
            class="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block font-semibold mb-1">Alto máximo hoja (cm)</label>
            <input
              v-model.number="cliente.altoMax"
              type="number"
              class="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label class="block font-semibold mb-1">Ancho máximo hoja (cm)</label>
            <input
              v-model.number="cliente.anchoMax"
              type="number"
              class="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
            />
          </div>
        </div>
        <div>
          <label class="block font-semibold mb-1">Saldo disponible</label>
          <input
            v-model.number="cliente.saldo"
            type="number"
            class="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
          />
        </div>
      </form>

      <hr class="my-6" />

      <!-- Proyectos recientes -->
      <h3 class="text-xl font-semibold mb-4">Proyectos recientes</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          v-for="proyecto in proyectos"
          :key="proyecto.id"
          class="bg-gray-100 flex flex-col items-start p-3 rounded-lg hover:bg-gray-200"
        >
          <span class="font-semibold text-lg">
            {{ proyecto.nombre }}
          </span>
          <span class="text-gray-500 text-sm mt-1">
            Fecha: {{ new Date(proyecto.fechaCreacion).toLocaleDateString() }}
          </span>
        </button>
      </div>
    </div>

    <!-- Columna derecha: Créditos -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold mb-6">Créditos de la Cuenta</h2>

      <div class="mb-6 text-lg">
        <p class="text-gray-700 mb-2">
          <strong>Créditos actuales:</strong> {{ creditos }} créditos
        </p>
        <p class="text-gray-500 text-sm">Cada molde requiere créditos según su tamaño.</p>
      </div>

      <hr class="my-6" />

      <h3 class="text-xl font-semibold mb-4">Recargar Cuenta</h3>
      <p class="text-gray-600 mb-6">Puedes recargar tu cuenta usando MercadoPago.</p>

      <button
        @click="recargarCuenta"
        class="bg-[#00BCFF] hover:bg-[#3483FA] text-white text-lg font-semibold px-6 py-3 rounded-lg shadow transition-colors flex items-center gap-3"
        loading="lazy"
      >
        <img :src="mercadopagoIcon" alt="MercadoPago" class="w-10 h-10" />
        Recargar con MercadoPago
      </button>
    </div>
  </div>
</template>
