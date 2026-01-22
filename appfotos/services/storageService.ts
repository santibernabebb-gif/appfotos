
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

const IDB_NAME = 'AppFotosSantiDB';
const STORE_NAME = 'handles';
const KEY_ROOT = 'rootHandle';

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet(key: string): Promise<any> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

async function idbSet(key: string, value: any): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put(value, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (e) {
    console.error('IDB Set Error:', e);
  }
}

export const storageService = {
  isNative: Capacitor.isNativePlatform(),

  async isRootReady(): Promise<boolean> {
    try {
      if (this.isNative) {
        const { value } = await Preferences.get({ key: 'root_uri' });
        return !!value;
      } else {
        const handle = await idbGet(KEY_ROOT);
        if (!handle) return false;
        
        // Comprobar existencia real de la subcarpeta sin pedir permiso aún
        try {
          await handle.getDirectoryHandle('AppFotosSantiSystems', { create: false });
        } catch {
          return false; // Si no existe, no está lista
        }

        const status = await handle.queryPermission({ mode: 'readwrite' });
        if (status === 'denied') return false;
        
        // En Android Chrome suele devolver 'prompt'. No bloqueamos aquí para permitir el "Entrar"
        return true; 
      }
    } catch {
      return false;
    }
  },

  async ensureAccessOnEnter(): Promise<boolean> {
    try {
      if (this.isNative) return true;
      
      const handle = await idbGet(KEY_ROOT);
      if (!handle) return false;

      // Verificar existencia antes de pedir permiso
      const appRoot = await handle.getDirectoryHandle('AppFotosSantiSystems', { create: false });
      
      // Gesto de usuario: aquí sí podemos pedir permiso si es 'prompt'
      const status = await appRoot.queryPermission({ mode: 'readwrite' });
      if (status === 'granted') return true;
      
      const requestStatus = await appRoot.requestPermission({ mode: 'readwrite' });
      return requestStatus === 'granted';
    } catch (e) {
      console.error('Access verification failed:', e);
      return false;
    }
  },

  async selectRootFolder(): Promise<boolean> {
    try {
      if (this.isNative) {
        await Preferences.set({ key: 'root_uri', value: 'content://appfotos_root' });
        await Filesystem.mkdir({ path: 'AppFotosSantiSystems', directory: Directory.Documents, recursive: true });
        return true;
      } else {
        const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
        
        // Permiso inmediato por gesto de usuario
        const perm = await handle.requestPermission({ mode: 'readwrite' });
        if (perm !== 'granted') return false;

        // Crear subcarpeta obligatoria
        await handle.getDirectoryHandle('AppFotosSantiSystems', { create: true });
        
        // Persistir handle esperando confirmación de IDB
        await idbSet(KEY_ROOT, handle);
        return true;
      }
    } catch (e) {
      console.error('Select folder error:', e);
      return false;
    }
  },

  async listAlbums(): Promise<any[]> {
    try {
      if (this.isNative) {
        const res = await Filesystem.readdir({ path: 'AppFotosSantiSystems', directory: Directory.Documents });
        return res.files.filter(f => f.type === 'directory').map(f => ({ id: f.name, name: f.name }));
      } else {
        const rootHandle = await idbGet(KEY_ROOT);
        if (!rootHandle) return [];
        const appRoot = await rootHandle.getDirectoryHandle('AppFotosSantiSystems');
        const albums = [];
        for await (const entry of (appRoot as any).values()) {
          if (entry.kind === 'directory') albums.push({ id: entry.name, name: entry.name });
        }
        return albums;
      }
    } catch {
      return [];
    }
  },

  async createAlbum(name: string): Promise<boolean> {
    try {
      const cleanName = name.trim().replace(/[^a-z0-9]/gi, '_');
      if (this.isNative) {
        await Filesystem.mkdir({ path: `AppFotosSantiSystems/${cleanName}`, directory: Directory.Documents, recursive: true });
        return true;
      } else {
        const rootHandle = await idbGet(KEY_ROOT);
        if (!rootHandle) return false;
        const appRoot = await rootHandle.getDirectoryHandle('AppFotosSantiSystems', { create: true });
        await appRoot.getDirectoryHandle(cleanName, { create: true });
        return true;
      }
    } catch {
      return false;
    }
  },

  async saveMedia(albumId: string, blob: Blob, type: 'image' | 'video'): Promise<boolean> {
    try {
      let ext = 'jpg';
      if (type === 'video') {
        ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      }
      const filename = `${type.toUpperCase()}_${Date.now()}.${ext}`;

      if (this.isNative) {
        const reader = new FileReader();
        const base64: string = await new Promise((res) => {
          reader.onload = () => res(reader.result as string);
          reader.readAsDataURL(blob);
        });
        await Filesystem.writeFile({
          path: `AppFotosSantiSystems/${albumId}/${filename}`,
          data: base64.split(',')[1],
          directory: Directory.Documents
        });
        return true;
      } else {
        const rootHandle = await idbGet(KEY_ROOT);
        if (!rootHandle) return false;
        const appRoot = await rootHandle.getDirectoryHandle('AppFotosSantiSystems');
        const albumHandle = await appRoot.getDirectoryHandle(albumId);
        const fileHandle = await albumHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      }
    } catch {
      return false;
    }
  },

  async listMedia(albumId: string): Promise<any[]> {
    try {
      if (this.isNative) {
        const res = await Filesystem.readdir({ path: `AppFotosSantiSystems/${albumId}`, directory: Directory.Documents });
        const media = [];
        for (const file of res.files) {
          if (file.type === 'file') {
            const isVideo = file.name.endsWith('.mp4') || file.name.endsWith('.webm');
            const content = await Filesystem.readFile({ path: `AppFotosSantiSystems/${albumId}/${file.name}`, directory: Directory.Documents });
            media.push({
              id: file.name,
              name: file.name,
              type: isVideo ? 'video' : 'image',
              url: `data:${isVideo ? 'video/webm' : 'image/jpeg'};base64,${content.data}`,
              timestamp: Date.now()
            });
          }
        }
        return media;
      } else {
        const rootHandle = await idbGet(KEY_ROOT);
        if (!rootHandle) return [];
        const appRoot = await rootHandle.getDirectoryHandle('AppFotosSantiSystems');
        const albumHandle = await appRoot.getDirectoryHandle(albumId);
        const media = [];
        for await (const entry of (albumHandle as any).values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            const isVideo = entry.name.endsWith('.mp4') || entry.name.endsWith('.webm');
            media.push({
              id: entry.name,
              name: entry.name,
              type: isVideo ? 'video' : 'image',
              url: URL.createObjectURL(file),
              timestamp: file.lastModified
            });
          }
        }
        return media;
      }
    } catch {
      return [];
    }
  }
};
