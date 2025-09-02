<template>
  <div class="grid grid-rows-[auto_auto_1fr] gap-6 p-6">
    <!-- 🔹 Moldes disponibles - Primera fila, ancho completo -->
    <section class="bg-white shadow-lg rounded-lg p-6">
      <h2 class="text-xl font-semibold mb-4">Moldes Disponibles</h2>
      <ul class="space-y-2 max-h-[400px] overflow-auto">
        <li
          v-for="m in moldes"
          :key="m.id"
          @click="() => selectMolde(m.id!)"
          class="cursor-pointer p-3 rounded-md transition"
          :class="{
            'bg-indigo-50 border-l-4 border-indigo-600': selectedMolde?.id === m.id,
            'bg-gray-50 border-l-4 border-transparent': selectedMolde?.id !== m.id,
          }"
        >
          {{ m.nombre }} — {{ new Date(m.fechaCreacion).toLocaleDateString() }}
        </li>
      </ul>
    </section>

    <!-- 🔹 Previsualización - Segunda fila, ancho completo -->
    <section class="bg-white shadow-lg rounded-lg p-6">
      <h2 class="text-xl font-semibold mb-4">Previsualización</h2>
      <div class="flex justify-center">
        <span class="text-gray-500" v-if="selectedPiece">{{ selectedPiece }}</span>
      </div>

      <div class="flex justify-center mt-4">
        <PreviewCanvas
          v-if="selectedPiece"
          :piece="pieceSelected"
          :overlay="overlaySelected"
          v-model:overlay="overlay"
          :texts="textsSelected"
          :customFuente="selectedMolde?.fuente"
          @update:piece="pieceSelected = $event"
          @update:overlay="overlaySelected = $event"
          @update:texts="textsSelected = $event"
        />
      </div>
    </section>

    <!-- 🔹 Piezas y edición - Tercera fila, ancho completo -->
    <section class="bg-white shadow-lg rounded-lg p-6">
      <h2 class="text-xl font-semibold mb-4">Piezas del Molde</h2>

      <div v-if="selectedMolde">
        <!-- Resumen de estado del molde -->
        <div
          v-if="getUnsavedPieces().length > 0"
          class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div class="flex items-center justify-between">
            <div class="text-sm text-yellow-800">
              <span class="font-semibold">{{ getUnsavedPieces().length }}</span> pieza(s)
              con cambios sin guardar
            </div>
            <button
              @click="guardarTodasLasPiezas"
              class="px-3 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors"
            >
              Guardar Todo
            </button>
          </div>
        </div>

        <!-- Lista de piezas -->
        <div class="flex gap-4 overflow-x-auto no-scrollbar mb-6">
          <button
            v-for="p in piezas"
            :key="p.nombre"
            @click="() => selectPiece(p.nombre)"
            class="relative flex-shrink-0 w-40 cursor-pointer transition-colors bg-gray-50 border-l-4"
            :class="
              selectedPiece === p.nombre
                ? 'bg-indigo-50 border-indigo-600'
                : 'border-transparent'
            "
          >
            <!-- Indicador de estado -->
            <div class="absolute top-2 right-2 z-10">
              <div
                v-if="getPieceStatus(p.nombre) === 'saved'"
                class="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                title="Diseño guardado"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
              </div>
              <div
                v-else-if="getPieceStatus(p.nombre) === 'modified'"
                class="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse"
                title="Cambios sin guardar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="white"
                  stroke="white"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
              </div>
              <div
                v-else
                class="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center"
                title="Sin modificar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </div>
            </div>

            <img
              :src="arrayBufferToBlobUrl(p.data, 'image/png')"
              class="w-full h-24 object-contain bg-gray-300"
            />
            <div class="p-2 text-center text-sm font-medium">{{ p.nombre }}</div>
          </button>
        </div>

        <!-- Panel de edición -->
        <div v-if="selectedPiece">
          <h3 class="text-lg font-semibold mb-4">Editar — {{ selectedPiece }}</h3>

          <!-- Fondo -->
          <div class="mb-4">
            <label class="block font-medium mb-1">Subir fondo</label>
            <input
              type="file"
              accept="image/*"
              @change="uploadBackground"
              class="block w-full"
            />
          </div>

          <!-- Acciones -->
          <!-- Reemplaza la sección de "Acciones" en tu template -->
          <div class="flex gap-3 flex-wrap">
            <!-- Botón principal: Guardar con imagen procesada -->
            <button @click="limpiarBD" class="bg-red-500 text-white px-2 py-1 rounded">
              Limpiar BD (Testing)
            </button>
            <button
              @click="guardarPiezaConValidacion"
              class="flex-1 min-w-[120px] bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
                ></path>
                <polyline points="17,21 17,13 7,13 7,21"></polyline>
                <polyline points="7,3 7,8 15,8"></polyline>
              </svg>
              Guardar Procesada
            </button>

            <!-- Botón: Exportar imagen procesada -->
            <button
              @click="generarImagenFinalConValidacion"
              class="flex-1 min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7,10 12,15 17,10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Exportar Procesada
            </button>

            <!-- Botón: Vista previa -->
            <button
              @click="previsualizarImagenProcesada"
              class="flex-1 min-w-[120px] bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              Vista Previa
            </button>

            <!-- Botón: Reset -->
            <button
              @click="resetPieza"
              class="flex-1 min-w-[120px] bg-gray-200 hover:bg-gray-300 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="1,4 1,10 7,10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
              Reset
            </button>
          </div>

          <!-- Opcional: Información sobre el procesamiento -->
          <div
            class="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800"
          >
            <div class="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="l9,12 2,2 4,-4"></path>
              </svg>
              <strong>Imagen Procesada:</strong> La pieza actúa como máscara, solo se
              exporta lo que está dentro de su forma.
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-gray-500 italic">Selecciona un molde primero.</div>
    </section>
  </div>
