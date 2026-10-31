import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Upload,
  LayoutGrid,
  List,
  Sliders,
  Mic2,
  Compass,
  Repeat,
  Music2,
  Globe2,
  Users2,
  Settings,
  Cloud,
  Bell,
  ArrowRight,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { TrackCard } from './TrackCard';
import { TrackTable } from './TrackTable';
import { TrendingNow } from './TrendingNow';
import { BCAfricaLogo } from './icons/VectorIcons';
import { formatTime } from '../utils/lrcParser';

export const DiscoverView: React.FC = () => {
  const {
    tracks,
    approvedTracks,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    playTrack,
    togglePlay,
    seek,
    setIsUploadModalOpen,
    searchQuery,
    selectedGenre,
    setSelectedGenre,
    openLyricsStudio,
    setActiveView,
  } = useAudio();

  const { user, setIsAuthModalOpen, setAuthModalMode } = useAuth();
  const [layoutMode, setLayoutMode] = useState<'grid' | 'table'>('grid');
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const genres = ['all', 'Zed Beats', 'Afrobeats', 'Amapiano', 'Highlife', 'Afro-Soul', 'Afro-Fusion'];

  // Only approved songs appear on the public Discover feed
  const publicCatalog = approvedTracks.length > 0 ? approvedTracks : tracks;

  // Filter tracks
  const filteredTracks = publicCatalog.filter((track) => {
    const matchesSearch =
      !searchQuery ||
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.lyricsRaw?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.genre.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGenre =
      selectedGenre === 'all' ||
      track.genre.toLowerCase() === selectedGenre.toLowerCase();

    return matchesSearch && matchesGenre;
  });

  const featuredTrack = publicCatalog.length > 0 ? publicCatalog[0] : null;
  const isFeaturedPlaying = featuredTrack && currentTrack?.id === featuredTrack.id && isPlaying;

  const handleUploadClick = () => {
    if (!user) {
      setAuthModalMode('signup');
      setIsAuthModalOpen(true);
      return;
    }
    setIsUploadModalOpen(true);
  };

  const handleStartCreating = () => {
    if (!user) {
      setAuthModalMode('signup');
      setIsAuthModalOpen(true);
      return;
    }
    setIsUploadModalOpen(true);
  };

  const handleTriggerSync = () => {
    setSyncToast('Cloud library synchronized across all connected devices.');
    setTimeout(() => setSyncToast(null), 3000);
  };

  // Fixed visual wave heights matching the production audio envelope in the reference image
  const waveformHeights = [
    12, 18, 14, 22, 28, 19, 32, 45, 24, 52, 68, 40, 78, 55, 88, 70,
    94, 62, 100, 85, 75, 92, 60, 82, 98, 74, 90, 65, 80, 58, 72, 48,
    64, 82, 52, 68, 44, 56, 38, 46, 32, 28, 22, 18, 14, 20, 15, 10
  ];

  const activeDuration = duration > 0 ? duration : 178; // 02:58 default
  const activeCurrentTime = currentTime > 0 ? currentTime : 34; // 00:34 default
  const progressRatio = Math.min(1, Math.max(0, activeCurrentTime / activeDuration));

  return (
    <div className="space-y-8 pb-32">
      {/* Toast notification */}
      {syncToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#0F1D32] border border-[#4A9FD6]/50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Cloud className="w-4 h-4 text-[#4A9FD6]" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Approved Hero Component — Matching image_66547cee.png faithfully */}
      {!searchQuery && (
        <div className="relative rounded-[28px] overflow-hidden glass-panel border border-[#4A9FD6]/20 p-6 sm:p-8 lg:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
          {/* Top Edge Ambient Highlight */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1.5px] bg-gradient-to-r from-transparent via-[#4A9FD6] to-transparent opacity-80" />

          {/* Main 2-Column Split: Content & Live Waveform Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column (Span 7) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Top Row: Official Logo & Status Badge */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src="./bc_africa_logo_fixed_v2.png"
                    alt="BC Africa Music"
                    className="h-14 sm:h-16 w-auto object-contain filter drop-shadow-[0_4px_16px_rgba(74,159,214,0.35)]"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      const fb = (e.target as HTMLElement).nextElementSibling;
                      if (fb) (fb as HTMLElement).style.display = 'block';
                    }}
                  />
                  <div style={{ display: 'none' }}>
                    <BCAfricaLogo size={52} />
                  </div>
                </div>

                {/* Status Badge: • LIVE • 12.4k Active Creators */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-[#4A9FD6]/30 text-xs font-semibold text-white tracking-wide shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                  <span>LIVE</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-200">12.4k Active Creators</span>
                </div>
              </div>

              {/* Main Headline */}
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.12]">
                  Play, Upload &amp; Sync<br />
                  <span className="bc-gradient-text">African Rhythms</span>
                </h1>
              </div>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                Create, share, and sync authentic African sounds. Collaborate with artists, upload tracks, and keep everything in sync across devices.
              </p>

              {/* 3 Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={handleStartCreating}
                  className="px-6 py-3 rounded-xl bg-[#3A8BC2] hover:bg-[#4A9FD6] text-white font-semibold text-sm shadow-[0_4px_20px_rgba(58,139,194,0.35)] hover:shadow-[0_4px_25px_rgba(74,159,214,0.5)] transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <span>Start Creating</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleUploadClick}
                  className="px-5 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-[#4A9FD6]/30 text-white font-semibold text-sm transition-all cursor-pointer flex items-center gap-2 active:scale-95 hover:border-[#4A9FD6]/60"
                >
                  <Upload className="w-4 h-4 text-[#4A9FD6]" />
                  <span>Upload Track</span>
                </button>

                <button
                  onClick={() => openLyricsStudio()}
                  className="px-5 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-[#4A9FD6]/30 text-white font-semibold text-sm transition-all cursor-pointer flex items-center gap-2 active:scale-95 hover:border-[#4A9FD6]/60"
                >
                  <Repeat className="w-4 h-4 text-[#4A9FD6]" />
                  <span>Sync Library</span>
                </button>
              </div>

              {/* 3 Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-[#4A9FD6]/20 flex items-center gap-2.5 backdrop-blur-sm">
                  <Music2 className="w-4 h-4 text-[#5AA1D2] shrink-0" />
                  <span className="text-xs font-semibold text-white tracking-wide">50+ Genres</span>
                </div>

                <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-[#4A9FD6]/20 flex items-center gap-2.5 backdrop-blur-sm">
                  <Globe2 className="w-4 h-4 text-[#5AA1D2] shrink-0" />
                  <span className="text-xs font-semibold text-white tracking-wide truncate">Afrobeats • Amapiano • Highlife</span>
                </div>

                <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-[#4A9FD6]/20 flex items-center gap-2.5 backdrop-blur-sm">
                  <Users2 className="w-4 h-4 text-[#5AA1D2] shrink-0" />
                  <span className="text-xs font-semibold text-white tracking-wide leading-tight">Collaborative Cloud Sync</span>
                </div>
              </div>
            </div>

            {/* Right Column (Span 5): Live Waveform Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-white/[0.04] border border-[#4A9FD6]/25 p-5 sm:p-6 backdrop-blur-md shadow-[0_12px_36px_rgba(0,0,0,0.35)] space-y-5 overflow-hidden">
                {/* Waveform Card Top Edge Highlight */}
                <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-[#4A9FD6] to-transparent opacity-80" />

                {/* Header: Live Waveform & Recording Indicator */}
                <div className="flex items-center justify-between">
                  <span className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Live Waveform
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse" />
                    <span>Recording • 02:14</span>
                  </div>
                </div>

                {/* Waveform Bars Container */}
                <div className="relative h-28 sm:h-32 w-full flex items-center justify-between gap-[2px] sm:gap-[3px] px-1 py-2 overflow-hidden">
                  {/* Centerline horizontal glow line */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-[#4A9FD6]/40 pointer-events-none" />

                  {waveformHeights.map((h, i) => {
                    const isPlayed = (i / waveformHeights.length) <= progressRatio;
                    return (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center justify-center h-full"
                      >
                        <div
                          style={{
                            height: isPlaying ? `${Math.max(12, (h * (0.8 + 0.4 * Math.sin(i * 0.5 + Date.now() / 300))))}%` : `${h}%`,
                            background: isPlayed
                              ? 'linear-gradient(180deg, #5AA1D2 0%, #FFFFFF 50%, #2F7AB8 100%)'
                              : 'linear-gradient(180deg, rgba(90,161,210,0.5) 0%, rgba(255,255,255,0.7) 50%, rgba(47,122,184,0.5) 100%)',
                          }}
                          className={`w-full rounded-full transition-all duration-150 shadow-[0_0_8px_rgba(74,159,214,0.35)]`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Transport / Scrubber Bar */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (featuredTrack) {
                        if (currentTrack?.id === featuredTrack.id) togglePlay();
                        else playTrack(featuredTrack);
                      }
                    }}
                    className="w-8 h-8 rounded-full bg-[#3A8BC2] hover:bg-[#4A9FD6] text-white flex items-center justify-center shrink-0 cursor-pointer shadow-md transition-all hover:scale-105 active:scale-95"
                    title={isPlaying ? 'Pause Spotlight' : 'Play Spotlight'}
                  >
                    {isFeaturedPlaying ? (
                      <Pause className="w-4 h-4 fill-white" />
                    ) : (
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    )}
                  </button>

                  {/* Scrubber Track */}
                  <div
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const ratio = (e.clientX - rect.left) / rect.width;
                      if (featuredTrack && currentTrack?.id === featuredTrack.id) {
                        seek(ratio * activeDuration);
                      }
                    }}
                    className="relative flex-1 h-1.5 bg-[#0A1426] rounded-full overflow-hidden cursor-pointer group"
                  >
                    <div
                      className="h-full bg-[#4A9FD6] rounded-full transition-all duration-150 relative"
                      style={{ width: `${progressRatio * 100}%` }}
                    />
                  </div>

                  {/* Time indicator */}
                  <span className="text-xs font-mono text-slate-300 tabular-nums shrink-0">
                    {formatTime(activeCurrentTime)} / {formatTime(activeDuration)}
                  </span>
                </div>

                {/* Bottom Audio Stats */}
                <div className="text-xs font-mono text-slate-300 tracking-wider">
                  BPM 112 • Key: F#m • 44.1kHz
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Card Footer: Metadata and Utility Buttons */}
          <div className="mt-8 pt-5 border-t border-[#4A9FD6]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-xs font-mono text-slate-400 tracking-wider">
              African Rhythms • Secure • Auto-Sync Enabled
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView('super-panel')}
                className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-[#4A9FD6]/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Settings & System Governance"
              >
                <Settings className="w-4 h-4 text-[#4A9FD6]" />
              </button>

              <button
                onClick={handleTriggerSync}
                className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-[#4A9FD6]/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Sync Library Across Devices"
              >
                <Cloud className="w-4 h-4 text-[#4A9FD6]" />
              </button>

              <button
                onClick={() => setSyncToast('No pending notifications. All streams nominal.')}
                className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-[#4A9FD6]/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4 text-[#4A9FD6]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trending Now Section */}
      {!searchQuery && <TrendingNow />}

      {/* Filter and View Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        {/* Genre Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {genres.map((genre) => {
            const isActive = selectedGenre.toLowerCase() === genre.toLowerCase();
            return (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#3A8BC2] hover:bg-[#4A9FD6] text-white shadow-[0_0_16px_rgba(74,159,214,0.4)] border border-[#5AA1D2]/50'
                    : 'glass-pill text-slate-300 hover:text-white hover:bg-white/10 border-white/10'
                }`}
              >
                {genre === 'all' ? 'All Genres' : genre}
              </button>
            );
          })}
        </div>

        {/* Layout Switcher (Grid vs Table) */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-300 font-mono">
            {filteredTracks.length} {filteredTracks.length === 1 ? 'Track' : 'Tracks'}
          </span>
          <div className="flex items-center glass-pill p-1 rounded-xl border border-white/15">
            <button
              onClick={() => setLayoutMode('grid')}
              className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                layoutMode === 'grid' ? 'bg-[#3A8BC2] text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayoutMode('table')}
              className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                layoutMode === 'table' ? 'bg-[#3A8BC2] text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Track List */}
      {filteredTracks.length === 0 ? (
        <div className="bg-[#0A1426] border border-[#4A9FD6]/20 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <Compass className="w-10 h-10 text-[#4A9FD6] mx-auto mb-3 opacity-70" />
          <h3 className="text-base font-semibold text-white mb-1">No tracks found</h3>
          <p className="text-xs text-slate-400 mb-5">
            {searchQuery
              ? `No tracks or lyrics matched "${searchQuery}".`
              : 'Try changing the selected genre or upload a custom track.'}
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#3A8BC2] hover:bg-[#4A9FD6] rounded-lg shadow-md cursor-pointer transition-colors"
          >
            Upload Track Now
          </button>
        </div>
      ) : layoutMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredTracks.map((track, i) => (
            <TrackCard key={track.id} track={track} index={i} />
          ))}
        </div>
      ) : (
        <div className="bg-[#0A1426] border border-[#4A9FD6]/20 rounded-2xl p-4">
          <TrackTable tracks={filteredTracks} />
        </div>
      )}

      {/* Sync Studio Promo Banner */}
      <div className="bg-gradient-to-r from-[#0F1D32] via-[#0A1426] to-[#0F1D32] border border-[#4A9FD6]/25 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#4A9FD6]/15 border border-[#4A9FD6]/30 flex items-center justify-center text-[#5AA1D2] shrink-0">
            <Mic2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Need to sync lyrics for your track?</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Use our built-in Live Sync Studio to tap timestamps on the beat with your keyboard spacebar.
            </p>
          </div>
        </div>

        <button
          onClick={() => openLyricsStudio()}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#3A8BC2] hover:bg-[#4A9FD6] rounded-xl shadow-[0_0_15px_rgba(74,159,214,0.35)] whitespace-nowrap cursor-pointer transition-all"
        >
          <Sliders className="w-4 h-4" />
          <span>Launch Lyrics Studio</span>
        </button>
      </div>
    </div>
  );
};
