import React, { useState } from 'react';
import {
  Upload,
  Search,
  Music,
  Mic2,
  Compass,
  Heart,
  User,
  LogOut,
  Shield,
  ChevronDown,
  Sparkles,
  Crown,
  ShieldCheck,
  Edit3,
  TrendingUp,
  DollarSign,
  Menu,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { usePlatform } from '../context/PlatformContext';
import { ViewMode, UserRole } from '../types/music';
import { BCAfricaLogo, LosslessAudioVector, ZambiaFlagVector } from './icons/VectorIcons';

interface NavbarProps {
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar }) => {
  const {
    activeView,
    setActiveView,
    setIsUploadModalOpen,
    searchQuery,
    setSearchQuery,
    tracks,
    openArtistProfile,
    selectedGenre,
    setSelectedGenre,
  } = useAudio();

  const {
    user,
    profile,
    role,
    isAdmin,
    isSuperAdmin,
    isReviewer,
    isEditor,
    isCreator,
    signOut,
    setIsAuthModalOpen,
    setAuthModalMode,
    updateUserRole,
  } = useAuth();

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const pendingCount = tracks.filter((t) => t.status === 'pending_review').length;

  const navItems: { id: ViewMode; label: string; icon: React.ReactNode; show?: boolean; badge?: number }[] = [
    { id: 'discover', label: 'Discover', icon: <Compass className="w-4 h-4" /> },
    { id: 'library', label: 'Tracks', icon: <Music className="w-4 h-4" /> },
    { id: 'artist-profile', label: 'Artist Profile', icon: <User className="w-4 h-4" /> },
    { id: 'my-uploads', label: 'My Uploads', icon: <Upload className="w-4 h-4" /> },
    { id: 'favorites', label: 'Favorites', icon: <Heart className="w-4 h-4" /> },
    { id: 'lyrics-studio', label: 'Sync Studio', icon: <Mic2 className="w-4 h-4" /> },
    {
      id: 'artist-analytics',
      label: 'Artist Analytics',
      icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'review-queue',
      label: 'Review Queue',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      show: isReviewer || isAdmin,
      badge: pendingCount,
    },
    {
      id: 'super-panel',
      label: 'Super Panel',
      icon: <Crown className="w-4 h-4 text-amber-400" />,
      show: isSuperAdmin || isAdmin,
    },
  ];

  const handleUploadClick = () => {
    if (!user) {
      setAuthModalMode('signup');
      setIsAuthModalOpen(true);
      return;
    }
    if (!isCreator && !isAdmin) {
      if (
        confirm(
          'Uploading songs is available to Creator / Artist accounts. Would you like to switch your account role to Creator now?'
        )
      ) {
        updateUserRole('creator');
        setIsUploadModalOpen(true);
      }
      return;
    }
    setIsUploadModalOpen(true);
  };

  const { settings } = usePlatform();

  return (
    <>
      {settings?.announcementEnabled && settings?.announcementText && (
        <div className="bg-gradient-to-r from-sky-600 via-blue-700 to-sky-600 text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-md relative z-50">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>{settings.announcementText}</span>
        </div>
      )}
      <header className="sticky top-0 z-40 glass-panel border-b border-white/10 px-3 lg:px-8 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 md:gap-8">
        {/* Zone 1: Mobile Hamburger & Brand Lockup */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="md:hidden p-2 text-slate-300 hover:text-white glass-pill hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 text-sky-400" />
            </button>
          )}

          <div
            onClick={() => setActiveView('discover')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="relative">
              <img
                src="./bc_africa_logo_fixed_v2.png"
                alt="BC Africa"
                className="w-10 h-10 object-contain drop-shadow-[0_2px_8px_rgba(74,159,214,0.35)] transition-transform group-hover:scale-105"
                onError={(e) => {
                  // Fallback to vector icon if image cannot be rendered
                  (e.target as HTMLElement).style.display = 'none';
                  const fb = (e.target as HTMLElement).nextElementSibling;
                  if (fb) (fb as HTMLElement).style.display = 'block';
                }}
              />
              <div style={{ display: 'none' }}>
                <BCAfricaLogo size={36} className="transition-transform group-hover:scale-105" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-1 whitespace-nowrap">
                <span className="text-[#4A9FD6]">BC</span> AFRICA <span className="font-light text-[#5AA1D2] text-xs sm:text-sm">Studio</span>
              </span>
              <span className="text-[9px] text-[#5AA1D2]/90 uppercase tracking-widest font-mono">Stream & Sync</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md hidden md:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A9FD6]" />
          <input
            type="text"
            placeholder="Search tracks, artists, or lyrics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#4A9FD6] focus:ring-2 focus:ring-[#4A9FD6]/40 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-300 hover:text-white"
            >
              ×
            </button>
          )}
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems
            .filter((item) => item.show !== false)
            .map((item) => {
              const isActive = activeView === item.id;
              const isSuper = item.id === 'super-panel';

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer relative ${
                    isActive
                      ? isSuper
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                        : 'bg-[#4A9FD6]/15 text-[#5AA1D2] border border-[#4A9FD6]/30 shadow-[0_0_12px_rgba(74,159,214,0.2)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.2 rounded-full font-bold font-mono animate-pulse">
                      {item.badge}
                    </span>
                  )}
                  {item.id === 'my-uploads' && tracks.filter((t) => t.isCustomUpload).length > 0 && (
                    <span className="ml-0.5 text-[10px] bg-slate-900 text-[#5AA1D2] px-1.5 py-0.2 rounded-full border border-[#4A9FD6]/40 font-mono">
                      {tracks.filter((t) => t.isCustomUpload).length}
                    </span>
                  )}
                </button>
              );
            })}
        </nav>

        {/* Zone 3: Actions & Account Authentication */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Super User Panel Button */}
          {(isSuperAdmin || isAdmin) && (
            <button
              onClick={() => setActiveView('super-panel')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === 'super-panel'
                  ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Super Panel</span>
            </button>
          )}

          <button
            onClick={handleUploadClick}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-[#3A8BC2] hover:bg-[#4A9FD6] rounded-lg shadow-[0_0_16px_rgba(74,159,214,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload Track</span>
            <span className="sm:hidden">Upload</span>
          </button>

          {/* User Account Controls */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 glass-card hover:bg-white/10 border-white/15 rounded-xl px-2.5 py-1.5 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden shadow-sm">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <span>{(profile?.displayName || user.email || 'U')[0].toUpperCase()}</span>
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-white truncate max-w-[100px]">
                    {profile?.artistStageName || profile?.displayName || 'User'}
                  </span>
                  <span
                    className={`text-[9px] font-mono uppercase font-bold tracking-wider ${
                      isSuperAdmin
                        ? 'text-amber-400'
                        : isAdmin
                        ? 'text-amber-300'
                        : isReviewer
                        ? 'text-emerald-400'
                        : isEditor
                        ? 'text-cyan-400'
                        : isCreator
                        ? 'text-sky-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {isSuperAdmin
                      ? 'Super Admin'
                      : isAdmin
                      ? 'Admin'
                      : isReviewer
                      ? 'Review Team'
                      : isEditor
                      ? 'Editor'
                      : isCreator
                      ? 'Creator'
                      : 'Listener'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 top-12 w-72 glass-panel-elevated border border-white/20 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in duration-150">
                  <div className="pb-3 border-b border-white/10">
                    <p className="text-xs font-bold text-white truncate">
                      {profile?.displayName || user.displayName || 'BC Africa User'}
                    </p>
                    <p className="text-[11px] text-slate-300 truncate">{user.email}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase glass-pill border border-white/15 text-sky-300">
                      <Shield className="w-3 h-3 text-sky-400" />
                      <span>Role: {role}</span>
                    </div>
                  </div>

                  {/* Super User Quick Jump */}
                  {(isSuperAdmin || isAdmin) && (
                    <div className="py-2.5 border-b border-sky-950">
                      <button
                        onClick={() => {
                          setActiveView('super-panel');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-colors cursor-pointer"
                      >
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span>Open Super User Panel</span>
                      </button>
                    </div>
                  )}

                  {/* Switch Active Role Option for Testing & Flexibility */}
                  {!isSuperAdmin && (
                    <div className="py-3 border-b border-sky-950">
                      <p className="text-[11px] text-slate-400 mb-2 font-medium">Switch Active Role:</p>
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        {(['creator', 'listener', 'editor', 'reviewer'] as UserRole[]).map((r) => (
                          <button
                            key={r}
                            onClick={() => {
                              updateUserRole(r);
                              setShowProfileMenu(false);
                            }}
                            className={`px-2 py-1.5 rounded-lg border text-left font-medium capitalize text-[11px] transition-colors cursor-pointer ${
                              role === r
                                ? 'bg-sky-600 text-white border-sky-500'
                                : 'bg-sky-950/40 text-slate-300 border-sky-900/60 hover:text-white'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 space-y-1">
                    <button
                      onClick={() => {
                        openArtistProfile(user.uid, profile?.artistStageName || profile?.displayName);
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-sky-300 hover:text-white hover:bg-sky-950/60 rounded-lg transition-colors cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-sky-400" />
                      <span>View Public Artist Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveView('artist-analytics');
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-300 hover:text-white hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Artist Analytics & Royalties</span>
                    </button>

                    {(isReviewer || isAdmin) && (
                      <button
                        onClick={() => {
                          setActiveView('review-queue');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-300 hover:text-white hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Music Review Queue ({pendingCount})</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        signOut();
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthModalMode('signup');
                  setIsAuthModalOpen(true);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-sky-300 bg-sky-950 hover:bg-sky-900 border border-sky-800 rounded-lg transition-all cursor-pointer whitespace-nowrap"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Genre Filter Bar */}
      <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-sky-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {[
          { label: 'All Music', value: 'all' },
          { label: 'Zed Beats', value: 'Zed Beats', isZambia: true },
          { label: 'Afrobeats', value: 'Afrobeats' },
          { label: 'Amapiano', value: 'Amapiano' },
          { label: 'Afro-Fusion', value: 'Afro-Fusion' },
          { label: 'Gospel & Soul', value: 'Gospel' },
        ].map((genre) => {
          const isSelected = selectedGenre === genre.value;
          return (
            <button
              key={genre.label}
              onClick={() => {
                setSelectedGenre(genre.value);
                if (activeView !== 'library' && activeView !== 'discover') {
                  setActiveView('library');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-sky-500 text-white shadow-[0_0_12px_rgba(2,132,199,0.4)]'
                  : 'bg-sky-950/40 text-slate-300 hover:text-white hover:bg-sky-900/50 border border-sky-900/40'
              }`}
            >
              {genre.isZambia && <ZambiaFlagVector size={14} />}
              <span>{genre.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Search Bar */}
      <div className="mt-2 md:hidden">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sky-400/60" />
          <input
            type="text"
            placeholder="Search songs or lyrics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0c1829] border border-sky-900/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400"
          />
        </div>
      </div>
    </header>
    </>
  );
};
