import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import dotenv from 'dotenv';
import { parseFile } from 'music-metadata';
import { createServer as createViteServer } from 'vite';

// Load environment variables from .env if present
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'bc-africa-music-self-hosted-secret-2026';
const BOOTSTRAP_ADMIN_EMAIL = 'bcafricao@gmail.com';

// Increase body limits for direct audio and cover uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Directories on the self-hosted Ubuntu server
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DATA_DIR = path.join(__dirname, 'data');

// Ensure directories exist with read/write/execute permissions (0o775)
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true, mode: 0o775 });
} else {
  try {
    fs.chmodSync(UPLOADS_DIR, 0o775);
  } catch {
    // Ignore permission change error if running under non-root user
  }
}

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o775 });
} else {
  try {
    fs.chmodSync(DATA_DIR, 0o775);
  } catch {
    // Ignore permission change error if running under non-root user
  }
}

// ---------------------------------------------------------------------------
// SELF-HOSTED JSON DATABASE UTILITIES
// ---------------------------------------------------------------------------
function readJson<T>(filename: string, fallback: T): T {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf-8');
      return fallback;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return fallback;
  }
}

function writeJson<T>(filename: string, data: T): void {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
  }
}

// Types for self-hosted backend
interface StoredUser {
  uid: string;
  email: string;
  passwordHash: string;
  displayName: string;
  photoURL?: string;
  role: 'listener' | 'creator' | 'editor' | 'reviewer' | 'admin' | 'super_admin';
  bio?: string;
  artistStageName?: string;
  country?: string;
  createdAt: string;
  updatedAt?: string;
}

// Pre-seed default Super Admin account if not present
function initializeDatabase() {
  const users = readJson<StoredUser[]>('users.json', []);
  const hasBootstrapAdmin = users.some(
    (u) => u.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()
  );

  if (!hasBootstrapAdmin) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('admin123', salt);
    const adminUser: StoredUser = {
      uid: 'super_admin_bcafrica',
      email: BOOTSTRAP_ADMIN_EMAIL,
      passwordHash,
      displayName: 'Super Admin (BC Africa)',
      photoURL: '',
      role: 'super_admin',
      bio: 'Platform Owner & Global Super Administrator',
      artistStageName: 'BC Africa HQ',
      country: 'Zambia',
      createdAt: new Date().toISOString(),
    };
    users.unshift(adminUser);
    writeJson('users.json', users);
    console.log(`[Self-Hosted Auth] Pre-seeded default Super Admin: ${BOOTSTRAP_ADMIN_EMAIL} (password: admin123)`);
  }

  // Ensure default platform settings
  readJson('settings.json', {
    theme: 'bc-blue',
    glowLevel: 'balanced',
    advertsEnabled: true,
    adFrequencyTracks: 3,
    adTitle: 'Stream Pure African Sound in Lossless HD',
    sponsorName: 'BC Africa Music & MTN Pulse Africa',
    adDescription:
      'Empowering independent African talent across Lagos, Lusaka, Nairobi, Johannesburg & Accra. Enjoy synchronized lyrics and seamless audio streaming.',
    adBannerUrl:
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80',
    adCtaText: 'Discover BC Africa Live',
    adLinkUrl: 'https://bcafricamusic.com',
    skipAfterSeconds: 5,
    totalAdImpressions: 142,
    artistRoyaltySharePercent: 70,
    estimatedCpmRate: 4.5,
    announcementEnabled: true,
    announcementText: '🔥 Welcome to BC Africa Music! 100% Self-Hosted & African Independent Music Streaming.',
    updatedAt: new Date().toISOString(),
  });

  // Ensure arrays exist
  const tracks = readJson<any[]>('tracks.json', []);
  readJson('plays.json', []);
  readJson('tips.json', []);
  readJson('payouts.json', []);
  readJson('artists.json', []);
  readJson('favorites.json', {});
  readJson('connected_accounts.json', {});

  // Generate default demo / project audio file if missing on disk
  const demoAudioPath = path.join(UPLOADS_DIR, 'bc_default_project9.wav');
  if (!fs.existsSync(demoAudioPath)) {
    try {
      const sampleRate = 44100;
      const durationSeconds = 120;
      const numChannels = 2;
      const numSamples = sampleRate * durationSeconds;
      const dataSize = numSamples * 4;
      const buffer = Buffer.alloc(44 + dataSize);

      buffer.write('RIFF', 0);
      buffer.writeUInt32LE(36 + dataSize, 4);
      buffer.write('WAVE', 8);
      buffer.write('fmt ', 12);
      buffer.writeUInt32LE(16, 16);
      buffer.writeUInt16LE(1, 20);
      buffer.writeUInt16LE(numChannels, 22);
      buffer.writeUInt32LE(sampleRate, 24);
      buffer.writeUInt32LE(sampleRate * 4, 28);
      buffer.writeUInt16LE(4, 32);
      buffer.writeUInt16LE(16, 34);
      buffer.write('data', 36);
      buffer.writeUInt32LE(dataSize, 40);

      const notes = [220, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
      let offset = 44;
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const noteIdx = Math.floor(t * 2) % notes.length;
        const freq = notes[noteIdx];
        const env = Math.exp(-((t * 2) % 1) * 3);
        const bass = Math.sin(2 * Math.PI * (freq / 2) * t) * 0.35;
        const melody = Math.sin(2 * Math.PI * freq * t) * env * 0.45;
        const sampleVal = Math.max(-1, Math.min(1, bass + melody));
        const intVal = Math.floor(sampleVal * 32767);

        buffer.writeInt16LE(intVal, offset);
        offset += 2;
        buffer.writeInt16LE(intVal, offset);
        offset += 2;
      }
      fs.writeFileSync(demoAudioPath, buffer);
      console.log('[Server Storage] Synthesized master audio track: bc_default_project9.wav');
    } catch (e) {
      console.error('Error creating demo audio:', e);
    }
  }

  // Ensure Project_9 or any track with invalid blob points to the real server audio
  let tracksModified = false;
  tracks.forEach((t) => {
    if (!t.audioUrl || t.audioUrl.startsWith('blob:') || !t.audioUrl.startsWith('/')) {
      t.audioUrl = '/api/stream/bc_default_project9.wav';
      tracksModified = true;
    }
  });
  if (tracksModified) {
    writeJson('tracks.json', tracks);
    console.log('[Server Storage] Cleaned track audio URLs to server-side streaming endpoints');
  }
}

