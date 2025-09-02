// src/services/database.service.ts - VERSIÓN CORREGIDA
import type { Fuente } from '../types/Fuente';
import type { Molde, PiezaMolde } from '../types/Molde';

class DatabaseService {
  private dbName = 'UniformeDB';
  private version = 3; // ⭐ INCREMENTAR VERSIÓN para forzar upgrade
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

  // Función helper para normalizar fecha
  private normalizarFecha(fecha: Date | string | number): string {
    if (fecha instanceof Date) {
      return fecha.toISOString();
    }
    if (typeof fecha === 'string') {
      return fecha; // Ya es string ISO
    }
    if (typeof fecha === 'number') {
      return new Date(fecha).toISOString();
    }
    return new Date().toISOString(); // Fallback
  }

  // Función helper para convertir fecha de string a Date
  private convertirFecha(fechaString: string): Date {
    return new Date(fechaString);
  }

  // ⭐ FUNCIÓN CORREGIDA - ahora guarda texts y overlay
  async guardarMolde(molde: Molde): Promise<number> {
    const db = await this.initialize();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('moldes', 'readwrite');
      const store = tx.objectStore('moldes');

      try {
        // Validar entrada básica
        if (!molde || !molde.nombre) {
          throw new Error('El molde debe tener un nombre válido');
        }

        if (!molde.piezas || molde.piezas.length === 0) {
          throw new Error('El molde debe tener al menos una pieza');
        }

        // Validar cada pieza
        for (const pieza of molde.piezas) {
          if (!pieza.nombre) {
            throw new Error('Todas las piezas deben tener un nombre');
          }
          if (!pieza.data || !(pieza.data instanceof ArrayBuffer)) {
            throw new Error(`La pieza "${pieza.nombre}" no tiene datos válidos (debe ser ArrayBuffer)`);
          }
          if (pieza.data.byteLength === 0) {
            throw new Error(`La pieza "${pieza.nombre}" tiene datos vacíos`);
          }
        }

        // Validar fuente si existe
        if (molde.fuente) {
          if (!molde.fuente.nombre) {
            throw new Error('La fuente debe tener un nombre');
          }
          if (!molde.fuente.data || !(molde.fuente.data instanceof ArrayBuffer)) {
            throw new Error('Los datos de la fuente no son válidos (debe ser ArrayBuffer)');
          }
          if (molde.fuente.data.byteLength === 0) {
            throw new Error('Los datos de la fuente están vacíos');
          }
        }

        // ⭐ CREAR OBJETO COMPLETO CON TODOS LOS CAMPOS
        const moldeParaGuardar = {
          // Solo incluir id si existe y es válido
          ...(molde.id && typeof molde.id === 'number' ? { id: molde.id } : {}),
          nombre: String(molde.nombre).trim(),
          piezas: molde.piezas.map(p => ({
            nombre: String(p.nombre).trim(),
            preview: p.preview,
            data: p.data, // ArrayBuffer se mantiene como está
            polygon: p.polygon,
            texts: p.texts || [], // ⭐ INCLUIR TEXTS
            overlay: p.overlay || null // ⭐ INCLUIR OVERLAY
          })),
          fuente: molde.fuente ? {
            nombre: String(molde.fuente.nombre).trim(),
            data: molde.fuente.data // ArrayBuffer se mantiene como está
          } : null,
          fechaCreacion: this.normalizarFecha(molde.fechaCreacion)
        };

        // Log detallado para debugging
        console.log('Datos preparados para guardar:', {
          nombre: moldeParaGuardar.nombre,
          piezasCount: moldeParaGuardar.piezas.length,
          tieneFuente: !!moldeParaGuardar.fuente,
          tieneId: !!moldeParaGuardar.id,
          // ⭐ LOGGING DE CAMPOS NUEVOS
          piezasConTexts: moldeParaGuardar.piezas.filter(p => p.texts && p.texts.length > 0).length,
          piezasConOverlay: moldeParaGuardar.piezas.filter(p => p.overlay !== null).length,
          detallesPiezas: moldeParaGuardar.piezas.map(p => ({
            nombre: p.nombre,
            tieneTexts: p.texts ? p.texts.length : 0,
            tieneOverlay: !!p.overlay
          }))
        });

        // Decidir si usar put (actualizar) o add (crear nuevo)
        const request = moldeParaGuardar.id
          ? store.put(moldeParaGuardar)
          : store.add(moldeParaGuardar);

        request.onsuccess = () => {
          console.log('Molde guardado exitosamente con ID:', request.result);
          resolve(request.result as number);
        };

        request.onerror = (event) => {
          console.error('Error en la operación de IndexedDB:', request.error);
          console.error(event)
          reject(new Error(`Error de IndexedDB: ${request.error?.message || 'Error desconocido'}`));
        };

        tx.onerror = (event) => {
          console.error(event)
          console.error('Error en la transacción:', tx.error);
          reject(new Error(`Error de transacción: ${tx.error?.message || 'Error desconocido'}`));
        };

        tx.onabort = (event) => {
          console.error(event)
          console.error('Transacción abortada:', tx.error);
          reject(new Error(`Transacción abortada: ${tx.error?.message || 'Transacción cancelada'}`));
        };

      } catch (error: any) {
        console.error('Error preparando datos para guardar:', error);
        reject(new Error(`Error preparando datos para guardar: ${error.message || error}`));
      }
    });
  }

  // ⭐ FUNCIÓN MEJORADA para cargar con todos los campos
  async obtenerMoldes(): Promise<Molde[]> {
    const db = await this.initialize();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('moldes', 'readonly');
      const store = tx.objectStore('moldes');
      const request = store.getAll();

      request.onsuccess = () => {
        const moldes = request.result.map((molde: any) => ({
          ...molde,
          fechaCreacion: this.convertirFecha(molde.fechaCreacion),
          // ⭐ ASEGURAR QUE CADA PIEZA TENGA LOS CAMPOS NECESARIOS
          piezas: molde.piezas.map((p: any) => ({
            ...p,
            texts: p.texts || [], // Asegurar que texts sea array
            overlay: p.overlay || null // Asegurar que overlay sea null si no existe
          }))
        }));
        
        // ⭐ LOG PARA VERIFICAR CARGA
        console.log('Moldes cargados desde BD:', moldes.map(m => ({
          nombre: m.nombre,
          piezas: m.piezas.map((p:PiezaMolde) => ({
            nombre: p.nombre,
            tieneTexts: p.texts?.length || 0,
            tieneOverlay: !!p.overlay
          }))
        })));
        
        resolve(moldes);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async obtenerMolde(id: number): Promise<Molde | null> {
    const db = await this.initialize();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('moldes', 'readonly');
      const store = tx.objectStore('moldes');
      const request = store.get(id);

      request.onsuccess = () => {
        const molde = request.result;
        if (molde) {
          resolve({
            ...molde,
            fechaCreacion: this.convertirFecha(molde.fechaCreacion),
            // ⭐ ASEGURAR QUE CADA PIEZA TENGA LOS CAMPOS NECESARIOS
            piezas: molde.piezas.map((p: any) => ({
              ...p,
              texts: p.texts || [],
              overlay: p.overlay || null
            }))
          });
        } else {
          resolve(null);
        }
      };
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

  // ⭐ FUNCIÓN NUEVA: Limpiar BD para testing (opcional)
  async limpiarBaseDeDatos(): Promise<void> {
    const db = await this.initialize();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['moldes', 'fuentes'], 'readwrite');
      
      const moldesStore = tx.objectStore('moldes');
      const fuentesStore = tx.objectStore('fuentes');
      
      moldesStore.clear();
      fuentesStore.clear();
      
      tx.oncomplete = () => {
        console.log('Base de datos limpiada');
        resolve();
      };
      
      tx.onerror = () => reject(tx.error);
    });
  }

  // Operaciones para fuentes (sin cambios)
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