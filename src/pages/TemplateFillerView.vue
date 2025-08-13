<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
    <!-- LEFT: selector + controles -->
    <div class="bg-white shadow-lg rounded-lg p-6">
      <h2 class="text-xl font-semibold">Editar piezas</h2>

      <!-- Lista de piezas (cards) -->
      <!-- En tu template (dentro del v-for de piezas) -->
      <div class="flex gap-4 overflow-x-auto no-scrollbar">
        <button
          v-for="p in pieces"
          :key="p.id"
          @click="selectPiece(p.id)"
          class="relative flex-shrink-0 w-40 cursor-pointer transition-colors"
          :class="
            selectedPiece === p.id
              ? 'bg-indigo-50 border-l-4 border-indigo-600'
              : 'bg-gray-50 border-l-4 border-transparent'
          "
        >
          <!-- Indicador de guardado (aparece si hay datos) -->
          <div
            v-if="isPieceSaved(p.id)"
            class="absolute top-1 right-1 bg-green-500 text-white rounded-full p-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <img :src="p.preview" class="w-full h-24 object-contain bg-white" />
          <div class="p-2 text-center text-sm font-medium">{{ p.name }}</div>
        </button>
      </div>

      <!-- Controles para la pieza seleccionada -->
      <div v-if="selectedPiece" class="space-y-4">
        <h3 class="text-lg font-semibold">Ajustes — {{ currentPiece?.name }}</h3>

        <label class="block text-sm font-medium">Subir diseño para la pieza</label>
        <input type="file" accept="image/*" @change="uploadDesign" class="block w-full" />

        <div class="grid grid-cols-1 gap-2">
          <label class="block font-medium">Nombre</label>
          <input
            v-model="settings.name"
            type="text"
            class="w-full p-2 border rounded-md"
            placeholder="Ej: Rodríguez"
          />
        </div>

        <div class="grid grid-cols-1 gap-2">
          <label class="block font-medium">Número</label>
          <input
            v-model="settings.number"
            type="text"
            class="w-full p-2 border rounded-md"
            placeholder="Ej: 10"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-medium">Fuente</label>
            <select v-model="settings.font" class="w-full p-2 border rounded-md">
              <option v-for="f in fonts" :key="f" :value="f">{{ f }}</option>
            </select>
          </div>

          <div>
            <label class="block font-medium">Tamaño (px)</label>
            <input
              v-model.number="settings.fontSize"
              type="number"
              min="8"
              max="300"
              class="w-full p-2 border rounded-md"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-medium">Color</label>
            <input
              type="color"
              v-model="settings.color"
              class="w-full h-10 p-0 border rounded-md"
            />
          </div>
          <div>
            <label class="block font-medium">Opacidad</label>
            <input
              type="range"
              v-model.number="settings.opacity"
              min="0"
              max="1"
              step="0.05"
              class="w-full"
            />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block font-medium">X (px)</label>
            <input
              v-model.number="settings.x"
              type="number"
              class="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label class="block font-medium">Y (px)</label>
            <input
              v-model.number="settings.y"
              type="number"
              class="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label class="block font-medium">Rotación</label>
            <input
              v-model.number="settings.rotate"
              type="number"
              class="w-full p-2 border rounded-md"
            />
          </div>
        </div>

        <div class="flex gap-3">
          <button
            @click="savePiece"
            class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
          >
            Guardar pieza
          </button>
          <button
            @click="resetPiece"
            class="flex-1 bg-gray-200 hover:bg-gray-300 text-black py-2 rounded-lg"
          >
            Reset
          </button>
        </div>
        <!-- Dentro del div izquierdo (después de los controles) -->
        <div class="mt-6 pt-4 border-t">
          <button
            @click="saveAllPieces"
            class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
            :disabled="!hasSavedPieces"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z"
              />
            </svg>
            Guardar plantilla completa
          </button>
          <p v-if="!hasSavedPieces" class="text-sm text-gray-500 mt-2 text-center">
            Personaliza al menos una pieza para habilitar
          </p>
        </div>
      </div>

      <div v-else class="text-gray-500 italic">Selecciona una pieza para editarla.</div>
    </div>

    <!-- RIGHT: vista grande de la pieza seleccionada con overlay (drag) -->
    <div
      class="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center justify-center"
    >
      <h2 class="text-xl font-semibold mb-4 text-center">Previsualización</h2>

      <div v-if="selectedPiece" class="relative w-full max-w-2xl">
        <!-- Contenedor responsivo de la imagen -->
        <div
          ref="previewContainer"
          class="relative bg-gray-50 border rounded overflow-hidden"
          style="min-height: 300px; height: 60vh"
        >
          <img
            :src="currentPreview"
            alt="piece preview"
            class="w-full h-full object-contain"
            @load="uploadDesign"
          />

          <!-- OVERLAY: nombre -->
          <div
            v-if="settings.name"
            class="absolute cursor-move select-none"
            :style="nameStyle"
            @pointerdown.prevent="startDrag($event, 'name')"
          >
            <span :style="textCss">{{ settings.name }}</span>
          </div>

          <!-- OVERLAY: número -->
          <div
            v-if="settings.number"
            class="absolute cursor-move select-none"
            :style="numberStyle"
            @pointerdown.prevent="startDrag($event, 'number')"
          >
            <span :style="textCssNumber">{{ settings.number }}</span>
          </div>
        </div>

        <!-- Small hint -->
        <p class="text-sm text-gray-500 mt-2">
          Arrastra el nombre o número directamente sobre la pieza para reposicionarlos.
        </p>
      </div>

      <div v-else class="text-gray-500 italic">
        Selecciona una pieza para ver la previsualización.
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onBeforeUnmount } from "vue";

