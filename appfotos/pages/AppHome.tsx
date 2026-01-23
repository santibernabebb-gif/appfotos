
import React, { useEffect, useState, useRef } from 'react';
import { storageService } from '../services/storageService';
import { Album } from '../types';
import { Plus, Search, Trash2, Loader2, ArrowLeft, Home, FolderPlus, Flower, Pencil, Edit2, X, Calendar, ArrowRight, AlertCircle } from 'lucide-react';

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
  const [appliedFilter, setAppliedFilter] = useState('');
  const [isSearchingFeedback, setIsSearchingFeedback] = useState(false);
  const [noResultsMessage, setNoResultsMessage] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [renamingAlbumId, setRenamingAlbumId] = useState<string | null>(null);
  const [renameInputValue, setRenameInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    setLoading(true);
    const data = await storageService.listAlbums();
    data.sort((a, b) => b.createdAt - a.createdAt);
    setAlbums(data);
    setLoading(false);
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;
    const success = await storageService.createAlbum(newAlbumName);
    if (success) {
      setNewAlbumName('');
      setShowCreateModal(false);
      await loadAlbums();
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingAlbumId || !renameInputValue.trim()) return;
    const success = await storageService.renameAlbum(renamingAlbumId, renameInputValue);
    if (success) {
      setShowRenameModal(false);
      setRenamingAlbumId(null);
      await loadAlbums();
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleApplySearch = () => {
    if (!searchQuery.trim()) return;
    
    const term = searchQuery.trim().toLowerCase();
    setIsSearchingFeedback(true);
    
    if (searchInputRef.current) searchInputRef.current.blur();

    const resultsFound = albums.some(a => 
      a.name.toLowerCase().includes(term) || 
      formatDate(a.createdAt).toLowerCase().includes(term)
    );

    setTimeout(() => {
      setIsSearchingFeedback(false);
      setSearchQuery('');

      if (resultsFound) {
        setAppliedFilter(term);
        setNoResultsMessage(false);
      } else {
        setNoResultsMessage(true);
        setTimeout(() => {
          setNoResultsMessage(false);
          setAppliedFilter('');
        }, 1500); 
      }
    }, 1000);
  };

  const clearFilter = () => {
    setAppliedFilter('');
    setSearchQuery('');
  };

  const activeSearchTerm = appliedFilter || searchQuery;
  const filteredAlbums = albums.filter(a => {
    if (!activeSearchTerm) return true;
    const query = activeSearchTerm.toLowerCase();
    return a.name.toLowerCase().includes(query) || formatDate(a.createdAt).toLowerCase().includes(query);
  });

  return (
    <div className="min-h-screen bg-[#E6E6FA] flex flex-col font-sans select-none relative">
      
      <div className="absolute top-2 left-0 right-0 z-0 flex justify-center opacity-30">
        <span className="text-indigo-900 text-[8px] font-black uppercase tracking-[0.4em]">
          APPFotos
        </span>
      </div>

      <header className="px-6 pt-10 pb-6 flex items-center justify-between z-10">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-indigo-900 shadow-sm active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <h1 className="text-2xl font-bold text-indigo-900 tracking-tight">Mis Recuerdos</h1>
        
        <button 
          onClick={onHome}
          className="w-12 h-12 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-indigo-900 shadow-sm active:scale-90 transition-transform"
        >
          <Home className="w-6 h-6" />
        </button>
      </header>

      <div className="px-6 mb-4 z-10">
        <div className="relative flex items-center">
          <Search className="absolute left-5 w-5 h-5 text-indigo-300 pointer-events-none" />
          <input 
            ref={searchInputRef}
            type="text"
            placeholder="Busca un recuerdo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplySearch()}
            className="w-full bg-white/80 backdrop-blur-sm py-5 pl-14 pr-24 rounded-[2rem] text-gray-700 font-medium placeholder:text-indigo-200 focus:bg-white outline-none shadow-xl transition-all"
          />
          <div className="absolute right-3 flex items-center gap-1">
            {(searchQuery || appliedFilter) && (
              <button 
                onClick={clearFilter}
                className="p-2 text-indigo-300 hover:text-indigo-500"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={handleApplySearch}
              className={`p-3 rounded-full transition-all active:scale-90 ${searchQuery ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-300'}`}
              disabled={!searchQuery}
            >
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </div>

        {isSearchingFeedback && (
          <div className="mt-4 flex items-center justify-center gap-2 py-1 animate-in fade-in duration-200">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Localizando...</span>
          </div>
        )}

        {noResultsMessage && (
          <div className="mt-4 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-500 rounded-full animate-in zoom-in duration-200">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-bold">No se ha encontrado nada</span>
          </div>
        )}

        {appliedFilter && !isSearchingFeedback && !noResultsMessage && (
          <div className="mt-4 flex justify-end">
            <button 
              onClick={clearFilter}
              className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
            >
              Ver todos los álbumes
            </button>
          </div>
        )}
      </div>

      <main className="flex-1 px-6 pb-12 overflow-y-auto">
        {loading || isSearchingFeedback ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-400 opacity-70" />
            <span className="text-indigo-400 font-bold tracking-widest uppercase text-xs">Cargando...</span>
          </div>
        ) : filteredAlbums.length > 0 ? (
          <div className="grid grid-cols-2 gap-5">
            {filteredAlbums.map((album, index) => {
              const colorClass = ALBUM_COLORS[index % ALBUM_COLORS.length];
              const mediaCount = album.mediaCount || 0;
              const countLabel = mediaCount === 1 ? 'FOTO' : 'ARCHIVOS';

              return (
                <div 
                  key={album.id}
                  onClick={() => onSelectAlbum(album.id)}
                  className={`${colorClass} p-4 rounded-[2.5rem] shadow-2xl flex flex-col relative group active:scale-95 transition-all cursor-pointer overflow-hidden border border-white/20`}
                >
                  <div className="w-full aspect-square rounded-[1.8rem] overflow-hidden mb-4 shadow-inner bg-black/5">
                    <img 
                      src={`https://picsum.photos/seed/${album.id}/300/300`} 
                      alt={album.name} 
                      className="w-full h-full object-cover opacity-90 transition-opacity"
                    />
                  </div>
                  <div className="px-1 flex justify-between items-start mb-1">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-bold text-lg leading-tight truncate text-indigo-950">{album.name}</h3>
                      <p className={`text-[10px] font-black tracking-widest uppercase opacity-60 text-indigo-900`}>
                        {mediaCount} {countLabel}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setRenamingAlbumId(album.id); setRenameInputValue(album.name); setShowRenameModal(true); }}
                        className="p-2.5 bg-black/5 rounded-full text-indigo-950 active:scale-90"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={async (e) => { e.stopPropagation(); if(window.confirm('¿Borrar álbum?')) { await storageService.deleteAlbum(album.id); loadAlbums(); } }}
                        className="p-2.5 bg-black/5 rounded-full text-indigo-950 active:scale-90"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-auto pt-2 flex items-center gap-1 opacity-40 text-indigo-950">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[9px] font-bold uppercase tracking-tighter">
                      {formatDate(album.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          !noResultsMessage && (
            <div className="text-center py-20 px-10">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FolderPlus className="w-10 h-10 text-indigo-300" />
              </div>
              <p className="font-bold italic text-indigo-300 text-lg">Tu galería está esperando...</p>
            </div>
          )
        )}
      </main>

      <button 
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-[#6366F1] text-white rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(99,102,241,0.4)] active:scale-90 transition-transform z-20 border-2 border-white"
      >
        <Plus className="w-10 h-10 stroke-[3]" />
      </button>

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-indigo-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#F8F9FB] w-full max-w-sm rounded-[3rem] p-10 shadow-2xl flex flex-col items-center">
            <h3 className="text-2xl font-black text-indigo-950 mb-6 uppercase tracking-tighter">Nuevo Álbum</h3>
            <form onSubmit={handleCreateAlbum} className="w-full">
              <input
                autoFocus
                type="text"
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                placeholder="Nombra tu recuerdo..."
                className="w-full py-5 px-6 bg-white rounded-[1.5rem] border border-gray-100 outline-none text-center font-medium mb-10 text-gray-700"
              />
              <div className="flex justify-between gap-4 px-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="text-indigo-400 font-bold">Cerrar</button>
                <button type="submit" className="px-10 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-bold shadow-lg">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRenameModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-indigo-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#F8F9FB] w-full max-w-sm rounded-[3rem] p-10 shadow-2xl flex flex-col items-center">
            <h3 className="text-2xl font-black text-indigo-950 mb-6 uppercase tracking-tighter">Renombrar</h3>
            <form onSubmit={handleRenameSubmit} className="w-full">
              <input
                autoFocus
                type="text"
                value={renameInputValue}
                onChange={(e) => setRenameInputValue(e.target.value)}
                className="w-full py-5 px-6 bg-white rounded-[1.5rem] border border-gray-100 outline-none text-center font-medium mb-10 text-gray-700"
              />
              <div className="flex justify-between gap-4 px-4">
                <button type="button" onClick={() => setShowRenameModal(false)} className="text-indigo-400 font-bold">Cancelar</button>
                <button type="submit" className="px-10 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-bold shadow-lg">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppHome;
