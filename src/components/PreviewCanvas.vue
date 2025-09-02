<template>
  <div class="preview-container">
    <div ref="canvas" class="canvas bg-gray-500">
      <!-- Imagen base -->
      <div
        v-if="piece"
        class="piece-container"
        :style="{
          width: pieceDisplayWidth + 'px',
          height: pieceDisplayHeight + 'px',
          left: pieceDisplayX + 'px',
          top: pieceDisplayY + 'px',
        }"
      >
        <img :src="piece.src" class="piece-img-static" />
      </div>

      <!-- Overlay -->
      <vue-draggable-resizable
        v-if="overlay"
        :x="overlay.x ?? 0"
        :y="overlay.y ?? 0"
        :w="overlay.w ?? 100"
        :h="overlay.h ?? 100"
        :rotation="overlay.rotation ?? 0"
        :parent="true"
        :resizable="true"
        :draggable="true"
        :rotatable="true"
        @drag-end="onDragEnd"
        @resize-end="onResizeEnd"
        @rotatestop="onRotateStop"
      >
        <img :src="arrayBufferToBlobUrl(overlay.data, 'image/png')" class="overlay-img" />
      </vue-draggable-resizable>

      <!-- Textos -->
      <vue-draggable-resizable
        v-for="(t, i) in textsComputed"
        :key="i"
        class="text-vdr"
        :x="t.x"
        :y="t.y"
        :w="measureBoxWidth(t.fontSize, t.content)"
        :h="measureBoxHeight(t.fontSize)"
        :rotation="t.rotation"
        :parent="true"
        :resizable="false"
        :draggable="true"
        :rotatable="true"
        @drag-end="(event) => onTextDragEnd(i, event)"
        @rotatestop="(event) => onTextRotateStop(i, event)"
        :class="{ 'is-selected': selectedTextIndex === i }"
      >
        <div
          class="text-box"
          :style="{
            fontSize: t.fontSize + 'px',
            fontFamily: t.fontFamily,
            color: t.color,
            opacity: t.opacity,
          }"
          @click.stop="selectText(i)"
        >
          {{ t.content || "Ejemplo" }}
        </div>

        <!-- Botón editar -->
        <button
          v-if="selectedTextIndex === i"
          class="edit-btn"
          @click.stop="toggleMenu(i)"
        >
          ✏️
        </button>

        <!-- Mini menú -->
        <div v-if="menuOpenFor === i" class="mini-menu">
          <div class="mini-row">
            <label>Tamaño</label>
            <input
              type="number"
              :value="textsComputed[i].fontSize"
              @input="applyStyle(i, { fontSize: Number($event.target.value) })"
            />
          </div>
          <div class="mini-row">
            <label>Fuente</label>
            <select
              :value="textsComputed[i].fontFamily"
              @change="applyStyle(i, { fontFamily: $event.target.value })"
            >
              <option v-for="f in fonts" :key="f" :value="f">{{ f }}</option>
            </select>
          </div>
          <div class="mini-row">
            <label>Color</label>
            <input
              type="color"
              :value="textsComputed[i].color"
              @input="applyStyle(i, { color: $event.target.value })"
            />
          </div>
          <div class="mini-row">
            <label>Opacidad</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              :value="textsComputed[i].opacity"
              @input="applyStyle(i, { opacity: Number($event.target.value) })"
            />
          </div>
          <div class="mini-actions">
            <button class="mini-btn" @click="closeMenu">Cerrar</button>
          </div>
        </div>
      </vue-draggable-resizable>
    </div>
  </div>

  <div class="controls">
    <button @click="addText" class="add-btn">+ Añadir texto</button>
  </div>
</template>

<script>
import VueDraggableResizable from "vue3-draggable-resizable";
import "vue3-draggable-resizable/dist/Vue3DraggableResizable.css";
import { loadFontFromArrayBuffer, arrayBufferToBlobUrl } from "../utils/utils";

