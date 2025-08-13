export interface Pieza {
  id?: number;
  nombre: string;
  preview: string;
  data: Blob;
  metadata?: Record<string, any>;
}