
import React from 'react';
import { ArrowRight } from 'lucide-react';

interface HomeGateProps {
  onEnter: () => void;
}

const HomeGate: React.FC<HomeGateProps> = ({ onEnter }) => {
  return (
    <div className="relative min-h-screen bg-[#E6E6FA] flex flex-col items-center justify-between p-8 overflow-hidden font-sans select-none text-center">
      
      {/* Elementos decorativos de fondo (Blobs) */}
      <div className="absolute -top-10 -left-10 w-96 h-96 bg-[#D4D4F7] rounded-full filter blur-3xl opacity-60"></div>
      <div className="absolute top-1/2 -right-20 w-80 h-80 bg-[#C7D2FE] rounded-full filter blur-3xl opacity-40 animate-pulse"></div>
      <div className="absolute bottom-20 -left-20 w-80 h-80 bg-[#BDBDF1] rounded-full filter blur-3xl opacity-30"></div>

      {/* Crédito Superior */}
      <div className="absolute top-6 left-0 right-0 z-20 flex justify-center">
        <span className="text-indigo-400/60 text-[10px] font-black uppercase tracking-[0.4em]">
          APPFotos
        </span>
      </div>

      {/* Contenedor de la Imagen Central */}
      <div className="flex-1 flex items-center justify-center z-10 mt-12">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-rose-200 via-purple-300 to-indigo-300 rounded-[3.5rem] scale-125 blur-2xl opacity-50 animate-pulse"></div>
          <div className="absolute inset-0 bg-[#A3E635] rounded-[4rem] scale-110 opacity-20 rotate-6"></div>
          
          <div className="relative w-64 h-64 bg-white rounded-[4.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] flex items-center justify-center p-4">
            <div className="relative w-full h-full rounded-[3.5rem] overflow-hidden shadow-inner group">
              <img 
                src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1000&auto=format&fit=crop" 
                alt="Mis Recuerdos" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Textos y Acción */}
      <div className="w-full max-w-sm z-10 flex flex-col items-center mb-6">
        <h1 className="text-[#4F46E5] text-[3.5rem] leading-[1] font-black tracking-tighter mb-4 drop-shadow-sm uppercase">
          APP <br />
          <span className="text-[#8B5CF6]">FOTOS</span>
        </h1>
        
        <p className="text-[#6366F1] text-base font-bold px-6 mb-14 leading-relaxed">
          Guarda tus momentos más dulces y revive la magia de tus recuerdos en <span className="font-black">APP FOTOS</span>.
        </p>

        <button
          onClick={onEnter}
          className="w-full bg-white text-[#6366F1] py-6 px-10 rounded-[2.5rem] flex items-center justify-center gap-3 font-black text-2xl shadow-[0_15px_35px_rgba(99,102,241,0.2)] hover:scale-[1.02] active:scale-95 transition-all duration-300 group"
        >
          <span>Empezar</span>
          <ArrowRight className="w-7 h-7 group-hover:translate-x-1 transition-transform stroke-[3]" />
        </button>

        <span className="text-[#6366F1]/50 text-[0.65rem] font-black tracking-[0.3em] uppercase mt-8">
          Toca para entrar
        </span>
      </div>

      {/* Barra de inicio inferior minimalista */}
      <div className="w-32 h-1.5 bg-[#6366F1]/10 rounded-full mb-6 z-10"></div>
    </div>
  );
};

export default HomeGate;
