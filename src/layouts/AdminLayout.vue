<template>
  <div class="min-h-screen flex flex-col bg-gray-100">
    <!-- Header -->
    <header class="bg-gray-900 text-white shadow-md">
      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16"
      >
        <!-- Logo o título -->
        <h1 class="text-lg md:text-xl font-bold">Panel Administrador</h1>

        <!-- Botón menú móvil -->
        <button
          class="sm:hidden p-2 rounded-md hover:bg-gray-800 transition-colors"
          @click="isMenuOpen = !isMenuOpen"
        >
          <svg
            v-if="!isMenuOpen"
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <!-- Navegación escritorio -->
        <nav class="hidden sm:flex items-center space-x-4">
          <router-link
            to="/admin"
            class="hover:text-red-400 transition-colors"
          >
            Dashboard Admin
          </router-link>

          <router-link
            to="/dashboard"
            class="hover:text-red-400 transition-colors"
          >
            Vista Cliente
          </router-link>

          <button
            @click="logout"
            class="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-4 rounded-lg shadow transition-colors"
          >
            Cerrar Sesión
          </button>
        </nav>
      </div>

      <!-- Menú móvil -->
      <div
        v-show="isMenuOpen"
        class="sm:hidden bg-gray-800 px-4 py-3 space-y-3"
      >
        <router-link
          to="/admin"
          class="block text-white hover:text-red-400 transition-colors"
          @click="isMenuOpen = false"
        >
          Dashboard Admin
        </router-link>

        <router-link
          to="/dashboard"
          class="block text-white hover:text-red-400 transition-colors"
          @click="isMenuOpen = false"
        >
          Vista Cliente
        </router-link>

        <button
          @click="() => { logout(); isMenuOpen = false; }"
          class="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg shadow transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1 max-w-7xl mx-auto p-6 w-full">
      <router-view />
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const isMenuOpen = ref(false);

function logout() {
  router.push("/login");
}
</script>
