import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { LyricLine, Track, ViewMode } from '../types/music';
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

interface AudioContextType {
  tracks: Track[];
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
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedGenre: string;
  setSelectedGenre: (g: string) => void;
  playTrack: (track: Track) => Promise<void>;
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
  deleteTrack: (trackId: string) => Promise<void>;
}

const AudioContext = createContext<AudioContextType | null>(null);

// Audio cache to prevent regenerating procedural tracks repeatedly
const audioUrlCache = new Map<string, string>();

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(INITIAL_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(INITIAL_TRACKS[0].duration || 0);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRateState] = useState<number>(1);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);

  // UI state
  const [activeView, setActiveView] = useState<ViewMode>('discover');
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState<boolean>(false);
  const [activeStudioTrack, setActiveStudioTrack] = useState<Track | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

  // Audio elements & Web Audio API
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const webAudioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [analyserReady, setAnalyserReady] = useState<AnalyserNode | null>(null);

  // Load custom tracks from IndexedDB on mount
  useEffect(() => {
    let mounted = true;
    async function loadTracks() {
      try {
        const storedTracks = await getCustomTracks();
        if (mounted && storedTracks && storedTracks.length > 0) {
          // Re-create object URLs for saved blobs
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
          setTracks([...restoredTracks, ...INITIAL_TRACKS]);
        }
      } catch (e) {
        console.error('Error loading stored tracks:', e);
      }
    }
    loadTracks();
    return () => {
      mounted = false;
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

  // Lazy Web Audio API init for Visualizer (Must happen after user interaction)
  const setupWebAudio = useCallback(() => {
    if (!audioRef.current) return;
    if (webAudioCtxRef.current) {
      if (webAudioCtxRef.current.state === 'suspended') {
        webAudioCtxRef.current.resume();
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
      console.warn('Web Audio API setup notice:', e);
    }
  }, []);

  // Resolves audio URL for track (either user blob or procedural African synthesizer)
  const resolveAudioUrl = useCallback(async (track: Track): Promise<string> => {
    if (track.audioUrl && track.audioUrl.length > 0) {
      return track.audioUrl;
    }

    // Check cache
    if (audioUrlCache.has(track.id)) {
      return audioUrlCache.get(track.id)!;
    }

    // Generate procedural African music matching style
    let style: 'amapiano' | 'afrobeats' | 'highlife' | 'afrosoul' = 'afrobeats';
    let bpm = 112;
    let rootFreq = 130.81; // C3

    if (track.genre.toLowerCase().includes('amapiano')) {
      style = 'amapiano';
      bpm = 114;
      rootFreq = 110; // A2
    } else if (track.genre.toLowerCase().includes('highlife')) {
      style = 'highlife';
      bpm = 108;
      rootFreq = 146.83; // D3
    } else if (track.genre.toLowerCase().includes('soul')) {
      style = 'afrosoul';
      bpm = 88;
      rootFreq = 123.47; // B2
    }

    const generatedUrl = await generateAfricanTrackAudio({
      bpm,
      rootFreq,
      scale: [0, 2, 4, 7, 9],
      style,
      duration: track.duration || 135,
    });

    audioUrlCache.set(track.id, generatedUrl);
    return generatedUrl;
  }, []);

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

        // Increment play count
        setTracks((prev) =>
          prev.map((t) => (t.id === track.id ? { ...t, plays: (t.plays || 0) + 1 } : t))
        );
      } catch (err) {
        console.error('Audio play error:', err);
      }
    },
    [setupWebAudio, resolveAudioUrl, playbackRate, isMuted, volume]
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
        await playTrack(tracks[0]);
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
  }, [isPlaying, currentTrack, tracks, playTrack, setupWebAudio]);

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
    if (tracks.length === 0) return;
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      playTrack(tracks[randomIndex]);
      return;
    }
    const currentIndex = currentTrack ? tracks.findIndex((t) => t.id === currentTrack.id) : -1;
    const nextIndex = (currentIndex + 1) % tracks.length;
    playTrack(tracks[nextIndex]);
  }, [tracks, isShuffle, currentTrack, playTrack]);

  const skipPrev = useCallback(() => {
    if (tracks.length === 0) return;
    // If more than 3 seconds in, restart track
    if (audioRef.current && audioRef.current.currentTime > 3) {
      seek(0);
      return;
    }
    const currentIndex = currentTrack ? tracks.findIndex((t) => t.id === currentTrack.id) : 0;
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    playTrack(tracks[prevIndex]);
  }, [tracks, currentTrack, playTrack, seek]);

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

  const addCustomTrack = useCallback(
    async (trackData: Omit<Track, 'id' | 'plays' | 'isCustomUpload'>, audioBlob: Blob): Promise<Track> => {
      const id = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const objectUrl = URL.createObjectURL(audioBlob);

      const newTrack: Track = {
        ...trackData,
        id,
        audioUrl: objectUrl,
        audioBlobKey: id,
        isCustomUpload: true,
        plays: 0,
        uploadedAt: new Date().toISOString().split('T')[0],
      };

      // Persist in IndexedDB
      await saveAudioBlob(id, audioBlob);
      await saveTrackMetadata(newTrack);

      setTracks((prev) => [newTrack, ...prev]);
      return newTrack;
    },
    []
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

      // If custom track, update in IndexedDB
      const target = tracks.find((t) => t.id === trackId);
      if (target && target.isCustomUpload) {
        await saveTrackMetadata({ ...target, lyricsSynced: synced, lyricsRaw: rawLRC });
      }
    },
    [currentTrack, activeStudioTrack, tracks]
  );

  const deleteTrack = useCallback(
    async (trackId: string) => {
      const target = tracks.find((t) => t.id === trackId);
      if (target?.isCustomUpload) {
        await deleteAudioBlob(trackId);
        await deleteTrackMetadata(trackId);
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

  return (
    <AudioContext.Provider
      value={{
        tracks,
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
        isUploadModalOpen,
        setIsUploadModalOpen,
        searchQuery,
        setSearchQuery,
        selectedGenre,
        setSelectedGenre,
        playTrack,
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
