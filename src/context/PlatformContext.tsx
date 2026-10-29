import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { PlatformSettings, PlatformThemeId, GlowLevel } from '../types/music';
import { useAuth } from './AuthContext';
import { apiClient } from '../services/apiClient';

export interface ThemePreset {
  id: PlatformThemeId;
  name: string;
  subtitle: string;
  primary: string;
  primaryHover: string;
  glow: string;
  bgDark: string;
  bgCard: string;
  borderColor: string;
  accentText: string;
}

export const THEME_PRESETS: Record<PlatformThemeId, ThemePreset> = {
  'bc-blue': {
    id: 'bc-blue',
    name: 'BC Africa Classic Blue',
    subtitle: 'Official Brand Identity & Electric Sapphire',
    primary: '#0ea5e9',
    primaryHover: '#0284c7',
    glow: 'rgba(14, 165, 233, 0.35)',
    bgDark: '#040b15',
    bgCard: '#071324',
    borderColor: 'rgba(14, 165, 233, 0.25)',
    accentText: 'text-sky-400',
  },
  'midnight-neon': {
    id: 'midnight-neon',
    name: 'Midnight Afrobeat Glow',
    subtitle: 'Cyberpunk Lagos & Electric Cyan',
    primary: '#06b6d4',
    primaryHover: '#0891b2',
    glow: 'rgba(6, 182, 212, 0.4)',
    bgDark: '#04090f',
    bgCard: '#081420',
    borderColor: 'rgba(6, 182, 212, 0.25)',
    accentText: 'text-cyan-400',
  },
  'sahara-gold': {
    id: 'sahara-gold',
    name: 'Sahara Sunset Gold',
    subtitle: 'Warm African Sunset & Desert Amber',
    primary: '#f59e0b',
    primaryHover: '#d97706',
    glow: 'rgba(245, 158, 11, 0.35)',
    bgDark: '#120a03',
    bgCard: '#1a1005',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    accentText: 'text-amber-400',
  },
  'lagos-emerald': {
    id: 'lagos-emerald',
    name: 'Lagos Emerald Pulse',
    subtitle: 'Afro-Fusion Rainforest & Vibrant Mint',
    primary: '#10b981',
    primaryHover: '#059669',
    glow: 'rgba(16, 185, 129, 0.35)',
    bgDark: '#02120b',
    bgCard: '#041d13',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    accentText: 'text-emerald-400',
  },
  'crimson-rhythm': {
    id: 'crimson-rhythm',
    name: 'Crimson Sun Rhythm',
    subtitle: 'Velvet Noir & Burning Sunset Ruby',
    primary: '#f43f5e',
    primaryHover: '#e11d48',
    glow: 'rgba(244, 63, 94, 0.35)',
    bgDark: '#130307',
    bgCard: '#1d060c',
    borderColor: 'rgba(244, 63, 94, 0.25)',
    accentText: 'text-rose-400',
  },
  'amapiano-violet': {
    id: 'amapiano-violet',
    name: 'Royal Amapiano Violet',
    subtitle: 'Deep Johannesburg Night & Electric Violet',
    primary: '#8b5cf6',
    primaryHover: '#7c3aed',
    glow: 'rgba(139, 92, 246, 0.35)',
    bgDark: '#0b0416',
    bgCard: '#140826',
    borderColor: 'rgba(139, 92, 246, 0.25)',
    accentText: 'text-violet-400',
  },
};

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  theme: 'bc-blue',
  glowLevel: 'balanced',
  advertsEnabled: true,
  adFrequencyTracks: 3,
  adTitle: 'Stream Pure African Sound in Lossless HD',
  sponsorName: 'BC Africa Music & MTN Pulse Africa',
  adDescription:
    'Empowering independent African talent across Lusaka, Lagos, Nairobi, Johannesburg & Accra. Enjoy synchronized lyrics and seamless audio streaming.',
  adBannerUrl:
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80',
  adCtaText: 'Discover BC Africa Live',
  adLinkUrl: 'https://bcafricamusic.com',
  skipAfterSeconds: 5,
  totalAdImpressions: 142,
  artistRoyaltySharePercent: 70,
  estimatedCpmRate: 4.5,
  announcementEnabled: true,
  announcementText: '🔥 Welcome to BC Africa Music! 100% Self-Hosted & African Independent Music Streaming.',
  updatedAt: new Date().toISOString(),
};

