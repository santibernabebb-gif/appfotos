
import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storageService';
import { Album } from '../types';
import { Plus, FolderOpen, ChevronRight, Trash2, Loader2 } from 'lucide-react';
import TopBar from '../components/TopBar';

interface AppHomeProps {
  onBack: () => void;
  onHome: () => void;
  onSelectAlbum: (id: string) => void;
}

const AppHome: React.FC<AppHomeProps> = ({ onBack, onHome, onSelectAlbum }) => {
  const [albums, setAlbums] = useState<Album[]>([]);
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
      onSelectAlbum(newAlbumName.trim().replace(/[^a-z0-9]/gi, '_'));
    }
  };

  const handleDeleteAlbum = async (e: React.MouseEvent, albumId: string) => {
    e.stopPropagation();
    if (window.confirm('¿Borrar este álbum y todo su contenido?')) {
      const success = await storageService.deleteAlbum(albumId);
      if (success) {
        setAlbums(prev => prev.filter(a => a.id !== albumId));
      } else {
        alert("No se pudo eliminar el álbum.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopBar title="Mis Álbumes" onBack={onBack} onHome={onHome} />

      <main className="p-4 max-w-2xl mx-auto">
        <button
          onClick={() => setShowModal(true)}
          className="w-full mb-6 bg-white border-2 border-dashed border-blue-300 p-8 rounded-3xl flex flex-col items-center gap-2 text-blue-600 hover:border-blue-500 hover:bg-blue-50 transition-all active:scale-[0.98]"
        >
          <Plus className="w-10 h-10" />
          <span className="font-bold text-lg">Crear nuevo álbum</span>
        </button>

        <h2 className="text-gray-400 uppercase text-xs font-bold tracking-widest mb-4 px-2">Carpetas detectadas</h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            <span className="text-sm text-gray-400">Escaneando archivos...</span>
          </div>
        ) : albums.length > 0 ? (
          <div className="grid gap-3">
            {albums.map((album) => (
              <button
                key={album.id}
                onClick={() => onSelectAlbum(album.id)}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow active:scale-[0.99] group"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800">{album.name}</p>
                    <p className="text-xs text-gray-400">Álbum local</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDeleteAlbum(e, album.id)}
                    className="p-3 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    aria-label="Borrar álbum"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p>No hay álbumes todavía.</p>
            <p className="text-sm">Pulsa arriba para crear el primero.</p>
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-4">Nuevo Álbum</h3>
            <form onSubmit={handleCreateAlbum}>
              <input
                autoFocus
                type="text"
                placeholder="Nombre del álbum..."
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                className="w-full p-4 bg-gray-100 rounded-xl mb-6 outline-none focus:ring-2 focus:ring-blue-500 border-none font-medium"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
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