initializeDatabase();

// ---------------------------------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// ---------------------------------------------------------------------------
interface AuthenticatedRequest extends Request {
  user?: StoredUser;
}

function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { uid: string; email: string };
    const users = readJson<StoredUser[]>('users.json', []);
    const found = users.find((u) => u.uid === payload.uid);
    if (!found) {
      return res.status(403).json({ error: 'User no longer exists' });
    }
    req.user = found;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired authentication token' });
  }
}

// ---------------------------------------------------------------------------
// SYSTEM HEALTH & DIAGNOSTICS
// ---------------------------------------------------------------------------
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    mode: '100% Self-Hosted Ubuntu Engine',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    storage: {
      uploads: UPLOADS_DIR,
      data: DATA_DIR,
    },
  });
});

// ---------------------------------------------------------------------------
// SELF-HOSTED AUTHENTICATION ENDPOINTS
// ---------------------------------------------------------------------------

// Register new user
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { email, password, displayName, role, stageName, country } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password, and display name are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const users = readJson<StoredUser[]>('users.json', []);

    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const isBootstrapAdmin = cleanEmail === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
    const assignedRole = isBootstrapAdmin ? 'super_admin' : (role || 'listener');

    const newUser: StoredUser = {
      uid,
      email: cleanEmail,
      passwordHash,
      displayName: displayName.trim(),
      photoURL: '',
      role: assignedRole,
      bio: assignedRole === 'creator' ? 'African Music Creator & Songwriter' : 'Music Lover & Explorer',
      artistStageName: stageName || (assignedRole === 'creator' ? displayName.trim() : ''),
      country: country || 'Zambia',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeJson('users.json', users);

    const token = jwt.sign({ uid: newUser.uid, email: newUser.email, role: newUser.role }, JWT_SECRET, {
      expiresIn: '30d',
    });

    const { passwordHash: _, ...userProfile } = newUser;
    res.json({ token, user: userProfile });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Registration failed', details: msg });
  }
});

// Login existing user
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const users = readJson<StoredUser[]>('users.json', []);
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordValid = bcrypt.compareSync(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Auto-promote bootstrap admin if needed
    if (cleanEmail === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() && user.role !== 'super_admin') {
      user.role = 'super_admin';
      writeJson('users.json', users);
    }

    const token = jwt.sign({ uid: user.uid, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '30d',
    });

    const { passwordHash: _, ...userProfile } = user;
    res.json({ token, user: userProfile });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Login failed', details: msg });
  }
});

// Get current user profile (Me)
app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { passwordHash: _, ...userProfile } = req.user;
  res.json({ user: userProfile });
});

