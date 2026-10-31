import React from 'react';
import { Play, Pause, Heart, Sliders, Trash2, Clock, Mic2 } from 'lucide-react';
import { Track } from '../types/music';
import { useAudio } from '../context/AudioContext';
import { formatTime } from '../utils/lrcParser';
import { getCountryFlagVector } from './icons/VectorIcons';

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
    openArtistProfile,
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
      className={`group relative glass-card rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer ${
        isCurrent
          ? 'border-sky-400/80 shadow-[0_0_24px_rgba(56,189,248,0.3)] bg-sky-950/30 ring-1 ring-sky-400/50'
          : ''
      }`}
    >
      {/* Cover Artwork Container */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden glass-card mb-3 border border-white/10">
        <img
          src={track.coverUrl || '/icon.svg'}
          alt={track.title}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            isThisPlaying ? 'brightness-105' : ''
          }`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/icon.svg';
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
            className="w-12 h-12 rounded-full bg-[#3A8BC2] hover:bg-[#4A9FD6] text-white flex items-center justify-center shadow-[0_0_20px_rgba(74,159,214,0.6)] hover:scale-110 active:scale-95 transition-all cursor-pointer"
          >
            {isThisPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5" />
            )}
          </button>
        </div>

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none gap-1">
          <div className="flex items-center gap-1 flex-wrap">
            {track.status === 'pending_review' ? (
              <span className="text-[8px] font-mono font-bold bg-amber-950/90 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-500/50 backdrop-blur-sm">
                PENDING REVIEW
              </span>
            ) : track.status === 'rejected' ? (
              <span className="text-[8px] font-mono font-bold bg-rose-950/90 text-rose-300 px-1.5 py-0.5 rounded-full border border-rose-500/50 backdrop-blur-sm">
                REVISION
              </span>
            ) : hasSyncedLyrics ? (
              <span className="text-[9px] font-mono font-semibold bg-[#070e17]/90 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/40 backdrop-blur-sm">
                SYNCED
              </span>
            ) : null}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(track.id);
            }}
            className="p-1 rounded-full bg-black/50 backdrop-blur-sm text-slate-300 hover:text-rose-400 pointer-events-auto transition-colors cursor-pointer shrink-0"
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
          <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
            {getCountryFlagVector(track.country, 13)}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openArtistProfile(track.ownerId, track.artist);
              }}
              className="text-[11px] text-slate-400 hover:text-sky-300 truncate text-left transition-colors cursor-pointer hover:underline"
              title={`View ${track.artist}'s profile`}
            >
              {track.artist}
            </button>
          </div>
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
