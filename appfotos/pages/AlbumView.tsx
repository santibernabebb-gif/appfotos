
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, Grid, Image as ImageIcon, Film, X, Loader2, Trash2, CheckCircle2, ArrowLeft, MoreVertical, Search, Umbrella, Home, Folder, Compass, User, Moon } from 'lucide-react';
import { MediaItem } from '../types';
import { storageService } from '../services/storageService';
import { permissionsService } from '../services/permissionsService';
import { cameraService } from '../services/cameraService';
import { Capacitor } from '@capacitor/core';

interface AlbumViewProps {
  albumId: string;
  onBack: () => void;
  onHome: () => void;
}

const AlbumView: React.FC<AlbumViewProps> = ({ albumId, onBack, onHome }) => {
  const [filter, setFilter] = useState<'all' | 'images' | 'videos'>('all');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadContent();
    return () => {
      items.forEach(item => {
        if (item.url.startsWith('blob:')) URL.revokeObjectURL(item.url);
      });
    };
  }, [albumId]);

  // Cerrar búsqueda al pinchar fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearching(false);
        setSearchQuery('');
      }
    };

    if (isSearching) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearching]);

  const loadContent = async () => {
    setLoading(true);
    const media = await storageService.listMedia(albumId);
    setItems(media);
    setLoading(false);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'all') return true;
    if (filter === 'images') return item.type === 'image';
    if (filter === 'videos') return item.type === 'video';
    return true;
  });

  const handleDelete = async (e: React.MouseEvent, item: MediaItem) => {
    e.stopPropagation();
    if (window.confirm('¿Borrar este archivo?')) {
      const success = await storageService.deleteMedia(albumId, item.id);
      if (success) {
        setItems(prev => prev.filter(i => i.id !== item.id));
      } else {
        alert("No se pudo eliminar el archivo.");
      }
    }
  };

  const openInSystemViewer = (item: MediaItem) => {
    window.open(item.url, '_blank');
  };

  const triggerSavedFeedback = () => {
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 1200);
  };

  const openCamera = async (mode: 'photo' | 'video') => {
    const hasCam = await permissionsService.requestCamera();
    let hasMic = true;
    if (mode === 'video') hasMic = await permissionsService.requestMic();

    if (!hasCam || !hasMic) {
      alert("Permisos necesarios denegados.");
      return;
    }

    if (Capacitor.isNativePlatform()) {
      if (mode === 'photo') {
        const photo = await cameraService.capturePhoto();
        if (photo) {
          await storageService.saveMedia(albumId, photo.blob, 'image');
          await loadContent();
        }
      } else {
        alert("Vídeo en Android: Próximamente.");
      }
    } else {
      setCameraMode(mode);
      setIsCameraOpen(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: mode === 'video'
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        alert("Error al acceder a la cámara: " + err);
        setIsCameraOpen(false);
      }
    }
  };

  const closeCamera = async () => {
    if (isRecording) stopWebRecording();
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    setIsCameraOpen(false);
    setIsRecording(false);
    await loadContent();
  };

  const captureWebPhoto = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob(async (blob) => {
        if (blob) {
          const success = await storageService.saveMedia(albumId, blob, 'image');
          if (success) triggerSavedFeedback();
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const startWebRecording = () => {
    if (!streamRef.current) return;
    recordedChunksRef.current = [];
    try {
      const options = { mimeType: 'video/webm;codecs=vp8,opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'video/webm';
      }
      const recorder = new MediaRecorder(streamRef.current, options);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: options.mimeType });
        const success = await storageService.saveMedia(albumId, blob, 'video');
        if (success) triggerSavedFeedback();
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (e) {
      alert("Grabación no soportada en este navegador.");
    }
  };

  const stopWebRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Lógica de textos de estado vacío
  const getEmptyStateTitle = () => {
    if (filter === 'all') return 'Tu carpeta está vacía';
    if (filter === 'images') return 'No hay fotos';
    return 'No hay vídeos';
  };

  const getEmptyStateDescription = () => {
    if (filter === 'all') {
      return 'No se han encontrado archivos.\nCaptura tu primer momento usando\nlos botones de arriba.';
    }
    const type = filter === 'images' ? 'fotos' : 'vídeos';
    return `No se han encontrado ${type} en esta carpeta.`;
  };

  return (
    <div className="min-h-screen bg-[#E6E6FA] flex flex-col font-sans select-none overflow-x-hidden relative">
      
      {/* Crédito Superior */}
      <div className="absolute top-2 left-0 right-0 z-50 flex justify-center opacity-40">
        <span className="text-indigo-900 text-[8px] font-black uppercase tracking-[0.4em]">
          APPFotos
        </span>
      </div>

      {/* Cabecera Estilo Lavanda - Consistente con AppHome */}
      <header className="px-6 pt-10 pb-6 flex items-center justify-between z-10 relative gap-3">
        {!isSearching && (
          <button onClick={onBack} className="flex-shrink-0 w-12 h-12 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-indigo-900 shadow-sm active:scale-90 transition-transform">
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        
        {isSearching ? (
          <div ref={searchRef} className="flex-1 flex items-center bg-white/60 backdrop-blur-lg rounded-full px-4 border border-white/80 animate-in slide-in-from-right-4 duration-300 shadow-sm">
            <Search className="w-4 h-4 text-indigo-400 mr-2" />
            <input 
              autoFocus
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent py-2 text-indigo-900 font-medium placeholder:text-indigo-300 outline-none"
            />
            <button onClick={() => { setIsSearching(false); setSearchQuery(''); }} className="ml-2 text-indigo-400"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <h1 className="text-2xl font-bold text-indigo-900 tracking-tight truncate flex-1 text-center">
            {albumId.replace(/_/g, ' ')}
          </h1>
        )}

        <div className="flex gap-2 flex-shrink-0">
          {!isSearching && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsSearching(true); }}
              className="w-12 h-12 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-indigo-900 shadow-sm active:scale-90 transition-transform"
            >
              <Search className="w-6 h-6" />
            </button>
          )}
          <button 
            onClick={onHome}
            className="w-12 h-12 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-indigo-900 shadow-sm active:scale-90 transition-transform"
            aria-label="Ir al inicio"
          >
            <Home className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Botones de Captura - Retocados para Lavanda */}
      <div className="px-6 z-20 flex gap-4 mb-10">
        <button 
          onClick={() => openCamera('photo')} 
          className="flex-1 bg-white h-14 rounded-2xl flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(0,0,0,0.05)] active:scale-95 transition-all group border border-white"
        >
          <Camera className="w-5 h-5 text-[#FF6B6B]" />
          <span className="font-black text-indigo-900 text-[10px] tracking-wider uppercase">Foto</span>
        </button>
        <button 
          onClick={() => openCamera('video')} 
          className="flex-1 bg-white h-14 rounded-2xl flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(0,0,0,0.05)] active:scale-95 transition-all group border border-white"
        >
          <Video className="w-5 h-5 text-[#FFCC4D]" />
          <span className="font-black text-indigo-900 text-[10px] tracking-wider uppercase">Vídeo</span>
        </button>
      </div>

      {/* Tabs - CENTRADOS (Colores Lavanda) */}
      <div className="px-6 mb-8 flex justify-center gap-3">
        <button onClick={() => setFilter('all')} className={`px-6 py-3 rounded-full font-black text-xs flex items-center gap-2 transition-all ${filter === 'all' ? 'bg-[#6366F1] text-white shadow-lg' : 'bg-white/40 text-indigo-400 border border-white/60'}`}><Grid className="w-4 h-4" /> Todo</button>
        <button onClick={() => setFilter('images')} className={`px-6 py-3 rounded-full font-black text-xs flex items-center gap-2 transition-all ${filter === 'images' ? 'bg-[#6366F1] text-white shadow-lg' : 'bg-white/40 text-indigo-400 border border-white/60'}`}><ImageIcon className="w-4 h-4" /> Fotos</button>
        <button onClick={() => setFilter('videos')} className={`px-6 py-3 rounded-full font-black text-xs flex items-center gap-2 transition-all ${filter === 'videos' ? 'bg-[#6366F1] text-white shadow-lg' : 'bg-white/40 text-indigo-400 border border-white/60'}`}><Film className="w-4 h-4" /> Vídeos</button>
      </div>

      {/* Grid */}
      <main className="flex-1 px-6 pb-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
            <p className="text-indigo-400 font-bold uppercase tracking-widest text-xs">Sincronizando...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map(item => (
              <div key={item.id} onClick={() => openInSystemViewer(item)} className="aspect-square bg-white rounded-[2rem] overflow-hidden relative shadow-md border border-white/80 active:scale-95 transition-transform cursor-pointer group">
                {item.type === 'image' ? <img src={item.url} alt={item.name} className="w-full h-full object-cover" /> : <video src={item.url} className="w-full h-full object-cover" playsInline />}
                <button onClick={(e) => handleDelete(e, item)} className="absolute bottom-3 right-3 bg-red-500 p-2.5 rounded-2xl text-white shadow-lg opacity-0 group-hover:opacity-100 active:scale-90 transition-all z-10"><Trash2 className="w-4 h-4" /></button>
                <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm p-2 rounded-xl text-white pointer-events-none">{item.type === 'video' ? <Film className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 px-6 border-2 border-dashed border-indigo-200 rounded-[3.5rem] flex flex-col items-center justify-center text-center bg-white/20 shadow-inner">
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-[#FEE2E2] rounded-full flex items-center justify-center shadow-sm"><Umbrella className="w-16 h-16 text-indigo-400" /></div>
              <div className="absolute bottom-2 right-2 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-gray-50"><Camera className="w-6 h-6 text-indigo-900" /></div>
            </div>
            <h3 className="text-2xl font-black text-indigo-900 mb-3 whitespace-pre-line">
              {getEmptyStateTitle()}
            </h3>
            <p className="text-indigo-500 text-sm font-medium leading-relaxed whitespace-pre-line">
              {getEmptyStateDescription()}
            </p>
          </div>
        )}
      </main>

      {/* FAB Nocturno */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-900 text-white rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform z-30"><Moon className="w-6 h-6 fill-white" /></button>

      {/* Modal Cámara */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-in fade-in duration-300">
          <div className="p-4 flex justify-between items-center bg-black/90 text-white border-b border-white/10">
            <div className="flex items-center gap-3">
               <span className="font-bold tracking-tighter text-lg">{cameraMode.toUpperCase()}</span>
               {isRecording && <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full animate-pulse"><div className="w-2 h-2 bg-white rounded-full"></div><span className="text-xs font-bold uppercase tracking-widest">REC</span></div>}
            </div>
            <button onClick={closeCamera} className="px-4 py-2 bg-white/10 rounded-xl font-bold text-sm flex items-center gap-2"><X className="w-5 h-5" /> Salir</button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden bg-zinc-900 relative">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
            {showSavedFeedback && <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none animate-in fade-in zoom-in duration-300"><div className="bg-green-600/90 text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl"><CheckCircle2 className="w-8 h-8" /><span className="font-black text-xl">GUARDADO</span></div></div>}
          </div>
          <div className="p-10 flex flex-col items-center gap-6 bg-black/90">
            <button onClick={cameraMode === 'photo' ? captureWebPhoto : (isRecording ? stopWebRecording : startWebRecording)} className={`relative flex items-center justify-center w-24 h-24 rounded-full transition-all active:scale-90 ${isRecording ? 'bg-white' : 'bg-transparent border-4 border-white'}`}><div className={`transition-all duration-300 ${isRecording ? 'w-10 h-10 bg-red-600 rounded-lg' : (cameraMode === 'photo' ? 'w-18 h-18 bg-white rounded-full' : 'w-16 h-16 bg-red-600 rounded-full')}`} /></button>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{isRecording ? 'Detener' : 'Capturar'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlbumView;
