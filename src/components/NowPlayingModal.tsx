import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  Mic2,
  Heart,
  Sliders,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { formatTime } from '../utils/lrcParser';
import { AudioVisualizer } from './AudioVisualizer';

export const NowPlayingModal: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    seek,
    skipNext,
    skipPrev,
    volume,
    isMuted,
    setVolume,
    toggleMute,
    isLooping,
    toggleLoop,
    isShuffle,
    toggleShuffle,
    toggleFavorite,
    isNowPlayingOpen,
    setIsNowPlayingOpen,
    openLyricsStudio,
    openArtistProfile,
  } = useAudio();

  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  const syncedLines = currentTrack?.lyricsSynced || [];
  const hasSyncedLyrics = syncedLines.length > 0 && syncedLines.some((l) => l.time >= 0);

  // Sync active lyric line
  useEffect(() => {
    if (!hasSyncedLyrics) {
      setActiveLineId(null);
      return;
    }
    let currentId: string | null = null;
    for (let i = syncedLines.length - 1; i >= 0; i--) {
      if (syncedLines[i].time <= currentTime + 0.15) {
        currentId = syncedLines[i].id;
        break;
      }
    }
    setActiveLineId(currentId || syncedLines[0]?.id || null);
  }, [currentTime, syncedLines, hasSyncedLyrics]);

  // Smooth auto-scroll
  useEffect(() => {
    if (activeLineRef.current && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current;
      const element = activeLineRef.current;
      container.scrollTo({
        top: element.offsetTop - container.clientHeight / 2 + element.clientHeight / 2,
        behavior: 'smooth',
      });
    }
  }, [activeLineId]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isNowPlayingOpen) {
        setIsNowPlayingOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNowPlayingOpen, setIsNowPlayingOpen]);

  if (!isNowPlayingOpen || !currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-60 bg-[#050b14]/98 backdrop-blur-3xl flex flex-col justify-between text-white animate-in fade-in duration-300">
      {/* Dynamic Ambient Background Glow in BC Africa blue */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-sky-600/30 rounded-full blur-[140px] transform -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-700/25 rounded-full blur-[140px] transform translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-sky-950 p-0.5 border border-sky-600/40">
            <img
              src="/assets/aistudio/e8cdafe3a5e2c0c1-blue-africa-logo_3aeaa8bc.jpg"
              alt="BC Africa"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-sky-400">
              BC Africa Music
            </span>
            <p className="text-sm font-semibold text-slate-200">Now Playing</p>
          </div>
        </div>

        <button
          onClick={() => setIsNowPlayingOpen(false)}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Layout: 2 Columns (Cover/Visualizer & Synced Lyrics) */}
      <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center min-h-0">
        {/* Left Side: Artwork & Visualizer */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center max-w-md mx-auto w-full">
          {/* Album Cover Art */}
          <div className="relative aspect-square w-64 sm:w-80 lg:w-96 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(2,132,199,0.3)] border border-sky-600/30 group">
            <img
              src={currentTrack.coverUrl || '/assets/aistudio/e8cdafe3a5e2c0c1-blue-africa-logo_3aeaa8bc.jpg'}
              alt={currentTrack.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? 'scale-105' : 'scale-100'
              }`}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/aistudio/e8cdafe3a5e2c0c1-blue-africa-logo_3aeaa8bc.jpg';
              }}
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-gradient-to-t from-sky-950/60 via-transparent to-transparent pointer-events-none" />
            )}
          </div>

          {/* Title & Artist & Favorite */}
          <div className="w-full mt-6 flex items-center justify-between">
            <div className="min-w-0 pr-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                {currentTrack.title}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsNowPlayingOpen(false);
                  openArtistProfile(currentTrack.ownerId, currentTrack.artist);
                }}
                className="text-sm text-sky-300 hover:text-sky-200 truncate mt-0.5 text-left transition-colors cursor-pointer hover:underline block"
                title={`View ${currentTrack.artist}'s profile`}
              >
                {currentTrack.artist}
              </button>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                <span>{currentTrack.genre}</span>
                <span>·</span>
                <span>{currentTrack.album || 'Single'}</span>
              </div>
            </div>

            <button
              onClick={() => toggleFavorite(currentTrack.id)}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-rose-400 transition-colors"
            >
              <Heart
                className={`w-5 h-5 ${
                  currentTrack.isFavorite ? 'fill-rose-500 text-rose-500' : ''
                }`}
              />
            </button>
          </div>

          {/* Large Audio Visualizer Waves */}
          <div className="w-full mt-4 h-12 bg-[#091526]/60 rounded-xl p-2 border border-sky-950">
            <AudioVisualizer height={36} barCount={48} />
          </div>
        </div>

        {/* Right Side: Karaoke Synced Lyrics Display */}
        <div className="lg:col-span-7 h-[360px] sm:h-[460px] lg:h-[540px] flex flex-col justify-center">
          <div className="flex items-center justify-between pb-3 border-b border-sky-950/80 mb-2">
            <div className="flex items-center gap-2">
              <Mic2 className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-mono uppercase tracking-widest text-slate-300">
                Synchronized Lyrics
              </span>
            </div>
            <button
              onClick={() => {
                setIsNowPlayingOpen(false);
                openLyricsStudio(currentTrack.id);
              }}
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Edit Timings</span>
            </button>
          </div>

          <div
            ref={lyricsContainerRef}
            className="flex-1 overflow-y-auto space-y-6 py-12 scroll-smooth select-none px-2"
          >
            {hasSyncedLyrics ? (
              syncedLines.map((line) => {
                const isActive = activeLineId === line.id;
                const isPast = activeLineId
                  ? syncedLines.findIndex((l) => l.id === activeLineId) >
                    syncedLines.findIndex((l) => l.id === line.id)
                  : false;

                return (
                  <div
                    key={line.id}
                    ref={isActive ? activeLineRef : null}
                    onClick={() => {
                      if (line.time >= 0) seek(line.time);
                    }}
                    className={`cursor-pointer transition-all duration-300 transform origin-left py-2 px-4 rounded-xl ${
                      isActive
                        ? 'text-white text-2xl sm:text-3xl font-extrabold bg-sky-950/50 border-l-4 border-sky-400 lyric-glow scale-[1.03]'
                        : isPast
                        ? 'text-slate-400/80 text-lg sm:text-xl font-medium hover:text-slate-200'
                        : 'text-slate-600 text-lg sm:text-xl font-medium hover:text-slate-400'
                    }`}
                  >
                    <p className="leading-snug tracking-tight">{line.text}</p>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Mic2 className="w-10 h-10 text-sky-400 opacity-60 mb-3" />
                <h4 className="text-base font-semibold text-white">No synchronized lyrics yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mb-4">
                  Open the BC Africa Lyric Sync Studio to time-align this track.
                </p>
                <button
                  onClick={() => {
                    setIsNowPlayingOpen(false);
                    openLyricsStudio(currentTrack.id);
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 rounded-lg text-white"
                >
                  Start Syncing Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Transport Controls */}
      <div className="relative z-10 max-w-4xl mx-auto w-full px-6 pb-8 pt-4">
        {/* Progress scrub bar */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-mono text-slate-400 tabular-nums w-12 text-right">
            {formatTime(currentTime)}
          </span>
          <div
            className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden cursor-pointer relative group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              seek(pos * duration);
            }}
          >
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-sky-400 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono text-slate-400 tabular-nums w-12 text-left">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-lg transition-colors ${
                isShuffle ? 'text-sky-400 bg-sky-950/80' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={toggleLoop}
              className={`p-2 rounded-lg transition-colors ${
                isLooping ? 'text-sky-400 bg-sky-950/80' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isLooping ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={skipPrev}
              className="p-2 text-slate-300 hover:text-white transition-colors"
            >
              <SkipBack className="w-6 h-6 fill-current" />
            </button>

            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-600 via-sky-500 to-sky-400 text-white flex items-center justify-center shadow-[0_0_30px_rgba(2,132,199,0.7)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-white" />
              ) : (
                <Play className="w-7 h-7 fill-white ml-0.5" />
              )}
            </button>

            <button
              onClick={skipNext}
              className="p-2 text-slate-300 hover:text-white transition-colors"
            >
              <SkipForward className="w-6 h-6 fill-current" />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="text-slate-400 hover:text-white">
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
