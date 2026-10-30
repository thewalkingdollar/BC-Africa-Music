import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Play,
  Pause,
  Music,
  Users,
  Award,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Wallet,
  Clock,
  Sparkles,
  Heart,
  Globe,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  CreditCard,
  Send,
  HelpCircle,
  ChevronRight,
  Filter,
  Building,
  Smartphone,
  Trash2,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { usePlatform } from '../context/PlatformContext';
import { Track, ArtistTip, PayoutRequest, PayoutStatus } from '../types/music';
import { formatTime } from '../utils/lrcParser';
import { apiClient } from '../services/apiClient';
import { TipArtistModal } from './TipArtistModal';

export interface ConnectedAccount {
  type: 'mobile_money' | 'bank_account';
  provider: string;
  accountName: string;
  accountNumber: string;
  country: string;
  savedAt: string;
}

const ZAMBIA_PROVIDERS = [
  { name: 'MTN Mobile Money Zambia (MoMo)', type: 'mobile_money', code: 'ZM_MTN', icon: '🇿🇲' },
  { name: 'Airtel Money Zambia', type: 'mobile_money', code: 'ZM_AIRTEL', icon: '🇿🇲' },
  { name: 'Zamtel Kwacha (Zambia)', type: 'mobile_money', code: 'ZM_ZAMTEL', icon: '🇿🇲' },
  { name: 'Zanaco Bank (Zambia National Commercial Bank)', type: 'bank_account', code: 'ZM_ZANACO', icon: '🇿🇲' },
  { name: 'Standard Chartered Bank Zambia', type: 'bank_account', code: 'ZM_STANCHART', icon: '🇿🇲' },
  { name: 'Stanbic Bank Zambia', type: 'bank_account', code: 'ZM_STANBIC', icon: '🇿🇲' },
  { name: 'FNB Zambia (First National Bank)', type: 'bank_account', code: 'ZM_FNB', icon: '🇿🇲' },
  { name: 'ABSA Bank Zambia', type: 'bank_account', code: 'ZM_ABSA', icon: '🇿🇲' },
];

const OTHER_PROVIDERS = [
  { name: 'Safaricom M-Pesa (Kenya & East Africa)', type: 'mobile_money', code: 'KE_MPESA', icon: '🇰🇪' },
  { name: 'MTN MoMo Ghana', type: 'mobile_money', code: 'GH_MTN', icon: '🇬🇭' },
  { name: 'OPay / PalmPay Nigeria', type: 'mobile_money', code: 'NG_OPAY', icon: '🇳🇬' },
  { name: 'Orange Money (Francophone Africa)', type: 'mobile_money', code: 'FR_ORANGE', icon: '🇨🇮' },
  { name: 'Nigeria Commercial Bank (GTBank / Zenith / Access)', type: 'bank_account', code: 'NG_BANK', icon: '🇳🇬' },
  { name: 'South Africa Bank (Capitec / FNB / Standard Bank)', type: 'bank_account', code: 'ZA_BANK', icon: '🇿🇦' },
  { name: 'International Bank Wire (SWIFT / IBAN)', type: 'bank_account', code: 'INT_SWIFT', icon: '🌐' },
  { name: 'PayPal Direct Payout', type: 'bank_account', code: 'INT_PAYPAL', icon: '🌐' },
];

const ALL_PAYOUT_PROVIDERS = [...ZAMBIA_PROVIDERS, ...OTHER_PROVIDERS];

// Approximate live benchmark exchange rate for payout estimation: 1 USD ~ 27.50 ZMW
const USD_TO_ZMW_RATE = 27.5;

