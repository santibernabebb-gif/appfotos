
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

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

  // Helpers OPFS para Web con creación automática
  async getOpfsRoot(): Promise<FileSystemDirectoryHandle> {
    return await navigator.storage.getDirectory();
  },

  async opfsEnsureAppDir(create = true): Promise<FileSystemDirectoryHandle> {
    const root = await withTimeout(this.getOpfsRoot(), 1500, 'getOpfsRoot-ensure') as FileSystemDirectoryHandle;
    return await withTimeout(root.getDirectoryHandle(APP_DIR_NAME, { create }), 1500, 'getDirectoryHandle-ensure') as FileSystemDirectoryHandle;
  },

  // Inicialización nativa automática
  async ensureNativeAppDir(): Promise<void> {
    if (!this.isNative) return;
    try {
      await withTimeout(Filesystem.mkdir({ 
        path: APP_DIR_NAME, 
        directory: Directory.Documents, 
        recursive: true 
      }), 1500, 'native-ensure-dir');
    } catch (e) {
      // Ignorar si ya existe
    }
  },

  // Funciones de negocio con auto-inicialización
  async listAlbums(): Promise<any[]> {
    try {
      if (this.isNative) {
        await this.ensureNativeAppDir();
        const res = await withTimeout(Filesystem.readdir({ path: APP_DIR_NAME, directory: Directory.Documents }), 2000, 'native-readdir') as any;
        return res.files.filter((f: any) => f.type === 'directory').map((f: any) => ({ id: f.name, name: f.name, mediaCount: 0 }));
      } else {
        const appRoot = await this.opfsEnsureAppDir(true);
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
        await this.ensureNativeAppDir();
        await withTimeout(Filesystem.mkdir({ path: `${APP_DIR_NAME}/${cleanName}`, directory: Directory.Documents, recursive: true }), 1500, 'native-create-album');
        return true;
      } else {
        const appRoot = await this.opfsEnsureAppDir(true);
        await withTimeout(appRoot.getDirectoryHandle(cleanName, { create: true }), 1500, 'opfs-create-album');
        return true;
      }
    } catch (e) {
      console.error('AppFotos: Error creando álbum:', e);
      return false;
    }
  },

  async deleteAlbum(albumId: string): Promise<boolean> {
    try {
      if (this.isNative) {
        await withTimeout(Filesystem.rmdir({
          path: `${APP_DIR_NAME}/${albumId}`,
          directory: Directory.Documents,
          recursive: true
        }), 2000, 'native-delete-album');
        return true;
      } else {
        const appRoot = await this.opfsEnsureAppDir(true);
        // @ts-ignore - removeEntry soporta { recursive: true } en OPFS
        await withTimeout(appRoot.removeEntry(albumId, { recursive: true }), 2000, 'opfs-delete-album');
        return true;
      }
    } catch (e) {
      console.error('AppFotos: Error eliminando álbum:', e);
      return false;
    }
  },

  async saveMedia(albumId: string, blob: Blob, type: 'image' | 'video'): Promise<boolean> {
    try {
      let ext = type === 'image' ? 'jpg' : (blob.type.includes('mp4') ? 'mp4' : 'webm');
      const filename = `${type.toUpperCase()}_${Date.now()}.${ext}`;

      if (this.isNative) {
        await this.ensureNativeAppDir();
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
        const appRoot = await this.opfsEnsureAppDir(true);
        const albumHandle = await withTimeout(appRoot.getDirectoryHandle(albumId), 1500, 'opfs-get-album-save') as any;
        const fileHandle = await withTimeout(albumHandle.getFileHandle(filename, { create: true }), 1500, 'opfs-get-file-save') as any;
        // @ts-ignore
        const writable = await withTimeout(fileHandle.createWritable(), 2000, 'opfs-create-writable') as any;
        await withTimeout(writable.write(blob), 5000, 'opfs-write-blob');
        await withTimeout(writable.close(), 2000, 'opfs-close-writable');
        return true;
      }
    } catch (e) {
      console.error('AppFotos: Error guardando media:', e);
      return false;
    }
  },

  async deleteMedia(albumId: string, fileName: string): Promise<boolean> {
    try {
      if (this.isNative) {
        await withTimeout(Filesystem.deleteFile({
          path: `${APP_DIR_NAME}/${albumId}/${fileName}`,
          directory: Directory.Documents
        }), 2000, 'native-delete-media');
        return true;
      } else {
        const appRoot = await this.opfsEnsureAppDir(true);
        const albumHandle = await withTimeout(appRoot.getDirectoryHandle(albumId), 1500, 'opfs-get-album-delete') as any;
        await withTimeout(albumHandle.removeEntry(fileName), 1500, 'opfs-delete-file');
        return true;
      }
    } catch (e) {
      console.error('AppFotos: Error eliminando media:', e);
      return false;
    }
  },

  async listMedia(albumId: string): Promise<any[]> {
    try {
      if (this.isNative) {
        await this.ensureNativeAppDir();
        const res = await withTimeout(Filesystem.readdir({ path: `${APP_DIR_NAME}/${albumId}`, directory: Directory.Documents }), 2000, 'native-list-media') as any;
        const media = [];
        for (const file of res.files) {
          if (file.type === 'file') {
            const isVideo = file.name.endsWith('.mp4') || file.name.endsWith('.webm');
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
        const appRoot = await this.opfsEnsureAppDir(true);
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
  },

  async ensureAccessOnEnter(): Promise<boolean> {
    return true; 
  }
};