interface PlatformContextType {
  settings: PlatformSettings;
  currentTheme: ThemePreset;
  updateSettings: (newSettings: Partial<PlatformSettings>) => Promise<void>;
  isAdOverlayOpen: boolean;
  adTimeRemaining: number;
  canSkipAd: boolean;
  activeAdData: PlatformSettings | null;
  triggerInStreamAd: () => void;
  dismissAd: () => void;
  notifyTrackPlayed: () => void;
  songsPlayedCount: number;
}

const PlatformContext = createContext<PlatformContextType | null>(null);

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);

  // In-Stream Ad state
  const [isAdOverlayOpen, setIsAdOverlayOpen] = useState(false);
  const [adTimeRemaining, setAdTimeRemaining] = useState(5);
  const [canSkipAd, setCanSkipAd] = useState(false);
  const [songsPlayedCount, setSongsPlayedCount] = useState(0);

  // Load settings from self-hosted server and poll periodically
  useEffect(() => {
    let mounted = true;

    async function fetchPlatformSettings() {
      try {
        const remoteSettings = await apiClient.settings.get();
        if (mounted && remoteSettings && remoteSettings.theme) {
          setSettings((prev) => ({
            ...prev,
            ...remoteSettings,
          }));
        }
      } catch (err) {
        // Fall back to default
      }
    }

    fetchPlatformSettings();
    const interval = setInterval(fetchPlatformSettings, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const currentTheme = THEME_PRESETS[settings.theme] || THEME_PRESETS['bc-blue'];

  // Apply theme styling dynamically to CSS root variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bc-primary', currentTheme.primary);
    root.style.setProperty('--bc-primary-hover', currentTheme.primaryHover);
    root.style.setProperty('--bc-glow', currentTheme.glow);
    root.style.setProperty('--bc-bg-dark', currentTheme.bgDark);
    root.style.setProperty('--bc-bg-card', currentTheme.bgCard);
    root.style.setProperty('--bc-border', currentTheme.borderColor);

    // Apply background color to document body
    document.body.style.backgroundColor = currentTheme.bgDark;
  }, [currentTheme]);

  // Update settings on self-hosted Ubuntu server
  const updateSettings = async (newSettings: Partial<PlatformSettings>) => {
    const merged: PlatformSettings = {
      ...settings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
    };
    setSettings(merged);

    try {
      await apiClient.settings.update(merged);
    } catch (err) {
      console.warn('Update platform settings note:', err);
    }
  };

  // Play sponsor sound or procedurally synthesised drum chime
  const playSponsorAudio = useCallback(() => {
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtxClass();
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.001, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.2, now + idx * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.85);
      });
    } catch (e) {
      console.debug('Audio chime note:', e);
    }
  }, []);

  // Trigger in-stream advert
  const triggerInStreamAd = useCallback(() => {
    setIsAdOverlayOpen(true);
    setAdTimeRemaining(settings.skipAfterSeconds || 5);
    setCanSkipAd(false);
    playSponsorAudio();

    // Increment impression on self-hosted server
    const nextImpressions = (settings.totalAdImpressions || 0) + 1;
    setSettings((prev) => ({ ...prev, totalAdImpressions: nextImpressions }));
    apiClient.settings.update({ totalAdImpressions: nextImpressions }).catch(() => {});
  }, [settings, playSponsorAudio]);

  // Dismiss in-stream ad
  const dismissAd = useCallback(() => {
    setIsAdOverlayOpen(false);
    setCanSkipAd(false);
  }, []);

  // Countdown timer for ad skip
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAdOverlayOpen) {
      if (adTimeRemaining > 0) {
        timer = setTimeout(() => {
          setAdTimeRemaining((prev) => prev - 1);
        }, 1000);
      } else {
        setCanSkipAd(true);
      }
    }
    return () => clearTimeout(timer);
  }, [isAdOverlayOpen, adTimeRemaining]);

  // Listener streamed a song: check if ad should trigger
  const notifyTrackPlayed = useCallback(() => {
    setSongsPlayedCount((prev) => {
      const nextCount = prev + 1;
      const freq = settings.adFrequencyTracks || 3;
      if (settings.advertsEnabled && nextCount % freq === 0) {
        setTimeout(() => {
          triggerInStreamAd();
        }, 800);
      }
      return nextCount;
    });
  }, [settings.advertsEnabled, settings.adFrequencyTracks, triggerInStreamAd]);

  return (
    <PlatformContext.Provider
      value={{
        settings,
        currentTheme,
        updateSettings,
        isAdOverlayOpen,
        adTimeRemaining,
        canSkipAd,
        activeAdData: settings,
        triggerInStreamAd,
        dismissAd,
        notifyTrackPlayed,
        songsPlayedCount,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
}
