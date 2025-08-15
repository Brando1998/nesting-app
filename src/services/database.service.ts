// src/services/database.service.ts
import type { Fuente } from '../types/Fuente';
import type { Molde } from '../types/Molde';

class DatabaseService {
  private dbName = 'UniformeDB';
  private version = 2;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // Store para fuentes
        if (!db.objectStoreNames.contains('fuentes')) {
          db.createObjectStore('fuentes', { keyPath: 'nombre' });
        }
        // Store para moldes completos
        if (!db.objectStoreNames.contains('moldes')) {
          const store = db.createObjectStore('moldes', {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('nombre', 'nombre', { unique: false });
          store.createIndex('fechaCreacion', 'fechaCreacion', { unique: false });
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

  // Operaciones para moldes completos
  async guardarMolde(molde: Omit<Molde, 'id'>): Promise<number> {
    const db = await this.initialize();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('moldes', 'readwrite');
      const store = tx.objectStore('moldes');

      const moldeParaGuardar = {
        ...molde,
        piezas: molde.piezas.map(p => ({
          nombre: p.nombre,
          data: p.data // ArrayBuffer es serializable
        })),
        fechaCreacion: molde.fechaCreacion.toISOString()
      };

      const request = store.add(moldeParaGuardar);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async obtenerMoldes(): Promise<Molde[]> {
    const db = await this.initialize();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('moldes', 'readonly');
      const store = tx.objectStore('moldes');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async eliminarMolde(id: number): Promise<void> {
    const db = await this.initialize();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('moldes', 'readwrite');
      const store = tx.objectStore('moldes');
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

  async eliminarFuente(nombre: string): Promise<void> {
    const db = await this.initialize();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('fuentes', 'readwrite');
      const store = tx.objectStore('fuentes');
      const request = store.delete(nombre);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

}

// Exportamos una instancia singleton
export const dbService = new DatabaseService();
export default dbService;