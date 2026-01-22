
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

const IDB_NAME = 'AppFotosSantiDB';
const STORE_NAME = 'handles';
const KEY_ROOT = 'rootHandle';

async function getStore(): Promise<IDBObjectStore> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME));
    request.onerror = () => reject(request.error);
  });
}

export const storageService = {
  isNative: Capacitor.isNativePlatform(),

  async isRootReady(): Promise<boolean> {
    if (this.isNative) {
      const { value } = await Preferences.get({ key: 'root_uri' });
      return !!value;
    } else {
      const store = await getStore();
      const handle: any = await new Promise(res => {
        const req = store.get(KEY_ROOT);
        req.onsuccess = () => res(req.result);
      });
      if (!handle) return false;
      
      const status = await handle.queryPermission({ mode: 'readwrite' });
      if (status === 'denied') return false;

      // Si es 'prompt', intentamos comprobar la existencia igual. 
      // Si el acceso falla por falta de permiso, el catch devolverá false.
      try {
        await handle.getDirectoryHandle('AppFotosSantiSystems', { create: false });
        return true;
      } catch (e) {
        return false; 
      }
    }
  },

  async selectRootFolder(): Promise<boolean> {
    if (this.isNative) {
      await Preferences.set({ key: 'root_uri', value: 'content://appfotos_root' });
      await Filesystem.mkdir({ path: 'AppFotosSantiSystems', directory: Directory.Documents, recursive: true });
      return true;
    } else {
      try {
        const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
        
        // Pedir permiso explícito antes de guardar
        const perm = await handle.requestPermission({ mode: 'readwrite' });
        if (perm !== 'granted') return false;

        const store = await getStore();
        store.put(handle, KEY_ROOT);
        
        // Asegurar que la subcarpeta existe
        await handle.getDirectoryHandle('AppFotosSantiSystems', { create: true });
        return true;
      } catch { return false; }
    }
  },

  async listAlbums(): Promise<any[]> {
    if (this.isNative) {
      try {
        const res = await Filesystem.readdir({ path: 'AppFotosSantiSystems', directory: Directory.Documents });
        return res.files.filter(f => f.type === 'directory').map(f => ({ id: f.name, name: f.name }));
      } catch { return []; }
    } else {
      const store = await getStore();
      const rootHandle: any = await new Promise(res => {
        const req = store.get(KEY_ROOT);
        req.onsuccess = () => res(req.result);
      });
      if (!rootHandle) return [];
      try {
        const appRoot = await rootHandle.getDirectoryHandle('AppFotosSantiSystems');
        const albums = [];
        for await (const entry of (appRoot as any).values()) {
          if (entry.kind === 'directory') albums.push({ id: entry.name, name: entry.name });
        }
        return albums;
      } catch { return []; }
    }
  },

  async createAlbum(name: string): Promise<boolean> {
    const cleanName = name.trim().replace(/[^a-z0-9]/gi, '_');
    if (this.isNative) {
      await Filesystem.mkdir({ path: `AppFotosSantiSystems/${cleanName}`, directory: Directory.Documents, recursive: true });
      return true;
    } else {
      const store = await getStore();
      const rootHandle: any = await new Promise(res => {
        const req = store.get(KEY_ROOT);
        req.onsuccess = () => res(req.result);
      });
      const appRoot = await rootHandle.getDirectoryHandle('AppFotosSantiSystems', { create: true });
      await appRoot.getDirectoryHandle(cleanName, { create: true });
      return true;
    }
  },

  async saveMedia(albumId: string, blob: Blob, type: 'image' | 'video'): Promise<boolean> {
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
      const store = await getStore();
      const rootHandle: any = await new Promise(res => {
        const req = store.get(KEY_ROOT);
        req.onsuccess = () => res(req.result);
      });
      const appRoot = await rootHandle.getDirectoryHandle('AppFotosSantiSystems');
      const albumHandle = await appRoot.getDirectoryHandle(albumId);
      const fileHandle = await albumHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    }
  },

  async listMedia(albumId: string): Promise<any[]> {
    if (this.isNative) {
      try {
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
      } catch { return []; }
    } else {
      const store = await getStore();
      const rootHandle: any = await new Promise(res => {
        const req = store.get(KEY_ROOT);
        req.onsuccess = () => res(req.result);
      });
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
  }
};
