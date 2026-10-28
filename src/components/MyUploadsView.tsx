import React from 'react';
import { Upload, Music, Plus, Sliders } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { TrackCard } from './TrackCard';
import { TrackTable } from './TrackTable';

export const MyUploadsView: React.FC = () => {
  const { tracks, setIsUploadModalOpen, openLyricsStudio } = useAudio();

  const customTracks = tracks.filter((t) => t.isCustomUpload);

  return (
    <div className="space-y-6 pb-32">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#091524] border border-sky-950 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
              Personal Vault
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {customTracks.length} {customTracks.length === 1 ? 'Track' : 'Tracks'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            My Uploaded Music
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Your uploaded audio files and synchronized lyrics, saved locally in IndexedDB.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 rounded-xl shadow-[0_0_20px_rgba(2,132,199,0.4)] transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Audio File</span>
        </button>
      </div>

      {/* Tracks Container */}
      {customTracks.length === 0 ? (
        <div className="bg-[#091524] border border-sky-950 rounded-2xl p-16 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-sky-950/80 border border-sky-800 flex items-center justify-center text-sky-400 mx-auto mb-4 shadow-lg">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No custom tracks uploaded yet</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Upload your own MP3, WAV, AAC, or FLAC songs. You can then stream them directly
            in BC Africa Music and synchronize their lyrics using our live tap-to-sync studio!
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-[0_0_20px_rgba(2,132,199,0.3)] transition-all cursor-pointer mx-auto"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Your First Song</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {customTracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>

          <div className="bg-[#091524] border border-sky-950 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Detailed File &amp; Sync Status
            </h4>
            <TrackTable tracks={customTracks} />
          </div>
        </div>
      )}
    </div>
  );
};
