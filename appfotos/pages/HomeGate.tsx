
import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storageService';
import { FolderPlus, Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface HomeGateProps {
  onEnter: () => void;
}

const HomeGate: React.FC<HomeGateProps> = ({ onEnter }) => {
  const [loading, setLoading] = useState(true);
  const [folderReady, setFolderReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectingFolder, setSelectingFolder] = useState(false);

  useEffect(() => {
    checkFolder();

    const handleRecheck = () => {
      if (!loading && !selectingFolder && document.visibilityState === 'visible') {
        checkFolder();
      }
    };

    window.addEventListener('focus', handleRecheck);
    document.addEventListener('visibilitychange', handleRecheck);

    return () => {
      window.removeEventListener('focus', handleRecheck);
      document.removeEventListener('visibilitychange', handleRecheck);
    };
  }, []);

  const checkFolder = async () => {
    console.log('AppFotos: Inicio checkFolder');
    setLoading(true);
    setError(null);
    const startTime = Date.now();

    // Temporizador de seguridad global de 3 segundos
    const safetyTimeout = setTimeout(() => {
      console.warn('AppFotos: Safety timeout disparado en HomeGate');
      setError("La sincronización está tardando demasiado. Reintenta configurar la carpeta.");
      setLoading(false);
    }, 3000);

    try {
      const ready = await storageService.isRootReady();
      console.log('AppFotos: Resultado isRootReady:', ready);
      setFolderReady(ready);
    } catch (e) {
      console.error('AppFotos: Excepción en checkFolder:', e);
      setFolderReady(false);
      setError("Error crítico al sincronizar el sistema de archivos.");
    } finally {
      clearTimeout(safetyTimeout);
      // Feedback visual mínimo de 250ms
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, 250 - elapsed);
      setTimeout(() => {
        setLoading(false);
        console.log('AppFotos: Fin checkFolder');
      }, delay);
    }
  };

  const handleCreateFolder = async () => {
    console.log('AppFotos: Inicio handleCreateFolder');
    setError(null);
    setSelectingFolder(true);
    try {
      const success = await storageService.selectRootFolder();
      console.log('AppFotos: Resultado selectRootFolder:', success);
      if (success) {
        await checkFolder();
      } else {
        setError("No se pudo configurar el almacenamiento local.");
      }
    } catch (e) {
      console.error('AppFotos: Error en handleCreateFolder:', e);
      setError("Error al configurar el sistema de archivos.");
    } finally {
      setSelectingFolder(false);
      console.log('AppFotos: Fin handleCreateFolder');
    }
  };

  const handleEnter = async () => {
    console.log('AppFotos: Inicio handleEnter');
    setError(null);
    setLoading(true);
    try {
      const hasAccess = await storageService.ensureAccessOnEnter();
      console.log('AppFotos: Resultado ensureAccessOnEnter:', hasAccess);
      if (hasAccess) {
        onEnter();
      } else {
        setFolderReady(false);
        setError("No se pudo acceder a los archivos. Por favor, re-configura la carpeta.");
      }
    } catch (e) {
      console.error('AppFotos: Error en handleEnter:', e);
      setError("Error al verificar acceso local.");
    } finally {
      setLoading(false);
      console.log('AppFotos: Fin handleEnter');
    }
  };

  return (
    <div className="antialiased min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-white text-center">
      <div className="mb-8 p-4 bg-blue-600 rounded-3xl shadow-xl">
        <FolderPlus className="w-16 h-16 text-white" />
      </div>
      
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2">AppFotos</h1>
      <p className="text-gray-600 mb-10 max-w-xs">Tus fotos guardadas localmente en tu sistema de archivos.</p>

      {loading && !selectingFolder ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500 font-medium">Sincronizando sistema de archivos...</p>
        </div>
      ) : (
        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={handleEnter}
            disabled={!folderReady || selectingFolder}
            className={`w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg transition-all shadow-lg ${
              folderReady && !selectingFolder
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Play className="w-6 h-6" />
            Entrar a la app
          </button>

          <button
            onClick={handleCreateFolder}
            disabled={selectingFolder}
            className={`w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg border-2 transition-all ${
              !folderReady 
                ? 'border-blue-600 text-blue-600 hover:bg-blue-50 active:scale-95' 
                : 'border-gray-300 text-gray-600 bg-gray-50'
            } ${selectingFolder ? 'opacity-50 cursor-wait' : ''}`}
          >
            {selectingFolder ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <FolderPlus className="w-6 h-6" />
            )}
            {selectingFolder ? 'Configurando...' : folderReady ? 'Cambiar / Reiniciar carpeta' : 'Crear carpeta en local'}
          </button>

          {folderReady && !selectingFolder ? (
            <div className="flex items-center justify-center gap-2 text-green-600 mt-4 animate-in fade-in duration-500">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">Almacenamiento local listo</span>
            </div>
          ) : !selectingFolder && (
             <div className="flex items-start justify-center gap-2 text-amber-600 mt-4 bg-amber-50 p-3 rounded-lg border border-amber-100 text-left">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-medium">Se requiere crear una carpeta local privada para guardar tus álbumes de forma segura en este navegador.</p>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center gap-2 text-red-500 mt-4 bg-red-50 p-3 rounded-lg border border-red-100">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      )}
      
      <footer className="mt-auto pt-10 text-xs text-gray-400 font-mono tracking-widest">
        SANTISYSTEMS &copy; 2024
      </footer>
    </div>
  );
};

export default HomeGate;
