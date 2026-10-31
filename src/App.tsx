/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { PlatformProvider } from './context/PlatformContext';
import { AudioProvider, useAudio } from './context/AudioContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
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
import { X } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeView } = useAudio();

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
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

const AppShell: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white transition-colors duration-500 bg-bc-ambient">
      {/* Top Navbar */}
      <Navbar onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex w-full relative">
        {/* Desktop Sticky Left Sidebar */}
        <Sidebar className="hidden md:flex h-[calc(100vh-140px)] sticky top-16" />

        {/* Mobile Slide-over Drawer */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-md animate-in fade-in"
            />
            {/* Drawer */}
            <div className="relative z-10 w-72 max-w-[85vw] h-full glass-panel-elevated border-r border-white/15 flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
              <div className="absolute top-4 right-4 z-20">
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 text-slate-300 hover:text-white rounded-lg glass-panel hover:bg-white/10 border border-white/15"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Sidebar onNavigate={() => setIsMobileSidebarOpen(false)} className="w-full h-full border-r-0" />
            </div>
          </div>
        )}

        {/* Main Scrolling Viewport */}
        <div className="flex-1 min-w-0 pb-36">
          <MainContent />
        </div>
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
  );
};

export default function App() {
  return (
    <AuthProvider>
      <PlatformProvider>
        <AudioProvider>
          <AppShell />
        </AudioProvider>
      </PlatformProvider>
    </AuthProvider>
  );
}
