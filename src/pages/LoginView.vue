<script lang="ts" setup>
import { ref } from "vue";
import { useAuth } from "../composables/useAuth";
import { useRouter } from "vue-router";
import loginBg from "../assets/login-bg.avif";

const { login, error, loading } = useAuth();
const router = useRouter();

const email = ref("");
const password = ref("");

async function handleLogin() {
  const success = await login(email.value, password.value);
  if (success) {
    router.push("/dashboard");
  }
}
</script>

<template>
  <div
    class="flex flex-col md:flex-row h-screen bg-cover bg-center"
    :style="{ backgroundImage: `url(${loginBg})` }"
  >
    <!-- Columna izquierda -->
    <div class="flex-1 flex items-center justify-center text-white p-8">
      <div class="max-w-md space-y-6">
        <h1 class="text-4xl md:text-5xl font-extrabold leading-tight drop-shadow-lg">
          La manera más fácil<br />
          de realizar tus montajes<br />
          para impresión.
        </h1>
        <button
          class="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-8 rounded-full shadow-md transition-colors"
        >
          Saber más
        </button>
      </div>
    </div>

    <!-- Columna derecha -->
    <div class="flex-1 flex items-center justify-center p-6 bg-black/50">
      <div class="w-full max-w-sm">
        <h2 class="text-yellow-400 font-bold text-3xl mb-6 text-center">
          Iniciar Sesión
        </h2>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <input
            v-model="email"
            type="email"
            placeholder="Email"
            required
            class="w-full p-3 rounded-lg border border-gray-200 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <input
            v-model="password"
            type="password"
            placeholder="Contraseña"
            required
            class="w-full p-3 rounded-lg border border-gray-200 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />

          <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>

          <button
            type="submit"
            class="w-full bg-gradient-to-r from-[#677CE7] to-[#754EA6] hover:from-[#5b6ed0] hover:to-[#684293] text-white font-semibold py-3 rounded-lg shadow-md transition-all duration-300"
            :disabled="loading"
          >
            <span v-if="loading">Ingresando...</span>
            <span v-else>Ingresar</span>
          </button>

          <p class="text-sm text-center text-gray-300">
            ¿No tienes cuenta?
            <a href="/register" class="font-semibold text-white hover:underline">
              Regístrate
            </a>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>
