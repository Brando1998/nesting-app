// src/services/database.service.ts
import type { Fuente } from '../types/Fuente';
import type { Pieza } from '../types/Pieza';

class DatabaseService {
  private dbName = 'UniformeDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('piezas')) {
          const store = db.createObjectStore('piezas', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('nombre', 'nombre', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('fuentes')) {
          db.createObjectStore('fuentes', { keyPath: 'nombre' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  // Operaciones para piezas
  async guardarPieza(pieza: Omit<Pieza, 'id'>): Promise<number> {
    const db = await this.initialize();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('piezas', 'readwrite');
      const store = tx.objectStore('piezas');
      const request = store.add(pieza);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async obtenerPiezas(): Promise<Pieza[]> {
    const db = await this.initialize();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('piezas', 'readonly');
      const store = tx.objectStore('piezas');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async eliminarPieza(id: number): Promise<void> {
    const db = await this.initialize();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('piezas', 'readwrite');
      const store = tx.objectStore('piezas');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Operaciones para fuentes
  async guardarFuente(fuente: Fuente): Promise<void> {
    const db = await this.initialize();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('fuentes', 'readwrite');
      const store = tx.objectStore('fuentes');
      const request = store.put(fuente);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async obtenerFuente(nombre: string = 'custom-font'): Promise<Fuente | null> {
    const db = await this.initialize();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('fuentes', 'readonly');
      const store = tx.objectStore('fuentes');
      const request = store.get(nombre);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
}

// Exportamos una instancia singleton
export const dbService = new DatabaseService();
export default dbService;