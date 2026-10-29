/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { PlatformProvider } from './context/PlatformContext';
import { AudioProvider, useAudio } from './context/AudioContext';
import { Navbar } from './components/Navbar';
import { BottomPlayer } from './components/BottomPlayer';
import { DiscoverView } from './components/DiscoverView';
import { LibraryView } from './components/LibraryView';
import { MyUploadsView } from './components/MyUploadsView';
import { FavoritesView } from './components/FavoritesView';
import { LyricsSyncStudio } from './components/LyricsSyncStudio';
import { ArtistProfileView } from './components/ArtistProfileView';
import { ReviewQueueView } from './components/ReviewQueueView';
import { SuperUserPanel } from './components/SuperUserPanel';
import { ArtistAnalyticsPanel } from './components/ArtistAnalyticsPanel';
import { AdPlayerOverlay } from './components/AdPlayerOverlay';
import { LyricsViewer } from './components/LyricsViewer';
import { NowPlayingModal } from './components/NowPlayingModal';
import { UploadModal } from './components/UploadModal';
import { AuthModal } from './components/AuthModal';

const MainContent: React.FC = () => {
  const { activeView } = useAudio();

  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6">
      {activeView === 'discover' && <DiscoverView />}
      {activeView === 'library' && <LibraryView />}
      {activeView === 'my-uploads' && <MyUploadsView />}
      {activeView === 'favorites' && <FavoritesView />}
      {activeView === 'lyrics-studio' && <LyricsSyncStudio />}
      {activeView === 'artist-profile' && <ArtistProfileView />}
      {activeView === 'artist-analytics' && <ArtistAnalyticsPanel />}
      {activeView === 'review-queue' && <ReviewQueueView />}
      {activeView === 'super-panel' && <SuperUserPanel />}
    </main>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <PlatformProvider>
        <AudioProvider>
          <div
            className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white transition-colors duration-500"
            style={{ backgroundColor: 'var(--bc-bg-dark, #040b15)' }}
          >
            {/* Top Navbar */}
            <Navbar />

            {/* Dynamic Main View */}
            <div className="flex-1">
              <MainContent />
            </div>

            {/* In-Stream Audio / Banner Advert Overlay */}
            <AdPlayerOverlay />

            {/* Synced Lyrics Drawer */}
            <LyricsViewer />

            {/* Immersive Now Playing Screen */}
            <NowPlayingModal />

            {/* Upload Audio Modal */}
            <UploadModal />

            {/* Account Creation & Sign In Modal with Roles */}
            <AuthModal />

            {/* Sticky Audio Transport Bar */}
            <BottomPlayer />
          </div>
        </AudioProvider>
      </PlatformProvider>
    </AuthProvider>
  );
}
