import React from 'react';
import { Play, Pause, Heart, Clock, Sliders, Trash2, Mic2 } from 'lucide-react';
import { Track } from '../types/music';
import { useAudio } from '../context/AudioContext';
import { formatTime } from '../utils/lrcParser';
import { getCountryFlagVector } from './icons/VectorIcons';

interface TrackTableProps {
  tracks: Track[];
}

export const TrackTable: React.FC<TrackTableProps> = ({ tracks }) => {
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

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-sky-950/80 text-[11px] font-mono uppercase tracking-wider text-slate-400">
            <th className="py-2.5 px-3 w-10">#</th>
            <th className="py-2.5 px-3">Title</th>
            <th className="py-2.5 px-3 hidden md:table-cell">Album</th>
            <th className="py-2.5 px-3 hidden sm:table-cell">Genre</th>
            <th className="py-2.5 px-3 text-center">Lyrics</th>
            <th className="py-2.5 px-3 text-right">
              <Clock className="w-3.5 h-3.5 inline text-slate-400" />
            </th>
            <th className="py-2.5 px-3 w-20 text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sky-950/40 text-xs">
          {tracks.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id;
            const isThisPlaying = isCurrent && isPlaying;
            const hasSyncedLyrics = track.lyricsSynced && track.lyricsSynced.some((l) => l.time >= 0);

            return (
              <tr
                key={track.id}
                onClick={() => {
                  if (isCurrent) togglePlay();
                  else playTrack(track);
                }}
                className={`group cursor-pointer transition-colors ${
                  isCurrent
                    ? 'bg-sky-950/40 text-sky-200'
                    : 'hover:bg-[#0c1a2e]/60 text-slate-300'
                }`}
              >
                {/* Index / Play button */}
                <td className="py-3 px-3 text-slate-400 font-mono text-[11px] w-10">
                  <div className="relative w-5 h-5 flex items-center justify-center">
                    <span className={`group-hover:hidden ${isCurrent ? 'hidden' : 'block'}`}>
                      {idx + 1}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrent) togglePlay();
                        else playTrack(track);
                      }}
                      className={`text-sky-400 ${isCurrent ? 'block' : 'hidden group-hover:block'}`}
                    >
                      {isThisPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                    </button>
                  </div>
                </td>

                {/* Title & Artist */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-sky-950/60 shrink-0 border border-sky-900/40">
                      <img
                        src={track.coverUrl || '/icon.svg'}
                        alt={track.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/icon.svg';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p
                          className={`font-semibold truncate ${
                            isCurrent ? 'text-sky-300' : 'text-white'
                          }`}
                        >
                          {track.title}
                        </p>
                        {track.status === 'pending_review' && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 shrink-0 font-bold">
                            Pending
                          </span>
                        )}
                        {track.status === 'rejected' && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 shrink-0 font-bold" title={track.reviewerNotes}>
                            Needs Revision
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {getCountryFlagVector(track.country, 12)}
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
                  </div>
                </td>

                {/* Album */}
                <td className="py-3 px-3 hidden md:table-cell text-slate-400 truncate max-w-[160px]">
                  {track.album || 'Single'}
                </td>

                {/* Genre */}
                <td className="py-3 px-3 hidden sm:table-cell text-slate-400">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-sky-950/70 border border-sky-900/40 text-sky-300">
                    {track.genre}
                  </span>
                </td>

                {/* Synced Lyrics Status */}
                <td className="py-3 px-3 text-center">
                  {hasSyncedLyrics ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isCurrent) playTrack(track);
                        setIsLyricsOpen(true);
                      }}
                      className="inline-flex items-center gap-1 text-[10px] font-mono text-sky-300 bg-sky-950/90 border border-sky-600/50 px-2 py-0.5 rounded-full hover:bg-sky-900"
                    >
                      <Mic2 className="w-3 h-3 text-sky-400" />
                      <span>SYNCED</span>
                    </button>
                  ) : track.lyricsRaw ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openLyricsStudio(track.id);
                      }}
                      className="text-[10px] text-slate-400 hover:text-sky-300 underline"
                    >
                      Unsynced
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openLyricsStudio(track.id);
                      }}
                      className="text-[10px] text-slate-500 hover:text-sky-400"
                    >
                      + Add
                    </button>
                  )}
                </td>

                {/* Duration */}
                <td className="py-3 px-3 text-right font-mono text-[11px] text-slate-400 tabular-nums">
                  {formatTime(track.duration)}
                </td>

                {/* Row actions */}
                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(track.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Favorite"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          track.isFavorite ? 'fill-rose-500 text-rose-500' : ''
                        }`}
                      />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openLyricsStudio(track.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-sky-300 transition-colors"
                      title="Sync studio"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>

                    {track.isCustomUpload && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Remove "${track.title}" from library?`)) {
                            deleteTrack(track.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
