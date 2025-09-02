import type { Fuente } from "./Fuente";

export interface Overlay {
  data: ArrayBuffer;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
}

export interface Texts {
  x: number,
  y: number,
  rotation: number,
  fontSize: number,
  fontFamily: string,
  color: string,
  opacity: number,
  content?: string
}

export interface PiezaMolde {
  nombre: string;
  preview?: ArrayBuffer;
  data: ArrayBuffer;
  polygon?: [number, number][];
  texts: Texts[];
  overlay?: Overlay | null;
}

export interface Molde {
  id?: number;
  nombre: string;
  piezas: PiezaMolde[];
  fuente?: Fuente | null;
  fechaCreacion: Date;
}