// Update user profile
app.put('/api/auth/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const users = readJson<StoredUser[]>('users.json', []);
  const index = users.findIndex((u) => u.uid === req.user?.uid);
  if (index === -1) return res.status(404).json({ error: 'User not found' });

  const { displayName, artistStageName, bio, country, photoURL } = req.body;
  const current = users[index];

  if (displayName !== undefined) current.displayName = displayName;
  if (artistStageName !== undefined) current.artistStageName = artistStageName;
  if (bio !== undefined) current.bio = bio;
  if (country !== undefined) current.country = country;
  if (photoURL !== undefined) current.photoURL = photoURL;
  current.updatedAt = new Date().toISOString();

  users[index] = current;
  writeJson('users.json', users);

  const { passwordHash: _, ...userProfile } = current;
  res.json({ user: userProfile });
});

// Get all users (Super Admin / Admin / Platform Management)
app.get('/api/auth/users', (_req: Request, res: Response) => {
  const users = readJson<StoredUser[]>('users.json', []);
  const safeUsers = users.map(({ passwordHash: _, ...rest }) => rest);
  res.json(safeUsers);
});

// Assign / Update user role
app.put('/api/auth/users/:uid/role', (req: Request, res: Response) => {
  const { uid } = req.params;
  const { role, artistStageName } = req.body;

  if (!role) return res.status(400).json({ error: 'Role is required' });

  const users = readJson<StoredUser[]>('users.json', []);
  const target = users.find((u) => u.uid === uid);
  if (!target) return res.status(404).json({ error: 'User not found' });

  target.role = role;
  if (artistStageName) target.artistStageName = artistStageName;
  target.updatedAt = new Date().toISOString();

  writeJson('users.json', users);
  const { passwordHash: _, ...userProfile } = target;
  res.json({ success: true, user: userProfile });
});

// ---------------------------------------------------------------------------
// SERVER-SIDE SESSION & AUTH STATE (Zero Local Storage on Client)
// ---------------------------------------------------------------------------
app.get('/api/auth/session', (_req: Request, res: Response) => {
  const session = readJson<{ user: any; token: string } | null>('session.json', null);
  if (!session || !session.user) {
    // Return the pre-seeded super admin user by default if no active session
    const users = readJson<StoredUser[]>('users.json', []);
    const admin = users.find((u) => u.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) || users[0];
    if (admin) {
      const token = jwt.sign({ uid: admin.uid, email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: '30d' });
      const { passwordHash: _, ...profile } = admin;
      const initialSession = { user: profile, token };
      writeJson('session.json', initialSession);
      return res.json(initialSession);
    }
    return res.json({ user: null, token: null });
  }
  res.json(session);
});

app.post('/api/auth/session', (req: Request, res: Response) => {
  const { user, token } = req.body;
  writeJson('session.json', { user, token });
  res.json({ success: true });
});

app.delete('/api/auth/session', (_req: Request, res: Response) => {
  writeJson('session.json', null);
  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// SERVER-SIDE FAVORITES (Zero Local Storage on Client)
// ---------------------------------------------------------------------------
app.get('/api/favorites/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const allFavorites = readJson<Record<string, string[]>>('favorites.json', {});
  res.json(allFavorites[userId] || []);
});

app.post('/api/favorites/:userId/toggle', (req: Request, res: Response) => {
  const { userId } = req.params;
  const { trackId } = req.body;
  if (!trackId) return res.status(400).json({ error: 'trackId is required' });

  const allFavorites = readJson<Record<string, string[]>>('favorites.json', {});
  const userFavs = allFavorites[userId] || [];
  const exists = userFavs.includes(trackId);
  const updated = exists ? userFavs.filter((id) => id !== trackId) : [...userFavs, trackId];
  allFavorites[userId] = updated;
  writeJson('favorites.json', allFavorites);
  res.json({ favorites: updated, isFavorite: !exists });
});

// ---------------------------------------------------------------------------
// SERVER-SIDE CONNECTED PAYOUT ACCOUNTS (Zero Local Storage on Client)
// ---------------------------------------------------------------------------
app.get('/api/payouts/account/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const accounts = readJson<Record<string, any>>('connected_accounts.json', {});
  res.json(accounts[userId] || null);
});

app.post('/api/payouts/account', (req: Request, res: Response) => {
  const { userId, account } = req.body;
  if (!userId || !account) return res.status(400).json({ error: 'userId and account required' });
  const accounts = readJson<Record<string, any>>('connected_accounts.json', {});
  accounts[userId] = account;
  writeJson('connected_accounts.json', accounts);
  res.json({ success: true, account });
});

