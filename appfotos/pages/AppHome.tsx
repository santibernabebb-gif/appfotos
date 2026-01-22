
import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storageService';
import { Album } from '../types';
import { Plus, Search, Trash2, Loader2, ArrowLeft, Home, FolderPlus, Flower } from 'lucide-react';

interface AppHomeProps {
  onBack: () => void;
  onHome: () => void;
  onSelectAlbum: (id: string) => void;
}

const ALBUM_COLORS = [
  'bg-[#CCFF00]', // Lima
  'bg-[#FF00BF]', // Rosa fuerte
  'bg-[#22C55E]', // Verde
  'bg-white text-gray-800', // Blanco
  'bg-[#F97316]', // Naranja
  'bg-[#0EA5E9]', // Azul
];

const AppHome: React.FC<AppHomeProps> = ({ onBack, onHome, onSelectAlbum }) => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    setLoading(true);
    const data = await storageService.listAlbums();
    setAlbums(data);
    setLoading(false);
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;
    const success = await storageService.createAlbum(newAlbumName);
    if (success) {
      setNewAlbumName('');
      setShowModal(false);
      await loadAlbums();
    }
  };

  const handleDeleteAlbum = async (e: React.MouseEvent, albumId: string) => {
    e.stopPropagation();
    if (window.confirm('¿Borrar este álbum y todo su contenido?')) {
      const success = await storageService.deleteAlbum(albumId);
      if (success) {
        setAlbums(prev => prev.filter(a => a.id !== albumId));
      }
    }
  };

  const filteredAlbums = albums.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#00CCD1] flex flex-col font-sans select-none">
      
      {/* Header con botones solicitados */}
      <header className="px-6 pt-8 pb-4 flex items-center justify-between z-10">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-gray-800 shadow-md active:scale-90 transition-transform"
          aria-label="Volver"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Mis Recuerdos</h1>
        
        <button 
          onClick={onHome}
          className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-gray-800 shadow-md active:scale-90 transition-transform"
          aria-label="Inicio"
        >
          <Home className="w-6 h-6" />
        </button>
      </header>

      {/* Search Bar */}
      <div className="px-6 mb-8 z-10">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text"
            placeholder="Buscar en tus recuerdos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/90 backdrop-blur-sm py-5 pl-14 pr-6 rounded-[2rem] text-gray-700 font-medium placeholder:text-gray-400 focus:bg-white outline-none shadow-xl transition-all"
          />
        </div>
      </div>

      {/* Grid de Álbumes */}
      <main className="flex-1 px-6 pb-20 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-white opacity-70" />
            <span className="text-white font-bold tracking-widest uppercase text-xs">Cargando...</span>
          </div>
        ) : filteredAlbums.length > 0 ? (
          <div className="grid grid-cols-2 gap-5">
            {filteredAlbums.map((album, index) => {
              const colorClass = ALBUM_COLORS[index % ALBUM_COLORS.length];
              return (
                <div 
                  key={album.id}
                  onClick={() => onSelectAlbum(album.id)}
                  className={`${colorClass} p-4 rounded-[2.5rem] shadow-2xl flex flex-col relative group active:scale-95 transition-all cursor-pointer`}
                >
                  <div className="w-full aspect-square rounded-[1.8rem] overflow-hidden mb-4 shadow-inner bg-black/5">
                    <img 
                      src={`https://picsum.photos/seed/${album.id}/300/300`} 
                      alt={album.name} 
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  <div className="px-1 flex justify-between items-end">
                    <div>
                      <h3 className="font-bold text-lg leading-tight truncate max-w-[100px]">{album.name}</h3>
                      <p className={`text-[10px] font-black tracking-widest uppercase opacity-60`}>
                        {album.mediaCount || 0} FOTOS
                      </p>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteAlbum(e, album.id)}
                      className="p-2 mb-1 bg-black/10 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-white/60">
            <p className="font-bold italic">No se han encontrado álbumes.</p>
          </div>
        )}
      </main>

      {/* FAB - Botón Flotante */}
      <button 
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-[#F97316] text-white rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(249,115,22,0.5)] active:scale-90 transition-transform z-20 border-2 border-white"
      >
        <Plus className="w-10 h-10 stroke-[3]" />
      </button>

      {/* Modal Nuevo Álbum Rediseñado (Según Imagen) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#F8F9FB] w-full max-w-sm rounded-[3rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 flex flex-col items-center">
            
            {/* Icono de Carpeta con Badge */}
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-[#D1EBE8] rounded-[2rem] flex items-center justify-center shadow-sm">
                <FolderPlus className="w-10 h-10 text-[#007F94] fill-[#007F94]/20" />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 bg-[#FFC107] border-[3px] border-white rounded-full flex items-center justify-center shadow-md">
                <Flower className="w-4 h-4 text-white fill-white" />
              </div>
            </div>

            <h3 className="text-3xl font-bold text-[#1F4D32] mb-2">Nuevo Álbum</h3>
            <p className="text-[#8E9AAF] text-center text-sm mb-10 font-medium">Nombra tu nueva colección privada</p>
            
            <form onSubmit={handleCreateAlbum} className="w-full">
              <div className="relative mb-12">
                <input
                  autoFocus
                  type="text"
                  placeholder="Nombre del álbum..."
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  className="w-full py-5 px-6 bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_4px_15px_rgba(0,0,0,0.02)] outline-none focus:ring-2 focus:ring-[#007F94]/20 text-gray-700 text-center font-medium placeholder:text-gray-300 transition-all"
                />
              </div>

              <div className="flex items-center justify-between gap-4 px-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-[#007F94] font-bold text-lg active:opacity-60 transition-opacity"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-10 py-4 bg-gradient-to-r from-[#2B849F] to-[#D4891C] text-white rounded-[1.5rem] font-bold text-lg shadow-lg active:scale-95 transition-all"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppHome;
