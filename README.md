# BC Africa Music — Ubuntu Server Deployment & Streaming Architecture Guide

Official production deployment guide and operations manual for self-hosting **BC Africa Music** on an Ubuntu Linux server with local audio storage, HTTP byte-range audio streaming, and zero-downtime upgrades.

---

## Technical Documentation PDF
A complete, 4-page technical architecture manual has been compiled and included directly in your repository:
* **Path:** `public/BC_Africa_Music_Ubuntu_Server_Architecture_Guide.pdf`
* **Direct Browser Access:** `https://your-domain.com/BC_Africa_Music_Ubuntu_Server_Architecture_Guide.pdf`

---

## 1. System Requirements

* **Operating System:** Ubuntu 20.04 LTS, 22.04 LTS, or 24.04 LTS
* **Compute:** Minimum 1 vCPU, 1 GB RAM (2 GB+ RAM recommended for high concurrent streams)
* **Storage:** 20 GB+ SSD (sized according to your audio library volume)
* **Network:** Ports `80` (HTTP), `443` (HTTPS), and `22` (SSH) open
* **Runtimes & Daemons:** Node.js 20 LTS, Nginx, PM2 Process Manager, Certbot

---

## 2. Server Architecture Overview

When hosted on your Ubuntu server, all audio files and artwork reside locally on your server's filesystem:

```
[ Internet / Mobile Streamers ]
               |
               | HTTPS (Port 443 with Let's Encrypt SSL)
               v
[ Nginx Reverse Proxy ]
   ├── Port 80 -> 443 redirect
   ├── HTTP Byte-Range support (Accept-Ranges: bytes)
   ├── client_max_body_size 100M (for audio uploads)
   └── Proxies to localhost:3000
               |
               v
[ Node.js / Express Engine (server.ts) managed by PM2 ]
   ├── Audio Streaming API (/api/stream/:filename & /uploads/*) -> HTTP 206 Partial Content
   ├── Audio Upload API (/api/upload) -> Saves directly to /var/www/bc-africa-music/uploads
   ├── Health Check API (/api/health)
   └── Single Page App Fallback -> Serves compiled React bundle from dist/
               |
               +----------------------------------+
               |                                  |
               v                                  v
[ Local Audio Storage ]                [ 100% Self-Hosted Local Database & Auth ]
/var/www/bc-africa-music/uploads       /var/www/bc-africa-music/data/
(Original MP3, WAV, FLAC, Covers)      (users.json, tracks.json, settings.json,
                                        plays.json, tips.json, payouts.json)
```

---

## 3. Step-by-Step Ubuntu Server Setup

### Step 1: Update System Packages & Install Prerequisites
Connect to your Ubuntu server via SSH and update all system packages:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx ufw certbot python3-certbot-nginx
```

---

### Step 2: Install Node.js 20 LTS and PM2
Install Node.js 20 LTS from the official NodeSource repository:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify versions
node -v   # Expected: v20.x.x
npm -v    # Expected: 10.x.x

# Install PM2 process manager and tsx globally
sudo npm install -g pm2 tsx
```

---

### Step 3: Setup Application Directory & Permissions
Create a dedicated deployment directory under `/var/www/`:

```bash
sudo mkdir -p /var/www/bc-africa-music
sudo chown -R $USER:$USER /var/www/bc-africa-music
cd /var/www/bc-africa-music

# Clone your repository or upload the codebase files here
# Example: git clone https://github.com/your-org/bc-africa-music.git .

# Create the dedicated local uploads directory for audio files and cover art
mkdir -p uploads public/assets/aistudio
chmod 755 uploads
```

---

### Step 4: Configure Environment Variables
Create your production `.env` file in the project root:

```bash
nano .env
```

Add your configuration:

```env
PORT=3000
NODE_ENV=production
APP_URL="https://music.bcafrica.com"
```

---

### Step 5: Install Dependencies & Build Production Bundle
Install dependencies and compile the optimized Vite frontend:

```bash
npm ci --prefer-offline
npm run build
```

This creates the production client build in `/var/www/bc-africa-music/dist`.

---

### Step 6: Start Application with PM2 Process Manager
Launch the production streaming server (`server.ts`) under PM2:

```bash
pm2 start npm --name "bc-africa-music" -- start

# Configure PM2 to restart automatically upon server reboot
pm2 save
pm2 startup
# (Copy and execute the 'sudo env PATH...' command output by PM2)

# Check status
pm2 status
pm2 logs bc-africa-music --lines 50
```

---

### Step 7: Configure Nginx as Reverse Proxy
Create an Nginx configuration file for BC Africa Music:

```bash
sudo nano /etc/nginx/sites-available/bc-africa-music
```

Paste the following configuration (replace `music.bcafrica.com` with your domain or server IP):

