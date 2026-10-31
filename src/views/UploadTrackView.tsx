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
} from 'lucide-react';
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

export const UploadTrackView: React.FC = () => {
  const { addCustomTrack, playTrack, openLyricsStudio, setActiveView } = useAudio();
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const handleAudioSelection = (file: File) => {
    setAudioFile(file);
    setErrorMsg(null);

    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    if (cleanName.includes('-')) {
      const [art, tit] = cleanName.split('-').map((s) => s.trim());
      if (art && !artist) setArtist(art);
      if (tit && !title) setTitle(tit);
    } else if (!title) {
      setTitle(cleanName);
    }

    const tempAudio = new Audio();
    const tempUrl = URL.createObjectURL(file);
    tempAudio.src = tempUrl;
    tempAudio.addEventListener('loadedmetadata', () => {
      if (tempAudio.duration && isFinite(tempAudio.duration)) {
        setDuration(Math.round(tempAudio.duration));
      }
      URL.revokeObjectURL(tempUrl);
    });
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

      setUploadProgress('Streaming master audio to /api/upload/audio...');

      const effectiveArtist = artist.trim() || profile?.artistStageName || profile?.displayName || user.displayName || 'BC Africa Artist';

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
          ownerName: profile?.artistStageName || profile?.displayName || user.displayName || effectiveArtist,
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
      <div className="bg-[#081322] border border-sky-950/80 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-sky-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-800/60 flex items-center justify-center text-sky-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Upload Music to Ubuntu Server</h1>
                <LosslessAudioVector className="scale-75 origin-left" />
              </div>
              <p className="text-xs text-sky-400/80">
                Direct HTTP 206 Byte-Range streaming &bull; Zero client blob dependency
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
          <div className="p-3 rounded-xl bg-sky-950/60 border border-sky-700 text-sky-200 text-xs flex items-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
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
                  ? 'border-emerald-500/60 bg-emerald-950/10'
                  : 'border-sky-900/60 hover:border-sky-500/50 bg-[#060f1b]'
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
                      {(audioFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Approx. {Math.round(duration)}s duration
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <FileAudio className="w-8 h-8 text-sky-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-200">Click to browse or drop your audio track</p>
                  <p className="text-[11px] text-slate-400">File is uploaded to Ubuntu server storage `/uploads/`</p>
                </div>
              )}
            </div>
          </div>

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
                className="w-full bg-[#0c1829] border border-sky-900/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
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
                className="w-full bg-[#0c1829] border border-sky-900/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          {/* Genre & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Genre</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-[#0c1829] border border-sky-900/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
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
                className="w-full bg-[#0c1829] border border-sky-900/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
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
                className="relative w-20 h-20 rounded-xl overflow-hidden bg-sky-950 border border-sky-800 cursor-pointer group shrink-0"
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
                  className="px-3 py-1.5 rounded-lg bg-sky-950 hover:bg-sky-900 border border-sky-800 text-xs text-sky-200 cursor-pointer"
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
              className="w-full bg-[#0c1829] border border-sky-900/60 rounded-xl p-3 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-sky-400"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 via-sky-500 to-sky-400 hover:from-sky-500 hover:to-sky-300 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(2,132,199,0.4)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Uploading & Registering...' : 'Upload Song to Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
