import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Music,
  Play,
  Pause,
  Flame,
  Globe,
  Calendar,
  CheckCircle2,
  Edit3,
  Upload,
  ArrowLeft,
  Sliders,
  Clock,
  Sparkles,
  Share2,
  Heart,
  Shuffle,
  Shield,
  X,
  Save,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { ArtistProfile, Track } from '../types/music';
import { formatTime } from '../utils/lrcParser';
import { apiClient } from '../services/apiClient';
import { TipArtistModal } from './TipArtistModal';
import { AFRICAN_COUNTRIES } from './AuthModal';
import { BCAfricaLogo, getCountryFlagVector } from './icons/VectorIcons';

export const ArtistProfileView: React.FC = () => {
  const {
    tracks,
    plays24hMap,
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    openLyricsStudio,
    selectedArtistId,
    selectedArtistName,
    setActiveView,
    setIsUploadModalOpen,
  } = useAudio();

  const { user, profile, isAdmin, updateArtistProfile } = useAuth();

  // Editing state
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editStageName, setEditStageName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCountry, setEditCountry] = useState('Nigeria');
  const [editPhotoURL, setEditPhotoURL] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);

  // Loaded public artist profile from Firestore
  const [fetchedProfile, setFetchedProfile] = useState<ArtistProfile | null>(null);

  // Determine target artist ID and Name
  const targetArtistId = useMemo(() => {
    if (selectedArtistId) return selectedArtistId;
    if (user) return user.uid;
    // Fallback: first track's ownerId or fallback to artist name
    if (tracks.length > 0 && tracks[0].ownerId) return tracks[0].ownerId;
    return null;
  }, [selectedArtistId, user, tracks]);

  const targetArtistName = useMemo(() => {
    if (selectedArtistName) return selectedArtistName;
    if (profile?.artistStageName || profile?.displayName) {
      return profile.artistStageName || profile.displayName;
    }
    if (tracks.length > 0) return tracks[0].artist;
    return 'Featured BC Artist';
  }, [selectedArtistName, profile, tracks]);

  // Fetch artist profile from self-hosted users list
  useEffect(() => {
    let mounted = true;
    if (!targetArtistId) {
      setFetchedProfile(null);
      return;
    }

    async function loadArtist() {
      try {
        const users = await apiClient.auth.getAllUsers();
        if (!mounted) return;
        const matched = users.find((u) => u.uid === targetArtistId);
        if (matched) {
          setFetchedProfile({
            id: matched.uid,
            displayName: matched.displayName,
            artistStageName: matched.artistStageName || matched.displayName,
            bio: matched.bio || 'African Music Creator & Songwriter',
            country: matched.country || 'Zambia',
            photoURL: matched.photoURL || '',
            isVerified: ['super_admin', 'admin', 'creator', 'reviewer', 'editor'].includes(matched.role),
            createdAt: matched.createdAt,
          });
        } else {
          setFetchedProfile(null);
        }
      } catch (err) {
        console.debug('Public artist profile read notice:', err);
      }
    }

    loadArtist();
    return () => {
      mounted = false;
    };
  }, [targetArtistId]);

  // Tracks uploaded by this artist
  const artistTracks = useMemo(() => {
    return tracks.filter((t) => {
      if (targetArtistId && t.ownerId === targetArtistId) return true;
      if (targetArtistName && t.artist.toLowerCase() === targetArtistName.toLowerCase()) return true;
      if (fetchedProfile?.artistStageName && t.artist.toLowerCase() === fetchedProfile.artistStageName.toLowerCase()) return true;
      return false;
    });
  }, [tracks, targetArtistId, targetArtistName, fetchedProfile]);

  // Check if current logged-in user is the owner of this artist profile
  const isOwner = Boolean(
    user && (user.uid === targetArtistId || (profile?.artistStageName && profile.artistStageName.toLowerCase() === targetArtistName.toLowerCase()))
  );
  const canEdit = isOwner || isAdmin;

  // Resolve artist display metadata
  const displayName =
    fetchedProfile?.artistStageName ||
    (isOwner ? profile?.artistStageName || profile?.displayName : targetArtistName) ||
    'BC Africa Artist';

  const realName =
    fetchedProfile?.displayName ||
    (isOwner ? profile?.displayName : '') ||
    '';

  const bio =
    fetchedProfile?.bio ||
    (isOwner ? profile?.bio : null) ||
    'Soulful rhythms and authentic African melodies recorded and crafted for the global soundscape. Stream, discover, and synchronize lyrics.';

  const country =
    fetchedProfile?.country ||
    (isOwner ? profile?.country : null) ||
    'Nigeria';

  const photoURL =
    fetchedProfile?.photoURL ||
    (isOwner ? profile?.photoURL : null) ||
    (artistTracks.length > 0 ? artistTracks[0].coverUrl : '/icon.svg');

  // Aggregated Statistics
  const totalPlays = useMemo(() => {
    return artistTracks.reduce((acc, t) => acc + (t.plays || 0), 0);
  }, [artistTracks]);

  const total24hPlays = useMemo(() => {
    return artistTracks.reduce((acc, t) => acc + (plays24hMap[t.id] || 0), 0);
  }, [artistTracks, plays24hMap]);

  const totalDuration = useMemo(() => {
    return artistTracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  }, [artistTracks]);

  const topGenres = useMemo(() => {
    const genreMap: Record<string, number> = {};
    artistTracks.forEach((t) => {
      genreMap[t.genre] = (genreMap[t.genre] || 0) + 1;
    });
    return Object.entries(genreMap)
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre);
  }, [artistTracks]);

  const openEditModal = () => {
    setEditStageName(fetchedProfile?.artistStageName || displayName);
    setEditBio(bio);
    setEditCountry(country);
    setEditPhotoURL(photoURL);
    setIsEditingBio(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateArtistProfile({
        artistStageName: editStageName.trim(),
        bio: editBio.trim(),
        country: editCountry.trim(),
        photoURL: editPhotoURL.trim(),
      });
      setIsEditingBio(false);
    } catch (err) {
      console.error('Error saving artist profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const handlePlayDiscography = () => {
    if (artistTracks.length === 0) return;
    if (currentTrack && artistTracks.some((t) => t.id === currentTrack.id)) {
      togglePlay();
    } else {
      playTrack(artistTracks[0]);
    }
  };

  const isAnyPlaying = currentTrack && artistTracks.some((t) => t.id === currentTrack.id) && isPlaying;

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Return Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveView('discover')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Discover</span>
        </button>

        <div className="flex items-center gap-2">
          {copiedNotification && (
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/30">
              Profile link copied!
            </span>
          )}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0c1829] hover:bg-[#11233d] border border-sky-900/60 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Share artist profile"
          >
            <Share2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Artist Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#0c223f] via-[#091629] to-[#060c16] border border-sky-500/25 p-6 lg:p-10 shadow-[0_15px_40px_rgba(2,132,199,0.18)]">
        {/* Subtle Watermark Art */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-15 pointer-events-none flex items-center justify-end pr-8">
          <BCAfricaLogo size={220} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 lg:gap-8">
          {/* Avatar Picture */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 shrink-0 rounded-2xl overflow-hidden bg-sky-950 border-2 border-sky-400/50 shadow-[0_0_25px_rgba(56,189,248,0.3)]">
            <img
              src={photoURL}
              alt={displayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/icon.svg';
              }}
            />
            {canEdit && (
              <button
                onClick={openEditModal}
                className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity gap-1 cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-sky-400" />
                <span>Change Photo</span>
              </button>
            )}
          </div>

          {/* Profile Header Details */}
          <div className="flex-1 space-y-3 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-sky-300 bg-sky-950/90 px-2.5 py-0.5 rounded-full border border-sky-500/40 flex items-center gap-1">
                <Shield className="w-3 h-3 text-sky-400" />
                Verified BC Africa Artist
              </span>

              {country && (
                <span className="text-xs font-medium text-slate-300 bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-sky-800/50 flex items-center gap-1.5">
                  {getCountryFlagVector(country, 15)}
                  <span>{country}</span>
                </span>
              )}

              {isOwner && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  Your Public Profile
                </span>
              )}
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight flex items-center gap-2.5">
                <span>{displayName}</span>
                <CheckCircle2 className="w-7 h-7 text-sky-400 shrink-0 fill-sky-950" />
              </h1>
              {realName && realName !== displayName && (
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Legal / Creator Name: {realName}
                </p>
              )}
            </div>

            {/* Bio Preview */}
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed whitespace-pre-line">
              {bio}
            </p>

            {/* Controls */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {artistTracks.length > 0 && (
                <button
                  onClick={handlePlayDiscography}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 rounded-xl shadow-[0_0_20px_rgba(2,132,199,0.4)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  {isAnyPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-white" />
                      <span>Pause Discography</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                      <span>Play All Tracks</span>
                    </>
                  )}
                </button>
              )}

              {canEdit && (
                <button
                  onClick={openEditModal}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-sky-200 bg-sky-950/80 hover:bg-sky-900 border border-sky-700/80 rounded-xl transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Edit Profile &amp; Bio</span>
                </button>
              )}

              {canEdit && (
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-sky-950/60 hover:bg-sky-900 border border-sky-800 rounded-xl transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-sky-400" />
                  <span>Upload New Track</span>
                </button>
              )}

              {/* Tip / Support Artist Button */}
              <button
                onClick={() => setIsTipModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-200 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.2)] transition-all cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span>Tip / Support {displayName}</span>
              </button>

              {/* View Full Analytics & Royalties */}
              <button
                onClick={() => setActiveView('artist-analytics')}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-emerald-200 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Analytics &amp; Royalties</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
        {/* Card 1: Uploaded Tracks */}
        <div className="bg-[#091524] border border-sky-950 rounded-2xl p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Uploaded Tracks</span>
            <Music className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <span className="text-2xl lg:text-3xl font-extrabold font-mono text-white tabular-nums">
              {artistTracks.length}
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">Total discography</p>
          </div>
        </div>

        {/* Card 2: 24h Trending Streams */}
        <div className="bg-[#091524] border border-sky-950 rounded-2xl p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">24h Streams</span>
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl lg:text-3xl font-extrabold font-mono text-amber-300 tabular-nums">
                {total24hPlays}
              </span>
              <span className="text-[10px] font-mono uppercase bg-amber-950/70 text-amber-400 px-1.5 py-0.5 rounded border border-amber-600/40">
                24H
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Past 24 hours</p>
          </div>
        </div>

        {/* Card 3: All-Time Plays */}
        <div className="bg-[#091524] border border-sky-950 rounded-2xl p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">All-Time Plays</span>
            <Sparkles className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <span className="text-2xl lg:text-3xl font-extrabold font-mono text-sky-300 tabular-nums">
              {totalPlays}
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">Total platform streams</p>
          </div>
        </div>

        {/* Card 4: Dominant Style */}
        <div className="bg-[#091524] border border-sky-950 rounded-2xl p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Primary Sound</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <span className="text-lg lg:text-xl font-bold text-white truncate block">
              {topGenres[0] || 'Afrobeats'}
            </span>
            <p className="text-[10px] font-mono text-slate-400 mt-0.5">
              {formatTime(totalDuration)} total runtime
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded Tracks Discography Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-sky-950/80 pb-3">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Uploaded Music &amp; Catalog</span>
              <span className="text-xs font-mono text-slate-400">({artistTracks.length})</span>
            </h2>
            <p className="text-xs text-slate-400">
              Listen to tracks uploaded directly by {displayName} with live synchronized lyrics
            </p>
          </div>

          {canEdit && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-300 bg-sky-950 hover:bg-sky-900 border border-sky-800 rounded-lg transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Add Track</span>
            </button>
          )}
        </div>

        {artistTracks.length === 0 ? (
          <div className="bg-[#091524] border border-sky-950 rounded-2xl p-12 text-center max-w-lg mx-auto">
            <Music className="w-10 h-10 text-sky-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-white mb-1">No uploaded tracks yet</h3>
            <p className="text-xs text-slate-400 mb-5">
              {isOwner
                ? 'Upload your first audio track to showcase your music, synchronized lyrics, and track play metrics.'
                : `${displayName} has not published tracks yet.`}
            </p>
            {canEdit && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-lg cursor-pointer transition-all"
              >
                Upload First Song
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {artistTracks.map((track, index) => {
              const isCurrent = currentTrack?.id === track.id;
              const isThisPlaying = isCurrent && isPlaying;
              const plays24h = plays24hMap[track.id] || 0;
              const hasLyrics = track.lyricsSynced && track.lyricsSynced.length > 0;

              return (
                <div
                  key={track.id}
                  onClick={() => {
                    if (isCurrent) togglePlay();
                    else playTrack(track);
                  }}
                  className={`group flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer ${
                    isCurrent
                      ? 'bg-gradient-to-r from-[#0c223f] to-[#091629] border-sky-500/80 shadow-[0_4px_16px_rgba(2,132,199,0.2)]'
                      : 'bg-[#091423] hover:bg-[#0c1c31] border-sky-950/70 hover:border-sky-800/80'
                  }`}
                >
                  {/* Left: Index, Artwork, Title */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-center text-xs font-mono font-bold text-slate-500 tabular-nums">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <div className="relative w-11 h-11 shrink-0 rounded-xl overflow-hidden bg-sky-950 border border-sky-900/60">
                      <img
                        src={track.coverUrl || '/icon.svg'}
                        alt={track.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/icon.svg';
                        }}
                      />
                      <div
                        className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                          isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center">
                          {isThisPlaying ? (
                            <Pause className="w-3 h-3 fill-white" />
                          ) : (
                            <Play className="w-3 h-3 fill-white ml-0.5" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-xs font-bold truncate transition-colors ${
                            isCurrent ? 'text-sky-300' : 'text-white group-hover:text-sky-200'
                          }`}
                        >
                          {track.title}
                        </h4>
                        {hasLyrics && (
                          <span className="text-[9px] font-mono font-semibold text-sky-300 bg-sky-950 px-1.5 py-0.5 rounded border border-sky-800/60">
                            SYNCED
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {track.album || 'Single'} • {track.genre}
                      </p>
                    </div>
                  </div>

                  {/* Right: Metrics & Actions */}
                  <div className="flex items-center gap-4 shrink-0">
                    {/* 24h Plays Badge */}
                    <div className="flex items-center gap-1 text-xs font-mono font-semibold text-amber-400 tabular-nums bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-500/20">
                      <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{plays24h}</span>
                      <span className="text-[9px] font-sans text-amber-300/70 font-normal">24h</span>
                    </div>

                    {/* All-time Plays */}
                    <span className="text-xs font-mono text-slate-400 tabular-nums hidden sm:inline-block">
                      {track.plays || 0} plays
                    </span>

                    {/* Duration */}
                    <span className="text-xs font-mono text-slate-500 tabular-nums">
                      {formatTime(track.duration)}
                    </span>

                    {/* Quick Lyrics Studio Action */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openLyricsStudio(track.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-sky-300 hover:bg-sky-950 rounded-lg transition-colors cursor-pointer"
                      title="Open in Lyrics Studio"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Edit Profile & Bio Modal */}
      {isEditingBio && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#091524] border border-sky-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsEditingBio(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Edit Artist Profile</h3>
                <p className="text-xs text-slate-400">
                  Update your public stage name, bio, origin, and artwork
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Artist Stage Name
                </label>
                <input
                  type="text"
                  required
                  value={editStageName}
                  onChange={(e) => setEditStageName(e.target.value)}
                  placeholder="e.g. Burna Boy, Wizkid, Tems"
                  className="w-full bg-[#0c1a2e] border border-sky-900/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Artist Biography &amp; Musical Sound
                </label>
                <textarea
                  rows={4}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Describe your musical journey, your unique rhythm, roots, inspirations, and what fans can expect..."
                  className="w-full bg-[#0c1a2e] border border-sky-900/60 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Country of Origin
                  </label>
                  <select
                    value={editCountry}
                    onChange={(e) => setEditCountry(e.target.value)}
                    className="w-full bg-[#0c1a2e] border border-sky-900/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
                  >
                    {AFRICAN_COUNTRIES.map((c) => (
                      <option key={c} value={c} className="bg-slate-900 text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Profile Photo URL
                  </label>
                  <input
                    type="url"
                    value={editPhotoURL}
                    onChange={(e) => setEditPhotoURL(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#0c1a2e] border border-sky-900/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingBio(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving Profile...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct-to-Artist Tip Modal */}
      <TipArtistModal
        isOpen={isTipModalOpen}
        onClose={() => setIsTipModalOpen(false)}
        artistId={targetArtistId || user?.uid || 'featured_artist'}
        artistName={displayName}
      />
    </div>
  );
};
