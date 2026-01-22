
import React from 'react';
import { Camera, ArrowRight, Moon } from 'lucide-react';

interface HomeGateProps {
  onEnter: () => void;
}

const HomeGate: React.FC<HomeGateProps> = ({ onEnter }) => {
  return (
    <div className="relative min-h-screen bg-[#00CCD1] flex flex-col items-center justify-between p-8 overflow-hidden font-sans select-none text-center">
      
      {/* Elementos decorativos de fondo (Blobs) */}
      <div className="absolute -top-10 -left-10 w-96 h-96 bg-[#17AAB1] rounded-full filter blur-3xl opacity-60"></div>
      <div className="absolute top-1/2 -right-20 w-80 h-80 bg-[#4ADE80] rounded-full filter blur-3xl opacity-40 animate-pulse"></div>
      <div className="absolute bottom-20 -left-20 w-80 h-80 bg-[#10B981] rounded-full filter blur-3xl opacity-30"></div>

      {/* Icono de modo noche */}
      <div className="absolute top-10 right-10 z-20">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center border border-white/10 shadow-lg">
          <Moon className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Contenedor del Icono Central */}
      <div className="flex-1 flex items-center justify-center z-10 mt-12">
        <div className="relative">
          {/* Capas de resplandor de colores detrás del icono */}
          <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400 via-green-400 to-cyan-400 rounded-[3.5rem] scale-125 blur-2xl opacity-50"></div>
          <div className="absolute inset-0 bg-[#A3E635] rounded-[3.5rem] scale-110 opacity-60 rotate-3"></div>
          
          {/* El cuadrado blanco con el logo */}
          <div className="relative w-52 h-52 bg-white rounded-[4rem] shadow-2xl flex items-center justify-center p-9">
            <div className="relative w-full h-full bg-gradient-to-b from-[#40A9FF] to-[#1890FF] rounded-[2.5rem] flex items-center justify-center shadow-[inset_0_2px_10px_rgba(255,255,255,0.4)]">
              <Camera className="w-20 h-20 text-white stroke-[2]" />
              {/* Punto rojo de "grabando" */}
              <div className="absolute top-4 right-4 w-5 h-5 bg-[#FF4D4F] border-[3px] border-white rounded-full shadow-md"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Textos y Acción */}
      <div className="w-full max-w-sm z-10 flex flex-col items-center mb-6">
        <h1 className="text-white text-[3.5rem] leading-[1] font-black tracking-tighter mb-4 drop-shadow-sm uppercase">
          APP <br />
          <span className="text-[#CCFF00]">FOTOS</span>
        </h1>
        
        <p className="text-white/95 text-base font-bold px-6 mb-14 leading-relaxed">
          La forma más vibrante de organizar y revivir tus momentos favoritos ahí en <span className="font-black">APP FOTOS</span>.
        </p>

        <button
          onClick={onEnter}
          className="w-full bg-white text-[#00CCD1] py-6 px-10 rounded-[2.5rem] flex items-center justify-center gap-3 font-black text-2xl shadow-[0_15px_35px_rgba(0,0,0,0.1)] hover:scale-[1.02] active:scale-95 transition-all duration-300 group"
        >
          <span>Empezar</span>
          <ArrowRight className="w-7 h-7 group-hover:translate-x-1 transition-transform stroke-[3]" />
        </button>

        <span className="text-white/70 text-[0.65rem] font-black tracking-[0.3em] uppercase mt-8">
          Toca para entrar
        </span>
      </div>

      {/* Barra de inicio inferior */}
      <div className="w-32 h-1.5 bg-white/30 rounded-full mb-2"></div>
    </div>
  );
};

export default HomeGate;
