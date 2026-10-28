import React from 'react';
import { Upload, Search, Music, Mic2, Compass, Heart } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { ViewMode } from '../types/music';

export const Navbar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    setIsUploadModalOpen,
    searchQuery,
    setSearchQuery,
    tracks,
  } = useAudio();

  const navItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'discover', label: 'Discover', icon: <Compass className="w-4 h-4" /> },
    { id: 'library', label: 'Tracks', icon: <Music className="w-4 h-4" /> },
    { id: 'my-uploads', label: 'My Uploads', icon: <Upload className="w-4 h-4" /> },
    { id: 'favorites', label: 'Favorites', icon: <Heart className="w-4 h-4" /> },
    { id: 'lyrics-studio', label: 'Sync Studio', icon: <Mic2 className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#070e17]/95 backdrop-blur-md border-b border-sky-950/60 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Lockup with Official Logo */}
        <div
          onClick={() => setActiveView('discover')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-sky-950/40 p-0.5 border border-sky-500/30 shadow-[0_0_15px_rgba(2,132,199,0.25)] transition-transform group-hover:scale-105">
            <img
              src="/assets/aistudio/e8cdafe3a5e2c0c1-blue-africa-logo_3aeaa8bc.jpg"
              alt="BC Africa Music Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-sky-400">BC</span> Africa <span className="font-light text-sky-200">Music</span>
            </span>
            <span className="text-[10px] text-sky-400/80 uppercase tracking-widest font-mono">Stream & Sync</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md hidden md:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400/60" />
          <input
            type="text"
            placeholder="Search tracks, artists, or lyrics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0c1829] border border-sky-900/50 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ×
            </button>
          )}
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.id === 'my-uploads' && (
                  <span className="ml-0.5 text-[10px] bg-sky-950 text-sky-300 px-1.5 py-0.2 rounded-full border border-sky-800/60">
                    {tracks.filter((t) => t.isCustomUpload).length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action (Upload Music) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 rounded-lg shadow-[0_0_16px_rgba(2,132,199,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Track</span>
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="mt-2.5 md:hidden">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sky-400/60" />
          <input
            type="text"
            placeholder="Search songs or lyrics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0c1829] border border-sky-900/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400"
          />
        </div>
      </div>
    </header>
  );
};
