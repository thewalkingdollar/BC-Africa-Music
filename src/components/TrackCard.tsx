import React from 'react';
import { Play, Pause, Heart, Sliders, Trash2, Clock, Mic2 } from 'lucide-react';
import { Track } from '../types/music';
import { useAudio } from '../context/AudioContext';
import { formatTime } from '../utils/lrcParser';

interface TrackCardProps {
  track: Track;
  index?: number;
}

export const TrackCard: React.FC<TrackCardProps> = ({ track, index }) => {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    toggleFavorite,
    openLyricsStudio,
    setIsLyricsOpen,
    deleteTrack,
  } = useAudio();

  const isCurrent = currentTrack?.id === track.id;
  const isThisPlaying = isCurrent && isPlaying;
  const hasSyncedLyrics = track.lyricsSynced && track.lyricsSynced.some((l) => l.time >= 0);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track);
    }
  };

  return (
    <div
      onClick={() => {
        if (!isCurrent) playTrack(track);
      }}
      className={`group relative bg-[#091423] hover:bg-[#0c1a2e] border transition-all duration-200 rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer ${
        isCurrent
          ? 'border-sky-500/80 shadow-[0_0_20px_rgba(2,132,199,0.25)]'
          : 'border-sky-950/60 hover:border-sky-900/80 shadow-md'
      }`}
    >
      {/* Cover Artwork Container */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-sky-950/60 mb-3 border border-sky-950">
        <img
          src={track.coverUrl || '/assets/aistudio/e8cdafe3a5e2c0c1-blue-africa-logo_3aeaa8bc.jpg'}
          alt={track.title}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            isThisPlaying ? 'brightness-105' : ''
          }`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/aistudio/e8cdafe3a5e2c0c1-blue-africa-logo_3aeaa8bc.jpg';
          }}
        />

        {/* Hover / Active Play Button Overlay */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-200 ${
            isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <button
            onClick={handlePlayClick}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-600 via-sky-500 to-sky-400 text-white flex items-center justify-center shadow-[0_0_20px_rgba(2,132,199,0.7)] hover:scale-110 active:scale-95 transition-all cursor-pointer"
          >
            {isThisPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5" />
            )}
          </button>
        </div>

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          {hasSyncedLyrics ? (
            <span className="text-[9px] font-mono font-semibold bg-[#070e17]/90 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/40 backdrop-blur-sm">
              SYNCED
            </span>
          ) : (
            <span />
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(track.id);
            }}
            className="p-1 rounded-full bg-black/50 backdrop-blur-sm text-slate-300 hover:text-rose-400 pointer-events-auto transition-colors cursor-pointer"
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                track.isFavorite ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3
            className={`text-xs font-semibold truncate transition-colors ${
              isCurrent ? 'text-sky-300 font-bold' : 'text-white group-hover:text-sky-200'
            }`}
            title={track.title}
          >
            {track.title}
          </h3>
          <p className="text-[11px] text-slate-400 truncate mt-0.5" title={track.artist}>
            {track.artist}
          </p>
        </div>

        {/* Bottom meta & actions */}
        <div className="mt-3 pt-2.5 border-t border-sky-950/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-mono tabular-nums flex items-center gap-1">
            <Clock className="w-3 h-3 text-sky-400/70" />
            {formatTime(track.duration)}
          </span>

          <div className="flex items-center gap-1">
            {/* Lyrics View */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isCurrent) playTrack(track);
                setIsLyricsOpen(true);
              }}
              className="p-1 text-slate-400 hover:text-sky-300 hover:bg-sky-950/60 rounded transition-colors cursor-pointer"
              title="View lyrics"
            >
              <Mic2 className="w-3.5 h-3.5" />
            </button>

            {/* Sync Studio */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                openLyricsStudio(track.id);
              }}
              className="p-1 text-slate-400 hover:text-sky-300 hover:bg-sky-950/60 rounded transition-colors cursor-pointer"
              title="Sync / edit lyrics"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>

            {/* Delete button for user custom uploads */}
            {track.isCustomUpload && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Remove "${track.title}" from your library?`)) {
                    deleteTrack(track.id);
                  }
                }}
                className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                title="Delete track"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
