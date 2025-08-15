import type { Fuente } from "./Fuente";

// src/types/Molde.ts
export interface PiezaMolde {
  nombre: string;
  preview: string;
  data: ArrayBuffer;
}

export interface Molde {
  id?: number; // Opcional para autoincrement
  nombre: string;
  piezas: PiezaMolde[];
  fuente?: Fuente | null;
  fechaCreacion: Date;
}