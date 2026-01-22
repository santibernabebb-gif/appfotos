
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

  useEffect(() => {
    checkFolder();

    // Re-comprobar si el usuario vuelve a la app (por si borró la carpeta manualmente)
    const handleRecheck = () => checkFolder();
    window.addEventListener('focus', handleRecheck);
    document.addEventListener('visibilitychange', handleRecheck);

    return () => {
      window.removeEventListener('focus', handleRecheck);
      document.removeEventListener('visibilitychange', handleRecheck);
    };
  }, []);

  const checkFolder = async () => {
    setLoading(true);
    const ready = await storageService.isRootReady();
    setFolderReady(ready);
    
    // Si no está lista pero antes lo estaba, puede que se haya borrado
    if (!ready && !loading) {
       // Opcional: Podríamos poner un error específico aquí si el handle existía pero la subcarpeta no
    }
    
    setLoading(false);
  };

  const handleCreateFolder = async () => {
    setLoading(true);
    setError(null);
    const success = await storageService.selectRootFolder();
    if (success) {
      setFolderReady(true);
    } else {
      setError("No se pudo configurar la carpeta. Asegúrate de que la carpeta raíz contenga 'AppFotosSantiSystems'.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-white text-center">
      <div className="mb-8 p-4 bg-blue-600 rounded-3xl shadow-xl">
        <FolderPlus className="w-16 h-16 text-white" />
      </div>
      
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2">AppFotos</h1>
      <p className="text-gray-600 mb-10 max-w-xs">Tus fotos guardadas localmente en tu sistema de archivos.</p>

      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500 font-medium">Sincronizando sistema de archivos...</p>
        </div>
      ) : (
        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={onEnter}
            disabled={!folderReady}
            className={`w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg transition-all shadow-lg ${
              folderReady 
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Play className="w-6 h-6" />
            Entrar a la app
          </button>

          <button
            onClick={handleCreateFolder}
            className={`w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg border-2 transition-all ${
              !folderReady 
                ? 'border-blue-600 text-blue-600 hover:bg-blue-50 active:scale-95' 
                : 'border-gray-300 text-gray-600 bg-gray-50'
            }`}
          >
            <FolderPlus className="w-6 h-6" />
            {folderReady ? 'Cambiar / Re-autorizar carpeta' : 'Configurar carpeta raíz'}
          </button>

          {folderReady ? (
            <div className="flex items-center justify-center gap-2 text-green-600 mt-4 animate-in fade-in duration-500">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">Carpeta vinculada correctamente</span>
            </div>
          ) : (
             <div className="flex items-start justify-center gap-2 text-amber-600 mt-4 bg-amber-50 p-3 rounded-lg border border-amber-100 text-left">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-medium">Se requiere configurar una carpeta raíz. La app creará dentro la carpeta 'AppFotosSantiSystems'.</p>
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
