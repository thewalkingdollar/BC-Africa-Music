import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Music,
  Image as ImageIcon,
  Sparkles,
  Check,
  Sliders,
  CheckCircle2,
  Activity,
  Layers,
  Info,
} from 'lucide-react';
import { parseBlob } from 'music-metadata-browser';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { parseLRC, plainTextToLines } from '../utils/lrcParser';
import { LyricLine } from '../types/music';
import { apiClient } from '../services/apiClient';

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
];

const GENRE_BPM_PRESETS = [
  { genre: 'Afrobeats', bpm: 104, defaultKey: 'F#m' },
  { genre: 'Amapiano', bpm: 113, defaultKey: 'Am' },
  { genre: 'Highlife', bpm: 118, defaultKey: 'C' },
  { genre: 'Zed Beats', bpm: 110, defaultKey: 'Bm' },
  { genre: 'Afro-Soul', bpm: 92, defaultKey: 'Em' },
];

const COMMON_KEYS = [
  'F#m',
  'Am',
  'Bm',
  'C',
  'G',
  'D',
  'Dm',
  'Em',
  'Gm',
  'C#m',
  'Fm',
  'Ab',
  'Bb',
  'Eb',
];

export const UploadModal: React.FC = () => {
  const {
    isUploadModalOpen,
    setIsUploadModalOpen,
    addCustomTrack,
    playTrack,
    openLyricsStudio,
  } = useAudio();

  const { user, profile, setIsAuthModalOpen, setAuthModalMode } = useAuth();

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState(profile?.artistStageName || profile?.displayName || '');
  const [album, setAlbum] = useState('BC Africa Single');
  const [genre, setGenre] = useState('Afrobeats');
  const [lyricsText, setLyricsText] = useState('');
  const [coverUrl, setCoverUrl] = useState(PRESET_COVERS[0]);

  // Audio metadata auto-detection state
  const [bpm, setBpm] = useState<number | ''>('');
  const [musicalKey, setMusicalKey] = useState<string>('F#m');
  const [sampleRate, setSampleRate] = useState<string>('44.1kHz');
  const [metadataSource, setMetadataSource] = useState<'auto-from-file' | 'manual-fallback' | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [showAdvancedAudio, setShowAdvancedAudio] = useState<boolean>(false);

  useEffect(() => {
    if (profile?.artistStageName && !artist) {
      setArtist(profile.artistStageName);
    } else if (profile?.displayName && !artist) {
      setArtist(profile.displayName);
    }
  }, [profile]);

  const [customCoverFile, setCustomCoverFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  if (!isUploadModalOpen) return null;

  const handleAudioSelection = async (file: File) => {
    setAudioFile(file);
    setIsAnalyzing(true);
    setMetadataSource(null);

    // Auto-fill fallback title from filename
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    if (cleanName.includes('-')) {
      const [art, tit] = cleanName.split('-').map((s) => s.trim());
      if (art && !artist) setArtist(art);
      if (tit && !title) setTitle(tit);
    } else if (!title) {
      setTitle(cleanName);
    }

    // Measure duration via HTML Audio element as base check
    const tempAudio = new Audio();
    const tempUrl = URL.createObjectURL(file);
    tempAudio.src = tempUrl;
    tempAudio.addEventListener('loadedmetadata', () => {
      if (tempAudio.duration && isFinite(tempAudio.duration)) {
        setDuration(Math.round(tempAudio.duration));
      }
      URL.revokeObjectURL(tempUrl);
    });

    // Client-side instant tag inspection using music-metadata-browser
    try {
      const parsed = await parseBlob(file);
      const { common, format } = parsed;

      // Extract duration & sample rate
      if (format.duration && isFinite(format.duration)) {
        setDuration(Math.round(format.duration));
      }
      if (format.sampleRate) {
        setSampleRate(`${(format.sampleRate / 1000).toFixed(1)}kHz`);
      }

      // Pre-fill ID3 text tags if present
      if (common.title && !title) setTitle(common.title);
      if (common.artist && !artist) setArtist(common.artist);
      if (common.album && (!album || album === 'BC Africa Single')) setAlbum(common.album);
      if (common.genre && common.genre.length > 0) {
        setGenre(common.genre[0]);
      }

      // Check for BPM (common.bpm or native ID3 TBPM)
      let detectedBpm: number | null = null;
      if (typeof common.bpm === 'number' && !isNaN(common.bpm) && common.bpm > 0) {
        detectedBpm = Math.round(common.bpm);
      } else if (common.bpm) {
        const parsedB = parseFloat(String(common.bpm));
        if (!isNaN(parsedB) && parsedB > 0) detectedBpm = Math.round(parsedB);
      }

      // Check for Musical Key (common.key or native ID3 TKEY / INITIALKEY)
      let detectedKey: string | null = null;
      if (common.key && typeof common.key === 'string' && common.key.trim().length > 0) {
        detectedKey = common.key.trim();
      }

      // Deep scan native tags if not in common
      if (!detectedBpm || !detectedKey) {
        if (parsed.native) {
          Object.values(parsed.native).forEach((tagList) => {
            tagList.forEach((tag) => {
              const id = (tag.id || '').toUpperCase();
              if (!detectedBpm && (id === 'TBPM' || id === 'BPM')) {
                const b = parseFloat(String(tag.value));
                if (!isNaN(b) && b > 0) detectedBpm = Math.round(b);
              }
              if (!detectedKey && (id === 'TKEY' || id === 'KEY' || id === 'INITIALKEY')) {
                detectedKey = String(tag.value).trim();
              }
            });
          });
        }
      }

      if (detectedBpm || detectedKey) {
        // Tag found in file!
        if (detectedBpm) setBpm(detectedBpm);
        if (detectedKey) setMusicalKey(detectedKey);
        setMetadataSource('auto-from-file');
      } else {
        // Normal for ~80% of African music exports without embedded TBPM tags
        setMetadataSource('manual-fallback');
        // Preset based on selected genre
        const preset = GENRE_BPM_PRESETS.find((p) => p.genre.toLowerCase() === genre.toLowerCase());
        setBpm(preset ? preset.bpm : 112);
        setMusicalKey(preset ? preset.defaultKey : 'F#m');
      }
    } catch (err) {
      console.warn('Local metadata parsing note:', err);
      setMetadataSource('manual-fallback');
      if (!bpm) setBpm(112);
    } finally {
      setIsAnalyzing(false);
    }
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

  const applyGenrePreset = (presetBpm: number, presetKey: string, presetGenre?: string) => {
    setBpm(presetBpm);
    setMusicalKey(presetKey);
    if (presetGenre) setGenre(presetGenre);
  };

  const handleSubmit = async (startSyncStudio = false) => {
    if (!user) {
      setIsUploadModalOpen(false);
      setAuthModalMode('signup');
      setIsAuthModalOpen(true);
      return;
    }

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
      let syncedLines: LyricLine[] = [];
      if (lyricsText.trim()) {
        const hasTimestamps = /\[\d{1,2}:\d{2}/.test(lyricsText);
        syncedLines = hasTimestamps ? parseLRC(lyricsText) : plainTextToLines(lyricsText);
      }

      const effectiveArtist =
        artist.trim() ||
        profile?.artistStageName ||
        profile?.displayName ||
        user.displayName ||
        'BC Africa Artist';

      let finalCoverUrl = coverUrl;
      if (customCoverFile) {
        const coverBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(customCoverFile);
        });
        const coverRes = await apiClient.uploadCover(
          customCoverFile.name || `cover_${Date.now()}.jpg`,
          coverBase64,
          customCoverFile.type || 'image/jpeg'
        );
        finalCoverUrl = coverRes.url;
      }

      const numBpm = typeof bpm === 'number' && bpm > 0 ? bpm : undefined;

      const newTrack = await addCustomTrack(
        {
          title: title.trim(),
          artist: effectiveArtist,
          album: album.trim() || 'Single',
          genre,
          duration: duration || 180,
          audioUrl: '',
          coverUrl: finalCoverUrl,
          country: profile?.country || 'Zambia',
          lyricsRaw: lyricsText,
          lyricsSynced: syncedLines,
          uploadedAt: new Date().toISOString().split('T')[0],
          fileSize: audioFile.size,
          ownerId: user.uid,
          ownerEmail: user.email || '',
          ownerName:
            profile?.artistStageName ||
            profile?.displayName ||
            user.displayName ||
            effectiveArtist,
          bpm: numBpm,
          musicalKey: musicalKey || undefined,
          sampleRate: sampleRate || '44.1kHz',
          metadataSource: metadataSource || 'manual-fallback',
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
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#0A1426] to-[#0F1D32] border border-[#4A9FD6]/20 rounded-2xl shadow-2xl p-6 text-slate-100 my-8 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#4A9FD6]/15">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#4A9FD6]/15 border border-[#4A9FD6]/30 flex items-center justify-center text-[#4A9FD6]">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Upload Music to BC Africa</h2>
              <p className="text-xs text-[#5AA1D2]/80">Auto BPM &amp; Key detection with server storage</p>
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
        <div className="space-y-4 mt-4">
          {/* Audio Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-[#4A9FD6] bg-[#4A9FD6]/15'
                : audioFile
                ? 'border-emerald-500/50 bg-emerald-950/20'
                : 'border-[#4A9FD6]/20 hover:border-[#4A9FD6]/60 bg-[#060e18]/80'
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
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Check className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white truncate max-w-sm">
                    {audioFile.name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {(audioFile.size / (1024 * 1024)).toFixed(2)} MB {duration > 0 && `· ~${Math.floor(duration / 60)}m ${duration % 60}s`} · {sampleRate}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <Music className="w-8 h-8 text-[#4A9FD6] mx-auto mb-2 opacity-90" />
                <p className="text-xs font-semibold text-white">
                  Drop audio file here, or <span className="text-[#5AA1D2] underline">browse files</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Supports MP3, WAV, AAC, M4A, FLAC, OGG &bull; Auto-detects ID3 tags
                </p>
              </div>
            )}
          </div>

          {/* Real-time Metadata Extraction Status Card */}
          {isAnalyzing && (
            <div className="p-3 rounded-xl bg-white/[0.04] border border-[#4A9FD6]/30 flex items-center gap-2.5 text-xs text-[#5AA1D2] animate-pulse">
              <Activity className="w-4 h-4 animate-spin shrink-0" />
              <span>Analyzing audio file headers &amp; ID3 tags (TBPM / TKEY / Vorbis)...</span>
            </div>
          )}

          {metadataSource === 'auto-from-file' && !isAnalyzing && (
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Auto-detected from file metadata (ID3)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdvancedAudio(!showAdvancedAudio)}
                  className="text-[11px] text-[#5AA1D2] hover:underline cursor-pointer"
                >
                  {showAdvancedAudio ? 'Hide details' : 'Adjust'}
                </button>
              </div>
              <div className="mt-2 flex items-center gap-3 font-mono text-[11px] text-slate-300">
                <span className="px-2 py-0.5 rounded bg-emerald-900/40 border border-emerald-700/50 text-emerald-200">
                  BPM: <strong>{bpm || 'N/A'}</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-900/40 border border-emerald-700/50 text-emerald-200">
                  Key: <strong>{musicalKey}</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-900/40 border border-emerald-700/50 text-emerald-200">
                  {sampleRate}
                </span>
              </div>
            </div>
          )}

          {(metadataSource === 'manual-fallback' || showAdvancedAudio) && !isAnalyzing && (
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-[#4A9FD6]/20 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Info className="w-3.5 h-3.5 text-[#4A9FD6]" />
                  <span>
                    {metadataSource === 'manual-fallback'
                      ? 'BPM / Key not found in file — choose a genre preset or enter manually:'
                      : 'Fine-tune BPM & Musical Key:'}
                  </span>
                </div>
              </div>

              {/* Quick Genre Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {GENRE_BPM_PRESETS.map((p) => (
                  <button
                    key={p.genre}
                    type="button"
                    onClick={() => applyGenrePreset(p.bpm, p.defaultKey, p.genre)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                      bpm === p.bpm && genre === p.genre
                        ? 'bg-[#3A8BC2] text-white shadow-sm'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-[#4A9FD6]/20'
                    }`}
                  >
                    {p.genre} ({p.bpm} BPM &bull; {p.defaultKey})
                  </button>
                ))}
              </div>

              {/* Manual Inputs Grid */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                    BPM (Tempo)
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="260"
                    value={bpm}
                    onChange={(e) => setBpm(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    placeholder="e.g. 112"
                    className="w-full bg-[#060e18] border border-[#4A9FD6]/30 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#4A9FD6]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                    Musical Key
                  </label>
                  <select
                    value={musicalKey}
                    onChange={(e) => setMusicalKey(e.target.value)}
                    className="w-full bg-[#060e18] border border-[#4A9FD6]/30 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#4A9FD6]"
                  >
                    {COMMON_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                    Sample Rate
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={sampleRate}
                    className="w-full bg-[#060e18]/60 border border-[#4A9FD6]/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Track Title *
              </label>
              <input
                type="text"
                placeholder="e.g. African Giant"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#060e18] border border-[#4A9FD6]/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A9FD6]"
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
                className="w-full bg-[#060e18] border border-[#4A9FD6]/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A9FD6]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Genre
              </label>
              <select
                value={genre}
                onChange={(e) => {
                  setGenre(e.target.value);
                  const preset = GENRE_BPM_PRESETS.find((p) => p.genre === e.target.value);
                  if (preset && metadataSource === 'manual-fallback') {
                    setBpm(preset.bpm);
                    setMusicalKey(preset.defaultKey);
                  }
                }}
                className="w-full bg-[#060e18] border border-[#4A9FD6]/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A9FD6]"
              >
                <option value="Afrobeats">Afrobeats</option>
                <option value="Amapiano">Amapiano</option>
                <option value="Highlife">Highlife</option>
                <option value="Zed Beats">Zed Beats (Zambia)</option>
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
                className="w-full bg-[#060e18] border border-[#4A9FD6]/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A9FD6]"
              />
            </div>
          </div>

          {/* Cover Art Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Album Artwork
            </label>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#4A9FD6]/40 shrink-0 shadow-md">
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
                      coverUrl === preset ? 'border-[#4A9FD6] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={preset} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="h-10 px-3 bg-[#060e18] hover:bg-[#4A9FD6]/10 border border-[#4A9FD6]/30 rounded-lg text-xs text-[#5AA1D2] flex items-center gap-1.5 cursor-pointer"
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
              <span className="text-[10px] text-[#5AA1D2] font-mono">Plain text or LRC code</span>
            </div>
            <textarea
              value={lyricsText}
              onChange={(e) => setLyricsText(e.target.value)}
              placeholder="Paste song lyrics here... You can timestamp them immediately after uploading using the Live Sync Studio!"
              rows={3}
              className="w-full bg-[#060e18] border border-[#4A9FD6]/30 rounded-lg p-2.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#4A9FD6]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-4 border-t border-[#4A9FD6]/15 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            Audio is stored in Ubuntu server <code className="text-[#5AA1D2]">/uploads/</code> with HTTP 206 streaming.
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="px-3 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>

            <button
              disabled={isSubmitting || !audioFile}
              onClick={() => handleSubmit(true)}
              className="px-3.5 py-2 text-xs font-semibold text-[#5AA1D2] bg-white/[0.04] hover:bg-white/[0.08] border border-[#4A9FD6]/30 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Save &amp; Sync Lyrics</span>
            </button>

            <button
              disabled={isSubmitting || !audioFile}
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 text-xs font-bold text-white bg-[#3A8BC2] hover:bg-[#4A9FD6] rounded-lg shadow-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
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
