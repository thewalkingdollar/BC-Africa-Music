export interface LyricLine {
  id: string;
  time: number; // In seconds
  text: string;
}

export type TrackStatus = 'pending_review' | 'approved' | 'rejected';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number; // in seconds
  audioUrl: string;
  coverUrl: string;
  lyricsRaw?: string;
  lyricsSynced: LyricLine[];
  isCustomUpload: boolean;
  uploadedAt: string;
  plays: number;
  isFavorite?: boolean;
  audioBlobKey?: string;
  fileSize?: number;
  ownerId?: string;
  ownerEmail?: string;
  ownerName?: string;
  country?: string;
  // Quality & Editorial Review workflow
  status?: TrackStatus;
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl?: string;
  trackIds: string[];
  createdAt: string;
}

export type UserRole = 'listener' | 'creator' | 'editor' | 'reviewer' | 'admin' | 'super_admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  bio?: string;
  artistStageName?: string;
  country?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TrendingTrack {
  track: Track;
  plays24h: number;
  rank: number;
}

export interface ArtistProfile {
  id: string; // artist user UID
  displayName: string;
  artistStageName: string;
  bio: string;
  country: string;
  photoURL?: string;
  isVerified?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type PlatformThemeId =
  | 'bc-blue'
  | 'midnight-neon'
  | 'sahara-gold'
  | 'lagos-emerald'
  | 'crimson-rhythm'
  | 'amapiano-violet';

export type GlowLevel = 'subtle' | 'balanced' | 'vibrant';

export interface PlatformSettings {
  theme: PlatformThemeId;
  customAccent?: string;
  glowLevel: GlowLevel;
  advertsEnabled: boolean;
  adFrequencyTracks: number;
  adTitle: string;
  sponsorName: string;
  adDescription: string;
  adBannerUrl: string;
  adAudioUrl?: string;
  adCtaText: string;
  adLinkUrl: string;
  skipAfterSeconds: number;
  totalAdImpressions?: number;
  artistRoyaltySharePercent?: number; // e.g. 70 (%)
  estimatedCpmRate?: number; // e.g. 4.50 ($)
  announcementEnabled?: boolean;
  announcementText?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ArtistTip {
  id: string;
  artistId: string;
  trackId?: string;
  amount: number;
  currency: string;
  senderName: string;
  senderEmail?: string;
  message?: string;
  createdAt: string;
  timestamp: number;
}

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'rejected';

export interface PayoutRequest {
  id: string;
  artistId: string;
  artistName: string;
  artistEmail: string;
  amount: number;
  paymentMethod: string;
  accountDetails: string;
  status: PayoutStatus;
  requestedAt: string;
  processedAt?: string;
  adminNotes?: string;
}

export type ViewMode =
  | 'discover'
  | 'library'
  | 'my-uploads'
  | 'favorites'
  | 'lyrics-studio'
  | 'artist-profile'
  | 'super-panel'
  | 'review-queue'
  | 'artist-analytics';
