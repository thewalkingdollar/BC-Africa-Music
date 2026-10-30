import React, { useState, useEffect, useMemo } from 'react';
import {
  Crown,
  Palette,
  Megaphone,
  ShieldCheck,
  Users,
  Music,
  Check,
  Sparkles,
  ExternalLink,
  Volume2,
  Sliders,
  Save,
  RotateCcw,
  Edit3,
  Mic2,
  Play,
  Pause,
  AlertCircle,
  Clock,
  Radio,
  TrendingUp,
  DollarSign,
  Download,
  Trash2,
  Plus,
  Search,
  Building,
  CheckCircle2,
  X,
  Bell,
  Send,
  Eye,
  RefreshCw,
  FileText,
  UserCheck,
  Lock,
} from 'lucide-react';
import { usePlatform, THEME_PRESETS } from '../context/PlatformContext';
import { useAuth, BOOTSTRAP_ADMIN_EMAIL } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { PlatformThemeId, GlowLevel, UserRole, UserProfile, Track, PayoutRequest, TrackStatus } from '../types/music';
import { apiClient } from '../services/apiClient';

export const SuperUserPanel: React.FC = () => {
  const {
    settings,
    currentTheme,
    updateSettings,
    triggerInStreamAd,
    songsPlayedCount,
  } = usePlatform();

  const {
    user,
    profile,
    role,
    isSuperAdmin,
    isAdmin,
    assignUserRole,
    fetchAllUsers,
    updateUserRole,
  } = useAuth();

  const {
    tracks,
    openLyricsStudio,
    updateTrackStatus,
    updateTrackMetadata,
    deleteTrack,
    playTrack,
    currentTrack,
    isPlaying,
    togglePlay,
    setActiveView,
  } = useAudio();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'roles' | 'catalog' | 'monetization' | 'theme' | 'adverts' | 'announcements'>('roles');

  // Ad Form State
  const [advertsEnabled, setAdvertsEnabled] = useState(settings.advertsEnabled);
  const [adFrequencyTracks, setAdFrequencyTracks] = useState(settings.adFrequencyTracks || 3);
  const [adTitle, setAdTitle] = useState(settings.adTitle || '');
  const [sponsorName, setSponsorName] = useState(settings.sponsorName || '');
  const [adDescription, setAdDescription] = useState(settings.adDescription || '');
  const [adBannerUrl, setAdBannerUrl] = useState(settings.adBannerUrl || '');
  const [adCtaText, setAdCtaText] = useState(settings.adCtaText || '');
  const [adLinkUrl, setAdLinkUrl] = useState(settings.adLinkUrl || '');
  const [skipAfterSeconds, setSkipAfterSeconds] = useState(settings.skipAfterSeconds || 5);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Monetization Settings State
  const [estimatedCpmRate, setEstimatedCpmRate] = useState<number>(settings.estimatedCpmRate || 4.5);
  const [artistRoyaltySharePercent, setArtistRoyaltySharePercent] = useState<number>(settings.artistRoyaltySharePercent || 70);

  // Broadcast Announcement State
  const [announcementEnabled, setAnnouncementEnabled] = useState<boolean>(settings.announcementEnabled || false);
  const [announcementText, setAnnouncementText] = useState<string>(
    settings.announcementText || '🔥 Welcome to BC Africa Music! Stream original African sounds, read live synced lyrics, and support creators.'
  );

  // User Management State
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUserRoleUpdate, setSelectedUserRoleUpdate] = useState<{ [uid: string]: UserRole }>({});
  const [updatingUserUid, setUpdatingUserUid] = useState<string | null>(null);

  // Create User Modal State
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('creator');
  const [newUserCountry, setNewUserCountry] = useState('Zambia');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Track Catalog Editing State
  const [trackSearchQuery, setTrackSearchQuery] = useState('');
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editAlbum, setEditAlbum] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [editStatus, setEditStatus] = useState<TrackStatus>('approved');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingTrack, setIsSavingTrack] = useState(false);

  // Payout Requests State
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [processingPayoutId, setProcessingPayoutId] = useState<string | null>(null);

  // Sync settings state
  useEffect(() => {
    setAdvertsEnabled(settings.advertsEnabled);
    setAdFrequencyTracks(settings.adFrequencyTracks);
    setAdTitle(settings.adTitle);
    setSponsorName(settings.sponsorName);
    setAdDescription(settings.adDescription);
    setAdBannerUrl(settings.adBannerUrl);
    setAdCtaText(settings.adCtaText);
    setAdLinkUrl(settings.adLinkUrl);
    setSkipAfterSeconds(settings.skipAfterSeconds);
    setEstimatedCpmRate(settings.estimatedCpmRate || 4.5);
    setArtistRoyaltySharePercent(settings.artistRoyaltySharePercent || 70);
    setAnnouncementEnabled(settings.announcementEnabled || false);
    setAnnouncementText(settings.announcementText || '');
  }, [settings]);

  // Load registered users on tab select
  useEffect(() => {
    if (activeTab === 'roles') {
      fetchAllUsers().then((list) => {
        setUsersList(list);
      });
    }
  }, [activeTab]);

  // Load Payout Requests from Self-Hosted Ubuntu server
  useEffect(() => {
    let mounted = true;
    async function loadPayouts() {
      try {
        const list = await apiClient.payouts.getAll();
        if (mounted) setPayouts(list);
      } catch (err) {
        console.warn('Load payouts error:', err);
      }
    }

    loadPayouts();
    const interval = setInterval(loadPayouts, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Save In-Stream Adverts Configuration
  const handleSaveAdSettings = async () => {
    await updateSettings({
      advertsEnabled,
      adFrequencyTracks,
      adTitle,
      sponsorName,
      adDescription,
      adBannerUrl,
      adCtaText,
      adLinkUrl,
      skipAfterSeconds,
    });
    showSaveSuccess('In-Stream Advert settings saved successfully!');
  };

  // Save Monetization & Royalty Pool Settings
  const handleSaveMonetizationSettings = async () => {
    await updateSettings({
      estimatedCpmRate,
      artistRoyaltySharePercent,
    });
    showSaveSuccess('Monetization & Royalty rates updated globally!');
  };

  // Save Platform Broadcast Announcement
  const handleSaveAnnouncement = async () => {
    await updateSettings({
      announcementEnabled,
      announcementText: announcementText.trim(),
    });
    showSaveSuccess('Platform announcement updated successfully!');
  };

  // Show transient toast
  const showSaveSuccess = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Assign role to user
  const handleAssignRole = async (targetUid: string) => {
    const newRole = selectedUserRoleUpdate[targetUid];
    if (!newRole) return;
    setUpdatingUserUid(targetUid);
    try {
      await assignUserRole(targetUid, newRole);
      setUsersList((prev) =>
        prev.map((u) => (u.uid === targetUid ? { ...u, role: newRole } : u))
      );
      showSaveSuccess(`User role updated to ${newRole.toUpperCase()}!`);
    } catch (err) {
      console.error('Failed to update role:', err);
      alert('Failed to update user role.');
    } finally {
      setUpdatingUserUid(null);
    }
  };

  // Create User Profile directly from panel
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    setIsCreatingUser(true);
    const generatedUid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newProfile: UserProfile = {
      uid: generatedUid,
      displayName: newUserName.trim(),
      email: newUserEmail.trim().toLowerCase(),
      role: newUserRole,
      country: newUserCountry,
      createdAt: new Date().toISOString(),
    };
    try {
      const res = await apiClient.auth.register({
        email: newUserEmail.trim().toLowerCase(),
        password: 'password123',
        displayName: newUserName.trim(),
        role: newUserRole,
        country: newUserCountry,
      });
      setUsersList((prev) => [res.user, ...prev]);
      setIsCreateUserModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      showSaveSuccess(`New user registered with role: ${newUserRole.toUpperCase()}!`);
    } catch (err) {
      console.error('Failed to create user:', err);
      alert('Failed to register user on self-hosted server.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Open Track Edit Modal
  const handleEditTrack = (track: Track) => {
    setEditingTrack(track);
    setEditTitle(track.title);
    setEditArtist(track.artist);
    setEditAlbum(track.album || '');
    setEditGenre(track.genre || 'Afrobeats');
    setEditStatus(track.status || 'approved');
    setEditNotes(track.reviewerNotes || '');
  };

  // Save Track Metadata & Status
  const handleSaveTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrack) return;
    setIsSavingTrack(true);
    try {
      await updateTrackMetadata(editingTrack.id, {
        title: editTitle.trim(),
        artist: editArtist.trim(),
        album: editAlbum.trim(),
        genre: editGenre.trim(),
      });
      await updateTrackStatus(editingTrack.id, editStatus, editNotes.trim());
      setEditingTrack(null);
      showSaveSuccess(`Track "${editTitle}" updated successfully!`);
    } catch (err) {
      console.error('Failed to save track:', err);
      alert('Error updating track.');
    } finally {
      setIsSavingTrack(false);
    }
  };

  // Delete Track from Platform
  const handleDeleteTrack = async (trackId: string, trackTitle: string) => {
    if (confirm(`Are you sure you want to permanently delete "${trackTitle}" from BC Africa Music?`)) {
      try {
        await deleteTrack(trackId);
        showSaveSuccess(`Track "${trackTitle}" deleted.`);
      } catch (err) {
        console.error('Failed to delete track:', err);
        alert('Error deleting track.');
      }
    }
  };

  // Approve / Process Payout
  const handleUpdatePayoutStatus = async (payoutId: string, status: 'paid' | 'rejected', notes?: string) => {
    setProcessingPayoutId(payoutId);
    try {
      const updated = await apiClient.payouts.update(payoutId, {
        status,
        adminNotes: notes || (status === 'paid' ? 'Disbursed via provider' : 'Rejected by administrator'),
      });
      setPayouts((prev) =>
        prev.map((p) => (p.id === payoutId ? updated : p))
      );
      showSaveSuccess(`Payout request marked as ${status.toUpperCase()}!`);
    } catch (err) {
      console.error('Failed to update payout:', err);
      alert('Error updating payout status.');
    } finally {
      setProcessingPayoutId(null);
    }
  };

  // Filtered lists
  const filteredUsers = useMemo(() => {
    return usersList.filter(
      (u) =>
        (u.displayName || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (u.role || '').toLowerCase().includes(userSearchQuery.toLowerCase())
    );
  }, [usersList, userSearchQuery]);

  const filteredTracks = useMemo(() => {
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(trackSearchQuery.toLowerCase()) ||
        t.artist.toLowerCase().includes(trackSearchQuery.toLowerCase()) ||
        t.genre.toLowerCase().includes(trackSearchQuery.toLowerCase()) ||
        (t.status || 'approved').toLowerCase().includes(trackSearchQuery.toLowerCase())
    );
  }, [tracks, trackSearchQuery]);

  const pendingTracks = tracks.filter((t) => t.status === 'pending_review');
  const pendingPayouts = payouts.filter((p) => p.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8 animate-fade-in pb-28">
      {/* Toast Notification */}
      {saveSuccessMsg && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl shadow-2xl animate-fade-in text-xs font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#0c223a] via-[#091728] to-[#040810] border border-amber-500/30 p-6 md:p-8 overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.12)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
              <Crown className="w-9 h-9" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-3 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Super User Master Control
                </span>
                <span className="text-xs text-sky-400 font-mono">
                  {user?.email}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                BC Africa Master Dashboard
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Edit and control every component: roles &amp; permissions, catalog moderation, in-stream adverts, visual themes, royalty payouts, and broadcast announcements.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-[#0b1b33] border border-sky-800/60 px-4 py-2.5 rounded-2xl text-center">
              <span className="block text-lg font-black text-sky-400">{tracks.length}</span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Tracks</span>
            </div>
            <div className="bg-[#0b1b33] border border-amber-500/40 px-4 py-2.5 rounded-2xl text-center">
              <span className="block text-lg font-black text-amber-400">{pendingTracks.length}</span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">In Review</span>
            </div>
            <div className="bg-[#0b1b33] border border-emerald-500/40 px-4 py-2.5 rounded-2xl text-center">
              <span className="block text-lg font-black text-emerald-400">{pendingPayouts.length}</span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Payouts Due</span>
            </div>
          </div>
        </div>

        {/* Super Admin Quick Role Simulator */}
        <div className="mt-6 pt-4 border-t border-sky-950/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-semibold text-slate-200">Simulate / Preview Platform As:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(['super_admin', 'creator', 'listener', 'editor', 'reviewer'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => updateUserRole(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  role === r
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'bg-sky-950/60 text-slate-300 hover:text-white border border-sky-800/40'
                }`}
              >
                {r.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-sky-950/80 overflow-x-auto">
          {[
            { id: 'roles', label: `Roles & Access Control (${usersList.length || '•'})`, icon: <Users className="w-4 h-4 text-violet-400" /> },
            { id: 'catalog', label: `Music Catalog & Tracks (${tracks.length})`, icon: <Music className="w-4 h-4 text-sky-400" /> },
            { id: 'monetization', label: `Payouts & Royalties (${pendingPayouts.length} pending)`, icon: <DollarSign className="w-4 h-4 text-emerald-400" /> },
            { id: 'theme', label: 'Theme & Brand Engine', icon: <Palette className="w-4 h-4 text-sky-400" /> },
            { id: 'adverts', label: 'In-Stream Ad Engine', icon: <Megaphone className="w-4 h-4 text-amber-400" /> },
            { id: 'announcements', label: 'Broadcast Banner', icon: <Bell className="w-4 h-4 text-rose-400" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}

          <a
            href="/BC_Africa_Music_Ubuntu_Server_Architecture_Guide.pdf"
            download="BC_Africa_Music_Ubuntu_Server_Architecture_Guide.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-sky-200 hover:text-white bg-sky-950/80 hover:bg-sky-900 border border-sky-600/60 transition-all cursor-pointer whitespace-nowrap shadow-[0_0_15px_rgba(2,132,199,0.2)] ml-auto"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Server Architecture PDF</span>
          </a>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ROLES & USER ACCESS CONTROL                                         */}
      {/* ========================================================================= */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Roles & Responsibilities Matrix */}
          <div className="bg-[#081528] border border-sky-950 p-6 rounded-3xl shadow-lg">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
              <span>Platform Roles &amp; Team Responsibilities Matrix</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              BC Africa Music enforces 6 distinct roles. The Super Admin has authority to edit any user's role on the fly.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  role: 'super_admin',
                  title: '👑 Super Admin',
                  color: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
                  desc: 'Unrestricted master control over the platform.',
                  powers: [
                    'Edit visual themes & CSS variables in real time',
                    'Configure in-stream audio/banner adverts & frequency',
                    'Promote/demote any user to any role',
                    'Approve or reject artist royalty withdrawals',
                    'Publish broadcast announcements',
                  ],
                },
                {
                  role: 'admin',
                  title: '🛡️ Administrator',
                  color: 'border-blue-500/50 bg-blue-500/10 text-sky-300',
                  desc: 'Operational management & catalog moderation.',
                  powers: [
                    'Review and approve music submissions',
                    'Moderate song catalog & edit lyrics',
                    'Inspect registered users and profiles',
                    'Manage reported tracks and copyright claims',
                  ],
                },
                {
                  role: 'reviewer',
                  title: '🔍 Music Review Team',
                  color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
                  desc: 'Gatekeepers of sound quality before release.',
                  powers: [
                    'Audition pending artist submissions in private player',
                    'Verify audio bitrates, cover art, and lyrics',
                    'Approve tracks to go live on Discover & Library',
                    'Reject tracks with structured reviewer feedback notes',
                  ],
                },
                {
                  role: 'editor',
                  title: '✍️ Editorial & Lyrics Quality Team',
                  color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300',
                  desc: 'Responsible for editing, curation & lyrics timing.',
                  powers: [
                    'Curate song titles, artist names, and album tags',
                    'Standardize African genres (Afrobeats, Amapiano, Highlife)',
                    'Fine-tune line-by-line synchronized lyrics in Sync Studio',
                    'Format lyrics stanzas, verses, and choruses',
                  ],
                },
                {
                  role: 'creator',
                  title: '🎤 Artist / Creator',
                  color: 'border-violet-500/50 bg-violet-500/10 text-violet-300',
                  desc: 'Original music creators, singers, & producers.',
                  powers: [
                    'Upload original tracks & synchronized LRC lyrics',
                    'Track 24-hour and all-time streaming analytics',
                    'Receive direct fan tips with zero middleman deductions',
                    'Withdraw royalties to Zambian MoMo or Bank accounts',
                  ],
                },
                {
                  role: 'listener',
                  title: '🎧 Listener / Fan',
                  color: 'border-slate-700 bg-slate-900/60 text-slate-300',
                  desc: 'Music streamers & authentic African sound fans.',
                  powers: [
                    'Stream approved songs across all genres',
                    'Read live karaoke synchronized lyrics in real time',
                    'Send direct tips and patronage messages to artists',
                    'Create personal playlists and favorite songs',
                  ],
                },
              ].map((item) => (
                <div
                  key={item.role}
                  className={`p-4 rounded-2xl border ${item.color} flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-sm">{item.title}</span>
                      <span className="text-[10px] font-mono uppercase bg-black/40 px-2 py-0.5 rounded-full font-bold">
                        {item.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mb-3">{item.desc}</p>
                    <ul className="space-y-1 text-[11px] text-slate-400">
                      {item.powers.map((p, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-sky-400">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Roster Table & Role Editor */}
          <div className="bg-[#081528] border border-sky-950 p-6 md:p-8 rounded-3xl shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-violet-400" />
                  <span>Registered Users Roster ({filteredUsers.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Change roles instantly or register a new user profile directly into Firestore.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search by name, email, or role..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="bg-[#06101d] border border-sky-900/60 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400 w-64"
                />

                <button
                  onClick={() => setIsCreateUserModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add User
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#050b14] text-slate-400 text-xs uppercase tracking-wider border-b border-sky-950/80">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Country</th>
                    <th className="py-3 px-4">Current Role</th>
                    <th className="py-3 px-4">Edit &amp; Assign Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-950/40">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                        No registered users match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const currentSelectedRole = selectedUserRoleUpdate[u.uid] || u.role;
                      const isBootstrap = u.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

                      return (
                        <tr key={u.uid} className="hover:bg-sky-950/20 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-sky-950 border border-sky-800 flex items-center justify-center text-white font-bold text-sm">
                                {(u.displayName || u.email || 'U')[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white">
                                    {u.displayName || 'BC User'}
                                  </span>
                                  {isBootstrap && (
                                    <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.2 rounded-full font-mono uppercase font-bold">
                                      Owner
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono">{u.uid}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-xs text-slate-300 font-mono">{u.email}</td>
                          <td className="py-3 px-4 text-xs text-slate-300">{u.country || 'Zambia 🇿🇲'}</td>

                          <td className="py-3 px-4">
                            <span className="text-xs font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800">
                              {u.role}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <select
                                value={currentSelectedRole}
                                onChange={(e) =>
                                  setSelectedUserRoleUpdate((prev) => ({
                                    ...prev,
                                    [u.uid]: e.target.value as UserRole,
                                  }))
                                }
                                className="bg-[#081528] border border-sky-900/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                              >
                                <option value="listener">Listener</option>
                                <option value="creator">Creator / Artist</option>
                                <option value="editor">Editor (Editorial Team)</option>
                                <option value="reviewer">Reviewer (Music Review Team)</option>
                                <option value="admin">Admin</option>
                                <option value="super_admin">Super Admin</option>
                              </select>

                              <button
                                onClick={() => handleAssignRole(u.uid)}
                                disabled={updatingUserUid === u.uid || currentSelectedRole === u.role}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                  currentSelectedRole !== u.role
                                    ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-md'
                                    : 'bg-white/5 text-slate-600 cursor-not-allowed'
                                }`}
                              >
                                {updatingUserUid === u.uid ? 'Saving...' : 'Apply'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MUSIC CATALOG & DIRECT TRACK EDITOR                                 */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <div className="bg-[#081528] border border-sky-950 p-6 md:p-8 rounded-3xl shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Music className="w-5 h-5 text-sky-400" />
                  <span>Platform Music Catalog Control ({filteredTracks.length} Songs)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Super Admin can edit titles, artists, genre classifications, review status, or remove songs permanently.
                </p>
              </div>

              <input
                type="text"
                placeholder="Search tracks by title, artist, genre, or status..."
                value={trackSearchQuery}
                onChange={(e) => setTrackSearchQuery(e.target.value)}
                className="bg-[#06101d] border border-sky-900/60 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400 w-72"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#050b14] text-slate-400 text-xs uppercase tracking-wider border-b border-sky-950/80">
                  <tr>
                    <th className="py-3 px-4">Track</th>
                    <th className="py-3 px-4">Genre / Duration</th>
                    <th className="py-3 px-4">Review Status</th>
                    <th className="py-3 px-4 text-right">Streams</th>
                    <th className="py-3 px-4 text-right">Super Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-950/40">
                  {filteredTracks.map((track) => (
                    <tr key={track.id} className="hover:bg-sky-950/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={track.coverUrl || '/assets/aistudio/e8cdafe3a5e2c0c1-blue-africa-logo_3aeaa8bc.jpg'}
                            alt={track.title}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-800"
                          />
                          <div>
                            <div className="font-bold text-white text-xs">{track.title}</div>
                            <div className="text-[11px] text-sky-400">{track.artist}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-300">
                        {track.genre || 'Afrobeats'} • {Math.round(track.duration || 0)}s
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            track.status === 'approved' || !track.status
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : track.status === 'rejected'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {track.status || 'approved'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-white text-xs">
                        {(track.plays || 0).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditTrack(track)}
                            className="px-2.5 py-1.5 rounded-lg bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Song</span>
                          </button>

                          <button
                            onClick={() => openLyricsStudio(track.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-sky-900/60"
                            title="Edit Synced Lyrics"
                          >
                            <Mic2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteTrack(track.id, track.title)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40"
                            title="Delete Track"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MONETIZATION, ROYALTIES & PAYOUT APPROVALS                          */}
      {/* ========================================================================= */}
      {activeTab === 'monetization' && (
        <div className="space-y-6">
          {/* Rate Controls */}
          <div className="bg-[#081528] border border-sky-950 p-6 md:p-8 rounded-3xl shadow-lg">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span>Platform Global Royalty &amp; Monetization Settings</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Configure platform CPM benchmark rates and artist revenue sharing splits. Changes calculate automatically in real time across all artist dashboards.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-[#06101d] border border-sky-900/60">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Benchmark In-Stream CPM ($ USD)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.10"
                    min="1"
                    max="50"
                    value={estimatedCpmRate}
                    onChange={(e) => setEstimatedCpmRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#081528] border border-sky-900/80 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-sky-400"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Current rate: ${estimatedCpmRate.toFixed(2)} per 1,000 advert impressions.
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#06101d] border border-sky-900/60">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Artist Royalty Share (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={artistRoyaltySharePercent}
                    onChange={(e) => setArtistRoyaltySharePercent(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[#081528] border border-sky-900/80 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-sky-400"
                  />
                  <span className="text-slate-400 font-bold">%</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {artistRoyaltySharePercent}% to Artists / Creators ({100 - artistRoyaltySharePercent}% to Platform Operations).
                </span>
              </div>
            </div>

            <button
              onClick={handleSaveMonetizationSettings}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Global Royalty Settings
            </button>
          </div>

          {/* Payout Requests Moderation Queue */}
          <div className="bg-[#081528] border border-sky-950 p-6 md:p-8 rounded-3xl shadow-lg">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-400" />
              <span>Artist Payout Requests Queue ({payouts.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Review and approve pending withdrawal requests to Zambian Mobile Money, Banks, or international accounts.
            </p>

            {payouts.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No payout requests submitted yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#050b14] text-slate-400 text-xs uppercase tracking-wider border-b border-sky-950/80">
                    <tr>
                      <th className="py-3 px-4">Artist</th>
                      <th className="py-3 px-4">Requested Date</th>
                      <th className="py-3 px-4">Provider / Method</th>
                      <th className="py-3 px-4">Account / Number</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-950/40">
                    {payouts.map((p) => (
                      <tr key={p.id} className="hover:bg-sky-950/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white text-xs">{p.artistName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.artistEmail}</div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-300">
                          {new Date(p.requestedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold text-white">{p.paymentMethod}</td>
                        <td className="py-3 px-4 text-xs font-mono text-slate-300">{p.accountDetails}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                          ${Number(p.amount).toFixed(2)} USD
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              p.status === 'paid'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : p.status === 'rejected'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {p.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleUpdatePayoutStatus(p.id, 'paid')}
                                disabled={processingPayoutId === p.id}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                Approve &amp; Pay
                              </button>
                              <button
                                onClick={() => handleUpdatePayoutStatus(p.id, 'rejected', 'Account details invalid')}
                                disabled={processingPayoutId === p.id}
                                className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: THEME ENGINE                                                       */}
      {/* ========================================================================= */}
      {activeTab === 'theme' && (
        <div className="space-y-6">
          <div className="bg-[#081528] border border-sky-950 p-6 md:p-8 rounded-3xl shadow-lg">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Palette className="w-5 h-5 text-sky-400" />
              <span>Dynamic Platform Visual Themes (Logo Color Palette)</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Select an authentic visual theme based on the signature BC Africa logo colors. Changes persist in Firestore and instantly update the entire application across all active listeners.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {Object.values(THEME_PRESETS).map((t) => {
                const isSelected = settings.theme === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => updateSettings({ theme: t.id })}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-sky-400 bg-sky-950/60 shadow-[0_0_20px_rgba(2,132,199,0.3)]'
                        : 'border-sky-950 bg-[#06101d] hover:border-sky-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-white text-sm">{t.name}</span>
                      {isSelected && (
                        <span className="text-xs bg-sky-500 text-white font-bold px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: t.primary }} />
                      <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: t.primaryHover }} />
                      <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: t.bgCard }} />
                    </div>
                    <p className="text-[11px] text-slate-400">{t.subtitle}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: IN-STREAM ADVERTS ENGINE                                            */}
      {/* ========================================================================= */}
      {activeTab === 'adverts' && (
        <div className="bg-[#081528] border border-sky-950 p-6 md:p-8 rounded-3xl shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <span>In-Stream Advertising Broadcast Engine</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure sponsor audio and banner ads that interrupt listeners during streaming.
              </p>
            </div>

            <button
              onClick={() => triggerInStreamAd()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Radio className="w-4 h-4 text-slate-950" />
              Test Play Advert Now
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#06101d] border border-sky-900/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-white text-xs block">Enable In-Stream Adverts</span>
                <span className="text-[11px] text-slate-400">Interrupt listeners after set track count</span>
              </div>
              <input
                type="checkbox"
                checked={advertsEnabled}
                onChange={(e) => setAdvertsEnabled(e.target.checked)}
                className="w-5 h-5 accent-sky-500 cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-2xl bg-[#06101d] border border-sky-900/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-white text-xs block">Track Play Frequency</span>
                <span className="text-[11px] text-slate-400">Play an ad every X songs streamed</span>
              </div>
              <select
                value={adFrequencyTracks}
                onChange={(e) => setAdFrequencyTracks(parseInt(e.target.value, 10))}
                className="bg-[#081528] border border-sky-900 rounded-xl px-3 py-1.5 text-xs text-white"
              >
                <option value={1}>Every 1 Track</option>
                <option value={2}>Every 2 Tracks</option>
                <option value={3}>Every 3 Tracks</option>
                <option value={5}>Every 5 Tracks</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Campaign Headline
              </label>
              <input
                type="text"
                value={adTitle}
                onChange={(e) => setAdTitle(e.target.value)}
                placeholder="e.g. Experience authentic African sound"
                className="w-full bg-[#06101d] border border-sky-900/60 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Sponsor Name
              </label>
              <input
                type="text"
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                placeholder="e.g. BC Africa Official Partner"
                className="w-full bg-[#06101d] border border-sky-900/60 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Promotional Description
              </label>
              <textarea
                rows={2}
                value={adDescription}
                onChange={(e) => setAdDescription(e.target.value)}
                placeholder="Short announcement message heard or read by listeners..."
                className="w-full bg-[#06101d] border border-sky-900/60 rounded-xl px-3 py-2 text-xs text-white resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Call-to-Action Text
              </label>
              <input
                type="text"
                value={adCtaText}
                onChange={(e) => setAdCtaText(e.target.value)}
                placeholder="e.g. Learn More / Visit Sponsor"
                className="w-full bg-[#06101d] border border-sky-900/60 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Target Link URL
              </label>
              <input
                type="url"
                value={adLinkUrl}
                onChange={(e) => setAdLinkUrl(e.target.value)}
                placeholder="https://bcafricamusic.com"
                className="w-full bg-[#06101d] border border-sky-900/60 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <button
            onClick={handleSaveAdSettings}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Advert Engine Configuration
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: BROADCAST ANNOUNCEMENT BANNER                                       */}
      {/* ========================================================================= */}
      {activeTab === 'announcements' && (
        <div className="bg-[#081528] border border-sky-950 p-6 md:p-8 rounded-3xl shadow-lg space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-rose-400" />
              <span>Platform-Wide Broadcast Banner</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Broadcast high-priority messages to all active listeners (e.g. new album drops, trending charts, live events).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#06101d] border border-sky-900/60 flex items-center justify-between">
            <div>
              <span className="font-bold text-white text-xs block">Enable Broadcast Announcement</span>
              <span className="text-[11px] text-slate-400">Shows top alert banner across all listener screens</span>
            </div>
            <input
              type="checkbox"
              checked={announcementEnabled}
              onChange={(e) => setAnnouncementEnabled(e.target.checked)}
              className="w-5 h-5 accent-rose-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Announcement Message
            </label>
            <textarea
              rows={3}
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="e.g. 🔥 New Music Friday: Check out the latest trending tracks in Afrobeats & Amapiano!"
              className="w-full bg-[#06101d] border border-sky-900/60 rounded-xl px-4 py-3 text-xs text-white resize-none"
            />
          </div>

          {announcementEnabled && announcementText && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950/80 via-sky-950/60 to-rose-950/80 border border-rose-500/40 text-xs text-white flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
              <div className="flex-1">
                <strong>Live Preview:</strong> {announcementText}
              </div>
            </div>
          )}

          <button
            onClick={handleSaveAnnouncement}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Publish Broadcast Announcement
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: REGISTER NEW USER PROFILE                                        */}
      {/* ========================================================================= */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#0b192c] to-[#070e17] border border-sky-500/30 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => setIsCreateUserModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <span className="text-xs text-sky-400 font-mono uppercase font-bold">Admin Management</span>
                <h3 className="text-xl font-bold text-white">Create New User Profile</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Kondwani Phiri"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="listener">Listener</option>
                  <option value="creator">Creator / Artist</option>
                  <option value="editor">Editor (Editorial Team)</option>
                  <option value="reviewer">Reviewer (Music Review Team)</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Country</label>
                <select
                  value={newUserCountry}
                  onChange={(e) => setNewUserCountry(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Zambia">🇿🇲 Zambia</option>
                  <option value="Nigeria">🇳🇬 Nigeria</option>
                  <option value="South Africa">🇿🇦 South Africa</option>
                  <option value="Ghana">🇬🇭 Ghana</option>
                  <option value="Kenya">🇰🇪 Kenya</option>
                  <option value="International">🌐 International / Diaspora</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {isCreatingUser ? 'Registering...' : 'Save User Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT TRACK METADATA & REVIEW STATUS                              */}
      {/* ========================================================================= */}
      {editingTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-gradient-to-b from-[#0b192c] to-[#070e17] border border-sky-500/30 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => setEditingTrack(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleSaveTrack} className="space-y-4">
              <div>
                <span className="text-xs text-sky-400 font-mono uppercase font-bold">Catalog Management</span>
                <h3 className="text-xl font-bold text-white">Edit Song: {editingTrack.title}</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Song Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Artist Name</label>
                  <input
                    type="text"
                    required
                    value={editArtist}
                    onChange={(e) => setEditArtist(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Album / Release</label>
                  <input
                    type="text"
                    value={editAlbum}
                    onChange={(e) => setEditAlbum(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">African Genre</label>
                  <select
                    value={editGenre}
                    onChange={(e) => setEditGenre(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Afrobeats">Afrobeats</option>
                    <option value="Amapiano">Amapiano</option>
                    <option value="Highlife">Highlife</option>
                    <option value="Bongo Flava">Bongo Flava</option>
                    <option value="Afro-Soul">Afro-Soul</option>
                    <option value="Gqom">Gqom</option>
                    <option value="Fuji">Fuji</option>
                    <option value="Zambian Kalindula / Afro">Zambian Kalindula / Afro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Review Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['approved', 'pending_review', 'rejected'] as TrackStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditStatus(s)}
                      className={`py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                        editStatus === s
                          ? s === 'approved'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : s === 'rejected'
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'bg-amber-600 text-white shadow-md'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reviewer Feedback Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Notes shown to artist (e.g. Audio approved for public broadcast)..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTrack(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTrack}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {isSavingTrack ? 'Saving...' : 'Save Track Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
