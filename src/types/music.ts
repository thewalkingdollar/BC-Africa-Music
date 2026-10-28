export interface LyricLine {
  id: string;
  time: number; // In seconds
  text: string;
}

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
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl?: string;
  trackIds: string[];
  createdAt: string;
}

export type UserRole = 'listener' | 'creator' | 'admin';

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

export type ViewMode = 'discover' | 'library' | 'my-uploads' | 'favorites' | 'lyrics-studio' | 'artist-profile';