/* ----- datos de ejemplo ----- */
const pieces = reactive([
  { id: "manga_der", name: "Manga Derecha", preview: "/pieces/manga_der.png" },
  { id: "manga_izq", name: "Manga Izquierda", preview: "/pieces/manga_izq.png" },
  { id: "frente", name: "Frente Camiseta", preview: "/pieces/frente.png" },
  { id: "espalda", name: "Espalda Camiseta", preview: "/pieces/espalda.png" },
  {
    id: "pantaloneta_izq",
    name: "Pantaloneta Izquierda",
    preview: "/pieces/pantaloneta_izq.png",
  },
  {
    id: "pantaloneta_der",
    name: "Pantaloneta Derecha",
    preview: "/pieces/pantaloneta_der.png",
  },
  { id: "cuello", name: "Cuello", preview: "/pieces/cuello.png" },
]);

const fonts = ["Arial", "Roboto", "Montserrat", "CustomFont1"];

/* ----- estado ----- */
const selectedPiece = ref<string | null>(null);

/* settings por pieza (persistente durante la sesión) */
const pieceSettings = reactive<
  Record<
    string,
    {
      name: string;
      number: string;
      font: string;
      fontSize: number;
      color: string;
      opacity: number;
      x: number;
      y: number;
      rotate: number;
    }
  >
>({});

for (const p of pieces) {
  pieceSettings[p.id] = {
    name: "",
    number: "",
    font: fonts[0],
    fontSize: 48,
    color: "#000000",
    opacity: 1,
    x: 20,
    y: 20,
    rotate: 0,
  };
}

const currentPiece = computed(() => {
  if (!selectedPiece.value) return null;
  return pieces.find((p) => p.id === selectedPiece.value) || null;
});

/* accesos rápidos a settings de la pieza seleccionada */
const settings = computed(() => {
  if (!selectedPiece.value) return pieceSettings[pieces[0].id];
  return pieceSettings[selectedPiece.value];
});

/* preview de la pieza seleccionada (por defecto la imagen de ejemplo) */
const currentPreview = computed(() => {
  if (!selectedPiece.value) return "";
  const p = pieces.find((x) => x.id === selectedPiece.value);
  return p?.preview ?? "";
});

/* referencia al contenedor para calcular límites al arrastrar */
const previewContainer = ref<HTMLElement | null>(null);

/* Marcar pieza como editada */
const isPieceSaved = (id: string) => {
  const settings = pieceSettings[id];
  return settings.name.trim() !== "" || settings.number.trim() !== "";
};

/* Drag logic */
let dragging = false;
let dragTarget: "name" | "number" | null = null;
let startPointer = { x: 0, y: 0 };
let startPos = { x: 0, y: 0 };

function startDrag(e: PointerEvent, target: "name" | "number") {
  dragging = true;
  dragTarget = target;
  (e.target as Element).setPointerCapture(e.pointerId);
  startPointer = { x: e.clientX, y: e.clientY };
  startPos = { x: settings.value.x, y: settings.value.y };
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", stopDrag);
}

