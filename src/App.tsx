/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AudioProvider, useAudio } from './context/AudioContext';
import { Navbar } from './components/Navbar';
import { BottomPlayer } from './components/BottomPlayer';
import { DiscoverView } from './components/DiscoverView';
import { LibraryView } from './components/LibraryView';
import { MyUploadsView } from './components/MyUploadsView';
import { FavoritesView } from './components/FavoritesView';
import { LyricsSyncStudio } from './components/LyricsSyncStudio';
import { LyricsViewer } from './components/LyricsViewer';
import { NowPlayingModal } from './components/NowPlayingModal';
import { UploadModal } from './components/UploadModal';

const MainContent: React.FC = () => {
  const { activeView } = useAudio();

  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6">
      {activeView === 'discover' && <DiscoverView />}
      {activeView === 'library' && <LibraryView />}
      {activeView === 'my-uploads' && <MyUploadsView />}
      {activeView === 'favorites' && <FavoritesView />}
      {activeView === 'lyrics-studio' && <LyricsSyncStudio />}
    </main>
  );
};

export default function App() {
  return (
    <AudioProvider>
      <div className="min-h-screen bg-[#060c15] text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
        {/* Top Navbar */}
        <Navbar />

        {/* Dynamic Main View */}
        <div className="flex-1">
          <MainContent />
        </div>

        {/* Synced Lyrics Drawer */}
        <LyricsViewer />

        {/* Immersive Now Playing Screen */}
        <NowPlayingModal />

        {/* Upload Audio Modal */}
        <UploadModal />

        {/* Sticky Audio Transport Bar */}
        <BottomPlayer />
      </div>
    </AudioProvider>
  );
}
