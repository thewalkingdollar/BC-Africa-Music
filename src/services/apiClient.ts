import {
  UserProfile,
  UserRole,
  Track,
  PlatformSettings,
  ArtistTip,
  PayoutRequest,
} from '../types/music';

const TOKEN_KEY = 'bc_africa_auth_token';
const USER_CACHE_KEY = 'bc_africa_cached_user';

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_CACHE_KEY);
      }
    }
  }

  public getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errMsg = `Request failed: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error) errMsg = errorData.error;
      } catch {
        // ignore parse error
      }
      throw new Error(errMsg);
    }

    return response.json() as Promise<T>;
  }

  // AUTH METHODS
  public auth = {
    register: async (data: {
      email: string;
      password: string;
      displayName: string;
      role?: UserRole;
      stageName?: string;
      country?: string;
    }): Promise<AuthResponse> => {
      const res = await this.request<AuthResponse>('/bcafricamusic/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      this.setToken(res.token);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(res.user));
      return res;
    },

    login: async (email: string, pass: string): Promise<AuthResponse> => {
      const res = await this.request<AuthResponse>('/bcafricamusic/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });
      this.setToken(res.token);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(res.user));
      return res;
    },

    me: async (): Promise<UserProfile | null> => {
      const token = this.getToken();
      if (!token) return null;
      try {
        const res = await this.request<{ user: UserProfile }>('/bcafricamusic/api/auth/me');
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(res.user));
        return res.user;
      } catch {
        // Fallback to cached profile if server temporarily unreachable
        const cached = localStorage.getItem(USER_CACHE_KEY);
        return cached ? JSON.parse(cached) : null;
      }
    },

    updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
      const res = await this.request<{ user: UserProfile }>('/bcafricamusic/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(res.user));
      return res.user;
    },

    getAllUsers: async (): Promise<UserProfile[]> => {
      try {
        return await this.request<UserProfile[]>('/bcafricamusic/api/auth/users');
      } catch {
        const cached = localStorage.getItem(USER_CACHE_KEY);
        return cached ? [JSON.parse(cached)] : [];
      }
    },

    updateUserRole: async (uid: string, role: UserRole, stageName?: string): Promise<UserProfile> => {
      const res = await this.request<{ success: boolean; user: UserProfile }>(
        `/api/auth/users/${uid}/role`,
        {
          method: 'PUT',
          body: JSON.stringify({ role, artistStageName: stageName }),
        }
      );
      return res.user;
    },

    logout: () => {
      this.setToken(null);
    },
  };

  // TRACKS METHODS
  public tracks = {
    getAll: async (): Promise<Track[]> => {
      try {
        return await this.request<Track[]>('/bcafricamusic/api/tracks');
      } catch (err) {
        console.warn('Failed to fetch tracks from self-hosted server:', err);
        return [];
      }
    },

    create: async (track: Partial<Track>): Promise<Track> => {
      return await this.request<Track>('/bcafricamusic/api/tracks', {
        method: 'POST',
        body: JSON.stringify(track),
      });
    },

    update: async (id: string, updates: Partial<Track>): Promise<Track> => {
      return await this.request<Track>(`/api/tracks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    delete: async (id: string): Promise<void> => {
      await this.request<{ success: boolean }>(`/api/tracks/${id}`, {
        method: 'DELETE',
      });
    },
  };

  // PLAYS & TRENDING
  public plays = {
    record: async (payload: {
      trackId: string;
      trackTitle?: string;
      artist?: string;
      userId?: string;
      artistId?: string;
    }): Promise<void> => {
      try {
        await this.request('/bcafricamusic/api/plays', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn('Failed to record stream play:', err);
      }
    },

    getRecent24h: async (): Promise<Record<string, number>> => {
      try {
        return await this.request<Record<string, number>>('/bcafricamusic/api/plays/recent');
      } catch {
        return {};
      }
    },
  };

  // TIPS & PATRONAGE
  public tips = {
    getAll: async (artistId?: string): Promise<ArtistTip[]> => {
      const qs = artistId ? `?artistId=${encodeURIComponent(artistId)}` : '';
      try {
        return await this.request<ArtistTip[]>(`/api/tips${qs}`);
      } catch {
        return [];
      }
    },

    create: async (tip: Partial<ArtistTip>): Promise<ArtistTip> => {
      const res = await this.request<{ success: boolean; tip: ArtistTip }>('/bcafricamusic/api/tips', {
        method: 'POST',
        body: JSON.stringify(tip),
      });
      return res.tip;
    },
  };

  // PAYOUTS
  public payouts = {
    getAll: async (artistId?: string): Promise<PayoutRequest[]> => {
      const qs = artistId ? `?artistId=${encodeURIComponent(artistId)}` : '';
      try {
        return await this.request<PayoutRequest[]>(`/api/payouts${qs}`);
      } catch {
        return [];
      }
    },

    create: async (payout: Partial<PayoutRequest>): Promise<PayoutRequest> => {
      const res = await this.request<{ success: boolean; payout: PayoutRequest }>('/bcafricamusic/api/payouts', {
        method: 'POST',
        body: JSON.stringify(payout),
      });
      return res.payout;
    },

    update: async (
      id: string,
      updates: { status?: string; adminNotes?: string }
    ): Promise<PayoutRequest> => {
      const res = await this.request<{ success: boolean; payout: PayoutRequest }>(
        `/api/payouts/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(updates),
        }
      );
      return res.payout;
    },

    delete: async (id: string): Promise<void> => {
      await this.request<{ success: boolean }>(`/api/payouts/${id}`, {
        method: 'DELETE',
      });
    },
  };

  // PLATFORM SETTINGS
  public settings = {
    get: async (): Promise<PlatformSettings> => {
      return await this.request<PlatformSettings>('/bcafricamusic/api/settings');
    },

    update: async (settings: Partial<PlatformSettings>): Promise<PlatformSettings> => {
      return await this.request<PlatformSettings>('/bcafricamusic/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    },
  };

  // DIRECT FILE UPLOAD TO UBUNTU SERVER STORAGE
  public upload = async (
    filename: string,
    fileData: string,
    mimeType?: string
  ): Promise<{ url: string; filename: string }> => {
    return await this.request<{ url: string; filename: string }>('/bcafricamusic/api/upload', {
      method: 'POST',
      body: JSON.stringify({ filename, fileData, mimeType }),
    });
  };
}

export const apiClient = new ApiClient();
