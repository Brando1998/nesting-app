<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Columna izquierda: Cards de subida -->
    <div class="space-y-6">
      <!-- Card: Subir Moldería -->
      <div
        class="bg-white rounded-lg shadow p-6 flex flex-col items-center cursor-pointer hover:shadow-lg transition"
        @dragover.prevent
        @drop.prevent="handleFileDrop"
        @click="moldeInput?.click()"
      >
        <div
          class="w-16 h-16 bg-blue-100 flex items-center justify-center rounded-full mb-4"
        >
          📐
        </div>
        <h2 class="text-lg font-bold mb-2">Subir Moldería Personalizada</h2>
        <p
          class="text-sm text-gray-500 text-center mb-2 border-2 border-dashed border-gray-300 p-14 w-full"
        >
          Arrastra tu archivo aquí o haz clic para buscar
          <span class="block text-xs text-gray-400 mt-1">Formatos: .svg, .jpg</span>
        </p>
        <input
          type="file"
          ref="moldeInput"
          accept=".svg,.jpg,.jpeg"
          class="hidden"
          @change="handleFileSelect"
        />

        <!-- Campo de nombre -->
        <input
          type="text"
          v-model="nombreMolde"
          placeholder="Nombre del molde"
          class="mt-3 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <!-- Card: Subir Fuente -->
      <div
        class="bg-white rounded-lg shadow p-6 flex flex-col items-center cursor-pointer hover:shadow-lg transition"
        @click="fuenteInput?.click()"
      >
        <div
          class="w-16 h-16 bg-green-100 flex items-center justify-center rounded-full mb-4"
        >
          ✏️
        </div>
        <h3 class="text-lg font-bold mb-2">Subir Fuente Personalizada</h3>
        <p
          class="text-sm text-gray-500 text-center mb-2 border-2 border-dashed border-gray-300 p-14 w-full"
        >
          Haz clic para buscar tu archivo de fuente
          <span class="block text-xs text-gray-400 mt-1">Formatos: .ttf, .otf</span>
        </p>
        <input
          type="file"
          ref="fuenteInput"
          accept=".ttf,.otf"
          class="hidden"
          @change="handleFuenteSelect"
        />
      </div>

      <!-- Piezas detectadas -->
      <div v-if="piezasSeparadas.length > 0" class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-bold mb-4">Piezas detectadas</h3>
        <div class="grid grid-cols-2 gap-4">
          <div
            v-for="(pieza, index) in piezasSeparadas"
            :key="index"
            class="border rounded-lg p-2 flex flex-col items-center"
          >
            <img :src="pieza.preview" class="w-full h-24 object-contain mb-2" />
            <input
              v-model="pieza.nombre"
              placeholder="Nombre pieza"
              class="w-full p-1 text-sm border rounded"
            />
            <button
              @click="guardarPieza(index)"
              class="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Columna derecha: Vista previa -->

    <div class="bg-white rounded-lg shadow p-6 flex flex-col">
      <h2 class="text-xl font-bold mb-4">Vista previa del molde</h2>
      <div v-if="moldePreview" class="flex-1 flex flex-col">
        <div class="border rounded-lg overflow-hidden mb-4 flex-1">
          <img
            :src="moldePreview"
            alt="Vista previa del molde"
            class="object-contain w-full h-full"
          />
        </div>

        <button
          v-if="moldePreview && !procesando"
          @click="separarPiezas"
          class="bg-green-600 text-white py-2 px-4 rounded-lg"
        >
          Separar piezas automáticamente
        </button>
        <div v-if="procesando" class="text-center py-4">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"
          ></div>
          <p class="mt-2">Procesando imagen...</p>
        </div>
      </div>
      <p v-else class="text-gray-500">Aún no has subido ningún molde.</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { dbService } from "../services/database.service";
import type { Fuente } from '../types/Fuente';
import type { Pieza } from '../types/Pieza';



// Estado reactivo
const piezasSeparadas = ref<Pieza[]>([]);
const fuenteSubida = ref<Fuente | null>(null);
const nombreMolde = ref("");
const moldePreview = ref<string | null>(null);
const procesando = ref(false);
const moldeInput = ref<HTMLInputElement | null>(null);
const fuenteInput = ref<HTMLInputElement | null>(null);

