<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- Header -->
    <header class="bg-gradient-to-b from-[#677CE7] to-[#754EA6] text-white shadow-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <!-- Logo o título -->
        <h1 class="text-lg md:text-xl font-bold">Área Cliente</h1>

        <!-- Botón menú móvil -->
        <button
          class="sm:hidden p-2 rounded-md hover:bg-green-700 transition-colors"
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
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Navegación escritorio -->
        <nav class="hidden sm:flex items-center space-x-4">
          <router-link
            to="/dashboard"
            class="hover:text-yellow-300 transition-colors"
          >
            Mis Diseños
          </router-link>

          <router-link
            v-if="authStore.user?.role === 'admin'"
            to="/admin"
            class="hover:text-yellow-300 transition-colors"
          >
            Ir a Admin
          </router-link>

          <button
            @click="logout"
            class="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-1 px-4 rounded-lg shadow transition-colors"
          >
            Cerrar Sesión
          </button>
        </nav>
      </div>

      <!-- Menú móvil -->
      <div
        v-show="isMenuOpen"
        class="sm:hidden bg-green-700 px-4 py-3 space-y-3"
      >
        <router-link
          to="/dashboard"
          class="block text-white hover:text-yellow-300 transition-colors"
          @click="isMenuOpen = false"
        >
          Mis Diseños
        </router-link>

        <router-link
          v-if="authStore.user?.role === 'admin'"
          to="/admin"
          class="block text-white hover:text-yellow-300 transition-colors"
          @click="isMenuOpen = false"
        >
          Ir a Admin
        </router-link>

        <button
          @click="() => { logout(); isMenuOpen = false; }"
          class="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 rounded-lg shadow transition-colors"
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
import { useAuthStore } from "../store/auth";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();
const isMenuOpen = ref(false);

function logout() {
  authStore.logout();
  router.push("/login");
}
</script>
