
import React from 'react';
import { ArrowLeft, Home } from 'lucide-react';

interface TopBarProps {
  title: string;
  onBack?: () => void;
  onHome: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ title, onBack, onHome }) => {
  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3 overflow-hidden">
        {onBack && (
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
        )}
        <h1 className="text-xl font-bold truncate text-gray-800">{title}</h1>
      </div>
      <button 
        onClick={onHome}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Inicio"
      >
        <Home className="w-6 h-6 text-gray-700" />
      </button>
    </div>
  );
};

export default TopBar;
