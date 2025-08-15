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
          v-if="!moldePreview"
        >
          Arrastra tu archivo aquí o haz clic para buscar
          <span class="block text-xs text-gray-400 mt-1">Formatos: .svg, .jpg</span>
        </p>
        <img
          v-if="moldePreview"
          :src="moldePreview"
          alt="Vista previa del molde"
          class="object-contain w-64"
        />
        <input
          type="file"
          ref="moldeInput"
          accept=".svg,.jpg,.jpeg"
          class="hidden"
          @change="handleFileSelect"
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

        <!-- Mostrar estado de la fuente -->
        <div v-if="fuenteSubida" class="text-center mb-2 w-full animate-pulse-once">
          <p
            class="text-sm text-green-600 font-medium"
            :style="{ fontFamily: fuenteSubida.nombre }"
          >
            Fuente cargada: {{ fuenteSubida.nombre }}
          </p>
          <p class="text-xs text-gray-500 mt-1">Ejemplo de texto con esta fuente</p>
          <button
            @click.stop="eliminarFuente"
            class="mt-2 text-xs text-red-500 hover:text-red-700"
          >
            Eliminar fuente
          </button>
        </div>
        <div
          v-else
          class="text-sm text-gray-500 text-center mb-2 border-2 border-dashed border-gray-300 p-14 w-full"
        >
          Haz clic para buscar tu archivo de fuente
          <span class="block text-xs text-gray-400 mt-1">Formatos: .ttf, .otf</span>
        </div>

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

    <div class="bg-white rounded-lg shadow p-6 flex flex-col">
      <h2 class="text-xl font-bold mb-4">Vista previa del molde</h2>
      <!-- Campo de nombre -->
      <input
        type="text"
        v-model="moldeActual.nombre"
        v-if="moldeActual.piezas.length > 0"
        placeholder="Nombre del molde completo"
        class="mt-3 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <h3 class="text-lg font-bold mb-4 mt-4" v-if="moldeActual.piezas.length > 0">
        Piezas detectadas
      </h3>

      <!-- Piezas detectadas -->
      <div class="grid grid-cols-2 gap-4" v-if="moldeActual.piezas.length > 0">
        <div
          v-for="(pieza, index) in moldeActual.piezas"
          :key="index"
          class="border rounded-lg p-2 flex flex-col items-center bg-[#725ebc]"
        >
          <img :src="pieza.preview" class="w-full h-24 object-contain mb-2" />
          <input
            v-model="pieza.nombre"
            placeholder="Nombre pieza"
            class="w-full p-1 text-sm border border-[#725EBC] rounded bg-[#F0B100] text-white"
            @change="actualizarNombrePieza(index, $event.target.value)"
          />
        </div>
      </div>

      <div v-if="moldePreview" class="flex-1 flex flex-col">
        <!-- Botones de accion  -->
        <div class="flex gap-2 mt-4">
          <button
            v-if="moldeActual.piezas.length > 0"
            @click="guardarMoldeCompleto"
            class="bg-blue-600 text-white py-2 px-4 rounded-lg"
          >
            Guardar Molde Completo
          </button>
        </div>
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
import type { Fuente, Molde, PiezaMolde } from "../types";

// Estado reactivo
const moldes = ref<Molde[]>([]);
const moldeActual = ref<Molde>({
  nombre: "",
  piezas: [],
  fuente: null,
  fechaCreacion: new Date(),
});
const piezasSeparadas = ref<PiezaMolde[]>([]);
const fuenteSubida = ref<Fuente | null>(null);
const moldePreview = ref<string | null>(null);
const procesando = ref(false);
const moldeInput = ref<HTMLInputElement | null>(null);
const fuenteInput = ref<HTMLInputElement | null>(null);

// Cargar OpenCV al montar el componente
onMounted(async () => {
  await cargarOpenCV();
  await cargarDatosLocales(); // Cargar datos guardados previamente
});

// Cargar la libreria open cv
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

// Cargar de la db
// async function cargarDatosLocales() {
//   try {
//     const moldesGuardados = await dbService.obtenerMoldes();
//     moldes.value = moldesGuardados.map(molde => ({
//       ...molde,
//       piezas: molde.piezas.map(pieza => ({
//         ...pieza,
//         preview: URL.createObjectURL(new Blob([pieza.data], { type: 'image/png' }))
//       }))
//     }));
    
//     fuenteSubida.value = await dbService.obtenerFuente();
//   } catch (error) {
//     console.error("Error cargando datos:", error);
//     moldes.value = [];
//     fuenteSubida.value = null;
//   }
// }

async function cargarDatosLocales() {
  try {
    const moldesGuardados = await dbService.obtenerMoldes();
    
    moldes.value = moldesGuardados.map(molde => ({
      ...molde,
      fechaCreacion: new Date(molde.fechaCreacion),
      piezas: molde.piezas.map(pieza => ({
        ...pieza,
        preview: URL.createObjectURL(new Blob([pieza.data], { type: 'image/png' }))
      })),
      fuente: molde.fuente ? {
        ...molde.fuente,
        // Recrear ArrayBuffer si es necesario
        data: molde.fuente.data instanceof ArrayBuffer ? 
              molde.fuente.data : 
              new Uint8Array(molde.fuente.data).buffer
      } : null
    }));
    
    fuenteSubida.value = await dbService.obtenerFuente();
  } catch (error) {
    console.error("Error cargando datos:", error);
    moldes.value = [];
    fuenteSubida.value = null;
  }
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
  moldeActual.value.piezas = []; // Limpiar piezas anteriores
  piezasSeparadas.value = []; // Limpiar piezas separadas
  separarPiezas();
}