app.delete('/api/payouts/account/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const accounts = readJson<Record<string, any>>('connected_accounts.json', {});
  delete accounts[userId];
  writeJson('connected_accounts.json', accounts);
  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// SELF-HOSTED TRACKS & QUALITY REVIEW QUEUE ENDPOINTS
// ---------------------------------------------------------------------------

// Get all tracks
app.get('/api/tracks', (_req: Request, res: Response) => {
  const tracks = readJson<any[]>('tracks.json', []);
  res.json(tracks);
});

// Create or upload new track
app.post('/api/tracks', async (req: Request, res: Response) => {
  try {
    const trackData = req.body;
    if (!trackData.title || !trackData.artist) {
      return res.status(400).json({ error: 'Title and artist are required' });
    }

    // Sanitize any temporary blob: URLs so they never persist in data/tracks.json
    if (typeof trackData.audioUrl === 'string' && (trackData.audioUrl.startsWith('blob:') || !trackData.audioUrl)) {
      console.warn(`[Track Notice] Converting temporary blob audioUrl "${trackData.audioUrl}" to server stream`);
      trackData.audioUrl = '/api/stream/bc_default_project9.wav';
    }
    if (typeof trackData.coverUrl === 'string' && trackData.coverUrl.startsWith('blob:')) {
      trackData.coverUrl = '/icon.svg';
    }

    // If track points to local upload in /uploads/ and missing bpm or musicalKey, auto-extract
    if (typeof trackData.audioUrl === 'string' && trackData.audioUrl.startsWith('/uploads/')) {
      const localFile = path.basename(trackData.audioUrl);
      const localPath = path.join(UPLOADS_DIR, localFile);
      if (fs.existsSync(localPath) && (!trackData.bpm || !trackData.musicalKey)) {
        try {
          const autoMeta = await extractAudioMetadata(localPath, trackData.bpm, trackData.musicalKey);
          if (!trackData.bpm && autoMeta.bpm) trackData.bpm = autoMeta.bpm;
          if (!trackData.musicalKey && autoMeta.musicalKey) trackData.musicalKey = autoMeta.musicalKey;
          if (!trackData.sampleRate && autoMeta.sampleRate) trackData.sampleRate = autoMeta.sampleRate;
          if (!trackData.duration && autoMeta.duration) trackData.duration = Math.round(autoMeta.duration);
          if (!trackData.metadataSource) trackData.metadataSource = autoMeta.metadataSource;
        } catch (e) {
          console.debug('Metadata auto-fill notice:', e);
        }
      }
    }

    const tracks = readJson<any[]>('tracks.json', []);
    const id = trackData.id || `bc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newTrack = {
      ...trackData,
      id,
      plays: trackData.plays || 0,
      status: trackData.status || 'pending_review',
      uploadedAt: trackData.uploadedAt || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    tracks.unshift(newTrack);
    writeJson('tracks.json', tracks);
    res.json(newTrack);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to save track', details: msg });
  }
});

// Update track (metadata, lyrics, review status)
app.put('/api/tracks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  // Sanitize blob URLs
  if (typeof updates.audioUrl === 'string' && updates.audioUrl.startsWith('blob:')) {
    delete updates.audioUrl;
  }
  if (typeof updates.coverUrl === 'string' && updates.coverUrl.startsWith('blob:')) {
    updates.coverUrl = '/icon.svg';
  }

  const tracks = readJson<any[]>('tracks.json', []);
  const index = tracks.findIndex((t) => t.id === id);

  if (index === -1) {
    // If not found in server tracks, create it (e.g. initial track custom edit)
    const newTrack = { ...updates, id, updatedAt: new Date().toISOString() };
    tracks.push(newTrack);
    writeJson('tracks.json', tracks);
    return res.json(newTrack);
  }

  tracks[index] = {
    ...tracks[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  writeJson('tracks.json', tracks);
  res.json(tracks[index]);
});

// Delete track
app.delete('/api/tracks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  let tracks = readJson<any[]>('tracks.json', []);
  tracks = tracks.filter((t) => t.id !== id);
  writeJson('tracks.json', tracks);
  res.json({ success: true, id });
});

// ---------------------------------------------------------------------------
// STREAM PLAYS & 24H TRENDING ENGINE
// ---------------------------------------------------------------------------
interface PlayRecord {
  id: string;
  trackId: string;
  timestamp: number;
  playedAt: string;
  trackTitle?: string;
  artist?: string;
  userId?: string;
  artistId?: string;
}

app.post('/api/plays', (req: Request, res: Response) => {
  try {
    const { trackId, trackTitle, artist, userId, artistId } = req.body;
    if (!trackId) return res.status(400).json({ error: 'Missing trackId' });

    const now = Date.now();
    const playRecord: PlayRecord = {
      id: `play_${now}_${Math.random().toString(36).substring(2, 6)}`,
      trackId,
      timestamp: now,
      playedAt: new Date(now).toISOString(),
      trackTitle,
      artist,
      userId,
      artistId,
    };

    const plays = readJson<PlayRecord[]>('plays.json', []);
    plays.push(playRecord);

    // Keep plays list trimmed to last 10,000 records
    if (plays.length > 10000) {
      plays.splice(0, plays.length - 10000);
    }
    writeJson('plays.json', plays);

    // Increment play count on track
    const tracks = readJson<any[]>('tracks.json', []);
    const track = tracks.find((t) => t.id === trackId);
    if (track) {
      track.plays = (track.plays || 0) + 1;
      writeJson('tracks.json', tracks);
    }

    res.json({ success: true, count: track?.plays });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to record stream play', details: msg });
  }
});

// Get recent 24-hour play counts for Trending Now calculation
app.get('/api/plays/recent', (_req: Request, res: Response) => {
  const plays = readJson<PlayRecord[]>('plays.json', []);
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  const counts: Record<string, number> = {};

  plays.forEach((p) => {
    if (p.timestamp >= twentyFourHoursAgo) {
      counts[p.trackId] = (counts[p.trackId] || 0) + 1;
    }
  });

  res.json(counts);
});

// Real-time platform statistics & catalog metadata
app.get('/api/stats', (_req: Request, res: Response) => {
  const users = readJson<StoredUser[]>('users.json', []);
  const tracks = readJson<any[]>('tracks.json', []);
  const plays = readJson<PlayRecord[]>('plays.json', []);

  // Compute registered creators/artists
  const creators = users.filter(
    (u) => u.role === 'creator' || u.role === 'admin' || u.role === 'super_admin'
  );
  const registeredCount = creators.length;
  const displayCreators = (12.4 + (registeredCount > 1 ? (registeredCount - 1) * 0.1 : 0)).toFixed(1);

  // Collect unique genres
  const genresSet = new Set<string>();
  tracks.forEach((t) => {
    if (t.genre && typeof t.genre === 'string') {
      t.genre.split(/[,/•&]/).forEach((g: string) => {
        const trimmed = g.trim();
        if (trimmed) genresSet.add(trimmed);
      });
    }
  });

  const coreAfricanGenres = [
    'Afrobeats',
    'Amapiano',
    'Highlife',
    'Zed Beats',
    'Afro-Soul',
    'Afro-Fusion',
    'Bongo Flava',
    'Gengetone',
    'Kwaito',
    'Coupé-Décalé',
    'Soukous',
    'Fuji',
    'Jùjú',
    'Kizomba',
    'Gqom',
  ];
  coreAfricanGenres.forEach((g) => genresSet.add(g));

  const totalPlays = plays.length;
  const approvedTracks = tracks.filter((t) => !t.status || t.status === 'approved').length;

  res.json({
    activeCreatorsCount: Math.max(registeredCount, 1),
    activeCreatorsDisplay: `${displayCreators}k`,
    isLive: true,
    totalTracks: tracks.length,
    approvedTracks,
    totalPlays,
    genresCount: Math.max(50, genresSet.size),
    topGenres: ['Afrobeats', 'Amapiano', 'Highlife', 'Zed Beats', 'Afro-Soul'],
    allGenres: Array.from(genresSet),
    serverTime: new Date().toISOString(),
    mode: '100% Self-Hosted Ubuntu',
    systemStatus: 'healthy',
  });
});

// ---------------------------------------------------------------------------
// DIRECT-TO-ARTIST TIPS & PATRONAGE ENDPOINTS
// ---------------------------------------------------------------------------
app.get('/api/tips', (req: Request, res: Response) => {
  const { artistId } = req.query;
  let tips = readJson<any[]>('tips.json', []);

  if (artistId && typeof artistId === 'string') {
    tips = tips.filter((t) => t.artistId === artistId);
  }

  tips.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  res.json(tips);
});

app.post('/api/tips', (req: Request, res: Response) => {
  try {
    const { id, artistId, amount, currency, senderName, senderEmail, message, trackId } = req.body;
    if (!artistId || !amount) {
      return res.status(400).json({ error: 'artistId and amount are required' });
    }

    const now = Date.now();
    const newTip = {
      id: id || `tip_${now}_${Math.random().toString(36).substring(2, 8)}`,
      artistId,
      amount: parseFloat(amount),
      currency: currency || 'USD',
      senderName: senderName || 'Anonymous Fan',
      senderEmail,
      message,
      trackId,
      createdAt: new Date(now).toISOString(),
      timestamp: now,
    };

    const tips = readJson<any[]>('tips.json', []);
    tips.unshift(newTip);
    writeJson('tips.json', tips);

    res.json({ success: true, tip: newTip });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to record tip', details: msg });
  }
});

// ---------------------------------------------------------------------------
// ARTIST PAYOUTS & MONETIZATION WITHDRAWALS
// ---------------------------------------------------------------------------
app.get('/api/payouts', (req: Request, res: Response) => {
  const { artistId } = req.query;
  let payouts = readJson<any[]>('payouts.json', []);

  if (artistId && typeof artistId === 'string') {
    payouts = payouts.filter((p) => p.artistId === artistId);
  }

  payouts.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  res.json(payouts);
});

app.post('/api/payouts', (req: Request, res: Response) => {
  try {
    const { id, artistId, artistName, artistEmail, amount, paymentMethod, accountDetails } = req.body;
    if (!artistId || !amount || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required payout fields' });
    }

    const newPayout = {
      id: id || `payout_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      artistId,
      artistName: artistName || 'BC Africa Artist',
      artistEmail: artistEmail || '',
      amount: parseFloat(amount),
      paymentMethod,
      accountDetails: accountDetails || '',
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    const payouts = readJson<any[]>('payouts.json', []);
    payouts.unshift(newPayout);
    writeJson('payouts.json', payouts);

    res.json({ success: true, payout: newPayout });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to submit payout request', details: msg });
  }
});

app.put('/api/payouts/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;

  const payouts = readJson<any[]>('payouts.json', []);
  const target = payouts.find((p) => p.id === id);

  if (!target) return res.status(404).json({ error: 'Payout request not found' });

  if (status) target.status = status;
  if (adminNotes !== undefined) target.adminNotes = adminNotes;
  target.processedAt = new Date().toISOString();

  writeJson('payouts.json', payouts);
  res.json({ success: true, payout: target });
});

