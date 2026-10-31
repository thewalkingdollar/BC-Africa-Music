import React from 'react';
import { Flame, Play, Pause, TrendingUp, Music2, Clock, Sparkles, Mic2 } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { formatTime } from '../utils/lrcParser';

export const TrendingNow: React.FC = () => {
  const {
    trendingTracks,
    plays24hMap,
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    openLyricsStudio,
    openArtistProfile,
  } = useAudio();

  // Total plays in the last 24 hours across all songs
  const total24hPlays = Object.values(plays24hMap).reduce((acc, count) => acc + count, 0);

  // Take top 6 trending songs
  const topTrending = trendingTracks.slice(0, 6);
  const hasAny24hPlays = topTrending.some((t) => t.plays24h > 0);

  if (trendingTracks.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-950/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-amber-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(2,132,199,0.35)]">
            <Flame className="w-4 h-4 fill-amber-300 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-1.5">
                Trending Now
              </h2>
              <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 bg-sky-950/90 px-2 py-0.5 rounded-full border border-sky-500/30">
                Last 24 Hours
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live top-streamed songs across BC Africa Music based on real-time plays
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs font-mono tabular-nums text-sky-300 bg-[#091524] px-3 py-1 rounded-lg border border-sky-900/60 flex items-center gap-1.5 shadow-sm">
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-semibold text-white">{total24hPlays}</span> plays today
          </span>
        </div>
      </div>

      {/* No plays in 24h notice (if songs exist but haven't been streamed in past 24h yet) */}
      {!hasAny24hPlays && (
        <div className="bg-gradient-to-r from-sky-950/40 via-[#0b192c]/50 to-sky-950/40 border border-sky-900/30 rounded-xl p-3.5 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              The 24-hour chart resets with live streams. Play any song below to launch it to <strong className="text-sky-300 font-semibold">#1 Trending</strong>!
            </span>
          </div>
        </div>
      )}

      {/* Ranked Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {topTrending.map(({ track, plays24h, rank }) => {
          const isCurrent = currentTrack?.id === track.id;
          const isThisPlaying = isCurrent && isPlaying;

          // Rank badge styling
          let rankBadgeClass = 'text-slate-400 bg-slate-900/80 border-slate-700/60';
          let rankGlow = '';
          if (rank === 1) {
            rankBadgeClass = 'text-amber-300 bg-amber-950/80 border-amber-500/50';
            rankGlow = 'shadow-[0_0_12px_rgba(245,158,11,0.2)]';
          } else if (rank === 2) {
            rankBadgeClass = 'text-sky-300 bg-sky-950/80 border-sky-400/50';
            rankGlow = 'shadow-[0_0_12px_rgba(56,189,248,0.15)]';
          } else if (rank === 3) {
            rankBadgeClass = 'text-orange-300 bg-orange-950/80 border-orange-500/50';
            rankGlow = 'shadow-[0_0_12px_rgba(249,115,22,0.15)]';
          }

          return (
            <div
              key={track.id}
              onClick={() => {
                if (isCurrent) {
                  togglePlay();
                } else {
                  playTrack(track);
                }
              }}
              className={`group relative flex items-center justify-between gap-3 p-3 rounded-2xl glass-card cursor-pointer ${
                isCurrent
                  ? 'border-sky-400/80 shadow-[0_4px_24px_rgba(56,189,248,0.25)] bg-sky-950/40 ring-1 ring-sky-400/50'
                  : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Rank Number */}
                <span
                  className={`w-7 h-7 shrink-0 rounded-lg font-mono text-xs font-bold flex items-center justify-center border tabular-nums ${rankBadgeClass} ${rankGlow}`}
                >
                  {String(rank).padStart(2, '0')}
                </span>

                {/* Cover Art with Play Button */}
                <div className="relative w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-sky-950 border border-sky-900/50">
                  <img
                    src={track.coverUrl || '/icon.svg'}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/icon.svg';
                    }}
                  />
                  <div
                    className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                      isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md">
                      {isThisPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-white" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Track Details */}
                <div className="min-w-0">
                  <h4
                    className={`text-xs font-bold truncate transition-colors ${
                      isCurrent ? 'text-sky-300' : 'text-white group-hover:text-sky-200'
                    }`}
                    title={track.title}
                  >
                    {track.title}
                  </h4>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openArtistProfile(track.ownerId, track.artist);
                    }}
                    className="text-[11px] text-slate-400 hover:text-sky-300 truncate mt-0.5 text-left transition-colors cursor-pointer block max-w-full hover:underline"
                    title={`View ${track.artist}'s profile`}
                  >
                    {track.artist}
                  </button>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-mono">
                    <span className="text-sky-400/80">{track.genre}</span>
                    <span>•</span>
                    <span className="tabular-nums flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTime(track.duration)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side: 24h Plays & Total Plays */}
              <div className="flex flex-col items-end shrink-0 pl-1">
                <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400 tabular-nums bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-500/20">
                  <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{plays24h}</span>
                  <span className="text-[9px] font-sans text-amber-300/80 font-normal">24h</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-1 tabular-nums">
                  {track.plays || 0} all-time
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
