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
          class="bg-gray-100 hover:bg-blue-100 rounded-lg shadow p-4 text-left flex flex-col items-start transition"
        >
          <span class="font-semibold text-lg">{{ proyecto.nombre }}</span>
          <span class="text-gray-500 text-sm mt-1">Fecha: {{ proyecto.fecha }}</span>
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
      >
        <img :src="mercadopagoIcon" alt="MercadoPago" class="w-6 h-6" />
        Recargar con MercadoPago
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import mercadopagoIcon from "../assets/icons/mercadopago.svg";

const cliente = ref({
  empresa: "Mi Empresa S.A.S.",
  altoMax: 50,
  anchoMax: 70,
  saldo: 125000,
});

const proyectos = ref([
  { id: 1, nombre: "Molde Caja", fecha: "2025-08-01" },
  { id: 2, nombre: "Molde Etiqueta", fecha: "2025-08-05" },
  { id: 3, nombre: "Molde Bolsa", fecha: "2025-08-09" },
]);

const creditos = ref(45);

function recargarCuenta() {
  alert("Redirigiendo a MercadoPago...");
}
</script>