```nginx
server {
    listen 80;
    server_name music.bcafrica.com www.music.bcafrica.com;

    # Maximum file upload size for high-res audio tracks and albums
    client_max_body_size 100M;

    # Performance tuning for audio file delivery
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;

    # Gzip settings: Exclude audio formats to prevent CPU waste
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_proxied any;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # WebSocket / HMR support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CRITICAL: Forward HTTP Byte-Range headers for smooth audio scrub and seek
        proxy_set_header Range $http_range;
        proxy_set_header If-Range $http_if_range;

        # Buffering settings
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

Enable the configuration and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/bc-africa-music /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Step 8: Install Free Let's Encrypt SSL (HTTPS)
Secure your streaming platform with a free SSL certificate:

```bash
sudo certbot --nginx -d music.bcafrica.com -d www.music.bcafrica.com
```

Certbot automatically configures HTTPS redirection and an automated renewal cron job at `/etc/cron.d/certbot`.

---

### Step 9: Configure Ubuntu UFW Firewall
Ensure only necessary ports are accessible:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 4. Zero-Downtime Upgrades & Feature Deployment

To upgrade BC Africa Music with new features, themes, or bug fixes **without interrupting active music listeners**:

### The Automated Deployment Script (`deploy.sh`)
Create `deploy.sh` in `/var/www/bc-africa-music/`:

```bash
nano /var/www/bc-africa-music/deploy.sh
```

Paste the following script:

```bash
#!/usr/bin/env bash
set -e

echo "=================================================="
echo "  Deploying BC Africa Music Updates (Zero Downtime)"
echo "=================================================="

# 1. Pull the latest code updates
git pull origin main

# 2. Install any new dependencies
npm ci --prefer-offline

# 3. Compile the optimized Vite frontend bundle
npm run build

# 4. Zero-Downtime Rolling Reload via PM2
# PM2 starts a new process before terminating the old one, ensuring 0 dropped requests
pm2 reload bc-africa-music --update-env

echo "=================================================="
echo "  Deployment Complete! System running smoothly.   "
echo "=================================================="
```

Make it executable:

```bash
chmod +x /var/www/bc-africa-music/deploy.sh
```

### Deploying Future Upgrades:
Whenever you have changes to deploy, simply run:

```bash
cd /var/www/bc-africa-music
./deploy.sh
```

### Why Active Streamers Never Experience Interruptions:
1. **PM2 Rolling Reload:** The old Node.js worker continues handling active HTTP byte-range audio streams until they complete, while the new worker takes over incoming connections.
2. **Client Audio Buffering:** The BC Africa audio engine buffers audio chunks in the browser and IndexedDB, providing continuous playback during server reloads.
3. **Immutable Static Assets:** Built JavaScript/CSS assets use hash filenames (e.g. `main.[hash].js`), so existing browser sessions never crash during asset updates.

---

## 5. Instant 1-Command Rollback
If a newly pushed update introduces an unexpected issue, roll back instantly:

```bash
git reset --hard HEAD~1
npm run build
pm2 reload bc-africa-music
```
Your previous stable version is live within 5 seconds.

---

## 6. Local Audio Storage Maintenance & Backups

All songs and cover images uploaded by users are saved in:
```
/var/www/bc-africa-music/uploads/
```

### Automated Nightly Backup Cron Job
To set up automatic daily backups of your uploaded music library:

```bash
crontab -e
```

Add the following line to back up the uploads directory every night at 2:00 AM:

```cron
0 2 * * * tar -czf /var/backups/bc_music_$(date +\%Y\%m\%d).tar.gz /var/www/bc-africa-music/uploads
```

---

## 7. Operational Health Checks & Logs

* **Healthcheck URL:** `https://your-domain.com/api/health`
* **PM2 Live Monitoring Dashboard:**
  ```bash
  pm2 monit
  ```
* **Server Logs:**
  ```bash
  pm2 logs bc-africa-music --lines 100
  ```
* **Nginx Access & Error Logs:**
  ```bash
  sudo tail -f /var/log/nginx/access.log
  sudo tail -f /var/log/nginx/error.log
  ```

---

## 8. Summary of Platform Roles & Super User Controls

* **Bootstrap Super Admin:** `bcafricao@gmail.com`
* **Super User Panel:** Navigate to `Super Panel` in the top navbar to:
  * Switch dynamic platform themes (BC Africa Classic Blue, Midnight Afrobeat, Sahara Gold, Lagos Emerald) in real time.
  * Configure In-Stream Audio and Banner Advert frequency, sponsor titles, links, and skip timers.
  * Audit pending uploads in the Music Review Queue.
  * Manage user roles and promote members to the Review or Editorial Teams.
* **Artist Analytics & Royalties:**
  * View real-time 24h streaming performance and velocity graphs.
  * Request withdrawals to **Zambian Mobile Money** (MTN MoMo, Airtel Money, Zamtel Kwacha) or **Zambian Banks** (Zanaco, Standard Chartered, Stanbic, FNB).
