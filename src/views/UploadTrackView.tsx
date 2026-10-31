import React, { useState, useRef } from 'react';
import {
  Upload,
  Music,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Shield,
  FileAudio,
  Activity,
  Info,
} from 'lucide-react';
import { parseBlob } from 'music-metadata-browser';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import { Track, LyricLine } from '../types/music';
import { parseLRC, plainTextToLines } from '../utils/lrcParser';
import { ZambiaFlagVector, LosslessAudioVector } from '../components/icons/VectorIcons';

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80',
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

export const UploadTrackView: React.FC = () => {
  const { addCustomTrack, playTrack, setActiveView } = useAudio();
  const { user, profile } = useAuth();

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [customCoverFile, setCustomCoverFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState(profile?.artistStageName || profile?.displayName || '');
  const [album, setAlbum] = useState('BC Africa Single');
  const [genre, setGenre] = useState('Zed Beats');
  const [country, setCountry] = useState(profile?.country || 'Zambia');
  const [lyricsText, setLyricsText] = useState('');
  const [coverUrl, setCoverUrl] = useState(PRESET_COVERS[0]);
  const [duration, setDuration] = useState(180);

  // Audio metadata state
  const [bpm, setBpm] = useState<number | ''>('');
  const [musicalKey, setMusicalKey] = useState<string>('Bm');
  const [sampleRate, setSampleRate] = useState<string>('44.1kHz');
  const [metadataSource, setMetadataSource] = useState<'auto-from-file' | 'manual-fallback' | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [showAdjustMetadata, setShowAdjustMetadata] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const handleAudioSelection = async (file: File) => {
    setAudioFile(file);
    setErrorMsg(null);
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

    // Measure duration
    const tempAudio = new Audio();
    const tempUrl = URL.createObjectURL(file);
    tempAudio.src = tempUrl;
    tempAudio.addEventListener('loadedmetadata', () => {
      if (tempAudio.duration && isFinite(tempAudio.duration)) {
        setDuration(Math.round(tempAudio.duration));
      }
      URL.revokeObjectURL(tempUrl);
    });

    // Inspect file tags in browser before upload
    try {
      const parsed = await parseBlob(file);
      const { common, format } = parsed;

      if (format.duration && isFinite(format.duration)) {
        setDuration(Math.round(format.duration));
      }
      if (format.sampleRate) {
        setSampleRate(`${(format.sampleRate / 1000).toFixed(1)}kHz`);
      }

      if (common.title && !title) setTitle(common.title);
      if (common.artist && !artist) setArtist(common.artist);
      if (common.album && (!album || album === 'BC Africa Single')) setAlbum(common.album);
      if (common.genre && common.genre.length > 0) {
        setGenre(common.genre[0]);
      }

      let detectedBpm: number | null = null;
      if (typeof common.bpm === 'number' && !isNaN(common.bpm) && common.bpm > 0) {
        detectedBpm = Math.round(common.bpm);
      } else if (common.bpm) {
        const b = parseFloat(String(common.bpm));
        if (!isNaN(b) && b > 0) detectedBpm = Math.round(b);
      }

      let detectedKey: string | null = null;
      if (common.key && typeof common.key === 'string' && common.key.trim().length > 0) {
        detectedKey = common.key.trim();
      }

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
        if (detectedBpm) setBpm(detectedBpm);
        if (detectedKey) setMusicalKey(detectedKey);
        setMetadataSource('auto-from-file');
      } else {
        setMetadataSource('manual-fallback');
        const preset = GENRE_BPM_PRESETS.find((p) => p.genre.toLowerCase() === genre.toLowerCase());
        setBpm(preset ? preset.bpm : 110);
        setMusicalKey(preset ? preset.defaultKey : 'Bm');
      }
    } catch (err) {
      console.warn('Metadata preview note:', err);
      setMetadataSource('manual-fallback');
      if (!bpm) setBpm(110);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyPreset = (presetBpm: number, presetKey: string, presetGenre?: string) => {
    setBpm(presetBpm);
    setMusicalKey(presetKey);
    if (presetGenre) setGenre(presetGenre);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!user) {
      setErrorMsg('Please sign in to upload music to your BC Africa artist catalog.');
      return;
    }
    if (!audioFile) {
      setErrorMsg('Please select an audio file (MP3, WAV, etc.) to upload.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Please provide a track title.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress('Preparing file for Ubuntu server storage...');

    try {
      // 1. Upload custom cover if selected
      let finalCoverUrl = coverUrl;
      if (customCoverFile) {
        setUploadProgress('Uploading cover artwork to /api/upload/cover...');
        const coverBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(customCoverFile);
        });

        const coverRes = await apiClient.uploadCover(
          customCoverFile.name || `cover_${Date.now()}.jpg`,
          coverBase64,
          customCoverFile.type || 'image/jpeg'
        );
        finalCoverUrl = coverRes.url;
      }

      // 2. Parse lyrics if provided
      let syncedLines: LyricLine[] = [];
      if (lyricsText.trim()) {
        const hasTimestamps = /\[\d{1,2}:\d{2}/.test(lyricsText);
        syncedLines = hasTimestamps ? parseLRC(lyricsText) : plainTextToLines(lyricsText);
      }

      setUploadProgress('Streaming master audio to Ubuntu server /uploads/ & analyzing ID3 tags...');

      const effectiveArtist =
        artist.trim() ||
        profile?.artistStageName ||
        profile?.displayName ||
        user.displayName ||
        'BC Africa Artist';

      const numBpm = typeof bpm === 'number' && bpm > 0 ? bpm : undefined;

      // 3. Upload audio and register track in server database
      const newTrack = await addCustomTrack(
        {
          title: title.trim(),
          artist: effectiveArtist,
          album: album.trim() || 'Single',
          genre,
          duration: duration || 180,
          audioUrl: '',
          coverUrl: finalCoverUrl,
          country: country || 'Zambia',
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

      setUploadProgress('Track uploaded successfully! Initializing playback...');
      await playTrack(newTrack);
      setActiveView('library');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Upload failed: ${msg}`);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-gradient-to-b from-[#0A1426] to-[#0F1D32] border border-[#4A9FD6]/20 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#4A9FD6]/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4A9FD6]/15 border border-[#4A9FD6]/30 flex items-center justify-center text-[#4A9FD6]">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Upload Music to Ubuntu Server</h1>
                <LosslessAudioVector className="scale-75 origin-left" />
              </div>
              <p className="text-xs text-[#5AA1D2]/80">
                Direct HTTP 206 Byte-Range streaming &bull; Auto ID3 BPM &amp; Musical Key extraction
              </p>
            </div>
          </div>
          <ZambiaFlagVector size={20} />
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {uploadProgress && (
          <div className="p-3 rounded-xl bg-[#4A9FD6]/15 border border-[#4A9FD6]/40 text-[#5AA1D2] text-xs flex items-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 text-[#4A9FD6] shrink-0" />
            <span>{uploadProgress}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Audio Drop Zone */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Master Audio File (MP3, WAV, FLAC, M4A)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                audioFile
                  ? 'border-emerald-500/60 bg-emerald-950/20'
                  : 'border-[#4A9FD6]/25 hover:border-[#4A9FD6]/60 bg-[#060f1b]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.flac"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleAudioSelection(e.target.files[0]);
                  }
                }}
              />
              {audioFile ? (
                <div className="flex items-center justify-center gap-3 text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-white truncate max-w-md">{audioFile.name}</p>
                    <p className="text-xs text-slate-400">
                      {(audioFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Approx. {Math.round(duration)}s duration &bull; {sampleRate}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <FileAudio className="w-8 h-8 text-[#4A9FD6] mx-auto opacity-90" />
                  <p className="text-xs font-semibold text-slate-200">Click to browse or drop your audio track</p>
                  <p className="text-[11px] text-slate-400">File is uploaded to Ubuntu server storage `/uploads/`</p>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Metadata Status Card */}
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
                  onClick={() => setShowAdjustMetadata(!showAdjustMetadata)}
                  className="text-[11px] text-[#5AA1D2] hover:underline cursor-pointer"
                >
                  {showAdjustMetadata ? 'Hide details' : 'Adjust'}
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

          {(metadataSource === 'manual-fallback' || showAdjustMetadata) && !isAnalyzing && (
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

              {/* Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {GENRE_BPM_PRESETS.map((p) => (
                  <button
                    key={p.genre}
                    type="button"
                    onClick={() => applyPreset(p.bpm, p.defaultKey, p.genre)}
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

              {/* Inputs */}
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

          {/* Title & Artist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Track Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lusaka Nights"
                className="w-full bg-[#0c1829] border border-[#4A9FD6]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A9FD6]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Artist Name</label>
              <input
                type="text"
                required
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="e.g. Blessed Chisanga"
                className="w-full bg-[#0c1829] border border-[#4A9FD6]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A9FD6]"
              />
            </div>
          </div>

          {/* Genre & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Genre</label>
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
                className="w-full bg-[#0c1829] border border-[#4A9FD6]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A9FD6]"
              >
                <option value="Zed Beats">Zed Beats (Zambia)</option>
                <option value="Afrobeats">Afrobeats</option>
                <option value="Amapiano">Amapiano</option>
                <option value="Afro-Fusion">Afro-Fusion</option>
                <option value="Gospel">Gospel &amp; Soul</option>
                <option value="Kalindula">Kalindula (Zambia Folk)</option>
                <option value="Hip-Hop">African Hip-Hop</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Country of Origin</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-[#0c1829] border border-[#4A9FD6]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A9FD6]"
              >
                <option value="Zambia">Zambia</option>
                <option value="Nigeria">Nigeria</option>
                <option value="South Africa">South Africa</option>
                <option value="Ghana">Ghana</option>
                <option value="Kenya">Kenya</option>
                <option value="International">International / Diaspora</option>
              </select>
            </div>
          </div>

          {/* Cover Artwork */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Cover Artwork
            </label>
            <div className="flex items-center gap-4">
              <div
                onClick={() => coverInputRef.current?.click()}
                className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#0c1829] border border-[#4A9FD6]/40 cursor-pointer group shrink-0"
              >
                <img
                  src={customCoverFile ? URL.createObjectURL(customCoverFile) : coverUrl}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-semibold transition-opacity">
                  Change
                </div>
              </div>
              <div className="flex-1">
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setCustomCoverFile(e.target.files[0]);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-[#4A9FD6]/30 text-xs text-[#5AA1D2] cursor-pointer"
                >
                  Upload Custom Cover (JPG, PNG)
                </button>
                <p className="text-[11px] text-slate-400 mt-1">
                  Custom cover is uploaded to Ubuntu server `/uploads/` and saved to `data/tracks.json`
                </p>
              </div>
            </div>
          </div>

          {/* Lyrics (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Lyrics (Optional &bull; Paste plain text or synced LRC)
            </label>
            <textarea
              rows={4}
              value={lyricsText}
              onChange={(e) => setLyricsText(e.target.value)}
              placeholder="Paste song lyrics here to enable karaoke live sync..."
              className="w-full bg-[#0c1829] border border-[#4A9FD6]/30 rounded-xl p-3 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-[#4A9FD6]"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#3A8BC2] hover:bg-[#4A9FD6] text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(74,159,214,0.3)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Uploading & Registering...' : 'Upload Song to Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