</template>
<script lang="ts" setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { dbService } from "../services/database.service";
import type { Molde, PiezaMolde } from "@/types/Molde";
import PreviewCanvas from "../components/PreviewCanvas.vue";
import { generateExactPreview, downloadImage } from "../utils/canvasMask.js";
import { arrayBufferToBlobUrl } from "../utils/utils.ts";
import { nextTick } from "vue";
import { toRaw } from "vue";

// ================== STATE ==================
const moldes = ref<Molde[]>([]);
const selectedMolde = ref<Molde | null>(null);
const piezas = ref<PiezaMolde[]>([]);
const selectedPiece = ref<string | null>(null);
const fonts = [];
const pieceSelected = ref(null);
const overlaySelected = ref<Overlay | null>(null);
const textsSelected = ref([]);

// ================== REACTIVE ==================

// Estado para tracking de cambios por pieza
const pieceStates = reactive<Record<string, { hasChanges: boolean; isSaved: boolean }>>(
  {}
);

// Settings por pieza
const pieceSettings = reactive<Record<string, any>>({});
const settings = computed({
  get() {
    if (!selectedPiece.value) return {};
    return pieceSettings[selectedPiece.value] || {};
  },
  set(val) {
    if (selectedPiece.value) pieceSettings[selectedPiece.value] = val;
  },
});

// ================== METHODS ==================
async function registrarFuenteDesdeMolde(molde: Molde) {
  if (!molde.fuente) return;

  try {
    // Convierte el ArrayBuffer a un objeto FontFace
    const font = new FontFace(molde.fuente.nombre, molde.fuente.data);

    // Espera a que cargue
    await font.load();

    // Regístrala en document.fonts
    document.fonts.add(font);

    console.log(`Fuente ${molde.fuente.nombre} registrada correctamente.`);
  } catch (err) {
    console.error("Error cargando fuente:", err);
  }
}

// ================== PIECE STATUS ==================
function initializePieceStates() {
  piezas.value.forEach((p) => {
    if (!pieceStates[p.nombre]) {
      pieceStates[p.nombre] = {
        hasChanges: false,
        isSaved: false,
      };
    }
  });
}

function markPieceAsModified(pieceName: string) {
  if (pieceStates[pieceName]) {
    pieceStates[pieceName].hasChanges = true;
    pieceStates[pieceName].isSaved = false;
  }
}

function markPieceAsSaved(pieceName: string) {
  if (pieceStates[pieceName]) {
    pieceStates[pieceName].hasChanges = false;
    pieceStates[pieceName].isSaved = true;
  }
}

function getPieceStatus(pieceName: string): "saved" | "modified" | "untouched" {
  const state = pieceStates[pieceName];
  if (!state) return "untouched";

  if (state.isSaved && !state.hasChanges) return "saved";
  if (state.hasChanges) return "modified";
  return "untouched";
}

// ================== PIECES CHANGES VALIDATE ==================

function hasUnsavedChanges(pieceName?: string): boolean {
  if (pieceName) {
    return pieceStates[pieceName]?.hasChanges || false;
  }
  // Verificar si hay cambios sin guardar en cualquier pieza
  return Object.values(pieceStates).some((state) => state.hasChanges);
}

