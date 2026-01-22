
import React, { useState } from 'react';
import { AppView } from './types';
import HomeGate from './pages/HomeGate';
import AppHome from './pages/AppHome';
import AlbumView from './pages/AlbumView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME_GATE);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

  const navigateToHomeGate = () => {
    setSelectedAlbumId(null);
    setCurrentView(AppView.HOME_GATE);
  };

  const navigateToAppHome = () => {
    setSelectedAlbumId(null);
    setCurrentView(AppView.APP_HOME);
  };

  const navigateToAlbum = (id: string) => {
    setSelectedAlbumId(id);
    setCurrentView(AppView.ALBUM_VIEW);
  };

  return (
    <div className="antialiased max-w-md mx-auto min-h-screen bg-gray-50 shadow-2xl relative">
      {currentView === AppView.HOME_GATE && (
        <HomeGate onEnter={navigateToAppHome} />
      )}

      {currentView === AppView.APP_HOME && (
        <AppHome 
          onBack={navigateToHomeGate} 
          onHome={navigateToHomeGate} 
          onSelectAlbum={navigateToAlbum}
        />
      )}

      {currentView === AppView.ALBUM_VIEW && selectedAlbumId && (
        <AlbumView 
          albumId={selectedAlbumId} 
          onBack={navigateToAppHome} 
          onHome={navigateToHomeGate} 
        />
      )}
    </div>
  );
};

export default App;