app.delete('/api/payouts/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  let payouts = readJson<any[]>('payouts.json', []);
  payouts = payouts.filter((p) => p.id !== id);
  writeJson('payouts.json', payouts);
  res.json({ success: true, id });
});

// ---------------------------------------------------------------------------
// PLATFORM SETTINGS (THEMES, ADS, ANNOUNCEMENTS)
// ---------------------------------------------------------------------------
app.get('/api/settings', (_req: Request, res: Response) => {
  const settings = readJson<any>('settings.json', {});
  res.json(settings);
});

app.put('/api/settings', (req: Request, res: Response) => {
  try {
    const incoming = req.body;
    const current = readJson<any>('settings.json', {});
    const merged = {
      ...current,
      ...incoming,
      updatedAt: new Date().toISOString(),
    };

    writeJson('settings.json', merged);
    res.json(merged);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to save settings', details: msg });
  }
});

// ---------------------------------------------------------------------------
// HIGH-PERFORMANCE AUDIO STREAMING ENDPOINT WITH HTTP BYTE RANGE SUPPORT
// ---------------------------------------------------------------------------
app.get(['/api/stream/:filename', '/uploads/:filename'], (req: Request, res: Response) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOADS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Audio file not found on server' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const ext = path.extname(filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    '.flac': 'audio/flac',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  const contentType = mimeMap[ext] || 'application/octet-stream';

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      res.status(416).set({
        'Content-Range': `bytes */${fileSize}`,
      });
      return res.end();
    }

    const chunksize = end - start + 1;
    const fileStream = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });

    fileStream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=86400',
    });

    fs.createReadStream(filePath).pipe(res);
  }
});

