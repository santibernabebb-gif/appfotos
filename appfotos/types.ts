
export enum AppView {
  HOME_GATE = 'HOME_GATE',
  APP_HOME = 'APP_HOME',
  ALBUM_VIEW = 'ALBUM_VIEW'
}

export interface MediaItem {
  id: string;
  name: string;
  type: 'image' | 'video';
  url: string; // Blob URL or path
  timestamp: number;
}

export interface Album {
  id: string;
  name: string;
  mediaCount: number;
}

export interface AppState {
  currentView: AppView;
  selectedAlbumId: string | null;
  folderReady: boolean;
  isNative: boolean;
}
