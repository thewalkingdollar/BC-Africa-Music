import React, { useState } from 'react';
import { Upload, Search, Music, Mic2, Compass, Heart, User, LogOut, Shield, ChevronDown, Sparkles } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { ViewMode } from '../types/music';

export const Navbar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    setIsUploadModalOpen,
    searchQuery,
    setSearchQuery,
    tracks,
    openArtistProfile,
  } = useAudio();

  const {
    user,
    profile,
    role,
    isAdmin,
    isCreator,
    signOut,
    setIsAuthModalOpen,
    setAuthModalMode,
    updateUserRole,
  } = useAuth();

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'discover', label: 'Discover', icon: <Compass className="w-4 h-4" /> },
    { id: 'library', label: 'Tracks', icon: <Music className="w-4 h-4" /> },
    { id: 'artist-profile', label: 'Artist Profile', icon: <User className="w-4 h-4" /> },
    { id: 'my-uploads', label: 'My Uploads', icon: <Upload className="w-4 h-4" /> },
    { id: 'favorites', label: 'Favorites', icon: <Heart className="w-4 h-4" /> },
    { id: 'lyrics-studio', label: 'Sync Studio', icon: <Mic2 className="w-4 h-4" /> },
  ];

  const handleUploadClick = () => {
    if (!user) {
      setAuthModalMode('signup');
      setIsAuthModalOpen(true);
      return;
    }
    if (!isCreator && !isAdmin) {
      if (confirm('Uploading songs is available to Creator / Artist accounts. Would you like to switch your account role to Creator now?')) {
        updateUserRole('creator');
        setIsUploadModalOpen(true);
      }
      return;
    }
    setIsUploadModalOpen(true);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#070e17]/95 backdrop-blur-md border-b border-sky-950/60 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Lockup with Official Logo */}
        <div
          onClick={() => setActiveView('discover')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-sky-950/40 p-0.5 border border-sky-500/30 shadow-[0_0_15px_rgba(2,132,199,0.25)] transition-transform group-hover:scale-105">
            <img
              src="/assets/aistudio/e8cdafe3a5e2c0c1-blue-africa-logo_3aeaa8bc.jpg"
              alt="BC Africa Music Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-sky-400">BC</span> Africa <span className="font-light text-sky-200">Music</span>
            </span>
            <span className="text-[10px] text-sky-400/80 uppercase tracking-widest font-mono">Stream & Sync</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md hidden md:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400/60" />
          <input
            type="text"
            placeholder="Search tracks, artists, or lyrics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0c1829] border border-sky-900/50 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ×
            </button>
          )}
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.id === 'my-uploads' && tracks.filter((t) => t.isCustomUpload).length > 0 && (
                  <span className="ml-0.5 text-[10px] bg-sky-950 text-sky-300 px-1.5 py-0.2 rounded-full border border-sky-800/60 font-mono">
                    {tracks.filter((t) => t.isCustomUpload).length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions & Account Authentication */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleUploadClick}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 rounded-lg shadow-[0_0_16px_rgba(2,132,199,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Track</span>
          </button>

          {/* User Account Controls */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 bg-[#0c1829] hover:bg-[#11233d] border border-sky-900/60 rounded-xl px-2.5 py-1.5 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
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
                      isAdmin
                        ? 'text-amber-400'
                        : isCreator
                        ? 'text-sky-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {isAdmin ? 'Admin' : isCreator ? 'Artist / Creator' : 'Listener'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 top-12 w-64 bg-[#081322] border border-sky-900/80 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in duration-150">
                  <div className="pb-3 border-b border-sky-950">
                    <p className="text-xs font-bold text-white truncate">
                      {profile?.displayName || user.displayName || 'BC Africa User'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-sky-950 border border-sky-800 text-sky-300">
                      <Shield className="w-3 h-3 text-sky-400" />
                      <span>Role: {role}</span>
                    </div>
                  </div>

                  {/* Switch Role Option */}
                  {!isAdmin && (
                    <div className="py-3 border-b border-sky-950">
                      <p className="text-[11px] text-slate-400 mb-2">Switch Active Role:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          onClick={() => {
                            updateUserRole('creator');
                            setShowProfileMenu(false);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg border text-left font-medium transition-colors cursor-pointer ${
                            isCreator
                              ? 'bg-sky-600 text-white border-sky-500'
                              : 'bg-sky-950/40 text-slate-300 border-sky-900/60 hover:text-white'
                          }`}
                        >
                          Creator
                        </button>
                        <button
                          onClick={() => {
                            updateUserRole('listener');
                            setShowProfileMenu(false);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg border text-left font-medium transition-colors cursor-pointer ${
                            !isCreator
                              ? 'bg-sky-600 text-white border-sky-500'
                              : 'bg-sky-950/40 text-slate-300 border-sky-900/60 hover:text-white'
                          }`}
                        >
                          Listener
                        </button>
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

      {/* Mobile Search Bar */}
      <div className="mt-2.5 md:hidden">
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
  );
};