function getUnsavedPieces(): string[] {
  return Object.keys(pieceStates).filter((name) => pieceStates[name].hasChanges);
}

async function confirmChangeWithUnsavedData(
  actionMessage: string,
  unsavedItems: string[]
): Promise<boolean> {
  const itemList = unsavedItems.join(", ");
  const message = `⚠️ ${actionMessage}\n\n❌ Cambios sin guardar en:\n${unsavedItems
    .map((item) => `   • ${item}`)
    .join("\n")}\n\n¿Deseas continuar? Los cambios se perderán definitivamente.`;

  return new Promise((resolve) => {
    const result = confirm(message);
    resolve(result);
  });
}

// ================== CONTROLS ==================

async function uploadBackground(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file || !selectedPiece.value) return;

  // Convertir el archivo a ArrayBuffer
  const buffer = await file.arrayBuffer();
  await nextTick();
  overlaySelected.value = {
    ...overlaySelected.value,
    data: buffer,
  };

  // Marcar pieza como modificada
  if (selectedPiece.value) {
    markPieceAsModified(selectedPiece.value);
  }
}

async function selectMolde(id: number) {
  // Verificar cambios sin guardar antes de cambiar molde
  if (hasUnsavedChanges()) {
    const unsavedPieces = getUnsavedPieces();
    const confirmed = await confirmChangeWithUnsavedData(
      "Estás a punto de cambiar de molde.",
      unsavedPieces
    );

    if (!confirmed) {
      return; // Cancelar el cambio de molde
    }
  }

  const m = moldes.value.find((x) => x.id === id);
  if (!m) return;

  selectedMolde.value = m;
  // ⭐ COPIAR PIEZAS CON TODAS SUS PROPIEDADES (incluyendo overlay)
  piezas.value = m.piezas.map((p) => ({
    ...p,
    texts: p.texts || [], // Asegurar que texts sea un array
    overlay: p.overlay || null, // Preservar overlay
  }));

  // Limpiar estados anteriores y inicializar nuevos
  Object.keys(pieceStates).forEach((key) => delete pieceStates[key]);
  Object.keys(pieceSettings).forEach((key) => delete pieceSettings[key]);

  initializePieceStates();

  // Registrar fuente si existe
  if (m.fuente) {
    await registrarFuenteDesdeMolde(m);
  }

  piezas.value.forEach((p) => {
    pieceSettings[p.nombre] = {
      name: "",
      number: "",
      font: fonts[0],
      fontSize: 48,
      color: "#000000",
      opacity: 1,
      x: 20,
      y: 20,
      rotate: 0,
      data: p.data,
    };
  });
  selectedPiece.value = null;

  // Limpiar canvas
  pieceSelected.value = null;
  overlaySelected.value = null;
}

async function selectPiece(nombre: string) {
  // Verificar cambios sin guardar en la pieza actual antes de cambiar
  if (selectedPiece.value && hasUnsavedChanges(selectedPiece.value)) {
    const confirmed = await confirmChangeWithUnsavedData(
      "Estás a punto de cambiar de pieza.",
      [selectedPiece.value]
    );

    if (!confirmed) {
      return; // Cancelar el cambio de pieza
    }
  }

  selectedPiece.value = nombre;
  const p = piezas.value.find((x) => x.nombre === nombre);
  if (!p) return;

  pieceSelected.value = {
    src: arrayBufferToBlobUrl(p.data, "image/png"),
    background: null,
    x: 50,
    y: 50,
    w: 200,
    h: 200,
    rotation: 0,
  };

  // ⭐ CARGAR OVERLAY DESDE LA PIEZA (no limpiar)
  if (p.overlay && (!p.overlay.w || !p.overlay.h)) {
    // Establecer valores por defecto si no existen
    p.overlay = {
      ...p.overlay,
      w: p.overlay.w || 100,
      h: p.overlay.h || 100,
      x: p.overlay.x || 0,
      y: p.overlay.y || 0,
      rotation: p.overlay.rotation || 0,
    };
  }
  overlaySelected.value = p.overlay;
  if (!p.texts) {
    p.texts = [];
  }
  // En selectPiece, después de cargar los textos:
  textsSelected.value = (p.texts || []).map((t) => ({
    ...t,
    x: t.x ?? 50, // Valor por defecto si es null
    y: t.y ?? 50, // Valor por defecto si es null
    rotation: t.rotation ?? 0,
  }));
}

