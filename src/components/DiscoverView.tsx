import React, { useState } from 'react';
import { Play, Pause, Sparkles, Upload, LayoutGrid, List, Sliders, Mic2, Compass, UserPlus, Shield } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { TrackCard } from './TrackCard';
import { TrackTable } from './TrackTable';
import { TrendingNow } from './TrendingNow';

export const DiscoverView: React.FC = () => {
  const {
    tracks,
    approvedTracks,
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    setIsUploadModalOpen,
    searchQuery,
    selectedGenre,
    setSelectedGenre,
    openLyricsStudio,
  } = useAudio();

  const { user, profile, isCreator, isAdmin, setIsAuthModalOpen, setAuthModalMode } = useAuth();

  const [layoutMode, setLayoutMode] = useState<'grid' | 'table'>('grid');

  const genres = ['all', 'Afrobeats', 'Amapiano', 'Highlife', 'Afro-Soul', 'Afro-Fusion'];

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

  return (
    <div className="space-y-8 pb-32">
      {/* Hero Spotlight Banner */}
      {!searchQuery && (
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0c1e38] via-[#091526] to-[#050b14] border border-sky-500/20 p-6 lg:p-10 shadow-[0_10px_35px_rgba(2,132,199,0.15)]">
          {/* Subtle logo silhouette in background */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-15 pointer-events-none flex items-center justify-end pr-6">
            <img
              src="/assets/aistudio/e8cdafe3a5e2c0c1-blue-africa-logo_3aeaa8bc.jpg"
              alt="BC Africa Watermark"
              className="h-full object-contain filter invert mix-blend-screen"
            />
          </div>

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400 bg-sky-950/80 px-2.5 py-1 rounded-full border border-sky-500/30">
                BC Africa Music Platform
              </span>
              {user && (
                <span className="text-[10px] font-mono text-sky-300 bg-sky-900/60 px-2 py-0.5 rounded-full border border-sky-700/60 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-sky-400" />
                  <span>{profile?.role === 'admin' ? 'Admin' : profile?.role === 'creator' ? 'Artist / Creator' : 'Listener'}</span>
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Play, Upload &amp; <span className="bc-gradient-text">Sync African Rhythms</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Every track here is uploaded directly by creators and artists.
              Upload your own audio tracks, and synchronize your lyrics live on the beat.
            </p>

            {/* Quick Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {featuredTrack ? (
                <button
                  onClick={() => {
                    if (currentTrack?.id === featuredTrack.id) togglePlay();
                    else playTrack(featuredTrack);
                  }}
                  className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-bold rounded-xl shadow-[0_0_25px_rgba(2,132,199,0.4)] transition-all hover:scale-105 active:scale-95 cursor-pointer text-sm"
                >
                  {isFeaturedPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-white" />
                      <span>Pause Spotlight</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                      <span>Play &quot;{featuredTrack.title}&quot;</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleUploadClick}
                  className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-bold rounded-xl shadow-[0_0_25px_rgba(2,132,199,0.4)] transition-all hover:scale-105 active:scale-95 cursor-pointer text-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Your First Song</span>
                </button>
              )}

              {!user && (
                <button
                  onClick={() => {
                    setAuthModalMode('signup');
                    setIsAuthModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-5 py-3 bg-sky-950/80 hover:bg-sky-900 border border-sky-800 text-sky-200 font-semibold rounded-xl transition-all cursor-pointer text-sm"
                >
                  <UserPlus className="w-4 h-4 text-sky-400" />
                  <span>Create Account &amp; Select Role</span>
                </button>
              )}

              {user && (
                <button
                  onClick={handleUploadClick}
                  className="flex items-center gap-2 px-5 py-3 bg-sky-950/60 hover:bg-sky-900 border border-sky-800 text-sky-200 font-semibold rounded-xl transition-all cursor-pointer text-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Track</span>
                </button>
              )}

              <button
                onClick={() => openLyricsStudio()}
                className="flex items-center gap-2 px-4 py-3 text-slate-300 hover:text-white transition-colors cursor-pointer text-sm"
              >
                <Sliders className="w-4 h-4 text-sky-400" />
                <span>Open Lyrics Studio</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trending Now Section (24h Real-Time Firestore Plays) */}
      {!searchQuery && <TrendingNow />}

      {/* Filter and View Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        {/* Genre Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {genres.map((genre) => {
            const isActive = selectedGenre.toLowerCase() === genre.toLowerCase();
            return (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-[0_0_12px_rgba(2,132,199,0.3)]'
                    : 'bg-[#091524] text-slate-400 hover:text-white border border-sky-950 hover:border-sky-900'
                }`}
              >
                {genre === 'all' ? 'All Genres' : genre}
              </button>
            );
          })}
        </div>

        {/* Layout Switcher (Grid vs Table) */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 font-mono">
            {filteredTracks.length} {filteredTracks.length === 1 ? 'Track' : 'Tracks'}
          </span>
          <div className="flex items-center bg-[#070e17] p-1 rounded-lg border border-sky-950">
            <button
              onClick={() => setLayoutMode('grid')}
              className={`p-1.5 rounded cursor-pointer transition-colors ${
                layoutMode === 'grid' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayoutMode('table')}
              className={`p-1.5 rounded cursor-pointer transition-colors ${
                layoutMode === 'table' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
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
        <div className="bg-[#091524] border border-sky-950 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <Compass className="w-10 h-10 text-sky-400 mx-auto mb-3 opacity-70" />
          <h3 className="text-base font-semibold text-white mb-1">No tracks found</h3>
          <p className="text-xs text-slate-400 mb-5">
            {searchQuery
              ? `No tracks or lyrics matched "${searchQuery}".`
              : 'Try changing the selected genre or upload a custom track.'}
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-md cursor-pointer"
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
        <div className="bg-[#091524] border border-sky-950 rounded-2xl p-4">
          <TrackTable tracks={filteredTracks} />
        </div>
      )}

      {/* Sync Studio Promo Banner */}
      <div className="bg-gradient-to-r from-sky-950/70 via-[#0a182b] to-sky-950/70 border border-sky-800/40 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-300 shrink-0">
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
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-[0_0_15px_rgba(2,132,199,0.3)] whitespace-nowrap cursor-pointer transition-all"
        >
          <Sliders className="w-4 h-4" />
          <span>Launch Lyrics Studio</span>
        </button>
      </div>
    </div>
  );
};