// Cargar OpenCV al montar el componente
onMounted(async () => {
  await cargarOpenCV();
  await cargarDatosLocales(); // Cargar datos guardados previamente
});

async function cargarOpenCV() {
  return new Promise<void>((resolve) => {
    if (window.cv) return resolve();

    const script = document.createElement("script");
    script.src = "https://docs.opencv.org/4.5.5/opencv.js";
    script.onload = () => {
      // OpenCV carga asíncronamente, necesitamos esperar
      const checkCV = setInterval(() => {
        if (window.cv) {
          clearInterval(checkCV);
          resolve();
        }
      }, 100);
    };
    document.head.appendChild(script);
  });
}

async function cargarDatosLocales() {
  // Cargar piezas guardadas de IndexedDB
  piezasSeparadas.value = await dbService.obtenerPiezas();
  fuenteSubida.value = await dbService.obtenerFuente();
}

async function handleFileSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) await procesarMolde(file);
}

async function handleFileDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0];
  if (file) await procesarMolde(file);
}

async function procesarMolde(file: File) {
  if (!file.type.startsWith("image/")) {
    alert("Formato no soportado. Usa .jpg, .png o .svg");
    return;
  }

  moldePreview.value = await leerArchivoComoURL(file);
  piezasSeparadas.value = []; // Limpiar piezas anteriores
}

function leerArchivoComoURL(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(file);
  });
}

async function separarPiezas() {
  if (!moldePreview.value) return;

  procesando.value = true;
  piezasSeparadas.value = [];

  try {
    // 1. Cargar la imagen en OpenCV
    const img = await cargarImagenOpenCV(moldePreview.value);

    // 2. Procesamiento básico (ajusta estos parámetros según tus necesidades)
    const gray = new cv.Mat();
    cv.cvtColor(img, gray, cv.COLOR_RGBA2GRAY);

    const binary = new cv.Mat();
    cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);

    // 3. Encontrar contornos
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(
      binary,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE
    );

    // 4. Extraer cada pieza
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const rect = cv.boundingRect(contour);

      // Filtrar contornos muy pequeños (ruido)
      if (rect.width < 50 || rect.height < 50) continue;

      // Extraer ROI (Region of Interest)
      const roi = img.roi(rect);
      const preview = await convertirMatAURL(roi);

      piezasSeparadas.value.push({
        nombre: `Pieza ${i + 1}`,
        preview,
        data: await convertirMatABlob(roi),
      });

      roi.delete();
    }

    // Liberar memoria
    img.delete();
    gray.delete();
    binary.delete();
    contours.delete();
    hierarchy.delete();
  } catch (error) {
    console.error("Error al procesar imagen:", error);
    alert(
      "Ocurrió un error al separar las piezas. Asegúrate que el molde tenga buen contraste."
    );
  } finally {
    procesando.value = false;
  }
}

function cargarImagenOpenCV(src: string): Promise<cv.Mat> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const mat = cv.imread(img);
      resolve(mat);
    };
    img.src = src;
  });
}

function convertirMatAURL(mat: cv.Mat): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    cv.imshow(canvas, mat);
    canvas.toBlob((blob) => {
      resolve(URL.createObjectURL(blob!));
    }, "image/png");
  });
}

function convertirMatABlob(mat: cv.Mat): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    cv.imshow(canvas, mat);
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, "image/png");
  });
}

async function guardarPieza(index: number) {
  await dbService.guardarPieza(piezasSeparadas.value[index]);
  alert("Pieza guardada localmente");
}

async function handleFuenteSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const arrayBuffer = await file.arrayBuffer();
  const fuente = {
    nombre: file.name.replace(/\.[^/.]+$/, ""),
    data: arrayBuffer,
  };

  await dbService.guardarFuente(fuente);
  fuenteSubida.value = fuente;

  // Cargar fuente en el documento
  const fontFace = new FontFace(fuente.nombre, arrayBuffer);
  await fontFace.load();
  document.fonts.add(fontFace);
}
</script>
