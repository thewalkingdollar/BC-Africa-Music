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
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl?: string;
  trackIds: string[];
  createdAt: string;
}

export type ViewMode = 'discover' | 'library' | 'my-uploads' | 'favorites' | 'lyrics-studio';
