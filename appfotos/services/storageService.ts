
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

const APP_DIR_NAME = 'AppFotosSantiSystems';

export const storageService = {
  isNative: Capacitor.isNativePlatform(),

  // Helpers OPFS para Web
  async getOpfsRoot(): Promise<FileSystemDirectoryHandle> {
    return await navigator.storage.getDirectory();
  },

  async opfsAppDirExists(): Promise<boolean> {
    try {
      const root = await this.getOpfsRoot();
      await root.getDirectoryHandle(APP_DIR_NAME, { create: false });
      return true;
    } catch {
      return false;
    }
  },

  async opfsEnsureAppDir(create = true): Promise<FileSystemDirectoryHandle> {
    const root = await this.getOpfsRoot();
    return await root.getDirectoryHandle(APP_DIR_NAME, { create });
  },

  // Interface Unificada
  async isRootReady(): Promise<boolean> {
    try {
      if (this.isNative) {
        const { value } = await Preferences.get({ key: 'root_uri' });
        return !!value;
      } else {
        return await this.opfsAppDirExists();
      }
    } catch {
      return false;
    }
  },

  async ensureAccessOnEnter(): Promise<boolean> {
    // En OPFS el acceso es implícito si el directorio existe
    return await this.isRootReady();
  },

  async selectRootFolder(): Promise<boolean> {
    try {
      if (this.isNative) {
        await Preferences.set({ key: 'root_uri', value: 'content://appfotos_root' });
        await Filesystem.mkdir({ path: APP_DIR_NAME, directory: Directory.Documents, recursive: true });
        return true;
      } else {
        // En Web simplemente aseguramos que el directorio OPFS existe
        await this.opfsEnsureAppDir(true);
        return true;
      }
    } catch (e) {
      console.error('Error configurando carpeta:', e);
      return false;
    }
  },

  async listAlbums(): Promise<any[]> {
    try {
      if (this.isNative) {
        const res = await Filesystem.readdir({ path: APP_DIR_NAME, directory: Directory.Documents });
        return res.files.filter(f => f.type === 'directory').map(f => ({ id: f.name, name: f.name, mediaCount: 0 }));
      } else {
        const appRoot = await this.opfsEnsureAppDir();
        const albums = [];
        // @ts-ignore - entries() es estándar en handles
        for await (const entry of appRoot.values()) {
          if (entry.kind === 'directory') {
            albums.push({ id: entry.name, name: entry.name, mediaCount: 0 });
          }
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
        await Filesystem.mkdir({ path: `${APP_DIR_NAME}/${cleanName}`, directory: Directory.Documents, recursive: true });
        return true;
      } else {
        const appRoot = await this.opfsEnsureAppDir();
        await appRoot.getDirectoryHandle(cleanName, { create: true });
        return true;
      }
    } catch {
      return false;
    }
  },

  async saveMedia(albumId: string, blob: Blob, type: 'image' | 'video'): Promise<boolean> {
    try {
      let ext = type === 'image' ? 'jpg' : (blob.type.includes('mp4') ? 'mp4' : 'webm');
      const filename = `${type.toUpperCase()}_${Date.now()}.${ext}`;

      if (this.isNative) {
        const reader = new FileReader();
        const base64: string = await new Promise((res) => {
          reader.onload = () => res(reader.result as string);
          reader.readAsDataURL(blob);
        });
        await Filesystem.writeFile({
          path: `${APP_DIR_NAME}/${albumId}/${filename}`,
          data: base64.split(',')[1],
          directory: Directory.Documents
        });
        return true;
      } else {
        const appRoot = await this.opfsEnsureAppDir();
        const albumHandle = await appRoot.getDirectoryHandle(albumId);
        const fileHandle = await albumHandle.getFileHandle(filename, { create: true });
        // @ts-ignore - createWritable es estándar en OPFS
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      }
    } catch (e) {
      console.error('Error guardando media:', e);
      return false;
    }
  },

  async listMedia(albumId: string): Promise<any[]> {
    try {
      if (this.isNative) {
        const res = await Filesystem.readdir({ path: `${APP_DIR_NAME}/${albumId}`, directory: Directory.Documents });
        const media = [];
        for (const file of res.files) {
          if (file.type === 'file') {
            const isVideo = file.name.endsWith('.mp4') || file.name.endsWith('.webm');
            const content = await Filesystem.readFile({ path: `${APP_DIR_NAME}/${albumId}/${file.name}`, directory: Directory.Documents });
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
        const albumHandle = await appRoot.getDirectoryHandle(albumId);
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
    } catch {
      return [];
    }
  }
};
