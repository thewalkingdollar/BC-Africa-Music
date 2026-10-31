import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { LyricLine, Track, ViewMode, TrendingTrack, TrackStatus } from '../types/music';
import { INITIAL_TRACKS } from '../data/defaultTracks';
import { generateAfricanTrackAudio } from '../utils/audioSynthesizer';
import { BOOTSTRAP_ADMIN_EMAIL, useAuth } from './AuthContext';
import { usePlatform } from './PlatformContext';
import { apiClient } from '../services/apiClient';

interface AudioContextType {
  tracks: Track[];
  approvedTracks: Track[];
  trendingTracks: TrendingTrack[];
  plays24hMap: Record<string, number>;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isLooping: boolean;
  isShuffle: boolean;
  analyserNode: AnalyserNode | null;
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  isLyricsOpen: boolean;
  setIsLyricsOpen: (open: boolean) => void;
  isNowPlayingOpen: boolean;
  setIsNowPlayingOpen: (open: boolean) => void;
  activeStudioTrack: Track | null;
  openLyricsStudio: (trackId?: string) => void;
  closeLyricsStudio: () => void;
  selectedArtistId: string | null;
  selectedArtistName: string | null;
  openArtistProfile: (artistId?: string, artistName?: string) => void;
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedGenre: string;
  setSelectedGenre: (g: string) => void;
  playTrack: (track: Track) => Promise<void>;
  recordTrackPlay: (track: Track) => Promise<void>;
  togglePlay: () => Promise<void>;
  pause: () => Promise<void> | void;
  seek: (seconds: number) => void;
  skipNext: () => void;
  skipPrev: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  toggleLoop: () => void;
  toggleShuffle: () => void;
  toggleFavorite: (trackId: string) => void;
  addCustomTrack: (trackData: Omit<Track, 'id' | 'plays' | 'isCustomUpload'>, audioFile: Blob | File) => Promise<Track>;
  updateTrackLyrics: (trackId: string, synced: LyricLine[], rawLRC: string) => Promise<void>;
  updateTrackStatus: (trackId: string, status: TrackStatus, notes?: string) => Promise<void>;
  updateTrackMetadata: (trackId: string, meta: Partial<Track>) => Promise<void>;
  deleteTrack: (trackId: string) => Promise<void>;
}

const AudioContext = createContext<AudioContextType | null>(null);

