import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';

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

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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
  readJson('tracks.json', []);
  readJson('plays.json', []);
  readJson('tips.json', []);
  readJson('payouts.json', []);
  readJson('artists.json', []);
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
// SELF-HOSTED TRACKS & QUALITY REVIEW QUEUE ENDPOINTS
// ---------------------------------------------------------------------------

// Get all tracks
app.get('/api/tracks', (_req: Request, res: Response) => {
  const tracks = readJson<any[]>('tracks.json', []);
  res.json(tracks);
});

// Create or upload new track
app.post('/api/tracks', (req: Request, res: Response) => {
  try {
    const trackData = req.body;
    if (!trackData.title || !trackData.artist) {
      return res.status(400).json({ error: 'Title and artist are required' });
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

// Direct server-side upload endpoint
app.post('/api/upload', (req: Request, res: Response) => {
  try {
    const { filename, fileData, mimeType } = req.body;

    if (!filename || !fileData) {
      return res.status(400).json({ error: 'Missing filename or fileData payload' });
    }

    const safeFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const targetPath = path.join(UPLOADS_DIR, safeFilename);

    const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    fs.writeFileSync(targetPath, buffer);

    const fileUrl = `/uploads/${safeFilename}`;
    res.json({
      success: true,
      url: fileUrl,
      filename: safeFilename,
      size: buffer.length,
      mimeType: mimeType || 'audio/mpeg',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Server upload error:', msg);
    res.status(500).json({ error: 'Failed to write file to Ubuntu storage', details: msg });
  }
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BC Africa Music] 100% Self-Hosted server active on port ${PORT}`);
    console.log(`[BC Africa Music] Audio uploads store: ${UPLOADS_DIR}`);
    console.log(`[BC Africa Music] Self-hosted data store: ${DATA_DIR}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting BC Africa Music server:', err);
  process.exit(1);
});
