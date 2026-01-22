
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, Grid, Image as ImageIcon, Film, X } from 'lucide-react';
import TopBar from '../components/TopBar';
import { MediaItem } from '../types';
import { Camera as CapCamera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface AlbumViewProps {
  albumId: string;
  onBack: () => void;
  onHome: () => void;
}

const AlbumView: React.FC<AlbumViewProps> = ({ albumId, onBack, onHome }) => {
  const [filter, setFilter] = useState<'all' | 'images' | 'videos'>('all');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Filter logic
  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'images') return item.type === 'image';
    if (filter === 'videos') return item.type === 'video';
    return true;
  });

  const openCamera = async (mode: 'photo' | 'video') => {
    if (Capacitor.isNativePlatform()) {
      if (mode === 'photo') {
        try {
          const image = await CapCamera.getPhoto({
            quality: 90,
            allowEditing: false,
            resultType: 'uri'
          });
          if (image.webPath) {
              const newItem: MediaItem = {
                  id: Date.now().toString(),
                  name: `IMG_${Date.now()}.jpg`,
                  type: 'image',
                  url: image.webPath,
                  timestamp: Date.now()
              };
              setItems(prev => [newItem, ...prev]);
          }
        } catch (e) {
          console.error("Camera cancelled or failed", e);
        }
      } else {
        alert("Vídeo en Android: Próximamente.");
      }
    } else {
      // WEB IMPLEMENTATION
      setCameraMode(mode);
      setIsCameraOpen(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: mode === 'video'
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        alert("Cámara no disponible: " + err);
        setIsCameraOpen(false);
      }
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const captureWebPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      const newItem: MediaItem = {
        id: Date.now().toString(),
        name: `WEB_IMG_${Date.now()}.jpg`,
        type: 'image',
        url: dataUrl,
        timestamp: Date.now()
      };
      setItems(prev => [newItem, ...prev]);
      closeCamera();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <TopBar title={albumId} onBack={onBack} onHome={onHome} />

      {/* Action Area */}
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

      {/* Filters */}
      <div className="px-4 mb-4 flex gap-2">
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500'}`}
        >
          <Grid className="w-4 h-4" /> Todo
        </button>
        <button 
          onClick={() => setFilter('images')}
          className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${filter === 'images' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500'}`}
        >
          <ImageIcon className="w-4 h-4" /> Fotos
        </button>
        <button 
          onClick={() => setFilter('videos')}
          className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${filter === 'videos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500'}`}
        >
          <Film className="w-4 h-4" /> Vídeos
        </button>
      </div>

      {/* Grid */}
      <div className="px-4">
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {filteredItems.map(item => (
              <div key={item.id} className="aspect-square bg-gray-200 rounded-lg overflow-hidden relative group">
                <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                {item.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Film className="text-white w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-gray-400">
            <p className="italic">Este álbum está vacío.</p>
          </div>
        )}
      </div>

      {/* Web Camera Overlay */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col">
          <div className="p-4 flex justify-between items-center bg-black/50 text-white">
            <span className="font-bold">{cameraMode === 'photo' ? 'FOTO' : 'VÍDEO'}</span>
            <button onClick={closeCamera} className="p-2 bg-white/10 rounded-full"><X /></button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-10 flex justify-center bg-black/50">
            <button 
              onClick={cameraMode === 'photo' ? captureWebPhoto : () => alert('Guardado de vídeo web próximamente')}
              className="w-20 h-20 bg-white rounded-full border-8 border-gray-400 active:scale-90 transition-transform"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AlbumView;