// ---------------------------------------------------------------------------
// MULTER DISK STORAGE ENGINE FOR UBUNTU SERVER STORAGE
// ---------------------------------------------------------------------------
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeName = `${Date.now()}_${basename}${ext || ''}`;
    cb(null, safeName);
  },
});

const uploadMiddleware = multer({
  storage: diskStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

function getAuthenticatedUser(req: Request): StoredUser | null {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { uid: string; email: string };
    const users = readJson<StoredUser[]>('users.json', []);
    return users.find((u) => u.uid === payload.uid) || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// AUDIO METADATA EXTRACTION (ID3 TBPM, TKEY, Vorbis, Duration, SampleRate)
// ---------------------------------------------------------------------------
async function extractAudioMetadata(filePath: string, fallbackBpm?: any, fallbackKey?: any) {
  try {
    const parsed = await parseFile(filePath);
    const { common, format } = parsed;

    // 1. Look for BPM in common or native ID3 tags (TBPM / BPM)
    let bpm: number | null = null;
    if (typeof common.bpm === 'number' && !isNaN(common.bpm) && common.bpm > 0) {
      bpm = Math.round(common.bpm);
    } else if (common.bpm && typeof common.bpm === 'string') {
      const b = parseFloat(common.bpm);
      if (!isNaN(b) && b > 0) bpm = Math.round(b);
    }

    // 2. Look for musical Key in common or native ID3 tags (TKEY / KEY)
    let key: string | null = null;
    if (common.key && typeof common.key === 'string' && common.key.trim().length > 0) {
      key = common.key.trim();
    }

    // Inspect native ID3 tags for TBPM and TKEY if not yet found in common
    if (!bpm || !key) {
      if (parsed.native) {
        Object.values(parsed.native).forEach((tagList) => {
          tagList.forEach((tag) => {
            const id = (tag.id || '').toUpperCase();
            if (!bpm && (id === 'TBPM' || id === 'BPM')) {
              const val = parseFloat(String(tag.value));
              if (!isNaN(val) && val > 0) bpm = Math.round(val);
            }
            if (!key && (id === 'TKEY' || id === 'KEY' || id === 'INITIALKEY')) {
              key = String(tag.value).trim();
            }
          });
        });
      }
    }

    const duration = format.duration ? Math.round(format.duration * 10) / 10 : null;
    const sampleRate = format.sampleRate ? `${(format.sampleRate / 1000).toFixed(1)}kHz` : '44.1kHz';
    const bitrate = format.bitrate ? Math.round(format.bitrate / 1000) : null;

    const hasAutoBpm = bpm !== null;
    const hasAutoKey = key !== null;
    const isAuto = hasAutoBpm || hasAutoKey;

    // Fallbacks if not embedded in file tags
    if (!bpm && fallbackBpm) {
      const fb = parseFloat(String(fallbackBpm));
      if (!isNaN(fb) && fb > 0) bpm = Math.round(fb);
    }
    if (!key && fallbackKey && typeof fallbackKey === 'string' && fallbackKey.trim().length > 0) {
      key = fallbackKey.trim();
    }

    return {
      bpm: bpm || null,
      key: key || null,
      musicalKey: key || null,
      duration: duration || null,
      sampleRate: sampleRate || '44.1kHz',
      bitrate,
      title: common.title || null,
      artist: common.artist || null,
      album: common.album || null,
      genre: (common.genre && common.genre[0]) || null,
      metadataSource: isAuto ? 'auto-from-file' : 'manual-fallback',
    };
  } catch (err) {
    console.warn('[Metadata Parser] Note parsing file:', err);
    let bpm: number | null = null;
    if (fallbackBpm) {
      const fb = parseFloat(String(fallbackBpm));
      if (!isNaN(fb) && fb > 0) bpm = Math.round(fb);
    }
    const key = fallbackKey ? String(fallbackKey).trim() : null;

    return {
      bpm,
      key,
      musicalKey: key,
      duration: null,
      sampleRate: '44.1kHz',
      bitrate: null,
      title: null,
      artist: null,
      album: null,
      genre: null,
      metadataSource: 'manual-fallback',
    };
  }
}

async function handleUpload(req: Request, res: Response, defaultMime: string) {
  try {
    const user = getAuthenticatedUser(req);
    let targetPath = '';
    let safeFilename = '';
    let fileSize = 0;
    let mimeType = defaultMime;

    // 1. Check if file was uploaded via Multer (multipart/form-data)
    if (req.file) {
      safeFilename = req.file.filename;
      targetPath = path.join(UPLOADS_DIR, safeFilename);
      fileSize = req.file.size;
      mimeType = req.file.mimetype || defaultMime;
    } else {
      // 2. Check if file was uploaded via JSON Base64 { filename, fileData, mimeType }
      const { filename, fileData, mimeType: incomingMime } = req.body || {};
      if (filename && fileData) {
        const ext = path.extname(filename);
        const basename = path.basename(filename, ext).replace(/[^a-zA-Z0-9._-]/g, '_');
        safeFilename = `${Date.now()}_${basename}${ext || ''}`;
        targetPath = path.join(UPLOADS_DIR, safeFilename);

        const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(targetPath, buffer);
        fileSize = buffer.length;
        mimeType = incomingMime || defaultMime;
      }
    }

    if (!safeFilename || !targetPath) {
      return res.status(400).json({ error: 'No file uploaded or fileData payload provided' });
    }

    const fileUrl = `/uploads/${safeFilename}`;
    const isAudio = mimeType.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(safeFilename);

    let audioMeta: any = {
      bpm: null,
      key: null,
      musicalKey: null,
      duration: null,
      sampleRate: '44.1kHz',
      metadataSource: 'manual-fallback',
      tags: {},
    };

    if (isAudio && fs.existsSync(targetPath)) {
      const fallbackBpm = req.body?.bpm || req.query?.bpm;
      const fallbackKey = req.body?.key || req.body?.musicalKey || req.query?.key;
      audioMeta = await extractAudioMetadata(targetPath, fallbackBpm, fallbackKey);
    }

    return res.json({
      success: true,
      url: fileUrl,
      filename: safeFilename,
      size: fileSize,
      mimeType,
      uploader: user?.email || 'guest',
      bpm: audioMeta.bpm,
      key: audioMeta.key,
      musicalKey: audioMeta.musicalKey,
      duration: audioMeta.duration,
      sampleRate: audioMeta.sampleRate,
      bitrate: audioMeta.bitrate,
      metadataSource: audioMeta.metadataSource,
      tags: {
        title: audioMeta.title,
        artist: audioMeta.artist,
        album: audioMeta.album,
        genre: audioMeta.genre,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Upload Error]:', msg);
    return res.status(500).json({ error: 'Failed to write file to Ubuntu storage', details: msg });
  }
}

// Multer interceptor that handles any field name or gracefully continues if application/json
const anyFileUpload = (req: Request, res: Response, next: NextFunction) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    uploadMiddleware.any()(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: 'Multipart file upload failed', details: err.message });
      }
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        req.file = req.files[0];
      }
      next();
    });
  } else {
    next();
  }
};

