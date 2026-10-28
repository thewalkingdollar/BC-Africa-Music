import React from 'react';
import { Heart, Music } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { TrackCard } from './TrackCard';
import { TrackTable } from './TrackTable';

export const FavoritesView: React.FC = () => {
  const { tracks, setActiveView } = useAudio();

  const favoriteTracks = tracks.filter((t) => t.isFavorite);

  return (
    <div className="space-y-6 pb-32">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950/40 via-[#0a1525] to-sky-950/40 border border-sky-950 p-6 rounded-2xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-900/60">
              Liked Songs
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {favoriteTracks.length} {favoriteTracks.length === 1 ? 'Track' : 'Tracks'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Favorite Tracks
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Your hand-picked collection of favorite African hits and personal uploads.
          </p>
        </div>

        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
        </div>
      </div>

      {favoriteTracks.length === 0 ? (
        <div className="bg-[#091524] border border-sky-950 rounded-2xl p-16 text-center max-w-xl mx-auto">
          <Heart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No favorite tracks yet</h3>
          <p className="text-xs text-slate-400 mb-6">
            Tap the heart icon on any song while streaming or browsing to save it to your favorites.
          </p>
          <button
            onClick={() => setActiveView('discover')}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg cursor-pointer"
          >
            Explore Music
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {favoriteTracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>

          <div className="bg-[#091524] border border-sky-950 rounded-2xl p-4">
            <TrackTable tracks={favoriteTracks} />
          </div>
        </div>
      )}
    </div>
  );
};