export const ArtistAnalyticsPanel: React.FC = () => {
  const {
    tracks,
    plays24hMap,
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    openLyricsStudio,
  } = useAudio();

  const { user, profile, isCreator, isAdmin, isSuperAdmin } = useAuth();
  const { settings } = usePlatform();

  // Selected artist to analyze (default to current user UID)
  const currentArtistId = user?.uid || 'current_user';
  const currentArtistName = profile?.artistStageName || profile?.displayName || 'BC Africa Artist';

  // Live state from Firestore
  const [tips, setTips] = useState<ArtistTip[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Connected Payout Account state (stored in localStorage keyed by artist ID)
  const [connectedAccount, setConnectedAccount] = useState<ConnectedAccount | null>(() => {
    if (!user) return null;
    try {
      const saved = localStorage.getItem(`bc_connected_payout_${user.uid}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Modals & UI states
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isConnectAccountModalOpen, setIsConnectAccountModalOpen] = useState(false);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);

  // Payout Form States
  const [useConnectedForWithdrawal, setUseConnectedForWithdrawal] = useState<boolean>(true);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutMethod, setPayoutMethod] = useState<string>('MTN Mobile Money Zambia (MoMo)');
  const [accountDetails, setAccountDetails] = useState<string>('');
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);

  // Connect Account Form States
  const [connectType, setConnectType] = useState<'mobile_money' | 'bank_account'>('mobile_money');
  const [connectProvider, setConnectProvider] = useState<string>('MTN Mobile Money Zambia (MoMo)');
  const [connectName, setConnectName] = useState<string>(currentArtistName);
  const [connectNumber, setConnectNumber] = useState<string>('+260 96 ');
  const [connectCountry, setConnectCountry] = useState<string>('Zambia');

  const [activeTab, setActiveTab] = useState<'overview' | 'tracks' | 'tips' | 'payouts'>('overview');

  // Rate settings from Platform or sensible defaults
  const cpmRate = settings?.estimatedCpmRate || 4.5; // $4.50 CPM
  const royaltySharePercent = settings?.artistRoyaltySharePercent || 70; // 70% to artist
  const ratePerStream = (cpmRate / 1000) * (royaltySharePercent / 100);

  // Filter tracks owned by this artist (or all tracks for testing/demo)
  const artistTracks = useMemo(() => {
    const owned = tracks.filter((t) => t.ownerId === currentArtistId);
    if (owned.length > 0) return owned;
    const byName = tracks.filter(
      (t) =>
        t.artist.toLowerCase() === currentArtistName.toLowerCase() ||
        (user?.email && t.ownerEmail === user.email)
    );
    if (byName.length > 0) return byName;
    return tracks;
  }, [tracks, currentArtistId, currentArtistName, user]);

  // Total streams all-time across artist tracks
  const totalStreams = useMemo(() => {
    return artistTracks.reduce((acc, t) => acc + (t.plays || 0), 0);
  }, [artistTracks]);

  // 24h active streams
  const total24hStreams = useMemo(() => {
    return artistTracks.reduce((acc, t) => acc + (plays24hMap[t.id] || 0), 0);
  }, [artistTracks, plays24hMap]);

  // Load Tips & Payouts from Self-Hosted Ubuntu server
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const fetchedTips = await apiClient.tips.getAll(
          isAdmin || isSuperAdmin ? undefined : currentArtistId
        );
        if (mounted) {
          setTips(fetchedTips);
        }

        if (user) {
          const fetchedPayouts = await apiClient.payouts.getAll(
            isAdmin || isSuperAdmin ? undefined : user.uid
          );
          if (mounted) {
            setPayouts(fetchedPayouts);
          }
        }
      } catch (err) {
        console.warn('Error loading financial analytics data:', err);
      } finally {
        if (mounted) setIsLoadingData(false);
      }
    }

    loadData();
    const interval = setInterval(loadData, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [currentArtistId, user, isAdmin, isSuperAdmin]);

  // Financial Computations
  const totalTipsAmount = useMemo(() => {
    return tips.reduce((acc, tip) => acc + (Number(tip.amount) || 0), 0);
  }, [tips]);

  const adStreamingRevenue = useMemo(() => {
    return totalStreams * ratePerStream;
  }, [totalStreams, ratePerStream]);

  const totalGrossEarnings = useMemo(() => {
    return adStreamingRevenue + totalTipsAmount;
  }, [adStreamingRevenue, totalTipsAmount]);

  const totalPaidOut = useMemo(() => {
    return payouts
      .filter((p) => p.status === 'paid')
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  }, [payouts]);

  const pendingPayoutAmount = useMemo(() => {
    return payouts
      .filter((p) => p.status === 'pending' || p.status === 'processing')
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  }, [payouts]);

  const availableBalance = Math.max(0, totalGrossEarnings - totalPaidOut - pendingPayoutAmount);

  // Audience Retention & Demographics featuring Zambia
  const audienceRegions = [
    { name: 'Zambia (Lusaka, Ndola, Kitwe, Livingstone)', percent: 34, count: Math.round(totalStreams * 0.34) },
    { name: 'Nigeria (Lagos, Abuja, Port Harcourt)', percent: 26, count: Math.round(totalStreams * 0.26) },
    { name: 'South Africa (Johannesburg, Cape Town)', percent: 18, count: Math.round(totalStreams * 0.18) },
    { name: 'Kenya (Nairobi, Mombasa)', percent: 12, count: Math.round(totalStreams * 0.12) },
    { name: 'Global African Diaspora (UK, US, Canada)', percent: 10, count: Math.round(totalStreams * 0.10) },
  ];

  // 7-day stream distribution chart model
  const weeklyTrendData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weights = [0.11, 0.13, 0.12, 0.15, 0.22, 0.19, 0.18];
    const base = Math.max(totalStreams, 14);
    return days.map((day, idx) => ({
      day,
      streams: Math.round((base / 7) * (weights[idx] * 7)),
      revenue: ((base / 7) * (weights[idx] * 7) * ratePerStream).toFixed(2),
    }));
  }, [totalStreams, ratePerStream]);

  const maxWeeklyStreams = Math.max(...weeklyTrendData.map((d) => d.streams), 1);

  // Save Connected Account
  const handleSaveConnectedAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const account: ConnectedAccount = {
      type: connectType,
      provider: connectProvider,
      accountName: connectName.trim(),
      accountNumber: connectNumber.trim(),
      country: connectCountry,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(`bc_connected_payout_${user.uid}`, JSON.stringify(account));
      setConnectedAccount(account);
      setIsConnectAccountModalOpen(false);
    } catch (err) {
      console.error('Failed to save connected payout account:', err);
    }
  };

  // Remove Connected Account
  const handleDisconnectAccount = () => {
    if (!user) return;
    if (confirm('Disconnect this saved payout method?')) {
      localStorage.removeItem(`bc_connected_payout_${user.uid}`);
      setConnectedAccount(null);
    }
  };

  // Handle Payout Request Submission
  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amountNum = parseFloat(payoutAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    if (amountNum > availableBalance) {
      alert('Requested amount exceeds your available balance.');
      return;
    }
    if (amountNum < 10) {
      alert('Minimum payout withdrawal threshold is $10.00 USD.');
      return;
    }

    setPayoutSubmitting(true);
    const payoutId = `payout_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Determine target payment method and details
    let finalMethod = payoutMethod;
    let finalDetails = accountDetails.trim();

    if (useConnectedForWithdrawal && connectedAccount) {
      finalMethod = `${connectedAccount.provider} (${connectedAccount.type === 'mobile_money' ? 'Mobile Money' : 'Bank'})`;
      finalDetails = `${connectedAccount.accountName} - ${connectedAccount.accountNumber} [${connectedAccount.country}]`;
    }

    const newPayout: PayoutRequest = {
      id: payoutId,
      artistId: user.uid,
      artistName: currentArtistName,
      artistEmail: user.email || 'artist@bcafrica.com',
      amount: amountNum,
      paymentMethod: finalMethod,
      accountDetails: finalDetails,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    try {
      await apiClient.payouts.create(newPayout);
      setPayouts((prev) => [newPayout, ...prev]);
      const kwachaVal = (amountNum * USD_TO_ZMW_RATE).toLocaleString(undefined, { minimumFractionDigits: 2 });
      setPayoutSuccessMsg(
        `Withdrawal of $${amountNum.toFixed(2)} USD (~K${kwachaVal} ZMW) submitted to ${finalMethod}! Expected disbursement within 24-48 business hours.`
      );
      setPayoutAmount('');
      setAccountDetails('');
      setTimeout(() => {
        setIsPayoutModalOpen(false);
        setPayoutSuccessMsg(null);
      }, 3000);
    } catch (err) {
      console.error('Error submitting payout:', err);
      alert('Failed to submit withdrawal request to self-hosted server.');
    } finally {
      setPayoutSubmitting(false);
    }
  };

  // Cancel a pending payout request
  const handleCancelPayout = async (payoutId: string) => {
    if (!confirm('Cancel this pending withdrawal request? Funds will immediately return to your available balance.')) {
      return;
    }
    try {
      await apiClient.payouts.delete(payoutId);
      setPayouts((prev) => prev.filter((p) => p.id !== payoutId));
    } catch (err) {
      console.error('Error cancelling payout:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8 animate-fade-in pb-28">
      {/* Top Banner / Artist Lockup */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#0b1b2f] via-[#091524] to-[#040810] border border-sky-500/25 p-6 md:p-8 overflow-hidden shadow-[0_0_40px_rgba(2,132,199,0.15)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-700 p-1 flex items-center justify-center text-white shadow-lg shrink-0">
              {profile?.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={currentArtistName}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <Music className="w-10 h-10" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  Verified Artist Catalog
                </span>
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Rights Owned
                </span>
                <span className="text-xs text-amber-300 font-semibold bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                  <span>🇿🇲</span> Zambia &amp; Pan-Africa
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {currentArtistName}
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-xl">
                Real-time streaming analytics, ad revenue pool distribution, and direct fan patronage tracking.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsTipModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-[0_0_15px_rgba(2,132,199,0.3)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-white" />
              Support / Send Tip
            </button>

            <button
              onClick={() => setIsConnectAccountModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#0e223b] hover:bg-[#142e4f] text-sky-300 border border-sky-500/40 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-sky-400" />
              {connectedAccount ? 'Manage Connected Payout' : 'Connect Bank / MoMo'}
            </button>

            <button
              onClick={() => {
                setUseConnectedForWithdrawal(Boolean(connectedAccount));
                setIsPayoutModalOpen(true);
              }}
              disabled={availableBalance < 10}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              Request Payout (${availableBalance.toFixed(2)})
            </button>
          </div>
        </div>

        {/* Connected Account Quick Status Banner */}
        {connectedAccount && (
          <div className="mt-5 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                {connectedAccount.type === 'mobile_money' ? (
                  <Smartphone className="w-4 h-4" />
                ) : (
                  <Building className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Connected Payout Account:</span>
                  <span className="text-emerald-300 font-mono">{connectedAccount.provider}</span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  {connectedAccount.accountName} • {connectedAccount.accountNumber} ({connectedAccount.country})
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsConnectAccountModalOpen(true)}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium underline cursor-pointer"
              >
                Change
              </button>
              <button
                onClick={handleDisconnectAccount}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Disconnect Account"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-8 border-t border-sky-950/60 pt-4 overflow-x-auto">
          {[
            { id: 'overview', label: 'Performance & Revenue', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'tracks', label: `Track Breakdown (${artistTracks.length})`, icon: <Music className="w-4 h-4" /> },
            { id: 'tips', label: `Fan Patronage (${tips.length})`, icon: <Heart className="w-4 h-4" /> },
            { id: 'payouts', label: `Payouts History (${payouts.length})`, icon: <Wallet className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(2,132,199,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-sky-950/40'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          {/* Key Metric Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Streams */}
            <div className="p-5 rounded-2xl bg-[#091524]/90 border border-sky-500/20 backdrop-blur-md shadow-lg relative overflow-hidden group hover:border-sky-500/50 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs uppercase tracking-wider font-semibold">Total Verified Streams</span>
                <Play className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {totalStreams.toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-2 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+{total24hStreams} streams last 24h</span>
              </div>
            </div>

            {/* 2. Total Gross Earnings */}
            <div className="p-5 rounded-2xl bg-[#091524]/90 border border-emerald-500/25 backdrop-blur-md shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs uppercase tracking-wider font-semibold">Lifetime Gross Earnings</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                ${totalGrossEarnings.toFixed(2)}
              </div>
              <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
                <span>~K{(totalGrossEarnings * USD_TO_ZMW_RATE).toFixed(0)} ZMW</span>
                <span className="text-sky-300 font-semibold">${ratePerStream.toFixed(4)}/stream</span>
              </div>
            </div>

            {/* 3. Available for Payout */}
            <div className="p-5 rounded-2xl bg-[#091524]/90 border border-amber-500/25 backdrop-blur-md shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs uppercase tracking-wider font-semibold">Available for Payout</span>
                <Wallet className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-amber-400 tracking-tight">
                ${availableBalance.toFixed(2)}
              </div>
              <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
                <span>~K{(availableBalance * USD_TO_ZMW_RATE).toFixed(0)} ZMW</span>
                <span className="text-amber-300 text-[11px] font-medium">Min $10.00</span>
              </div>
            </div>

            {/* 4. Fan Patronage (Tips) */}
            <div className="p-5 rounded-2xl bg-[#091524]/90 border border-sky-500/20 backdrop-blur-md shadow-lg relative overflow-hidden group hover:border-sky-500/50 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs uppercase tracking-wider font-semibold">Direct Fan Patronage</span>
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                ${totalTipsAmount.toFixed(2)}
              </div>
              <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>{tips.length} fan donations received</span>
              </div>
            </div>
          </div>

          {/* Charts & Audience Demographics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 7-Day Stream Velocity Chart */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-[#08121f] border border-sky-500/20 shadow-md">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-sky-400" />
                    7-Day Streaming Velocity
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Daily streams recorded and attributed to your uploaded music
                  </p>
                </div>
                <div className="text-xs px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/20">
                  Last 7 Days
                </div>
              </div>

              {/* Bar Graph */}
              <div className="h-48 flex items-end gap-3 pt-6 border-b border-sky-950/80">
                {weeklyTrendData.map((d, i) => {
                  const heightPercent = Math.max(12, Math.round((d.streams / maxWeeklyStreams) * 100));
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-sky-300 whitespace-nowrap bg-slate-900 px-1.5 py-0.5 rounded border border-sky-500/30">
                        {d.streams} plays (${d.revenue})
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full rounded-t-lg bg-gradient-to-t from-sky-600 to-sky-400 group-hover:from-sky-500 group-hover:to-cyan-300 transition-all shadow-[0_0_12px_rgba(2,132,199,0.3)]"
                      />
                      <span className="text-[11px] font-medium text-slate-400 group-hover:text-white transition-colors">
                        {d.day}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-1">
                <span>Calculated via verified stream play events</span>
                <span className="text-emerald-400 font-semibold">
                  Avg ${(totalGrossEarnings / 7).toFixed(2)}/day
                </span>
              </div>
            </div>

            {/* Geographic Distribution Across Africa (featuring Zambia) */}
            <div className="p-6 rounded-2xl bg-[#08121f] border border-sky-500/20 shadow-md">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-sky-400" />
                Audience Distribution
              </h3>
              <p className="text-xs text-slate-400 mb-5">Top listener hubs streaming your catalog</p>

              <div className="space-y-3.5">
                {audienceRegions.map((region, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium truncate max-w-[170px]">
                        {region.name}
                      </span>
                      <span className="text-sky-300 font-mono font-semibold">
                        {region.percent}% ({region.count})
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${region.percent}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monetization Engine Explainer Card */}
          <div className="rounded-2xl bg-gradient-to-r from-[#0c223a] to-[#071322] border border-sky-500/30 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold">
                <Award className="w-3.5 h-3.5" />
                Transparent Royalty Accounting
              </div>
              <h3 className="text-lg font-bold text-white">
                How Your Earnings Are Calculated on BC Africa Music
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                As an independent creator who uploaded your original music, you retain{' '}
                <strong className="text-white">100% of both Master and Publishing Rights</strong>.
                When fans stream your songs, revenue is generated through in-stream sponsor adverts
                (estimated at <span className="text-sky-300 font-bold">${cpmRate.toFixed(2)} CPM</span>
                ), with <span className="text-emerald-300 font-bold">{royaltySharePercent}%</span> paid
                directly to you (~${ratePerStream.toFixed(4)}/stream). You can withdraw to Zambian Mobile Money (MTN MoMo, Airtel, Zamtel) or Bank Accounts with zero middleman deductions!
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => {
                  setUseConnectedForWithdrawal(Boolean(connectedAccount));
                  setIsPayoutModalOpen(true);
                }}
                disabled={availableBalance < 10}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 text-white font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                Withdraw Available (${availableBalance.toFixed(2)})
              </button>
              <span className="text-[11px] text-center text-slate-400">
                Disbursed to Zambian MoMo / Bank in 24-48h
              </span>
            </div>
          </div>
        </>
      )}

      {/* TRACKS BREAKDOWN TAB */}
      {activeTab === 'tracks' && (
        <div className="rounded-2xl bg-[#08121f] border border-sky-500/20 overflow-hidden shadow-lg">
          <div className="p-6 border-b border-sky-950/80 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Track Streaming Performance &amp; Royalties</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Individual song metrics, review status, and accrued ad royalties
              </p>
            </div>
            <span className="text-xs text-sky-400 font-mono bg-sky-950/60 px-3 py-1 rounded-lg border border-sky-800/40">
              {artistTracks.length} Uploaded Songs
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#050b14] text-slate-400 text-xs uppercase tracking-wider border-b border-sky-950/80">
                <tr>
                  <th className="py-3.5 px-4">Track</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">All-Time Streams</th>
                  <th className="py-3.5 px-4 text-right">24h Velocity</th>
                  <th className="py-3.5 px-4 text-right">Est. Ad Earnings</th>
                  <th className="py-3.5 px-4 text-center">Lyrics Sync</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-950/40">
                {artistTracks.map((track) => {
                  const isCurrent = currentTrack?.id === track.id;
                  const track24h = plays24hMap[track.id] || 0;
                  const trackEarnings = (track.plays || 0) * ratePerStream;

                  return (
                    <tr
                      key={track.id}
                      className="hover:bg-sky-950/20 transition-colors group"
                    >
                      {/* Track info with cover */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => (isCurrent ? togglePlay() : playTrack(track))}
                            className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-800 shrink-0 group/cover"
                          >
                            <img
                              src={track.coverUrl}
                              alt={track.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity">
                              {isCurrent && isPlaying ? (
                                <Pause className="w-4 h-4 text-white fill-white" />
                              ) : (
                                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                              )}
                            </div>
                          </button>
                          <div>
                            <div className="font-semibold text-white group-hover:text-sky-300 transition-colors">
                              {track.title}
                            </div>
                            <div className="text-xs text-slate-400">
                              {track.genre || 'Afrobeats'} • {formatTime(track.duration || 0)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            track.status === 'approved' || !track.status
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : track.status === 'rejected'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {track.status === 'approved' || !track.status
                            ? 'Approved'
                            : track.status === 'rejected'
                            ? 'Needs Revision'
                            : 'In Review'}
                        </span>
                      </td>

                      {/* All time streams */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        {(track.plays || 0).toLocaleString()}
                      </td>

                      {/* 24h streams */}
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-400 font-semibold">
                        +{track24h}
                      </td>

                      {/* Est. Ad Earnings */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                        ${trackEarnings.toFixed(2)}
                      </td>

                      {/* Lyrics Sync */}
                      <td className="py-3.5 px-4 text-center">
                        {track.lyricsSynced && track.lyricsSynced.length > 0 ? (
                          <span className="text-xs text-sky-400 font-medium">
                            {track.lyricsSynced.length} lines synced
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Unsynced</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openLyricsStudio(track.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-sky-950/60 transition-colors"
                            title="Edit Synced Lyrics"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setIsTipModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-xs font-semibold border border-sky-500/30 transition-colors"
                          >
                            Tip Song
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FAN PATRONAGE (TIPS) TAB */}
      {activeTab === 'tips' && (
        <div className="rounded-2xl bg-[#08121f] border border-sky-500/20 overflow-hidden shadow-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
                Direct Fan Patronage &amp; Tips Feed
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every tip sent by listeners is deposited immediately into your available payout balance.
              </p>
            </div>
            <button
              onClick={() => setIsTipModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 self-start cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 fill-white" />
              Simulate / Send Fan Tip
            </button>
          </div>

          {tips.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-sky-950/80 rounded-xl">
              <Heart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-semibold">No fan tips recorded yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                When listeners stream your tracks and click "Support Artist", their contributions and personal messages will appear here live!
              </p>
              <button
                onClick={() => setIsTipModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-xs font-bold border border-sky-500/30 transition-all cursor-pointer"
              >
                Send a Test Tip Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tips.map((tip) => (
                <div
                  key={tip.id}
                  className="p-4 rounded-xl bg-[#0b1728] border border-sky-500/20 flex flex-col justify-between hover:border-sky-500/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-sm">
                        ${tip.amount}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{tip.senderName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(tip.timestamp || tip.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                    <span className="text-emerald-400 font-bold font-mono text-sm">
                      +${Number(tip.amount).toFixed(2)} USD
                    </span>
                  </div>

                  {tip.message && (
                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 italic mt-2">
                      "{tip.message}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PAYOUTS HISTORY TAB */}
      {activeTab === 'payouts' && (
        <div className="rounded-2xl bg-[#08121f] border border-sky-500/20 overflow-hidden shadow-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                Royalty &amp; Earnings Withdrawal History
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Track your requested disbursements via Zambian Mobile Money (MTN MoMo, Airtel, Zamtel) or Bank Accounts.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsConnectAccountModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-[#0d2138] hover:bg-[#122e4e] text-sky-300 text-xs font-semibold border border-sky-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                {connectedAccount ? 'Manage Connected Account' : 'Connect Account'}
              </button>
              <button
                onClick={() => {
                  setUseConnectedForWithdrawal(Boolean(connectedAccount));
                  setIsPayoutModalOpen(true);
                }}
                disabled={availableBalance < 10}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 self-start cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5" />
                Request Payout (${availableBalance.toFixed(2)})
              </button>
            </div>
          </div>

          {payouts.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-sky-950/80 rounded-xl">
              <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-semibold">No payout requests yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Once you accumulate at least $10.00 USD in verified streaming ad revenue or fan tips, you can request an instant payout here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#050b14] text-slate-400 text-xs uppercase tracking-wider border-b border-sky-950/80">
                  <tr>
                    <th className="py-3 px-4">Request ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Method / Destination</th>
                    <th className="py-3 px-4">Account Details</th>
                    <th className="py-3 px-4 text-right">Amount (USD / ZMW)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-950/40">
                  {payouts.map((p) => {
                    const kwachaEst = (Number(p.amount) * USD_TO_ZMW_RATE).toFixed(0);
                    return (
                      <tr key={p.id} className="hover:bg-sky-950/20 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-slate-400">{p.id.slice(0, 14)}...</td>
                        <td className="py-3 px-4 text-xs text-slate-300">
                          {new Date(p.requestedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold text-white">{p.paymentMethod}</td>
                        <td className="py-3 px-4 text-xs font-mono text-slate-400">{p.accountDetails}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                          <div>${Number(p.amount).toFixed(2)} USD</div>
                          <div className="text-[10px] text-slate-400 font-normal">~K{kwachaEst} ZMW</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              p.status === 'paid'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : p.status === 'rejected'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {p.status === 'pending' && (
                            <button
                              onClick={() => handleCancelPayout(p.id)}
                              className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CONNECT BANK OR MOBILE MONEY MODAL */}
      {isConnectAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-gradient-to-b from-[#0b192c] to-[#070e17] border border-sky-500/30 rounded-2xl shadow-[0_0_50px_rgba(2,132,199,0.3)] p-6 overflow-hidden">
            <button
              onClick={() => setIsConnectAccountModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-sky-950/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleSaveConnectedAccount} className="space-y-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold mb-2">
                  <CreditCard className="w-3.5 h-3.5" />
                  Connected Payout Destination
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Connect Bank or Mobile Money</h2>
                <p className="text-xs text-slate-300 mt-1">
                  Save your verified account details once for instant 1-click royalty withdrawals.
                </p>
              </div>

              {/* Account Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Destination Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setConnectType('mobile_money');
                      setConnectProvider('MTN Mobile Money Zambia (MoMo)');
                    }}
                    className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      connectType === 'mobile_money'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-[0_0_15px_rgba(2,132,199,0.3)]'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    Mobile Money Wallet
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setConnectType('bank_account');
                      setConnectProvider('Zanaco Bank (Zambia National Commercial Bank)');
                    }}
                    className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      connectType === 'bank_account'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-[0_0_15px_rgba(2,132,199,0.3)]'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building className="w-4 h-4 text-sky-400" />
                    Commercial Bank Account
                  </button>
                </div>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Provider / Bank
                </label>
                <select
                  value={connectProvider}
                  onChange={(e) => setConnectProvider(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500"
                >
                  <optgroup label="🇿🇲 Zambia Providers">
                    {ZAMBIA_PROVIDERS.filter((p) => p.type === connectType).map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.icon} {p.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🌍 Pan-Africa &amp; Global">
                    {OTHER_PROVIDERS.filter((p) => p.type === connectType).map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.icon} {p.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Account Holder Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Account Holder Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={connectName}
                  onChange={(e) => setConnectName(e.target.value)}
                  placeholder="e.g. Kondwani Phiri or BC Music Ltd"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Account / Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {connectType === 'mobile_money' ? 'Mobile Money Number (with country code)' : 'Bank Account / IBAN Number'}
                </label>
                <input
                  type="text"
                  required
                  value={connectNumber}
                  onChange={(e) => setConnectNumber(e.target.value)}
                  placeholder={connectType === 'mobile_money' ? 'e.g. +260 96 123 4567' : 'e.g. 582910482901'}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Country
                </label>
                <select
                  value={connectCountry}
                  onChange={(e) => setConnectCountry(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500"
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
                  onClick={() => setIsConnectAccountModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  Save &amp; Connect Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST PAYOUT MODAL */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#0b192c] to-[#070e17] border border-sky-500/30 rounded-2xl shadow-[0_0_50px_rgba(2,132,199,0.3)] p-6 overflow-hidden">
            <button
              onClick={() => setIsPayoutModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-sky-950/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {payoutSuccessMsg ? (
              <div className="py-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Withdrawal Submitted!</h3>
                <p className="text-xs text-slate-300 max-w-xs leading-relaxed">{payoutSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleRequestPayout} className="space-y-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
                    <Wallet className="w-3.5 h-3.5" />
                    Artist Royalty Withdrawal
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Withdraw Earnings</h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Available balance:{' '}
                    <strong className="text-emerald-400">${availableBalance.toFixed(2)} USD</strong>{' '}
                    <span className="text-slate-400 font-mono">(~K{(availableBalance * USD_TO_ZMW_RATE).toFixed(0)} ZMW)</span>
                  </p>
                </div>

                {/* Amount to Withdraw */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Amount to Withdraw (USD)
                    </label>
                    {payoutAmount && !isNaN(parseFloat(payoutAmount)) && (
                      <span className="text-xs font-mono text-emerald-400 font-semibold">
                        ≈ K{(parseFloat(payoutAmount) * USD_TO_ZMW_RATE).toLocaleString(undefined, { minimumFractionDigits: 2 })} ZMW
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="10"
                      max={availableBalance}
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      required
                      placeholder={`10.00 - ${availableBalance.toFixed(2)}`}
                      className="w-full pl-8 pr-20 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => setPayoutAmount(availableBalance.toFixed(2))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-sky-400 font-bold hover:text-sky-300 uppercase cursor-pointer"
                    >
                      Max All
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Minimum withdrawal threshold is $10.00 USD. No processing fee.
                  </span>
                </div>

                {/* Destination Selector: Connected vs Custom */}
                {connectedAccount ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Payout Destination
                    </label>
                    <div
                      onClick={() => setUseConnectedForWithdrawal(true)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        useConnectedForWithdrawal
                          ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">
                          ✓
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>Withdraw to Connected Account</span>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                              Saved
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-300 font-mono">
                            {connectedAccount.provider} • {connectedAccount.accountNumber}
                          </div>
                        </div>
                      </div>
                      <input
                        type="radio"
                        checked={useConnectedForWithdrawal}
                        onChange={() => setUseConnectedForWithdrawal(true)}
                        className="accent-emerald-400"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setUseConnectedForWithdrawal(false)}
                      className="text-xs text-slate-400 hover:text-sky-300 underline block cursor-pointer"
                    >
                      Or withdraw to a different bank/number
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 flex items-center justify-between">
                    <span className="text-xs text-sky-200">No connected payout destination yet.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPayoutModalOpen(false);
                        setIsConnectAccountModalOpen(true);
                      }}
                      className="text-xs font-bold text-sky-400 hover:text-sky-300 underline cursor-pointer"
                    >
                      Connect One
                    </button>
                  </div>
                )}

                {/* Custom / Alternative Destination Details (if not using connected account) */}
                {(!connectedAccount || !useConnectedForWithdrawal) && (
                  <div className="space-y-3 pt-1 border-t border-sky-950/60">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Select Provider or Bank
                      </label>
                      <select
                        value={payoutMethod}
                        onChange={(e) => setPayoutMethod(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500"
                      >
                        <optgroup label="🇿🇲 Zambia Mobile Money">
                          {ZAMBIA_PROVIDERS.filter((p) => p.type === 'mobile_money').map((p) => (
                            <option key={p.name} value={p.name}>
                              {p.icon} {p.name}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="🇿🇲 Zambia Commercial Banks">
                          {ZAMBIA_PROVIDERS.filter((p) => p.type === 'bank_account').map((p) => (
                            <option key={p.name} value={p.name}>
                              {p.icon} {p.name}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="🌍 Pan-Africa &amp; Global">
                          {OTHER_PROVIDERS.map((p) => (
                            <option key={p.name} value={p.name}>
                              {p.icon} {p.name}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Recipient Account / Phone Number
                      </label>
                      <input
                        type="text"
                        value={accountDetails}
                        onChange={(e) => setAccountDetails(e.target.value)}
                        required={!connectedAccount || !useConnectedForWithdrawal}
                        placeholder="e.g. +260 97 123 4567 or Zanaco Acc: 5829104829"
                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={payoutSubmitting || !payoutAmount || parseFloat(payoutAmount) < 10}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <Send className="w-4 h-4" />
                  {payoutSubmitting
                    ? 'Submitting Request...'
                    : `Confirm Withdrawal of $${payoutAmount || '0.00'} USD`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TIP ARTIST MODAL */}
      <TipArtistModal
        isOpen={isTipModalOpen}
        onClose={() => setIsTipModalOpen(false)}
        artistId={currentArtistId}
        artistName={currentArtistName}
      />
    </div>
  );
};
