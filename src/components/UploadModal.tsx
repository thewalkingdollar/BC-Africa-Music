import React, { useState, useRef } from 'react';
import { X, Upload, Music, Image as ImageIcon, Sparkles, Check, Sliders } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { parseLRC, plainTextToLines } from '../utils/lrcParser';

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
];

export const UploadModal: React.FC = () => {
  const {
    isUploadModalOpen,
    setIsUploadModalOpen,
    addCustomTrack,
    playTrack,
    openLyricsStudio,
  } = useAudio();

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('BC Africa Single');
  const [genre, setGenre] = useState('Afrobeats');
  const [lyricsText, setLyricsText] = useState('');
  const [coverUrl, setCoverUrl] = useState(PRESET_COVERS[0]);
  const [customCoverFile, setCustomCoverFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  if (!isUploadModalOpen) return null;

  const handleAudioSelection = (file: File) => {
    setAudioFile(file);

    // Auto-fill title from filename
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    if (cleanName.includes('-')) {
      const [art, tit] = cleanName.split('-').map((s) => s.trim());
      if (art && !artist) setArtist(art);
      if (tit && !title) setTitle(tit);
    } else if (!title) {
      setTitle(cleanName);
    }

    // Measure duration
    const tempAudio = new Audio();
    tempAudio.src = URL.createObjectURL(file);
    tempAudio.addEventListener('loadedmetadata', () => {
      if (tempAudio.duration && isFinite(tempAudio.duration)) {
        setDuration(Math.round(tempAudio.duration));
      }
    });
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|flac|ogg)$/i.test(file.name)) {
        handleAudioSelection(file);
      }
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCustomCoverFile(file);
      setCoverUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (startSyncStudio = false) => {
    if (!audioFile) {
      alert('Please select an audio file (MP3, WAV, etc.) to upload.');
      return;
    }
    if (!title.trim()) {
      alert('Please enter a track title.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse lyrics if provided
      let syncedLines: import('../types/music').LyricLine[] = [];
      if (lyricsText.trim()) {
        const hasTimestamps = /\[\d{1,2}:\d{2}/.test(lyricsText);
        syncedLines = hasTimestamps ? parseLRC(lyricsText) : plainTextToLines(lyricsText);
      }

      const newTrack = await addCustomTrack(
        {
          title: title.trim(),
          artist: (artist.trim() || 'BC Africa Artist'),
          album: album.trim() || 'Single',
          genre,
          duration: duration || 180,
          audioUrl: '',
          coverUrl,
          lyricsRaw: lyricsText,
          lyricsSynced: syncedLines,
          uploadedAt: new Date().toISOString().split('T')[0],
          fileSize: audioFile.size,
        },
        audioFile
      );

      setIsSubmitting(false);
      setIsUploadModalOpen(false);

      // Play the newly uploaded track immediately!
      await playTrack(newTrack);

      if (startSyncStudio) {
        openLyricsStudio(newTrack.id);
      }
    } catch (err) {
      console.error('Track upload failed:', err);
      setIsSubmitting(false);
      alert('Failed to save audio file. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#081322] border border-sky-950/80 rounded-2xl shadow-2xl p-6 text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-sky-950">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-800/60 flex items-center justify-center text-sky-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Upload Music to BC Africa</h2>
              <p className="text-xs text-sky-400/80">Stream anywhere, attach lyrics, and sync live</p>
            </div>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-5 mt-5">
          {/* Audio Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-sky-400 bg-sky-950/50'
                : audioFile
                ? 'border-sky-600 bg-sky-950/30'
                : 'border-sky-900/60 hover:border-sky-600 bg-[#060e18]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleAudioSelection(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            {audioFile ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-600/20 text-sky-400 flex items-center justify-center">
                  <Check className="w-5 h-5 text-sky-300" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white truncate max-w-sm">
                    {audioFile.name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {(audioFile.size / (1024 * 1024)).toFixed(2)} MB {duration > 0 && `· ~${Math.floor(duration / 60)}m ${duration % 60}s`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <Music className="w-8 h-8 text-sky-400 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-semibold text-white">
                  Drop audio file here, or <span className="text-sky-400 underline">browse files</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Supports MP3, WAV, AAC, M4A, FLAC, OGG
                </p>
              </div>
            )}
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Track Title *
              </label>
              <input
                type="text"
                placeholder="e.g. African Giant"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#060e18] border border-sky-900/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Artist Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Burna Boy, Wizkid, Asake"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full bg-[#060e18] border border-sky-900/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-[#060e18] border border-sky-900/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
              >
                <option value="Afrobeats">Afrobeats</option>
                <option value="Amapiano">Amapiano</option>
                <option value="Highlife">Highlife</option>
                <option value="Afro-Soul">Afro-Soul</option>
                <option value="Afro-Fusion">Afro-Fusion</option>
                <option value="Bongo Flava">Bongo Flava</option>
                <option value="Gospel">Gospel</option>
                <option value="Reggae / Dancehall">Reggae / Dancehall</option>
                <option value="Hip Hop / Drill">Hip Hop / Drill</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Album / EP (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. African Soundscapes"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                className="w-full bg-[#060e18] border border-sky-900/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          {/* Cover Art Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Album Artwork
            </label>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-sky-800 shrink-0 shadow-md">
                <img
                  src={coverUrl}
                  alt="Cover Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 flex flex-wrap items-center gap-2">
                {PRESET_COVERS.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCoverUrl(preset)}
                    className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      coverUrl === preset ? 'border-sky-400 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={preset} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="h-10 px-3 bg-[#060e18] hover:bg-sky-950 border border-sky-900/60 rounded-lg text-xs text-sky-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Custom Image</span>
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Lyrics (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Lyrics (Optional - can be synced later in Sync Studio)
              </label>
              <span className="text-[10px] text-sky-400 font-mono">Plain text or LRC code</span>
            </div>
            <textarea
              value={lyricsText}
              onChange={(e) => setLyricsText(e.target.value)}
              placeholder="Paste song lyrics here... You can timestamp them immediately after uploading using the Live Sync Studio!"
              rows={4}
              className="w-full bg-[#060e18] border border-sky-900/60 rounded-lg p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-400"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-sky-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            Audio is stored in browser memory &amp; IndexedDB for persistent streaming.
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>

            <button
              disabled={isSubmitting || !audioFile}
              onClick={() => handleSubmit(true)}
              className="px-4 py-2 text-xs font-semibold text-sky-300 bg-sky-950 hover:bg-sky-900 border border-sky-800 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Save &amp; Sync Lyrics</span>
            </button>

            <button
              disabled={isSubmitting || !audioFile}
              onClick={() => handleSubmit(false)}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 rounded-lg shadow-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Uploading...' : 'Upload & Play'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