async function generarImagenFinal() {
  if (!pieceSelected.value) {
    alert("Selecciona una pieza primero");
    return;
  }

  try {
    // Usar la función que genera exactamente lo que se ve en PreviewCanvas
    const result = await generateExactPreview(pieceSelected.value, overlaySelected.value);

    // Descargar automáticamente la imagen procesada
    const filename = `${selectedPiece.value}_procesada.png`;
    downloadImage(result.dataURL, filename);

    console.log("Imagen procesada exportada exitosamente");
  } catch (error) {
    console.error("Error generando imagen procesada:", error);
    alert("Error al generar la imagen procesada");
  }
}

function resetPieza() {
  if (!selectedPiece.value) return;
  const p = piezas.value.find((x) => x.nombre === selectedPiece.value);

  if (!pieceSettings[selectedPiece.value]) {
    pieceSettings[selectedPiece.value] = {};
  }

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
    data: p?.data,
  };
}

async function previsualizarImagenProcesada() {
  if (!pieceSelected.value) {
    alert("Selecciona una pieza primero");
    return;
  }

  try {
    const result = await generateExactPreview(pieceSelected.value, overlaySelected.value);

    // Crear ventana emergente simple sin HTML complejo
    const newWindow = window.open("", "_blank", "width=800,height=600");
    if (newWindow) {
      // Crear elementos del DOM directamente en lugar de usar HTML strings
      const doc = newWindow.document;

      doc.title = `Vista previa - ${selectedPiece.value}`;

      // Estilos
      const style = doc.createElement("style");
      style.textContent = `
        body { 
          margin: 0; 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          min-height: 100vh; 
          background: #f0f0f0;
          font-family: Arial, sans-serif;
        }
        .preview-container {
          text-align: center;
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        img { 
          max-width: 100%; 
          max-height: 70vh; 
          border: 2px solid #ddd;
          border-radius: 5px;
        }
        h1 { 
          color: #333; 
          margin-bottom: 20px; 
        }
        .download-btn {
          margin-top: 15px;
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
        }
        .download-btn:hover {
          background: #0056b3;
        }
      `;
      doc.head.appendChild(style);

      // Contenedor
      const container = doc.createElement("div");
      container.className = "preview-container";

      // Título
      const title = doc.createElement("h1");
      title.textContent = `Vista Previa: ${selectedPiece.value}`;
      container.appendChild(title);

      // Imagen
      const img = doc.createElement("img");
      img.src = result.dataURL;
      img.alt = "Vista previa procesada";
      container.appendChild(img);

      // Botón de descarga
      const button = doc.createElement("button");
      button.textContent = "Descargar Imagen";
      button.className = "download-btn";
      button.onclick = () => {
        const link = doc.createElement("a");
        link.download = `${selectedPiece.value}_preview.png`;
        link.href = result.dataURL;
        link.click();
      };
      container.appendChild(button);

      doc.body.appendChild(container);
    }
  } catch (error) {
    console.error("Error previsualizando imagen procesada:", error);
    alert("Error al previsualizar la imagen procesada");
  }
}

