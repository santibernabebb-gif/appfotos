
import React from 'react';
import { ImageIcon, Play } from 'lucide-react';

interface HomeGateProps {
  onEnter: () => void;
}

const HomeGate: React.FC<HomeGateProps> = ({ onEnter }) => {
  return (
    <div className="antialiased min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-white text-center">
      <div className="mb-8 p-6 bg-blue-600 rounded-[2.5rem] shadow-xl animate-in fade-in zoom-in duration-700">
        <ImageIcon className="w-16 h-16 text-white" />
      </div>
      
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2">AppFotos</h1>
      <p className="text-gray-600 mb-10 max-w-xs font-medium">Gestiona tus álbumes de fotos y vídeos de forma local y privada.</p>

      <div className="w-full max-w-xs space-y-4">
        <button
          onClick={onEnter}
          className="w-full py-5 px-6 bg-blue-600 text-white rounded-2xl flex items-center justify-center gap-3 font-bold text-xl transition-all shadow-lg hover:bg-blue-700 active:scale-95 shadow-blue-200"
        >
          <Play className="w-6 h-6 fill-current" />
          Entrar a la app
        </button>
      </div>

      <div className="mt-12 flex items-start justify-center gap-2 text-gray-400 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 max-w-xs text-left">
        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></div>
        <p className="text-xs font-medium leading-relaxed">Tus archivos se guardan directamente en el almacenamiento de este dispositivo mediante tecnología de sistema de archivos local.</p>
      </div>
      
      <footer className="mt-auto pt-10 text-[10px] text-gray-300 font-mono tracking-widest uppercase">
        SANTISYSTEMS &copy; 2024
      </footer>
    </div>
  );
};

export default HomeGate;