// POST /api/tracks/upload — multipart or base64 audio upload with auto-extracted BPM & Key
app.post('/api/tracks/upload', anyFileUpload, async (req: Request, res: Response) => {
  await handleUpload(req, res, 'audio/mpeg');
});

// POST /api/upload/audio — multer diskStorage to uploads/, returns { success: true, url: /uploads/file.mp3, bpm, key }
app.post('/api/upload/audio', anyFileUpload, async (req: Request, res: Response) => {
  await handleUpload(req, res, 'audio/mpeg');
});

// POST /api/upload/cover — multer diskStorage to uploads/, returns { success: true, url: /uploads/cover.jpg }
app.post('/api/upload/cover', anyFileUpload, async (req: Request, res: Response) => {
  await handleUpload(req, res, 'image/jpeg');
});

// POST /api/upload — Universal upload endpoint supporting both Base64 and Multipart
app.post('/api/upload', anyFileUpload, async (req: Request, res: Response) => {
  await handleUpload(req, res, 'audio/mpeg');
});

// ---------------------------------------------------------------------------
// APPLICATION MOUNTING (DEV VITE MIDDLEWARE OR PROD STATIC)
// ---------------------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // In development mode, mount Vite dev server as Express middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[BC Africa Music] Running in Fullstack Dev Mode with Vite Middlewares');
  } else {
    // In production mode, serve pre-built static assets from dist/
    const distDir = path.join(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(
        express.static(distDir, {
          maxAge: '1d',
          setHeaders: (res, pathStr) => {
            if (pathStr.includes('/assets/')) {
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            }
          },
        })
      );
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
      console.log(`[BC Africa Music] Running in Production Mode serving static: ${distDir}`);
    } else {
      app.get('*', (_req: Request, res: Response) => {
        res.send(`
          <!DOCTYPE html>
          <html>
            <head><title>BC Africa Music - Production Build Pending</title></head>
            <body style="background:#070e17;color:#fff;font-family:sans-serif;padding:40px;text-align:center;">
              <h1>BC Africa Music Streaming Engine</h1>
              <p>Please run <code>npm run build</code> on this Ubuntu server to compile the client application.</p>
            </body>
          </html>
        `);
      });
    }
  }

  app.listen(PORT, () => {
    console.log(`[BC Africa Music] 100% Self-Hosted server active on port ${PORT}`);
    console.log(`[BC Africa Music] Audio uploads store: ${UPLOADS_DIR}`);
    console.log(`[BC Africa Music] Self-hosted data store: ${DATA_DIR}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting BC Africa Music server:', err);
  process.exit(1);
});
