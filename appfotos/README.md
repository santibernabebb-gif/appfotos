
# AppFotosSantiSystems

Aplicación de gestión de álbumes local compatible con Web (PWA) y Android (Capacitor).

## 🚀 Ejecución Web (PWA)
Para ejecutar la aplicación en el navegador o desplegarla en Cloudflare Pages:

1. Instalar dependencias: `npm install`
2. Ejecutar modo desarrollo: `npm run dev`
3. Generar build: `npm run build`

**Nota Web:** Utiliza la *File System Access API*. La primera vez deberás elegir una carpeta raíz (recomendado en Imágenes). El navegador solicitará permiso de edición cada vez que reinicies si no se ha persistido el handle en IndexedDB.

## 📱 Ejecución Android (Capacitor)
Preparado para ser compilado con Capacitor:

1. Instalar Capacitor si no está: `npm install @capacitor/cli @capacitor/core`
2. Inicializar proyecto: `npx cap init AppFotosSantiSystems com.santisystems.appfotos`
3. Añadir plataforma Android: `npx cap add android`
4. Sincronizar cambios tras cada build: `npm run build && npx cap sync`
5. Abrir en Android Studio: `npx cap open android`

**Nota Android:** Se utiliza la estructura de carpetas en `Documents/AppFotosSantiSystems`. Los permisos de cámara y almacenamiento se solicitan bajo demanda.

## 🛠 Limitaciones
- **WEB:** La grabación de vídeo depende del soporte de `MediaRecorder` del navegador. El acceso a carpetas está limitado por la API del Sistema de Archivos del navegador.
- **ANDROID:** El guardado persistente utiliza la API de Preferencias para el URI raíz. La función de vídeo en este prototipo está marcada como stub para integración futura con un plugin de captura específico.

SANTISYSTEMS - Código robusto y estable.
