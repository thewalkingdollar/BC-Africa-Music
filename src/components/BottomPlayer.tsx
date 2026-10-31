import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Shuffle,
  Repeat,
  Repeat1,
  Mic2,
  Maximize2,
  Heart,
  Sliders,
  DollarSign,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { formatTime } from '../utils/lrcParser';
import { AudioVisualizer } from './AudioVisualizer';
import { TipArtistModal } from './TipArtistModal';
import { LosslessAudioVector, EqualizerWaveVector, getCountryFlagVector } from './icons/VectorIcons';

export const BottomPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    isLooping,
    isShuffle,
    togglePlay,
    seek,
    skipNext,
    skipPrev,
    setVolume,
    toggleMute,
    setPlaybackRate,
    toggleLoop,
    toggleShuffle,
    toggleFavorite,
    isLyricsOpen,
    setIsLyricsOpen,
    setIsNowPlayingOpen,
    openLyricsStudio,
    openArtistProfile,
  } = useAudio();

  const [isHoveringSeek, setIsHoveringSeek] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    seek(pos * duration);
  };

  const handleSeekMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(pos * duration);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass-panel-elevated border-t border-white/20 px-3 lg:px-6 py-2.5 shadow-[0_-8px_32px_rgba(0,0,0,0.37)]">
      <div className="max-w-7xl mx-auto flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-4">
          {/* Left Zone: Track Info & Cover */}
          <div className="flex items-center gap-3 min-w-[200px] max-w-[280px] lg:max-w-[340px] shrink-0">
            <div
              onClick={() => setIsNowPlayingOpen(true)}
              className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 cursor-pointer group shadow-[0_4px_16px_rgba(0,0,0,0.3)] border border-white/20 glass-card"
            >
              <img
                src={currentTrack.coverUrl || '/icon.svg'}
                alt={currentTrack.title}
                className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${
                  isPlaying ? 'brightness-105' : 'brightness-90'
                }`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/icon.svg';
                }}
              />
              <div className="absolute inset-0 bg-sky-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="w-4 h-4 text-sky-200" />
              </div>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  onClick={() => setIsNowPlayingOpen(true)}
                  className="text-xs lg:text-sm font-semibold text-white truncate cursor-pointer hover:text-sky-300 transition-colors"
                  title={currentTrack.title}
                >
                  {currentTrack.title}
                </span>
                <LosslessAudioVector className="scale-75 origin-left" />
                {currentTrack.lyricsSynced?.length > 0 && (
                  <span className="text-[8px] text-sky-400 bg-sky-950/80 px-1 py-0.2 rounded border border-sky-800/40 shrink-0 font-medium">
                    SYNCED
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {getCountryFlagVector(currentTrack.country, 13)}
                <button
                  type="button"
                  onClick={() => openArtistProfile(currentTrack.ownerId, currentTrack.artist)}
                  className="text-[11px] text-slate-400 hover:text-sky-300 truncate text-left transition-colors cursor-pointer hover:underline"
                  title={`View ${currentTrack.artist}'s profile`}
                >
                  {currentTrack.artist}
                </button>
              </div>
            </div>

            <button
              onClick={() => toggleFavorite(currentTrack.id)}
              className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer shrink-0 ml-1"
              title={currentTrack.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={`w-4 h-4 transition-transform active:scale-125 ${
                  currentTrack.isFavorite ? 'fill-rose-500 text-rose-500' : ''
                }`}
              />
            </button>

            <button
              onClick={() => setIsTipModalOpen(true)}
              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
              title={`Send a tip to ${currentTrack.artist}`}
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </button>
          </div>

          {/* Center Zone: Transport Controls */}
          <div className="flex flex-col items-center flex-1 max-w-xl">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={toggleShuffle}
                className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  isShuffle ? 'text-sky-400 bg-sky-950/60' : 'text-slate-400 hover:text-white'
                }`}
                title={isShuffle ? 'Shuffle enabled' : 'Shuffle off'}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={skipPrev}
                className="p-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Previous track"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-[#3A8BC2] hover:bg-[#4A9FD6] text-white flex items-center justify-center shadow-[0_0_20px_rgba(74,159,214,0.45)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-white text-white" />
                ) : (
                  <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                )}
              </button>

              <button
                onClick={skipNext}
                className="p-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Next track"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={toggleLoop}
                className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  isLooping ? 'text-[#4A9FD6] bg-[#0A1426]' : 'text-slate-400 hover:text-white'
                }`}
                title={isLooping ? 'Repeat track on' : 'Repeat off'}
              >
                {isLooping ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
              </button>
            </div>

            {/* Seek Bar with Time labels */}
            <div className="w-full flex items-center gap-2 mt-1">
              <EqualizerWaveVector isPlaying={isPlaying} className="hidden sm:flex shrink-0 mr-1" />
              <span className="text-[11px] font-mono text-slate-400 tabular-nums w-10 text-right">
                {formatTime(currentTime)}
              </span>

              <div
                className="relative flex-1 h-3 flex items-center cursor-pointer group"
                onClick={handleSeekClick}
                onMouseEnter={() => setIsHoveringSeek(true)}
                onMouseLeave={() => {
                  setIsHoveringSeek(false);
                  setHoverTime(null);
                }}
                onMouseMove={handleSeekMouseMove}
              >
                {/* Background track */}
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden group-hover:h-1.5 transition-all">
                  <div
                    className="h-full bg-gradient-to-r from-[#5AA1D2] to-[#4A9FD6] rounded-full relative"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Scrubber thumb */}
                <div
                  className="absolute w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(74,159,214,0.8)] opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2 pointer-events-none"
                  style={{ left: `${progressPercent}%` }}
                />

                {/* Hover time tooltip */}
                {isHoveringSeek && hoverTime !== null && (
                  <div
                    className="absolute -top-6 -translate-x-1/2 bg-sky-950 text-sky-200 text-[10px] font-mono px-1.5 py-0.5 rounded border border-sky-800 shadow-md pointer-events-none"
                    style={{ left: `${Math.min(95, Math.max(5, (hoverTime / duration) * 100))}%` }}
                  >
                    {formatTime(hoverTime)}
                  </div>
                )}
              </div>

              <span className="text-[11px] font-mono text-slate-400 tabular-nums w-10 text-left">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Right Zone: Controls, Lyrics & Volume */}
          <div className="flex items-center justify-end gap-2.5 min-w-[200px] shrink-0">
            {/* Visualizer Mini */}
            <div className="hidden xl:block w-20 h-6">
              <AudioVisualizer height={24} barCount={16} />
            </div>

            {/* Speed Selector */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors cursor-pointer ${
                  playbackRate !== 1
                    ? 'border-sky-500 text-sky-300 bg-sky-950/60'
                    : 'border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
                title="Playback speed"
              >
                {playbackRate}x
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-8 right-0 bg-[#0c1829] border border-sky-900 rounded-lg p-1 shadow-xl flex flex-col gap-1 z-50">
                  {[0.75, 1, 1.25, 1.5].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        setPlaybackRate(rate);
                        setShowSpeedMenu(false);
                      }}
                      className={`px-3 py-1 text-xs text-left rounded font-mono ${
                        playbackRate === rate
                          ? 'bg-sky-600 text-white'
                          : 'text-slate-300 hover:bg-sky-950'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Lyrics Toggle Button */}
            <button
              onClick={() => setIsLyricsOpen(!isLyricsOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isLyricsOpen
                  ? 'bg-sky-500 text-white shadow-[0_0_12px_rgba(2,132,199,0.5)]'
                  : 'text-slate-300 hover:text-white hover:bg-sky-950/60'
              }`}
              title="Toggle Live Synced Lyrics"
            >
              <Mic2 className="w-4 h-4" />
              <span className="hidden sm:inline">Lyrics</span>
            </button>

            {/* Lyrics Studio Button */}
            <button
              onClick={() => openLyricsStudio(currentTrack.id)}
              className="p-1.5 text-slate-400 hover:text-sky-300 transition-colors cursor-pointer"
              title="Open Lyric Sync Studio"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Volume slider */}
            <div className="hidden sm:flex items-center gap-2 group">
              <button
                onClick={toggleMute}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 lg:w-20 accent-sky-400 cursor-pointer h-1 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Maximize Now Playing */}
            <button
              onClick={() => setIsNowPlayingOpen(true)}
              className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Expand view"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Direct-to-Artist Tip Modal */}
      {currentTrack && (
        <TipArtistModal
          isOpen={isTipModalOpen}
          onClose={() => setIsTipModalOpen(false)}
          artistId={currentTrack.ownerId || 'featured_artist'}
          artistName={currentTrack.artist}
          trackId={currentTrack.id}
          trackTitle={currentTrack.title}
        />
      )}
    </div>
  );
};
