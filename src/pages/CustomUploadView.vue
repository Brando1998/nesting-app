<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Columna izquierda: Subida de archivos -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-bold mb-4">Subir Moldería Personalizada</h2>

      <!-- Área de arrastre -->
      <div
        class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition"
        @dragover.prevent
        @drop.prevent="handleFileDrop"
        @click="$refs.moldeInput.click()"
      >
        <p class="text-gray-500 mb-2">Arrastra tu archivo aquí o haz clic para buscar</p>
        <p class="text-xs text-gray-400">Formatos permitidos: .svg, .jpg</p>
        <input
          type="file"
          ref="moldeInput"
          accept=".svg,.jpg,.jpeg"
          class="hidden"
          @change="handleFileSelect"
        />
      </div>

      <!-- Campo de nombre -->
      <div class="mt-4">
        <label class="block text-sm font-medium text-gray-700">Nombre del molde</label>
        <input
          type="text"
          v-model="nombreMolde"
          placeholder="Ej: Barcelona FC"
          class="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <hr class="my-6" />

      <!-- Subida de fuente -->
      <h3 class="text-lg font-semibold mb-2">Subir Fuente Personalizada</h3>
      <div
        class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition"
        @click="$refs.fuenteInput.click()"
      >
        <p class="text-gray-500 mb-2">Haz clic para buscar tu archivo de fuente</p>
        <p class="text-xs text-gray-400">Formatos permitidos: .ttf, .otf</p>
        <input
          type="file"
          ref="fuenteInput"
          accept=".ttf,.otf"
          class="hidden"
          @change="handleFuenteSelect"
        />
      </div>
    </div>

    <!-- Columna derecha: Vista previa -->
    <div class="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center">
      <h2 class="text-xl font-bold mb-4">Vista previa del molde</h2>

      <div
        v-if="moldePreview"
        class="border rounded-lg overflow-hidden max-w-full max-h-[400px]"
      >
        <img
          :src="moldePreview"
          alt="Vista previa del molde"
          class="object-contain w-full h-full"
        />
      </div>

      <p v-else class="text-gray-500">Aún no has subido ningún molde.</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";

const nombreMolde = ref("");
const moldePreview = ref<string | null>(null);

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    createPreview(file);
  }
}

function handleFileDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    createPreview(file);
  }
}

function createPreview(file: File) {
  if (file.type.startsWith("image/") || file.name.endsWith(".svg")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      moldePreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  } else {
    alert("Formato no soportado. Usa .svg o .jpg");
  }
}

function handleFuenteSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    alert(`Fuente subida: ${file.name}`);
    // Aquí podrías guardar el archivo en el backend
  }
}
</script>