// ================== SAVE ==================
async function saveCurrentMold({
  soloPieza,
  procesar = false,
}: {
  soloPieza?: string;
  procesar?: boolean;
}) {
  if (!selectedMolde.value) return;

  try {
    // Crear molde plano (sin Proxies de Vue)
    const moldeParaGuardar: Molde = {
      id: selectedMolde.value.id,
      nombre: selectedMolde.value.nombre,
      fechaCreacion: selectedMolde.value.fechaCreacion,
      fuente: selectedMolde.value.fuente ? { ...selectedMolde.value.fuente } : undefined,
      piezas: await Promise.all(
        selectedMolde.value.piezas.map(async (p) => {
          let processedArrayBuffer = p.data;
          let preview = p.preview || "";
          let overlay = p.overlay || null;
          let texts = p.texts || [];

          console.log("TEXTOS ANTES DE PROCESAR", p.texts);

          // Si no toca esta pieza → devolver plano
          if (soloPieza && p.nombre !== soloPieza) {
            return {
              nombre: p.nombre,
              data: processedArrayBuffer,
              preview,
              overlay: overlay
                ? {
                    data: overlay.data,
                    x: overlay.x,
                    y: overlay.y,
                    w: overlay.w,
                    h: overlay.h,
                    rotation: overlay.rotation,
                  }
                : null,
              texts: (p.texts || []).map((t) => ({ ...toRaw(t) })),
            };
          }

          // Si hay que procesar esta pieza
          if (procesar && selectedPiece.value === p.nombre && pieceSelected.value) {
            const processedImage = await generateExactPreview(
              pieceSelected.value,
              overlaySelected.value,
              textsSelected.value
            );
            processedArrayBuffer = await processedImage.blob!.arrayBuffer();
            preview = processedImage.dataURL;
            overlay = overlaySelected.value;
            texts = textsSelected.value;
          }

          // Siempre actualizar overla y textos de la pieza seleccionada
          if (selectedPiece.value === p.nombre) {
            overlay = overlaySelected.value;
            texts = textsSelected.value;
          }

          return {
            nombre: p.nombre,
            data: processedArrayBuffer,
            preview,
            overlay: overlay
              ? {
                  data: overlay.data,
                  x: overlay.x,
                  y: overlay.y,
                  w: overlay.w,
                  h: overlay.h,
                  rotation: overlay.rotation,
                }
              : null,
            texts: texts.map((t) => ({ ...toRaw(t) })),
          };
        })
      ),
    };

    console.log("MOLDE PARA GUARDAR", moldeParaGuardar);

    // Guardar en DB
    await dbService.guardarMolde(moldeParaGuardar);

    // Actualizar estado local (se vuelve reactivo al asignar a ref)
    selectedMolde.value = moldeParaGuardar;
    piezas.value = [...moldeParaGuardar.piezas];

    // Marcar guardado
    if (soloPieza) {
      markPieceAsSaved(soloPieza);
    } else {
      getUnsavedPieces().forEach((name) => markPieceAsSaved(name));
    }

    alert(
      soloPieza
        ? `✅ Pieza ${soloPieza} guardada correctamente`
        : `✅ Molde guardado con ${moldeParaGuardar.piezas.length} piezas`
    );
  } catch (error) {
    console.error("Error al guardar molde:", error);
    alert("❌ Error al guardar");
  }
}

async function guardarPiezaConValidacion() {
  if (!validarElementosEnPieza()) return;
  if (!selectedPiece.value) return;

  await saveCurrentMold({ soloPieza: selectedPiece.value, procesar: true });
}

async function guardarTodasLasPiezas() {
  const unsaved = getUnsavedPieces();
  if (unsaved.length === 0) {
    alert("No hay cambios pendientes");
    return;
  }

  await saveCurrentMold({ procesar: false });
}

/* Función para validar que los elementos están correctamente posicionados */
function validarElementosEnPieza(): boolean {
  if (!pieceSelected.value) {
    alert("No hay ninguna pieza seleccionada");
    return false;
  }

  // Verificar que hay elementos para procesar
  const tieneOverlay = overlaySelected.value !== null;

  if (!tieneOverlay) {
    const confirmar = confirm(
      "No hay elementos adicionales (fondo) para procesar.\n\n" +
        "Solo se exportará la pieza original.\n\n" +
        "¿Deseas continuar?"
    );
    return confirmar;
  }

  return true;
}

async function generarImagenFinalConValidacion() {
  if (!validarElementosEnPieza()) {
    return;
  }
  await generarImagenFinal();
}

// ================== OTHERS ==================
/* Función para obtener configuración del canvas */
function getCanvasConfig() {
  return {
    width: 600,
    height: 400,
    backgroundColor: "transparent",
  };
}

async function cargarMoldes() {
  moldes.value = await dbService.obtenerMoldes();
}

// ================== WHATCHERS ==================

watch(
  () => pieceSelected.value,
  (newVal, oldVal) => {
    if (!oldVal || !selectedPiece.value) return;
    markPieceAsModified(selectedPiece.value);
  },
  { deep: true }
);

watch(
  () => overlaySelected.value,
  (newOverlay) => {
    console.log("Overlay actualizado:", newOverlay);
    if (selectedPiece.value) {
      const pieza = piezas.value.find((p) => p.nombre === selectedPiece.value);
      if (pieza) pieza.overlay = newOverlay;
      markPieceAsModified(selectedPiece.value);
    }
  },
  { deep: true }
);

watch(
  () => textsSelected.value,
  (newTexts) => {
    if (selectedPiece.value) {
      const pieza = piezas.value.find((p) => p.nombre === selectedPiece.value);
      if (pieza) {
        console.log("Before updating pieza.texts:", pieza.texts);
        pieza.texts = newTexts;
        console.log("NEW TEXTS:", newTexts);
        console.log("After updating pieza.texts:", pieza.texts);
      }
      markPieceAsModified(selectedPiece.value);
    }
  },
  { deep: true }
);

onMounted(() => cargarMoldes());
onBeforeUnmount(() => {});
</script>
