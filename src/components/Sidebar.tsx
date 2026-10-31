import React, { useState, useEffect } from 'react';
import {
  Compass,
  Music,
  TrendingUp,
  Heart,
  Upload,
  Mic2,
  ShieldCheck,
  Crown,
  Radio,
  Layers,
  Sparkles,
  Download,
  Check,
  Disc3,
  User,
  SlidersHorizontal,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { BCAfricaLogo, LosslessAudioVector, ZambiaFlagVector } from './icons/VectorIcons';
import { ViewMode } from '../types/music';

interface SidebarProps {
  onNavigate?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate, className = '' }) => {
  const { activeView, setActiveView, tracks, selectedGenre, setSelectedGenre } = useAudio();
  const { user, isReviewer, isAdmin, isSuperAdmin, isCreator } = useAuth();

  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Handle BeforeInstallPrompt for PWA
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      alert('BC Africa Music is ready for background playback! If you are on desktop or mobile, choose "Add to Home screen" or "Install App" in your browser menu.');
      return;
    }
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  };

  const handleNav = (view: ViewMode) => {
    setActiveView(view);
    if (onNavigate) onNavigate();
  };

  const pendingCount = tracks.filter((t) => t.status === 'pending_review').length;

  return (
    <aside
      className={`w-64 xl:w-72 shrink-0 flex flex-col glass-panel border-r border-white/10 text-slate-200 select-none ${className}`}
    >
      {/* Brand Header */}
      <div className="p-5 pb-4 flex items-center justify-between border-b border-white/10">
        <button
          onClick={() => handleNav('discover')}
          className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
        >
          <div className="relative">
            <img
              src="./bc_africa_logo_fixed_v2.png"
              alt="BC Africa"
              className="w-10 h-10 object-contain drop-shadow-[0_2px_8px_rgba(74,159,214,0.35)] transition-transform group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
                const fb = (e.target as HTMLElement).nextElementSibling;
                if (fb) (fb as HTMLElement).style.display = 'block';
              }}
            />
            <div style={{ display: 'none' }}>
              <BCAfricaLogo size={36} className="transition-transform group-hover:scale-105" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-white">
                <span className="text-[#4A9FD6]">BC</span> AFRICA
              </span>
              <LosslessAudioVector className="scale-75 origin-left" />
            </div>
            <p className="text-[10px] text-[#5AA1D2]/80 font-mono tracking-wider uppercase">
              Ubuntu Master Node
            </p>
          </div>
        </button>
      </div>

      {/* Scrollable Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        {/* Main Menu */}
        <div>
          <span className="px-3 text-[10px] font-mono uppercase font-bold text-slate-300 tracking-wider">
            Explore
          </span>
          <nav className="mt-2 space-y-1">
            <button
              onClick={() => handleNav('discover')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'discover'
                  ? 'glass-card text-[#5AA1D2] border-[#4A9FD6]/40 shadow-[0_0_16px_rgba(74,159,214,0.25)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Compass className="w-4 h-4 text-[#4A9FD6]" />
              <span>Discover & Pulse</span>
            </button>

            <button
              onClick={() => handleNav('library')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'library'
                  ? 'bg-[#4A9FD6]/15 text-[#5AA1D2] border border-[#4A9FD6]/30 shadow-[0_0_12px_rgba(74,159,214,0.2)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Music className="w-4 h-4 text-[#4A9FD6]" />
              <span>Browse All Tracks</span>
              <span className="ml-auto text-[10px] font-mono text-slate-400">{tracks.length}</span>
            </button>

            <button
              onClick={() => handleNav('favorites')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'favorites'
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-[0_0_12px_rgba(14,165,233,0.15)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Heart className="w-4 h-4 text-rose-400" />
              <span>My Favorites</span>
            </button>
          </nav>
        </div>

        {/* Studio & Artist Center */}
        <div>
          <span className="px-3 text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
            Artist Studio & Revenue
          </span>
          <nav className="mt-2 space-y-1">
            <button
              onClick={() => handleNav('artist-analytics')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'artist-analytics'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <div className="flex-1 text-left flex items-center justify-between">
                <span>Artist Analytics & Payouts</span>
                <ZambiaFlagVector size={16} />
              </div>
            </button>

            <button
              onClick={() => handleNav('my-uploads')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'my-uploads'
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-[0_0_12px_rgba(14,165,233,0.15)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Upload className="w-4 h-4 text-sky-400" />
              <span>My Uploads</span>
            </button>

            <button
              onClick={() => handleNav('lyrics-studio')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'lyrics-studio'
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-[0_0_12px_rgba(14,165,233,0.15)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Mic2 className="w-4 h-4 text-indigo-400" />
              <span>Lyrics Sync Studio</span>
            </button>

            <button
              onClick={() => handleNav('artist-profile')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'artist-profile'
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-[0_0_12px_rgba(14,165,233,0.15)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-4 h-4 text-sky-400" />
              <span>Artist Public Profile</span>
            </button>
          </nav>
        </div>

        {/* Administration & Governance */}
        {(isReviewer || isAdmin || isSuperAdmin) && (
          <div>
            <span className="px-3 text-[10px] font-mono uppercase font-bold text-amber-400/90 tracking-wider">
              Platform Controls
            </span>
            <nav className="mt-2 space-y-1">
              {(isReviewer || isAdmin) && (
                <button
                  onClick={() => handleNav('review-queue')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeView === 'review-queue'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Review Queue</span>
                  {pendingCount > 0 && (
                    <span className="ml-auto bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </button>
              )}

              {(isSuperAdmin || isAdmin) && (
                <button
                  onClick={() => handleNav('super-panel')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeView === 'super-panel'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Super Admin Center</span>
                </button>
              )}
            </nav>
          </div>
        )}

        {/* Curated Zambian & African Playlists */}
        <div>
          <span className="px-3 text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
            Curated Hubs
          </span>
          <div className="mt-2 space-y-1">
            <button
              onClick={() => {
                setSelectedGenre('Zed Beats');
                handleNav('library');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-sky-300 hover:bg-sky-950/40 transition-colors text-left"
            >
              <ZambiaFlagVector size={14} />
              <span className="truncate">Zed Beats & Lusaka Heat</span>
            </button>
            <button
              onClick={() => {
                setSelectedGenre('Afrobeats');
                handleNav('library');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-sky-300 hover:bg-sky-950/40 transition-colors text-left"
            >
              <Disc3 className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate">Afrobeats Worldwide</span>
            </button>
            <button
              onClick={() => {
                setSelectedGenre('Amapiano');
                handleNav('library');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-sky-300 hover:bg-sky-950/40 transition-colors text-left"
            >
              <Radio className="w-3.5 h-3.5 text-sky-400" />
              <span className="truncate">Amapiano Log Drum Pulse</span>
            </button>
            <button
              onClick={() => {
                setSelectedGenre('Gospel');
                handleNav('library');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-sky-300 hover:bg-sky-950/40 transition-colors text-left"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate">Pan-African Gospel & Soul</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer / Background Playback & PWA Prompt */}
      <div className="p-4 border-t border-white/10 glass-panel space-y-2.5">
        <div className="p-2.5 rounded-xl glass-pill border border-white/10 flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-semibold text-slate-100 block truncate">
              Background Audio Active
            </span>
            <span className="text-[10px] text-slate-300 block truncate">
              Music plays when phone locked
            </span>
          </div>
        </div>

        <button
          onClick={handleInstallClick}
          className="w-full py-2 px-3 rounded-xl glass-card hover:bg-white/15 border-white/15 text-sky-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-sky-400"
        >
          {isInstalled ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Installed as Web App</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Install Desktop & Mobile App</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
