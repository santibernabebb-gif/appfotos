
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export const cameraService = {
  async capturePhoto(): Promise<{ blob: Blob; mimeType: string } | null> {
    if (Capacitor.isNativePlatform()) {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });
      if (image.webPath) {
        const res = await fetch(image.webPath);
        const blob = await res.blob();
        return { blob, mimeType: 'image/jpeg' };
      }
      return null;
    } else {
      // En Web delegamos la UI de captura a un componente, pero este servicio
      // puede retornar la lógica de procesamiento de blobs si fuera necesario.
      return null; 
    }
  }
};
