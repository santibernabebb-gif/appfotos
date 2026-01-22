
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
  }, [loading, selectingFolder]);

  const checkFolder = async () => {
    setLoading(true);
    const startTime = Date.now();
    try {
      const ready = await storageService.isRootReady();
      setFolderReady(ready);
      setError(null);
    } catch (e) {
      console.error('Check folder error:', e);
      setFolderReady(false);
      setError("Error al sincronizar el sistema de archivos local.");
    } finally {
      // Garantizar un mínimo de feedback visual para evitar parpadeos bruscos
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, 300 - elapsed);
      setTimeout(() => setLoading(false), delay);
    }
  };

  const handleCreateFolder = async () => {
    setError(null);
    setSelectingFolder(true);
    try {
      const success = await storageService.selectRootFolder();
      if (success) {
        await checkFolder();
      } else {
        setError("No se pudo inicializar el almacenamiento local.");
      }
    } catch (e) {
      console.error('Handle create folder error:', e);
      setError("Error al configurar el sistema de archivos.");
    } finally {
      setSelectingFolder(false);
    }
  };

  const handleEnter = async () => {
    setError(null);
    setLoading(true);
    try {
      const hasAccess = await storageService.ensureAccessOnEnter();
      if (hasAccess) {
        onEnter();
      } else {
        setFolderReady(false);
        setError("No se pudo acceder a la carpeta. Por favor, vuelve a configurarla.");
      }
    } catch (e) {
      setError("Error al verificar acceso local.");
    } finally {
      setLoading(false);
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