function leerArchivoComoURL(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(file);
  });
}

// Separar de la imagen subida
async function separarPiezas() {
  if (!moldePreview.value) return;

  procesando.value = true;
  piezasSeparadas.value = [];

  try {
    const img = await cargarImagenOpenCV(moldePreview.value);
    const gray = new cv.Mat();
    cv.cvtColor(img, gray, cv.COLOR_RGBA2GRAY);

    // 1. Crear máscara binaria
    const binary = new cv.Mat();
    cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);

    // 2. Encontrar contornos
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(
      binary,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE
    );

    // 3. Procesar cada contorno
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const rect = cv.boundingRect(contour);

      if (rect.width < 50 || rect.height < 50) continue;

      // Crear imagen con transparencia
      const roi = new cv.Mat.zeros(rect.height, rect.width, cv.CV_8UC4);
      const mask = new cv.Mat.zeros(rect.height, rect.width, cv.CV_8UC1);

      // Dibujar el contorno en la máscara
      const offset = new cv.Point(-rect.x, -rect.y);
      cv.drawContours(
        mask,
        contours,
        i,
        new cv.Scalar(255),
        cv.FILLED,
        cv.LINE_8,
        hierarchy,
        0,
        offset
      );

      // Copiar solo la región con la máscara aplicada
      img.roi(rect).copyTo(roi, mask);

      const preview = await convertirMatAURLTransparente(roi);

      piezasSeparadas.value.push({
        nombre: `Pieza ${i + 1}`,
        preview: await convertirMatAURLTransparente(roi),
        data: await convertirMatABlob(roi),
      });

      roi.delete();
      mask.delete();
    }

    // Y también al molde actual
    moldeActual.value.piezas = [...piezasSeparadas.value];

    // Liberar memoria
    img.delete();
    gray.delete();
    binary.delete();
    contours.delete();
    hierarchy.delete();
  } catch (error) {
    console.error("Error al procesar imagen:", error);
    alert("Error al separar piezas");
  } finally {
    procesando.value = false;
  }
}

// Nueva función para imágenes transparentes
function convertirMatAURLTransparente(mat: cv.Mat): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    cv.imshow(canvas, mat);
    canvas.toBlob((blob) => {
      resolve(URL.createObjectURL(blob!));
    }, "image/png"); // PNG soporta transparencia
  });
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

async function convertirMatABlob(mat: cv.Mat): Promise<ArrayBuffer> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    cv.imshow(canvas, mat);
    canvas.toBlob(async (blob) => {
      const arrayBuffer = await blob!.arrayBuffer();
      resolve(arrayBuffer);
    }, "image/png");
  });
}

function actualizarNombrePieza(index: number, nuevoNombre: string) {
  moldeActual.value.piezas[index].nombre = nuevoNombre;
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

// Eliminar fuente

async function eliminarFuente() {
  if (!fuenteSubida.value) return;

  try {
    await dbService.eliminarFuente(fuenteSubida.value.nombre);
    fuenteSubida.value = null;

    // Opcional: Eliminar la fuente del documento
    const fontFaces = Array.from(document.fonts.values());
    const fontToRemove = fontFaces.find((f) => f.family === fuenteSubida.value?.nombre);
    if (fontToRemove) {
      document.fonts.delete(fontToRemove);
    }
  } catch (error) {
    console.error("Error al eliminar la fuente:", error);
    alert("Error al eliminar la fuente");
  }
}

// Guardar
async function guardarMoldeCompleto() {
  if (!moldeActual.value.nombre) {
    alert("Debes ingresar un nombre para el molde");
    return;
  }

  if (moldeActual.value.piezas.length === 0) {
    alert("No hay piezas para guardar");
    return;
  }

  // Asignar la fuente si está disponible
  if (fuenteSubida.value) {
    moldeActual.value.fuente = fuenteSubida.value;
  }

  console.log(moldeActual.value);

  try {
    
    //Copia
    const moldeParaGuardar = {
      nombre: moldeActual.value.nombre,
      piezas: moldeActual.value.piezas.map(pieza => ({
        nombre: pieza.nombre,
        data: pieza.data // ArrayBuffer ya es serializable
      })),
      fuente: fuenteSubida.value ? {
        nombre: fuenteSubida.value.nombre,
        data: fuenteSubida.value.data
      } : null,
      fechaCreacion: new Date()
    };

    console.log("Objeto a guardar:", JSON.parse(JSON.stringify({
      ...moldeParaGuardar,
      piezas: moldeParaGuardar.piezas.map(p => ({
        ...p,
        data: `ArrayBuffer(${p.data.byteLength} bytes)`
      })),
      fuente: moldeParaGuardar.fuente ? {
        ...moldeParaGuardar.fuente,
        data: `ArrayBuffer(${moldeParaGuardar.fuente.data.byteLength} bytes)`
      } : null
    })));

    const id = await dbService.guardarMolde(moldeParaGuardar);
    alert(`Molde "${moldeActual.value.nombre}" guardado correctamente con ID: ${id}`);

    // Resetear el molde actual después de guardar
    moldeActual.value = {
      nombre: "",
      piezas: [],
      fuente: null,
      fechaCreacion: new Date(),
    };
    moldePreview.value = null;

    // Recargar la lista de moldes
    await cargarDatosLocales();
  } catch (error) {
    console.error("Error al guardar el molde:", error);
    alert("Error al guardar el molde");
  }
}
</script>
