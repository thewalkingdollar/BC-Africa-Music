import React, { useState } from 'react';
import { LayoutGrid, List, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { TrackCard } from './TrackCard';
import { TrackTable } from './TrackTable';

export const LibraryView: React.FC = () => {
  const { tracks, searchQuery, selectedGenre, setSelectedGenre } = useAudio();
  const [layoutMode, setLayoutMode] = useState<'grid' | 'table'>('table');
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'duration' | 'plays'>('plays');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const genres = ['all', 'Afrobeats', 'Amapiano', 'Highlife', 'Afro-Soul', 'Afro-Fusion'];

  const filtered = tracks.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.genre.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGenre =
      selectedGenre === 'all' || t.genre.toLowerCase() === selectedGenre.toLowerCase();

    return matchesSearch && matchesGenre;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'title') comparison = a.title.localeCompare(b.title);
    else if (sortBy === 'artist') comparison = a.artist.localeCompare(b.artist);
    else if (sortBy === 'duration') comparison = a.duration - b.duration;
    else if (sortBy === 'plays') comparison = (a.plays || 0) - (b.plays || 0);

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-950/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Music Library</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete collection of streams, synced tracks, and custom uploads.
          </p>
        </div>

        {/* Sorting and layout controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#091524] border border-sky-950 rounded-lg p-1 text-xs">
            <span className="text-slate-400 px-2 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </span>
            <button
              onClick={() => toggleSort('plays')}
              className={`px-2.5 py-1 rounded cursor-pointer ${
                sortBy === 'plays' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              Popularity
            </button>
            <button
              onClick={() => toggleSort('title')}
              className={`px-2.5 py-1 rounded cursor-pointer ${
                sortBy === 'title' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              Title
            </button>
            <button
              onClick={() => toggleSort('duration')}
              className={`px-2.5 py-1 rounded cursor-pointer ${
                sortBy === 'duration' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              Length
            </button>
          </div>

          <div className="flex items-center bg-[#070e17] p-1 rounded-lg border border-sky-950">
            <button
              onClick={() => setLayoutMode('grid')}
              className={`p-1.5 rounded cursor-pointer ${
                layoutMode === 'grid' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayoutMode('table')}
              className={`p-1.5 rounded cursor-pointer ${
                layoutMode === 'table' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Table"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Genre Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGenre(g)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
              selectedGenre.toLowerCase() === g.toLowerCase()
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-[#091524] text-slate-400 hover:text-white border border-sky-950'
            }`}
          >
            {g === 'all' ? 'All Genres' : g}
          </button>
        ))}
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <div className="bg-[#091524] border border-sky-950 rounded-2xl p-12 text-center">
          <p className="text-sm text-slate-300">No tracks found matching your filter criteria.</p>
        </div>
      ) : layoutMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sorted.map((track, i) => (
            <TrackCard key={track.id} track={track} index={i} />
          ))}
        </div>
      ) : (
        <div className="bg-[#091524] border border-sky-950 rounded-2xl p-4">
          <TrackTable tracks={sorted} />
        </div>
      )}
    </div>
  );
};
