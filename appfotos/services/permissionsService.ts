
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';

export const permissionsService = {
  async requestCamera(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      const status = await Camera.requestPermissions();
      return status.camera === 'granted';
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());
        return true;
      } catch {
        return false;
      }
    }
  },

  async requestMic(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      // Implementación nativa de permisos de audio si fuera necesario
      return true; 
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        return true;
      } catch {
        return false;
      }
    }
  }
};
