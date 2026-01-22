
# AppFotosSantiSystems 📸

Gestión robusta de fotos y vídeos en local (Web/Android).

## ✨ Funcionalidades en esta versión
- **WEB (FS Access API)**: Los álbumes son subcarpetas reales dentro de una carpeta raíz elegida por el usuario. Las fotos se guardan como archivos `.jpg`.
- **Persistencia**: La carpeta raíz se recuerda mediante IndexedDB. Si el navegador revoca permisos al reiniciar la pestaña, la app permite "Re-autorizar" con un clic.
- **NATIVO (Capacitor)**: Estructura de servicios preparada para el sistema de archivos de Android (`Documents/AppFotosSantiSystems`).
- **Media Real**: El grid de los álbumes lee directamente los archivos físicos, nada queda solo en memoria.

## 🛠 Requisitos Web
Para la gestión de carpetas reales, se requiere un navegador con soporte para **File System Access API** (Chrome, Edge, Opera actualizados).

## 🚀 Instalación
1. `npm install`
2. `npm run dev` (Web)
3. `npx cap sync android` (Android)

SANTISYSTEMS &copy; 2024