// Audio cache to prevent regenerating procedural tracks repeatedly
const audioUrlCache = new Map<string, string>();

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { notifyTrackPlayed, isAdOverlayOpen } = usePlatform();
  const { user } = useAuth();

  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRateState] = useState<number>(1);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [plays24hMap, setPlays24hMap] = useState<Record<string, number>>({});
  const [favoriteTrackIds, setFavoriteTrackIds] = useState<string[]>([]);

  // UI state
  const [activeView, setActiveView] = useState<ViewMode>('discover');
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState<boolean>(false);
  const [activeStudioTrack, setActiveStudioTrack] = useState<Track | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

  // Audio elements & Web Audio API
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const webAudioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [analyserReady, setAnalyserReady] = useState<AnalyserNode | null>(null);

  // Playback coordination refs to avoid DOMException on interrupted play()
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const activeRequestIdRef = useRef<number>(0);

  // Safely await pending play promise before changing src, loading, or pausing
  const waitForPendingPlay = useCallback(async () => {
    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current;
      } catch {
        // Interruption rejections from previously aborted requests are safely swallowed
      }
    }
  }, []);

  const pause = useCallback(async () => {
    setIsPlaying(false);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
    const audio = audioRef.current;
    if (!audio) return;

    await waitForPendingPlay();
    try {
      audio.pause();
    } catch {
      // Audio already paused or aborted
    }
  }, [waitForPendingPlay]);

  // Pause music if in-stream ad starts playing
  useEffect(() => {
    if (isAdOverlayOpen && isPlaying) {
      pause();
    }
  }, [isAdOverlayOpen, isPlaying, pause]);

  // Load favorites from server whenever user logs in or changes
  useEffect(() => {
    let mounted = true;
    if (!user) {
      setFavoriteTrackIds([]);
      return;
    }

    async function loadFavorites() {
      if (!user) return;
      try {
        const favs = await apiClient.favorites.get(user.uid);
        if (mounted && Array.isArray(favs)) {
          setFavoriteTrackIds(favs);
        }
      } catch (err) {
        console.warn('Load favorites note:', err);
      }
    }

    loadFavorites();
    return () => {
      mounted = false;
    };
  }, [user]);

  // 100% Server-Authoritative: Load tracks & 24h play stats from Ubuntu Express server
  useEffect(() => {
    let mounted = true;

    async function loadServerData() {
      try {
        const serverTracks = await apiClient.tracks.getAll();
        if (mounted && serverTracks && serverTracks.length > 0) {
          setTracks(serverTracks);
        }

        const recentPlays = await apiClient.plays.getRecent24h();
        if (mounted && recentPlays) {
          setPlays24hMap(recentPlays);
        }
      } catch (err) {
        console.warn('Notice loading tracks from server:', err);
      }
    }

    loadServerData();

    // Periodic synchronization with server
    const syncInterval = setInterval(async () => {
      try {
        const serverTracks = await apiClient.tracks.getAll();
        if (mounted && serverTracks && serverTracks.length > 0) {
          setTracks(serverTracks);
        }

        const recentPlays = await apiClient.plays.getRecent24h();
        if (mounted && recentPlays) {
          setPlays24hMap(recentPlays);
        }
      } catch {
        // silent fallback
      }
    }, 6000);

    return () => {
      mounted = false;
      clearInterval(syncInterval);
    };
  }, []);

  // Update track objects with favorite status from server
  const tracksWithFavorites = useMemo(() => {
    return tracks.map((t) => ({
      ...t,
      isFavorite: favoriteTrackIds.includes(t.id),
    }));
  }, [tracks, favoriteTrackIds]);

  // Initialize Audio Element with Background Playback & Media Session Support
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    // Essential for mobile browsers & iOS Safari to allow continuous background audio
    (audio as any).playsInline = true;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);

      // Keep OS Media Session position in sync for lock screen scrubbers
      if ('mediaSession' in navigator && audio.duration && isFinite(audio.duration)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: Math.min(audio.currentTime, audio.duration),
          });
        } catch {
          // ignore position state unsupported details
        }
      }
    };

    const handleDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      if (isLooping) {
        audio.currentTime = 0;
        const p = audio.play();
        playPromiseRef.current = p;
        p.catch(() => {}).finally(() => {
          if (playPromiseRef.current === p) {
            playPromiseRef.current = null;
          }
        });
      } else {
        skipNext();
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      if (playPromiseRef.current) {
        playPromiseRef.current
          .then(() => {
            try {
              audio.pause();
              audio.src = '';
            } catch {
              // ignore
            }
          })
          .catch(() => {});
      } else {
        try {
          audio.pause();
          audio.src = '';
        } catch {
          // ignore
        }
      }
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [isLooping]);

  // Configure Media Session API Action Handlers for Background OS Playback Controls
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', async () => {
        if (audioRef.current && !isPlaying) {
          try {
            await waitForPendingPlay();
            const p = audioRef.current.play();
            playPromiseRef.current = p;
            await p;
            setIsPlaying(true);
          } catch {
            // safely ignore interrupted / gesture restrictions
          } finally {
            playPromiseRef.current = null;
          }
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        pause();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        skipPrev();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        skipNext();
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && audioRef.current) {
          seek(details.seekTime);
        }
      });

      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const offset = details.seekOffset || 10;
        if (audioRef.current) {
          seek(Math.max(0, audioRef.current.currentTime - offset));
        }
      });

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const offset = details.seekOffset || 10;
        if (audioRef.current) {
          seek(Math.min(audioRef.current.duration || 9999, audioRef.current.currentTime + offset));
        }
      });
    } catch (e) {
      console.debug('MediaSession handlers setup notice:', e);
    }
  }, [isPlaying]);

  // Sync Media Session Metadata whenever current track changes
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    try {
      const rawCover = currentTrack.coverUrl || '/icon.svg';
      const absoluteCover = rawCover.startsWith('http')
        ? rawCover
        : `${window.location.origin}${rawCover.startsWith('/') ? '' : '/'}${rawCover}`;

      const isSvg = absoluteCover.toLowerCase().includes('.svg');
      const isPng = absoluteCover.toLowerCase().includes('.png');
      const mimeType = isSvg ? 'image/svg+xml' : isPng ? 'image/png' : 'image/jpeg';

      const artworkList = [
        {
          src: absoluteCover,
          sizes: '96x96',
          type: mimeType,
        },
        {
          src: absoluteCover,
          sizes: '128x128',
          type: mimeType,
        },
        {
          src: absoluteCover,
          sizes: '192x192',
          type: mimeType,
        },
        {
          src: absoluteCover,
          sizes: '256x256',
          type: mimeType,
        },
        {
          src: absoluteCover,
          sizes: '512x512',
          type: mimeType,
        },
      ];

      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || 'BC Africa Music',
        artwork: artworkList,
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch (e) {
      console.debug('MediaSession metadata notice:', e);
    }
  }, [currentTrack, isPlaying]);

  // Lazy Web Audio API init for Visualizer
  const setupWebAudio = useCallback(() => {
    if (!audioRef.current) return;
    if (webAudioCtxRef.current) {
      if (webAudioCtxRef.current.state === 'suspended') {
        webAudioCtxRef.current.resume();
      }
      return;
    }

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtxClass();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      webAudioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceNodeRef.current = source;
      setAnalyserReady(analyser);
    } catch (e) {
      console.warn('Web Audio initialization note:', e);
    }
  }, []);

  // Resolve audio URL
  const resolveAudioUrl = useCallback(async (track: Track): Promise<string> => {
    if (track.audioUrl && track.audioUrl.trim().length > 0) {
      return track.audioUrl;
    }

    if (audioUrlCache.has(track.id)) {
      return audioUrlCache.get(track.id)!;
    }

    const synthUrl = await generateAfricanTrackAudio(track);
    audioUrlCache.set(track.id, synthUrl);
    return synthUrl;
  }, []);

  // Record stream play event to self-hosted server
  const recordTrackPlay = useCallback(
    async (track: Track) => {
      try {
        await apiClient.plays.record({
          trackId: track.id,
          trackTitle: track.title,
          artist: track.artist,
          userId: user?.uid,
          artistId: track.ownerId,
        });

        // Update local 24h play stats
        setPlays24hMap((prev) => ({
          ...prev,
          [track.id]: (prev[track.id] || 0) + 1,
        }));
      } catch (err) {
        console.warn('Failed to record track play:', err);
      }
    },
    [user]
  );

  // Filter approved tracks for listeners
  const approvedTracks = useMemo(() => {
    return tracksWithFavorites.filter((t) => !t.status || t.status === 'approved');
  }, [tracksWithFavorites]);

  const playTrack = useCallback(
    async (track: Track) => {
      setupWebAudio();
      const audio = audioRef.current;
      if (!audio) return;

      const currentRequestId = ++activeRequestIdRef.current;

      try {
        const url = await resolveAudioUrl(track);

        // If another play request began while resolving audio URL, discard
        if (currentRequestId !== activeRequestIdRef.current) {
          return;
        }

        // Safely wait for any prior play() promise to settle before loading new src
        await waitForPendingPlay();
        if (currentRequestId !== activeRequestIdRef.current) {
          return;
        }

        // Compare normalized URLs to prevent unnecessary reloads
        const currentSrc = audio.src;
        let targetSrc = url;
        try {
          targetSrc = new URL(url, window.location.href).href;
        } catch {
          targetSrc = url;
        }

        if (currentSrc !== targetSrc) {
          audio.src = url;
          audio.load();
        }

        audio.playbackRate = playbackRate;
        audio.volume = isMuted ? 0 : volume;

        // Eagerly update UI state
        setCurrentTrack(track);
        setDuration(track.duration || 0);

        const playPromise = audio.play();
        playPromiseRef.current = playPromise;

        await playPromise;

        // If another play request superseded this one while play was resolving, discard
        if (currentRequestId !== activeRequestIdRef.current) {
          return;
        }

        setIsPlaying(true);

        // Record play event & notify platform in-stream advert engine
        recordTrackPlay(track);
        notifyTrackPlayed();

        // Increment local play count
        setTracks((prev) =>
          prev.map((t) => (t.id === track.id ? { ...t, plays: (t.plays || 0) + 1 } : t))
        );
      } catch (err: any) {
        // Standard browser abort / interrupt or autoplay policy rejection
        const isInterrupted =
          err?.name === 'AbortError' ||
          err?.name === 'NotAllowedError' ||
          err?.code === 20 ||
          (typeof err?.message === 'string' &&
            (err.message.includes('interrupted by a new load request') ||
              err.message.includes('interrupted by a call to pause') ||
              err.message.includes('play() request was interrupted') ||
              err.message.includes("user didn't interact")));

        if (!isInterrupted) {
          console.error('Audio play error:', err);
        }
      } finally {
        if (currentRequestId === activeRequestIdRef.current) {
          playPromiseRef.current = null;
        }
      }
    },
    [setupWebAudio, resolveAudioUrl, playbackRate, isMuted, volume, recordTrackPlay, notifyTrackPlayed, waitForPendingPlay]
  );

  const togglePlay = useCallback(async () => {
    setupWebAudio();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      await pause();
    } else {
      if (!currentTrack && tracksWithFavorites.length > 0) {
        await playTrack(approvedTracks[0] || tracksWithFavorites[0]);
      } else if (currentTrack) {
        if (!audio.src || audio.src === window.location.href) {
          await playTrack(currentTrack);
        } else {
          const resumeRequestId = ++activeRequestIdRef.current;
          try {
            await waitForPendingPlay();
            if (resumeRequestId !== activeRequestIdRef.current) return;

            const playPromise = audio.play();
            playPromiseRef.current = playPromise;
            await playPromise;

            if (resumeRequestId === activeRequestIdRef.current) {
              setIsPlaying(true);
            }
          } catch (err: any) {
            const isInterrupted =
              err?.name === 'AbortError' ||
              err?.name === 'NotAllowedError' ||
              err?.code === 20 ||
              (typeof err?.message === 'string' &&
                (err.message.includes('interrupted') ||
                  err.message.includes("user didn't interact")));

            if (!isInterrupted) {
              console.error('Playback resume error:', err);
            }
          } finally {
            if (resumeRequestId === activeRequestIdRef.current) {
              playPromiseRef.current = null;
            }
          }
        }
      }
    }
  }, [isPlaying, currentTrack, tracksWithFavorites, approvedTracks, playTrack, setupWebAudio, pause, waitForPendingPlay]);

  const seek = useCallback((seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(seconds, audioRef.current.duration || 9999));
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const skipNext = useCallback(() => {
    const list = approvedTracks.length > 0 ? approvedTracks : tracksWithFavorites;
    if (list.length === 0) return;
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * list.length);
      playTrack(list[randomIndex]);
      return;
    }
    const currentIndex = currentTrack ? list.findIndex((t) => t.id === currentTrack.id) : -1;
    const nextIndex = (currentIndex + 1) % list.length;
    playTrack(list[nextIndex]);
  }, [approvedTracks, tracksWithFavorites, isShuffle, currentTrack, playTrack]);

  const skipPrev = useCallback(() => {
    const list = approvedTracks.length > 0 ? approvedTracks : tracksWithFavorites;
    if (list.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      seek(0);
      return;
    }
    const currentIndex = currentTrack ? list.findIndex((t) => t.id === currentTrack.id) : 0;
    const prevIndex = (currentIndex - 1 + list.length) % list.length;
    playTrack(list[prevIndex]);
  }, [approvedTracks, tracksWithFavorites, currentTrack, playTrack, seek]);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : clamped;
    }
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.volume = next ? 0 : volume;
      }
      return next;
    });
  }, [volume]);

  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  const toggleLoop = useCallback(() => {
    setIsLooping((prev) => !prev);
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  // Server-side Favorites toggle
  const toggleFavorite = useCallback(
    async (trackId: string) => {
      if (!user) {
        // Toggle locally in state if not logged in
        setFavoriteTrackIds((prev) =>
          prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
        );
        return;
      }

      try {
        const res = await apiClient.favorites.toggle(user.uid, trackId);
        setFavoriteTrackIds(res.favorites);
      } catch (err) {
        console.warn('Favorite toggle error:', err);
      }
    },
    [user]
  );

  // 100% Server File Upload (Direct to Ubuntu filesystem & server tracks database)
  const addCustomTrack = useCallback(
    async (
      trackData: Omit<Track, 'id' | 'plays' | 'isCustomUpload'>,
      audioFile: Blob | File
    ): Promise<Track> => {
      const isAutoApproved = user?.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
      const initialStatus: TrackStatus = isAutoApproved ? 'approved' : 'pending_review';

      // 1. Read binary file as Base64 to upload directly to server storage
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(audioFile);
      });

      const filename = (audioFile as File).name || `audio_${Date.now()}.mp3`;

      // 2. Upload file directly to Ubuntu Server `/uploads/`
      const uploadRes = await apiClient.uploadAudio(
        filename,
        fileData,
        audioFile.type || 'audio/mpeg',
        {
          bpm: trackData.bpm,
          key: trackData.musicalKey,
          musicalKey: trackData.musicalKey,
        }
      );
      const serverAudioUrl = uploadRes.url;

      // 3. Save track entry in server `/data/tracks.json`
      const effectiveBpm = uploadRes.bpm || trackData.bpm;
      const effectiveKey = uploadRes.musicalKey || uploadRes.key || trackData.musicalKey;
      const effectiveSource = uploadRes.metadataSource || trackData.metadataSource || (effectiveBpm ? 'auto-from-file' : 'manual-fallback');

      const newTrackData: Partial<Track> = {
        ...trackData,
        audioUrl: serverAudioUrl,
        bpm: effectiveBpm,
        musicalKey: effectiveKey,
        sampleRate: uploadRes.sampleRate || trackData.sampleRate || '44.1kHz',
        metadataSource: effectiveSource,
        duration: uploadRes.duration ? Math.round(uploadRes.duration) : (trackData.duration || 180),
        isCustomUpload: true,
        status: initialStatus,
        reviewerNotes: '',
        plays: 0,
        uploadedAt: new Date().toISOString().split('T')[0],
        ownerId: user?.uid || 'guest_creator',
        ownerEmail: user?.email || '',
        ownerName: user?.displayName || trackData.artist,
      };

      const createdTrack = await apiClient.tracks.create(newTrackData);
      setTracks((prev) => [createdTrack, ...prev.filter((t) => t.id !== createdTrack.id)]);
      return createdTrack;
    },
    [user]
  );

  const updateTrackLyrics = useCallback(
    async (trackId: string, synced: LyricLine[], rawLRC: string) => {
      setTracks((prev) =>
        prev.map((t) =>
          t.id === trackId ? { ...t, lyricsSynced: synced, lyricsRaw: rawLRC } : t
        )
      );

      if (currentTrack && currentTrack.id === trackId) {
        setCurrentTrack((prev) =>
          prev ? { ...prev, lyricsSynced: synced, lyricsRaw: rawLRC } : null
        );
      }

      if (activeStudioTrack && activeStudioTrack.id === trackId) {
        setActiveStudioTrack((prev) =>
          prev ? { ...prev, lyricsSynced: synced, lyricsRaw: rawLRC } : null
        );
      }

      // Sync to self-hosted Ubuntu backend
      try {
        await apiClient.tracks.update(trackId, {
          lyricsSynced: synced,
          lyricsRaw: rawLRC,
        });
      } catch (err) {
        console.warn('Notice updating lyrics on server:', err);
      }
    },
    [currentTrack, activeStudioTrack]
  );

  // Review status update for Music Review Team
  const updateTrackStatus = useCallback(
    async (trackId: string, status: TrackStatus, notes?: string) => {
      const now = new Date().toISOString();
      const reviewerEmail = user?.email || 'Reviewer';

      setTracks((prev) =>
        prev.map((t) =>
          t.id === trackId
            ? { ...t, status, reviewerNotes: notes || '', reviewedAt: now, reviewedBy: reviewerEmail }
            : t
        )
      );

      if (currentTrack && currentTrack.id === trackId) {
        setCurrentTrack((prev) =>
          prev ? { ...prev, status, reviewerNotes: notes || '', reviewedAt: now, reviewedBy: reviewerEmail } : null
        );
      }

      try {
        await apiClient.tracks.update(trackId, {
          status,
          reviewerNotes: notes || '',
          reviewedBy: reviewerEmail,
          reviewedAt: now,
        });
      } catch (err) {
        console.warn('Update track review status note:', err);
      }
    },
    [currentTrack, user]
  );

  // Metadata update for Editorial Team
  const updateTrackMetadata = useCallback(
    async (trackId: string, meta: Partial<Track>) => {
      setTracks((prev) =>
        prev.map((t) => (t.id === trackId ? { ...t, ...meta } : t))
      );

      if (currentTrack && currentTrack.id === trackId) {
        setCurrentTrack((prev) => (prev ? { ...prev, ...meta } : null));
      }

      try {
        await apiClient.tracks.update(trackId, meta);
      } catch (err) {
        console.warn('Update track metadata note:', err);
      }
    },
    [currentTrack]
  );

  const deleteTrack = useCallback(
    async (trackId: string) => {
      try {
        await apiClient.tracks.delete(trackId);
      } catch (err) {
        console.warn('Self-hosted track deletion note:', err);
      }

      setTracks((prev) => prev.filter((t) => t.id !== trackId));

      if (currentTrack?.id === trackId) {
        pause();
        const remaining = tracks.filter((t) => t.id !== trackId);
        setCurrentTrack(remaining[0] || null);
      }

      if (activeStudioTrack?.id === trackId) {
        setActiveStudioTrack(null);
      }
    },
    [tracks, currentTrack, activeStudioTrack, pause]
  );

  const openLyricsStudio = useCallback(
    (trackId?: string) => {
      const target = trackId ? tracks.find((t) => t.id === trackId) : currentTrack;
      if (target) {
        setActiveStudioTrack(target);
        setActiveView('lyrics-studio');
      }
    },
    [tracks, currentTrack]
  );

  const closeLyricsStudio = useCallback(() => {
    setActiveStudioTrack(null);
    setActiveView('discover');
  }, []);

  const openArtistProfile = useCallback((artistId?: string, artistName?: string) => {
    setSelectedArtistId(artistId || null);
    setSelectedArtistName(artistName || null);
    setActiveView('artist-profile');
  }, []);

  // Calculate trending tracks sorted by 24h play events among approved tracks
  const trendingTracks: TrendingTrack[] = useMemo(() => {
    const candidateTracks = approvedTracks.length > 0 ? approvedTracks : tracksWithFavorites;
    return candidateTracks
      .map((track) => {
        const plays24h = plays24hMap[track.id] || 0;
        return {
          track,
          plays24h,
          rank: 0,
        };
      })
      .sort((a, b) => {
        if (b.plays24h !== a.plays24h) {
          return b.plays24h - a.plays24h;
        }
        return (b.track.plays || 0) - (a.track.plays || 0);
      })
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
  }, [approvedTracks, tracksWithFavorites, plays24hMap]);

  return (
    <AudioContext.Provider
      value={{
        tracks: tracksWithFavorites,
        approvedTracks,
        trendingTracks,
        plays24hMap,
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        playbackRate,
        isLooping,
        isShuffle,
        analyserNode: analyserReady,
        activeView,
        setActiveView,
        isLyricsOpen,
        setIsLyricsOpen,
        isNowPlayingOpen,
        setIsNowPlayingOpen,
        activeStudioTrack,
        openLyricsStudio,
        closeLyricsStudio,
        selectedArtistId,
        selectedArtistName,
        openArtistProfile,
        isUploadModalOpen,
        setIsUploadModalOpen,
        searchQuery,
        setSearchQuery,
        selectedGenre,
        setSelectedGenre,
        playTrack,
        recordTrackPlay,
        togglePlay,
        pause,
        seek,
        skipNext,
        skipPrev,
        setVolume,
        toggleMute,
        setPlaybackRate,
        toggleLoop,
        toggleShuffle,
        toggleFavorite,
        addCustomTrack,
        updateTrackLyrics,
        updateTrackStatus,
        updateTrackMetadata,
        deleteTrack,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