function onPointerMove(e: PointerEvent) {
  if (!dragging || !dragTarget) return;
  const dx = e.clientX - startPointer.x;
  const dy = e.clientY - startPointer.y;

  // actualizar posición relativa (en px)
  if (dragTarget === "name") {
    settings.value.x = Math.max(0, Math.round(startPos.x + dx));
    settings.value.y = Math.max(0, Math.round(startPos.y + dy));
  } else {
    // si se arrastra el número, lo desplazamos un poco a la derecha por defecto
    settings.value.x = Math.max(0, Math.round(startPos.x + dx));
    settings.value.y = Math.max(0, Math.round(startPos.y + dy));
  }
}

// function stopDrag(e?: PointerEvent) {
function stopDrag() {
  dragging = false;
  dragTarget = null;
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", stopDrag);
}

/* upload: reemplaza preview de la pieza seleccionada */
function uploadDesign(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file || !selectedPiece.value) return;
  // revoke previous objectURL if set
  const p = pieces.find((x) => x.id === selectedPiece.value);
  if (!p) return;
  try {
    // crear URL temporal para previsualizar
    const url = URL.createObjectURL(file);
    // si p.preview era generado anteriormente por createObjectURL, no intentamos revocar aquí por simplicidad
    p.preview = url;
  } catch (err) {
    console.error(err);
  }
}

/* seleccionar pieza */
function selectPiece(id: string) {
  selectedPiece.value = id;
}

/* guardar settings (aquí puedes enviar a backend) */
function savePiece() {
  if (!selectedPiece.value) {
    alert("Selecciona una pieza primero");
    return;
  }
  // ejemplo: enviar pieceSettings[selectedPiece] al backend
  console.log(
    "Guardando settings:",
    selectedPiece.value,
    pieceSettings[selectedPiece.value]
  );
  alert("Configuración guardada para " + selectedPiece.value);
}

/* reset a valores por default para la pieza */
function resetPiece() {
  if (!selectedPiece.value) return;
  pieceSettings[selectedPiece.value] = {
    name: "",
    number: "",
    font: fonts[0],
    fontSize: 48,
    color: "#000000",
    opacity: 1,
    x: 20,
    y: 20,
    rotate: 0,
  };
}

// Computed para verificar si hay piezas guardadas
const hasSavedPieces = computed(() => {
  return pieces.some((p) => isPieceSaved(p.id));
});

// Función para guardar todas las piezas
const saveAllPieces = () => {
  const template = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    pieces: {} as Record<string, any>,
  };

  pieces.forEach((p) => {
    if (isPieceSaved(p.id)) {
      template.pieces[p.id] = { ...pieceSettings[p.id] };
    }
  });

  // Aquí puedes:
  // 1. Guardar en localStorage (ejemplo rápido)
  localStorage.setItem("uniformTemplate", JSON.stringify(template));

  // 2. Enviar a tu backend
  // await api.saveTemplate(template);

  alert(`Plantilla guardada con ${Object.keys(template.pieces).length} piezas`);
  console.log("Plantilla:", template);
};

/* estilos en línea para overlays */
const nameStyle = computed(() => {
  const s = settings.value;
  return {
    left: `${s.x}px`,
    top: `${s.y}px`,
    transform: `translate(-50%, -50%) rotate(${s.rotate}deg)`,
    pointerEvents: "auto",
  } as Record<string, string>;
});

const numberStyle = computed(() => {
  const s = settings.value;
  // number sits slightly right by default; can be dragged independently
  return {
    left: `${s.x + 60}px`,
    top: `${s.y}px`,
    transform: `translate(-50%, -50%) rotate(${s.rotate}deg)`,
    pointerEvents: "auto",
  } as Record<string, string>;
});

const textCss = computed(() => {
  const s = settings.value;
  return {
    fontFamily: s.font,
    fontSize: `${s.fontSize}px`,
    color: s.color,
    opacity: `${s.opacity}`,
    fontWeight: "600",
    textShadow: "0 1px 2px rgba(0,0,0,0.25)",
    whiteSpace: "pre",
  } as Record<string, string>;
});

const textCssNumber = computed(() => {
  const s = settings.value;
  return {
    fontFamily: s.font,
    fontSize: `${Math.round(s.fontSize * 1.2)}px`,
    color: s.color,
    opacity: `${s.opacity}`,
    fontWeight: "800",
    textShadow: "0 1px 2px rgba(0,0,0,0.25)",
    whiteSpace: "pre",
  } as Record<string, string>;
});

/* limpiar listeners en desmontado */
onBeforeUnmount(() => {
  stopDrag();
});
</script>
