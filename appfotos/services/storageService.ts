
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

const APP_DIR_NAME = 'AppFotosSantiSystems';

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((_, rej) => {
    timeoutId = setTimeout(() => {
      console.warn(`AppFotos: TIMEOUT alcanzado en: ${label}`);
      rej(new Error('TIMEOUT:' + label));
    }, ms);
  });
  try {
    return await Promise.race([p, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

export const storageService = {
  isNative: Capacitor.isNativePlatform(),

  // Helpers OPFS para Web
  async getOpfsRoot(): Promise<FileSystemDirectoryHandle> {
    return await navigator.storage.getDirectory();
  },

  async opfsAppDirExists(): Promise<boolean> {
    try {
      // Added type assertion to cast from unknown to FileSystemDirectoryHandle
      const root = await withTimeout(this.getOpfsRoot(), 1000, 'getOpfsRoot') as FileSystemDirectoryHandle;
      await withTimeout(root.getDirectoryHandle(APP_DIR_NAME, { create: false }), 1000, 'getDirectoryHandle-check');
      return true;
    } catch (e) {
      console.log('AppFotos: opfsAppDirExists check fallido o no existe');
      return false;
    }
  },

  async opfsEnsureAppDir(create = true): Promise<FileSystemDirectoryHandle> {
    // Added type assertion to cast from unknown to FileSystemDirectoryHandle
    const root = await withTimeout(this.getOpfsRoot(), 1500, 'getOpfsRoot-ensure') as FileSystemDirectoryHandle;
    return await withTimeout(root.getDirectoryHandle(APP_DIR_NAME, { create }), 1500, 'getDirectoryHandle-ensure') as FileSystemDirectoryHandle;
  },

  // Interface Unificada
  async isRootReady(): Promise<boolean> {
    console.log('AppFotos: Iniciando isRootReady...');
    try {
      if (this.isNative) {
        // Added type assertion to cast from unknown to any to access the 'value' property
        const result = await withTimeout(Preferences.get({ key: 'root_uri' }), 1000, 'native-prefs-get') as any;
        const ready = !!result?.value;
        console.log('AppFotos: isRootReady (Native):', ready);
        return ready;
      } else {
        const ready = await this.opfsAppDirExists();
        console.log('AppFotos: isRootReady (Web/OPFS):', ready);
        return ready;
      }
    } catch (e) {
      console.error('AppFotos: Error en isRootReady:', e);
      return false;
    }
  },

  async ensureAccessOnEnter(): Promise<boolean> {
    console.log('AppFotos: Iniciando ensureAccessOnEnter...');
    try {
      return await withTimeout(this.isRootReady(), 2000, 'ensureAccessOnEnter-rootReady');
    } catch (e) {
      console.error('AppFotos: Error en ensureAccessOnEnter:', e);
      return false;
    }
  },

  async selectRootFolder(): Promise<boolean> {
    console.log('AppFotos: Iniciando selectRootFolder...');
    try {
      if (this.isNative) {
        await withTimeout(Preferences.set({ key: 'root_uri', value: 'content://appfotos_root' }), 1000, 'native-prefs-set');
        await withTimeout(Filesystem.mkdir({ path: APP_DIR_NAME, directory: Directory.Documents, recursive: true }), 1500, 'native-mkdir');
        return true;
      } else {
        await withTimeout(this.opfsEnsureAppDir(true), 2000, 'opfs-mkdir');
        return true;
      }
    } catch (e) {
      console.error('AppFotos: Error configurando carpeta:', e);
      return false;
    }
  },

  async listAlbums(): Promise<any[]> {
    try {
      if (this.isNative) {
        // Added type assertion to cast from unknown to any to access the 'files' property
        const res = await withTimeout(Filesystem.readdir({ path: APP_DIR_NAME, directory: Directory.Documents }), 2000, 'native-readdir') as any;
        return res.files.filter((f: any) => f.type === 'directory').map((f: any) => ({ id: f.name, name: f.name, mediaCount: 0 }));
      } else {
        const appRoot = await this.opfsEnsureAppDir();
        const albums = [];
        // @ts-ignore
        for await (const entry of appRoot.values()) {
          if (entry.kind === 'directory') {
            albums.push({ id: entry.name, name: entry.name, mediaCount: 0 });
          }
        }
        return albums;
      }
    } catch (e) {
      console.error('AppFotos: Error listando álbumes:', e);
      return [];
    }
  },

  async createAlbum(name: string): Promise<boolean> {
    try {
      const cleanName = name.trim().replace(/[^a-z0-9]/gi, '_');
      if (this.isNative) {
        await withTimeout(Filesystem.mkdir({ path: `${APP_DIR_NAME}/${cleanName}`, directory: Directory.Documents, recursive: true }), 1500, 'native-create-album');
        return true;
      } else {
        const appRoot = await this.opfsEnsureAppDir();
        await withTimeout(appRoot.getDirectoryHandle(cleanName, { create: true }), 1500, 'opfs-create-album');
        return true;
      }
    } catch (e) {
      console.error('AppFotos: Error creando álbum:', e);
      return false;
    }
  },

  async saveMedia(albumId: string, blob: Blob, type: 'image' | 'video'): Promise<boolean> {
    try {
      let ext = type === 'image' ? 'jpg' : (blob.type.includes('mp4') ? 'mp4' : 'webm');
      const filename = `${type.toUpperCase()}_${Date.now()}.${ext}`;

      if (this.isNative) {
        const reader = new FileReader();
        const base64: string = await new Promise((res, rej) => {
          reader.onload = () => res(reader.result as string);
          reader.onerror = () => rej(new Error('FileReader error'));
          reader.readAsDataURL(blob);
        });
        await withTimeout(Filesystem.writeFile({
          path: `${APP_DIR_NAME}/${albumId}/${filename}`,
          data: base64.split(',')[1],
          directory: Directory.Documents
        }), 3000, 'native-save-media');
        return true;
      } else {
        const appRoot = await this.opfsEnsureAppDir();
        // Added type assertions to cast from unknown to allow directory and file handle method access
        const albumHandle = await withTimeout(appRoot.getDirectoryHandle(albumId), 1500, 'opfs-get-album-save') as any;
        const fileHandle = await withTimeout(albumHandle.getFileHandle(filename, { create: true }), 1500, 'opfs-get-file-save') as any;
        // @ts-ignore
        const writable = await withTimeout(fileHandle.createWritable(), 2000, 'opfs-create-writable') as any;
        // The cast to any above allows access to write() and close()
        await withTimeout(writable.write(blob), 5000, 'opfs-write-blob');
        await withTimeout(writable.close(), 2000, 'opfs-close-writable');
        return true;
      }
    } catch (e) {
      console.error('AppFotos: Error guardando media:', e);
      return false;
    }
  },

  async listMedia(albumId: string): Promise<any[]> {
    try {
      if (this.isNative) {
        // Added type assertion to cast from unknown to any to access 'files'
        const res = await withTimeout(Filesystem.readdir({ path: `${APP_DIR_NAME}/${albumId}`, directory: Directory.Documents }), 2000, 'native-list-media') as any;
        const media = [];
        for (const file of res.files) {
          if (file.type === 'file') {
            const isVideo = file.name.endsWith('.mp4') || file.name.endsWith('.webm');
            // Added type assertion to cast from unknown to any to access 'data'
            const content = await withTimeout(Filesystem.readFile({ path: `${APP_DIR_NAME}/${albumId}/${file.name}`, directory: Directory.Documents }), 3000, 'native-read-media') as any;
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
        const appRoot = await this.opfsEnsureAppDir();
        // Added type assertion to cast from unknown to any for directory handle access
        const albumHandle = await withTimeout(appRoot.getDirectoryHandle(albumId), 1500, 'opfs-get-album-list') as any;
        const media = [];
        // @ts-ignore
        for await (const entry of albumHandle.values()) {
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
    } catch (e) {
      console.error('AppFotos: Error listando media:', e);
      return [];
    }
  }
};