export default {
  name: "PreviewCanvas",
  components: { VueDraggableResizable },
  props: {
    piece: { type: Object, default: null },
    overlay: {
      type: Object,
      default: () => ({ x: 0, y: 0, w: 100, h: 100, rotation: 0 }),
    },
    customFuente: { type: Object, default: null },
    texts: { type: Array, default: () => [] },
  },
  emits: ["update:piece", "update:texts", "update:overlay"],
  data() {
    return {
      selectedTextIndex: null,
      menuOpenFor: null,
      canvasWidth: 600,
      canvasHeight: 400,
      pieceImageDimensions: null,
    };
  },
  computed: {
    fonts() {
      const baseFonts = ["Arial", "Roboto", "Montserrat"];
      if (this.customFuente?.nombre) {
        return [this.customFuente.nombre, ...baseFonts];
      }
      return baseFonts;
    },
    pieceDisplayHeight() {
      return this.canvasHeight;
    },
    pieceDisplayWidth() {
      if (!this.pieceImageDimensions) return this.canvasWidth;
      const aspectRatio =
        this.pieceImageDimensions.width / this.pieceImageDimensions.height;
      return this.pieceDisplayHeight * aspectRatio;
    },
    pieceDisplayX() {
      return (this.canvasWidth - this.pieceDisplayWidth) / 2;
    },
    pieceDisplayY() {
      return 0;
    },
    // Estándar único para manipular texts desde el hijo sin mutar directamente la prop
    textsComputed: {
      get() {
        return this.texts || [];
      },
      set(newTexts) {
        this.$emit("update:texts", newTexts);
      },
    },
  },
  watch: {
    "piece.src": {
      handler(newSrc) {
        if (newSrc) this.loadImageDimensions(newSrc);
      },
      immediate: true,
    },
    // Nota: se eliminó el watch profundo de `texts` para evitar dobles emisiones
  },
  mounted() {
    if (this.piece?.src) {
      this.loadImageDimensions(this.piece.src);
    }
    this.initCustomFont();
  },
  methods: {
    loadImageDimensions(src) {
      const img = new Image();
      img.onload = () => {
        this.pieceImageDimensions = {
          width: img.naturalWidth,
          height: img.naturalHeight,
        };
        this.updatePiecePosition();
      };
      img.src = src;
    },
    updatePiecePosition() {
      const staticPieceData = {
        ...this.piece,
        x: this.pieceDisplayX,
        y: this.pieceDisplayY,
        w: this.pieceDisplayWidth,
        h: this.pieceDisplayHeight,
        rotation: 0,
      };
      this.$emit("update:piece", staticPieceData);
    },

    // TEXTS
    addText() {
      console.log("Addinfg texts");
      const newTexts = [
        ...this.textsComputed,
        {
          content: "Ejemplo",
          x: 50,
          y: 50,
          rotation: 0,
          fontSize: 32,
          fontFamily: this.customFuente?.nombre || "Arial",
          color: "#000000",
          opacity: 1,
        },
      ];
      this.textsComputed = newTexts;
      this.selectedTextIndex = newTexts.length - 1;
    },

    // En PreviewCanvas.vue
    onTextDragEnd(i, event) {
      console.log("Text drag end:", i, event.x, event.y);
      const updated = [...this.textsComputed];
      updated[i] = {
        ...updated[i],
        x: Number(event.x),
        y: Number(event.y),
        rotation: updated[i].rotation || 0,
      };
      this.textsComputed = updated;
    },

    onTextRotateStop(i, event) {
      console.log("Text rotate stop:", i, event);
      const updated = [...this.textsComputed];
      updated[i] = {
        ...updated[i],
        rotation: Number(event),
      };
      this.textsComputed = updated;
    },

    applyStyle(i, patch) {
      const updated = [...this.textsComputed];
      updated[i] = { ...updated[i], ...patch };
      this.textsComputed = updated;
    },
    selectText(i) {
      this.selectedTextIndex = i;
    },
    toggleMenu(i) {
      this.menuOpenFor = this.menuOpenFor === i ? null : i;
    },
    closeMenu() {
      this.menuOpenFor = null;
    },
    async initCustomFont() {
      if (this.customFuente) {
        await loadFontFromArrayBuffer(this.customFuente.nombre, this.customFuente.data);
      }
    },
    measureBoxWidth(fontSize, content) {
      const len = content?.length || 1;
      return Math.max(60, Math.floor(len * fontSize * 0.6) + 20);
    },
    measureBoxHeight(fontSize) {
      return Math.max(40, Math.floor(fontSize * 1.4));
    },
    // OVERLAY METHODS
    onDragEnd(rect) {
      // console.log("Drag end:", rect);
      this.updateOverlay({
        x: rect.x,
        y: rect.y,
        w: this.overlay.w,
        h: this.overlay.h,
        rotation: this.overlay.rotation,
      });
    },
    onResizeEnd(rect) {
      // console.log("Resize end:", rect);
      this.updateOverlay({
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: rect.h,
        rotation: Number(this.overlay.rotation),
      });
    },
    onRotateStop(angle) {
      // console.log("Rotate stop:", angle);
      this.updateOverlay({
        x: this.overlay.x,
        y: this.overlay.y,
        w: this.overlay.w,
        h: this.overlay.h,
        rotation: Number(angle),
      });
    },
    updateOverlay({ x, y, w, h, rotation }) {
      const updatedOverlay = {
        ...this.overlay,
        x: Number.isFinite(x) ? Number(x) : this.overlay?.x ?? 0,
        y: Number.isFinite(y) ? Number(y) : this.overlay?.y ?? 0,
        w: Number.isFinite(w) ? Number(w) : this.overlay?.w ?? 100,
        h: Number.isFinite(h) ? Number(h) : this.overlay?.h ?? 100,
        rotation: Number.isFinite(rotation)
          ? Number(rotation)
          : this.overlay?.rotation ?? 0,
      };
      // console.log("Updated overlay:", updatedOverlay);
      this.$emit("update:overlay", updatedOverlay);
    },

    arrayBufferToBlobUrl,
  },
};
</script>

<style>
.canvas {
  width: 600px;
  height: 400px;
  border: 2px dashed #ccc;
  position: relative;
  overflow: hidden;
}
.piece-container {
  position: absolute;
  pointer-events: none;
  z-index: 0;
}
.piece-img-static {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.overlay-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.text-vdr {
  z-index: 10;
}
.text-box {
  cursor: pointer;
  text-align: center;
}
.text-vdr.is-selected {
  outline: 1px dashed rgba(255, 255, 255, 0.8);
}
.edit-btn {
  position: absolute;
  right: -8px;
  top: -8px;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 9999px;
  background: #1f2937;
  color: #fff;
  cursor: pointer;
  z-index: 15;
}
.mini-menu {
  position: absolute;
  right: 0;
  top: 26px;
  min-width: 180px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.16);
  z-index: 25;
}
.mini-row {
  margin-bottom: 8px;
}
.mini-row label {
  font-size: 12px;
  color: #374151;
}
.mini-actions {
  display: flex;
  justify-content: flex-end;
}
.mini-btn {
  font-size: 12px;
  padding: 6px 10px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
}
.mini-btn:hover {
  background: #e5e7eb;
}
.add-btn {
  padding: 6px 12px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 10px;
}
.add-btn:hover {
  background: #1d4ed8;
}
</style>
