
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

// Helper to store DirectoryHandle in IndexedDB (Web only)
const IDB_NAME = 'AppFotosDB';
const STORE_NAME = 'handles';
const KEY_ROOT = 'rootHandle';

async function getIDBStore(): Promise<IDBObjectStore> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      resolve(tx.objectStore(STORE_NAME));
    };
    request.onerror = () => reject(request.error);
  });
}

export const storageService = {
  isNative: Capacitor.isNativePlatform(),

  async detectDefaultFolder(): Promise<boolean> {
    if (this.isNative) {
      try {
        const { value } = await Preferences.get({ key: 'root_folder_uri' });
        if (!value) return false;
        // In Android SAF we'd check if we still have permissions
        // For this stub, we assume if URI is saved, it's ready
        return true;
      } catch {
        return false;
      }
    } else {
      try {
        const store = await getIDBStore();
        return new Promise((resolve) => {
          const req = store.get(KEY_ROOT);
          req.onsuccess = async () => {
            const handle = req.result;
            if (handle) {
              // Verify permission
              const mode = 'readwrite';
              if ((await (handle as any).queryPermission({ mode })) === 'granted') {
                resolve(true);
              } else {
                resolve(false);
              }
            } else {
              resolve(false);
            }
          };
          req.onerror = () => resolve(false);
        });
      } catch {
        return false;
      }
    }
  },

  async createFolder(): Promise<boolean> {
    if (this.isNative) {
      try {
        // En Android real, usaríamos un plugin de SAF para elegir carpeta.
        // Aquí simulamos guardando un "URI" de éxito.
        await Preferences.set({ key: 'root_folder_uri', value: 'content://com.android.externalstorage.documents/tree/primary:AppFotosSantiSystems' });
        // Crear carpeta física si no existe
        await Filesystem.mkdir({
          path: 'AppFotosSantiSystems',
          directory: Directory.Documents,
          recursive: true
        });
        return true;
      } catch (e) {
        console.error("Error creating native folder", e);
        return false;
      }
    } else {
      try {
        // File System Access API
        const handle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
          startIn: 'pictures'
        });
        
        // Save to IndexedDB
        const store = await getIDBStore();
        store.put(handle, KEY_ROOT);
        
        // Create internal subfolder
        try {
            await handle.getDirectoryHandle('AppFotosSantiSystems', { create: true });
        } catch (e) {
            console.error("Error creating subfolder", e);
        }

        return true;
      } catch (e) {
        console.error("User cancelled or API not supported", e);
        return false;
      }
    }
  },

  async getAlbums(): Promise<any[]> {
    // Logic to list subfolders inside root
    if (this.isNative) {
        try {
            const result = await Filesystem.readdir({
                path: 'AppFotosSantiSystems',
                directory: Directory.Documents
            });
            return result.files
                .filter(f => f.type === 'directory')
                .map(f => ({ id: f.name, name: f.name, mediaCount: 0 }));
        } catch { return []; }
    } else {
        const store = await getIDBStore();
        const handle: any = await new Promise((res) => {
            const req = store.get(KEY_ROOT);
            req.onsuccess = () => res(req.result);
        });
        if (!handle) return [];
        const root = await handle.getDirectoryHandle('AppFotosSantiSystems', { create: true });
        const albums = [];
        for await (const entry of (root as any).values()) {
            if (entry.kind === 'directory') {
                albums.push({ id: entry.name, name: entry.name, mediaCount: 0 });
            }
        }
        return albums;
    }
  },

  async createAlbum(name: string): Promise<boolean> {
    const cleanName = name.trim().replace(/[^a-z0-9]/gi, '_');
    if (this.isNative) {
        await Filesystem.mkdir({
            path: `AppFotosSantiSystems/${cleanName}`,
            directory: Directory.Documents,
            recursive: true
        });
        return true;
    } else {
        const store = await getIDBStore();
        const handle: any = await new Promise((res) => {
            const req = store.get(KEY_ROOT);
            req.onsuccess = () => res(req.result);
        });
        const root = await handle.getDirectoryHandle('AppFotosSantiSystems', { create: true });
        await root.getDirectoryHandle(cleanName, { create: true });
        return true;
    }
  }
};
