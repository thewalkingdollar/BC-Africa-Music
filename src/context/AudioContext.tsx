import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { LyricLine, Track, ViewMode, TrendingTrack, TrackStatus } from '../types/music';
import { INITIAL_TRACKS } from '../data/defaultTracks';
import { generateAfricanTrackAudio } from '../utils/audioSynthesizer';
import {
  getCustomTracks,
  saveTrackMetadata,
  deleteTrackMetadata,
  saveAudioBlob,
  getAudioBlob,
  deleteAudioBlob,
} from '../utils/indexedDB';
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
  pause: () => void;
  seek: (seconds: number) => void;
  skipNext: () => void;
  skipPrev: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  toggleLoop: () => void;
  toggleShuffle: () => void;
  toggleFavorite: (trackId: string) => void;
  addCustomTrack: (trackData: Omit<Track, 'id' | 'plays' | 'isCustomUpload'>, audioBlob: Blob) => Promise<Track>;
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

  // Pause music if in-stream ad starts playing
  useEffect(() => {
    if (isAdOverlayOpen && isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isAdOverlayOpen, isPlaying]);

  // Load custom tracks from IndexedDB & Self-Hosted Ubuntu server
  useEffect(() => {
    let mounted = true;

    async function loadInitialData() {
      // 1. Load local IndexedDB custom uploaded blobs
      try {
        const storedTracks = await getCustomTracks();
        if (mounted && storedTracks && storedTracks.length > 0) {
          const restoredTracks: Track[] = await Promise.all(
            storedTracks.map(async (t) => {
              if (t.audioBlobKey) {
                const blob = await getAudioBlob(t.audioBlobKey);
                if (blob) {
                  return { ...t, audioUrl: URL.createObjectURL(blob) };
                }
              }
              return t;
            })
          );
          setTracks((prev) => {
            const localMap = new Map(prev.map((t) => [t.id, t]));
            restoredTracks.forEach((t) => localMap.set(t.id, t));
            return Array.from(localMap.values());
          });
        }
      } catch (e) {
        console.error('Error loading stored local tracks:', e);
      }

      // 2. Fetch tracks and 24h play stats from self-hosted server
      try {
        const serverTracks = await apiClient.tracks.getAll();
        if (mounted && serverTracks && serverTracks.length > 0) {
          setTracks((prev) => {
            const localMap = new Map(prev.map((t) => [t.id, t]));
            serverTracks.forEach((st) => {
              const existing = localMap.get(st.id);
              if (existing && existing.audioUrl?.startsWith('blob:')) {
                localMap.set(st.id, { ...st, audioUrl: existing.audioUrl, audioBlobKey: existing.audioBlobKey });
              } else {
                localMap.set(st.id, st);
              }
            });
            return Array.from(localMap.values());
          });
        }

        const recentPlays = await apiClient.plays.getRecent24h();
        if (mounted && recentPlays) {
          setPlays24hMap(recentPlays);
        }
      } catch (err) {
        console.warn('Notice loading tracks from self-hosted server:', err);
      }
    }

    loadInitialData();

    // Periodic synchronization with self-hosted server
    const syncInterval = setInterval(async () => {
      try {
        const serverTracks = await apiClient.tracks.getAll();
        if (mounted && serverTracks && serverTracks.length > 0) {
          setTracks((prev) => {
            const localMap = new Map(prev.map((t) => [t.id, t]));
            serverTracks.forEach((st) => {
              const existing = localMap.get(st.id);
              if (existing && existing.audioUrl?.startsWith('blob:')) {
                localMap.set(st.id, { ...st, audioUrl: existing.audioUrl, audioBlobKey: existing.audioBlobKey });
              } else {
                localMap.set(st.id, st);
              }
            });
            return Array.from(localMap.values());
          });
        }

        const recentPlays = await apiClient.plays.getRecent24h();
        if (mounted && recentPlays) {
          setPlays24hMap(recentPlays);
        }
      } catch {
        // quiet fallback
      }
    }, 6000);

    return () => {
      mounted = false;
      clearInterval(syncInterval);
    };
  }, []);

  // Initialize Audio Element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      if (isLooping) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        skipNext();
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [isLooping]);

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

    if (track.audioBlobKey) {
      const blob = await getAudioBlob(track.audioBlobKey);
      if (blob) {
        const url = URL.createObjectURL(blob);
        audioUrlCache.set(track.id, url);
        return url;
      }
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
    return tracks.filter((t) => !t.status || t.status === 'approved');
  }, [tracks]);

  const playTrack = useCallback(
    async (track: Track) => {
      setupWebAudio();
      const audio = audioRef.current;
      if (!audio) return;

      try {
        const url = await resolveAudioUrl(track);
        if (audio.src !== url) {
          audio.src = url;
          audio.load();
        }

        audio.playbackRate = playbackRate;
        audio.volume = isMuted ? 0 : volume;

        await audio.play();
        setCurrentTrack(track);
        setIsPlaying(true);
        setDuration(track.duration || 0);

        // Record play event & notify platform in-stream advert engine
        recordTrackPlay(track);
        notifyTrackPlayed();

        // Increment local play count
        setTracks((prev) =>
          prev.map((t) => (t.id === track.id ? { ...t, plays: (t.plays || 0) + 1 } : t))
        );
      } catch (err) {
        console.error('Audio play error:', err);
      }
    },
    [setupWebAudio, resolveAudioUrl, playbackRate, isMuted, volume, recordTrackPlay, notifyTrackPlayed]
  );

  const togglePlay = useCallback(async () => {
    setupWebAudio();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (!currentTrack && tracks.length > 0) {
        await playTrack(approvedTracks[0] || tracks[0]);
      } else if (currentTrack) {
        if (!audio.src || audio.src === window.location.href) {
          await playTrack(currentTrack);
        } else {
          try {
            await audio.play();
            setIsPlaying(true);
          } catch (e) {
            console.error('Playback resume error:', e);
          }
        }
      }
    }
  }, [isPlaying, currentTrack, tracks, approvedTracks, playTrack, setupWebAudio]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const seek = useCallback((seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(seconds, audioRef.current.duration || 9999));
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const skipNext = useCallback(() => {
    const list = approvedTracks.length > 0 ? approvedTracks : tracks;
    if (list.length === 0) return;
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * list.length);
      playTrack(list[randomIndex]);
      return;
    }
    const currentIndex = currentTrack ? list.findIndex((t) => t.id === currentTrack.id) : -1;
    const nextIndex = (currentIndex + 1) % list.length;
    playTrack(list[nextIndex]);
  }, [approvedTracks, tracks, isShuffle, currentTrack, playTrack]);

  const skipPrev = useCallback(() => {
    const list = approvedTracks.length > 0 ? approvedTracks : tracks;
    if (list.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      seek(0);
      return;
    }
    const currentIndex = currentTrack ? list.findIndex((t) => t.id === currentTrack.id) : 0;
    const prevIndex = (currentIndex - 1 + list.length) % list.length;
    playTrack(list[prevIndex]);
  }, [approvedTracks, tracks, currentTrack, playTrack, seek]);

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

  const toggleFavorite = useCallback((trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, isFavorite: !t.isFavorite } : t))
    );
    setCurrentTrack((prev) =>
      prev && prev.id === trackId ? { ...prev, isFavorite: !prev.isFavorite } : prev
    );
  }, []);

  // Add custom track with local IndexedDB storage and self-hosted server persistence
  const addCustomTrack = useCallback(
    async (trackData: Omit<Track, 'id' | 'plays' | 'isCustomUpload'>, audioBlob: Blob): Promise<Track> => {
      const id = `bc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const objectUrl = URL.createObjectURL(audioBlob);

      const isAutoApproved = user?.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
      const initialStatus: TrackStatus = isAutoApproved ? 'approved' : 'pending_review';

      const newTrack: Track = {
        ...trackData,
        id,
        audioUrl: objectUrl,
        audioBlobKey: id,
        isCustomUpload: true,
        status: initialStatus,
        reviewerNotes: '',
        plays: 0,
        uploadedAt: new Date().toISOString().split('T')[0],
        ownerId: user?.uid || 'guest_creator',
        ownerEmail: user?.email || '',
        ownerName: user?.displayName || trackData.artist,
      };

      await saveAudioBlob(id, audioBlob);
      await saveTrackMetadata(newTrack);

      // Persist to self-hosted Ubuntu server
      try {
        await apiClient.tracks.create({
          ...newTrack,
          audioUrl: trackData.audioUrl || objectUrl,
        });
      } catch (err) {
        console.warn('Notice saving track to self-hosted server:', err);
      }

      setTracks((prev) => [newTrack, ...prev.filter((t) => t.id !== id)]);
      return newTrack;
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

      const target = tracks.find((t) => t.id === trackId);
      if (target && target.isCustomUpload) {
        await saveTrackMetadata({ ...target, lyricsSynced: synced, lyricsRaw: rawLRC });
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
    [currentTrack, activeStudioTrack, tracks]
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
      const target = tracks.find((t) => t.id === trackId);
      if (target?.isCustomUpload) {
        await deleteAudioBlob(trackId);
        await deleteTrackMetadata(trackId);
      }

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
    const candidateTracks = approvedTracks.length > 0 ? approvedTracks : tracks;
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
  }, [approvedTracks, tracks, plays24hMap]);

  return (
    <AudioContext.Provider
      value={{
        tracks,
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
