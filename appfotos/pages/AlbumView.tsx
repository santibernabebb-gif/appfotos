
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, Grid, Image as ImageIcon, Film, X, Loader2, Trash2, CheckCircle2 } from 'lucide-react';
import TopBar from '../components/TopBar';
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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    loadContent();
    return () => {
      items.forEach(item => {
        if (item.url.startsWith('blob:')) URL.revokeObjectURL(item.url);
      });
    };
  }, [albumId]);

  const loadContent = async () => {
    setLoading(true);
    const media = await storageService.listMedia(albumId);
    setItems(media);
    setLoading(false);
  };

  const filteredItems = items.filter(item => {
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

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <TopBar title={albumId.replace(/_/g, ' ')} onBack={onBack} onHome={onHome} />

      <div className="p-4 flex gap-3">
        <button 
          onClick={() => openCamera('photo')}
          className="flex-1 bg-blue-600 text-white p-6 rounded-3xl flex flex-col items-center gap-2 shadow-lg active:scale-95 transition-all"
        >
          <Camera className="w-8 h-8" />
          <span className="font-bold">Hacer Foto</span>
        </button>
        <button 
          onClick={() => openCamera('video')}
          className="flex-1 bg-gray-800 text-white p-6 rounded-3xl flex flex-col items-center gap-2 shadow-lg active:scale-95 transition-all"
        >
          <Video className="w-8 h-8" />
          <span className="font-bold">Grabar Vídeo</span>
        </button>
      </div>

      <div className="px-4 mb-4 flex gap-2 overflow-x-auto pb-2">
        {(['all', 'images', 'videos'] as const).map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${filter === f ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-500 shadow-sm border border-gray-100'}`}
          >
            {f === 'all' && <Grid className="w-4 h-4" />}
            {f === 'images' && <ImageIcon className="w-4 h-4" />}
            {f === 'videos' && <Film className="w-4 h-4" />}
            {f === 'all' ? 'Todo' : f === 'images' ? 'Fotos' : 'Vídeos'}
          </button>
        ))}
      </div>

      <div className="px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="font-medium">Cargando galería...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map(item => (
              <div 
                key={item.id} 
                onClick={() => openInSystemViewer(item)}
                className="aspect-square bg-gray-200 rounded-2xl overflow-hidden relative shadow-sm border border-gray-100 group active:scale-95 transition-transform cursor-pointer"
              >
                {item.type === 'image' ? (
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <video src={item.url} className="w-full h-full object-cover" playsInline />
                )}
                
                <button 
                  onClick={(e) => handleDelete(e, item)}
                  className="absolute bottom-2 right-2 bg-red-600/90 p-2 rounded-xl text-white shadow-md active:scale-90 transition-all z-10 hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="absolute top-2 right-2 pointer-events-none">
                  {item.type === 'video' ? (
                    <div className="bg-black/60 p-1.5 rounded-lg text-white">
                      <Film className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="bg-white/80 p-1.5 rounded-lg text-gray-600">
                      <ImageIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-[2.5rem] mx-4">
            <p className="italic font-medium">No se han encontrado archivos.</p>
            <p className="text-sm">Captura el primero usando los botones superiores.</p>
          </div>
        )}
      </div>

      {isCameraOpen && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col">
          <div className="p-4 flex justify-between items-center bg-black/90 text-white border-b border-white/10">
            <div className="flex items-center gap-3">
               <span className="font-bold tracking-tighter text-lg">{cameraMode.toUpperCase()}</span>
               {isRecording && (
                 <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span className="text-xs font-bold uppercase tracking-widest">REC</span>
                 </div>
               )}
            </div>
            <button onClick={closeCamera} className="px-4 py-2 bg-white/10 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-white/20 transition-colors">
              <X className="w-5 h-5" /> Salir
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-center overflow-hidden bg-zinc-900 relative">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
            {showSavedFeedback && (
              <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none animate-in fade-in zoom-in duration-300">
                <div className="bg-green-600/90 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-2xl">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="font-bold text-lg">Guardado ✓</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-10 flex flex-col items-center gap-6 bg-black/90 border-t border-white/10">
            <button 
              onClick={cameraMode === 'photo' ? captureWebPhoto : (isRecording ? stopWebRecording : startWebRecording)}
              className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-all active:scale-90 ${
                isRecording ? 'bg-white' : 'bg-transparent border-4 border-white'
              }`}
            >
               <div className={`transition-all duration-300 ${
                 isRecording ? 'w-8 h-8 bg-red-600 rounded-lg' : (cameraMode === 'photo' ? 'w-16 h-16 bg-white rounded-full' : 'w-14 h-14 bg-red-600 rounded-full')
               }`} />
            </button>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
              {isRecording ? 'Pulsa para detener' : 'Pulsa para capturar'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlbumView;
