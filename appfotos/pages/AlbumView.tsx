
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, Grid, Image as ImageIcon, Film, X, Loader2 } from 'lucide-react';
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadContent();
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

  const openCamera = async (mode: 'photo' | 'video') => {
    const hasPerm = await permissionsService.requestCamera();
    if (!hasPerm) {
      alert("No hay permiso de cámara.");
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
      } catch {
        setIsCameraOpen(false);
      }
    }
  };

  const closeCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    setIsCameraOpen(false);
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
          await storageService.saveMedia(albumId, blob, 'image');
          closeCamera();
          await loadContent();
        }
      }, 'image/jpeg', 0.9);
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

      <div className="px-4 mb-4 flex gap-2">
        {(['all', 'images', 'videos'] as const).map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 shadow-sm border border-gray-100'}`}
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
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="font-medium">Leyendo archivos...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {filteredItems.map(item => (
              <div key={item.id} className="aspect-square bg-gray-200 rounded-xl overflow-hidden relative shadow-sm">
                <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                {item.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Film className="text-white w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl mx-4">
            <p className="italic">No hay archivos en esta categoría.</p>
          </div>
        )}
      </div>

      {isCameraOpen && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col">
          <div className="p-4 flex justify-between items-center bg-black/80 text-white">
            <span className="font-bold tracking-widest">{cameraMode.toUpperCase()}</span>
            <button onClick={closeCamera} className="p-2 bg-white/20 rounded-full"><X /></button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
          <div className="p-10 flex justify-center bg-black/80">
            <button 
              onClick={cameraMode === 'photo' ? captureWebPhoto : () => alert('Próximamente')}
              className="w-20 h-20 bg-white rounded-full border-8 border-gray-500 active:scale-90 transition-transform shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AlbumView;
