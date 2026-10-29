import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function generatePdf() {
  const pdfDoc = await PDFDocument.create();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

  // Brand Palette based on BC Africa logo
  const cSkyPrimary = rgb(0.01, 0.52, 0.78); // #0284c7
  const cSkyLight = rgb(0.22, 0.74, 0.97);   // #38bdf8
  const cNavyDark = rgb(0.03, 0.05, 0.09);   // #070e17
  const cNavyCard = rgb(0.04, 0.09, 0.16);   // #0a1728
  const cTextLight = rgb(0.95, 0.96, 0.98);  // #f1f5f9
  const cTextMuted = rgb(0.65, 0.71, 0.79);  // #a0aec0
  const cEmerald = rgb(0.06, 0.73, 0.51);    // #10b981
  const cAmber = rgb(0.96, 0.62, 0.13);      // #f59e0b

  const PAGE_WIDTH = 595.28; // A4 standard
  const PAGE_HEIGHT = 841.89;

  function addHeaderFooter(page: any, pageNumber: number, totalPages: number, pageTitle: string) {
    // Top border glow bar
    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 6,
      width: PAGE_WIDTH,
      height: 6,
      color: cSkyPrimary,
    });

    // Running Header
    page.drawText('BC AFRICA MUSIC  |  Ubuntu Server Architecture & Streaming Technical Manual', {
      x: 36,
      y: PAGE_HEIGHT - 28,
      size: 8,
      font: fontBold,
      color: cSkyPrimary,
    });

    page.drawLine({
      start: { x: 36, y: PAGE_HEIGHT - 34 },
      end: { x: PAGE_WIDTH - 36, y: PAGE_HEIGHT - 34 },
      thickness: 0.5,
      color: rgb(0.2, 0.3, 0.4),
    });

    // Running Footer
    page.drawLine({
      start: { x: 36, y: 38 },
      end: { x: PAGE_WIDTH - 36, y: 38 },
      thickness: 0.5,
      color: rgb(0.2, 0.3, 0.4),
    });

    page.drawText('BC Africa Music Streaming Engine — Self-Hosted Production Edition', {
      x: 36,
      y: 24,
      size: 7.5,
      font: fontRegular,
      color: cTextMuted,
    });

    page.drawText(`Page ${pageNumber} of ${totalPages}`, {
      x: PAGE_WIDTH - 90,
      y: 24,
      size: 7.5,
      font: fontBold,
      color: cSkyPrimary,
    });
  }

  // ==========================================
  // PAGE 1: TITLE & SYSTEM ARCHITECTURE
  // ==========================================
  const page1 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  // Dark background
  page1.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: cNavyDark,
  });

  // Hero Card
  page1.drawRectangle({
    x: 36,
    y: PAGE_HEIGHT - 170,
    width: PAGE_WIDTH - 72,
    height: 120,
    color: cNavyCard,
    borderColor: cSkyPrimary,
    borderWidth: 1,
  });

  page1.drawText('TECHNICAL ARCHITECTURE & PRODUCTION GUIDE', {
    x: 52,
    y: PAGE_HEIGHT - 75,
    size: 10,
    font: fontBold,
    color: cSkyLight,
  });

  page1.drawText('BC AFRICA MUSIC STREAMING PLATFORM', {
    x: 52,
    y: PAGE_HEIGHT - 100,
    size: 18,
    font: fontBold,
    color: cTextLight,
  });

  page1.drawText('Self-Hosted Ubuntu Linux Deployment, Local File Storage, and Zero-Downtime Operations', {
    x: 52,
    y: PAGE_HEIGHT - 120,
    size: 9.5,
    font: fontRegular,
    color: cTextMuted,
  });

  page1.drawText('Target Platform: Ubuntu 20.04 / 22.04 / 24.04 LTS  |  Node.js 20 LTS  |  Nginx Reverse Proxy', {
    x: 52,
    y: PAGE_HEIGHT - 145,
    size: 8.5,
    font: fontBold,
    color: cEmerald,
  });

  // Section 1: Architectural Blueprint
  let y = PAGE_HEIGHT - 200;

  page1.drawText('1. Production System Architecture on Ubuntu Server', {
    x: 36,
    y,
    size: 13,
    font: fontBold,
    color: cSkyLight,
  });

  y -= 20;
  const introText = [
    'BC Africa Music is built as an end-to-end full-stack music streaming, synchronized lyrics,',
    'and royalty distribution platform. When deployed on an Ubuntu server, all audio files (MP3, WAV,',
    'FLAC, AAC), cover art, lyrics, and metadata reside directly on the server filesystem with zero third-party',
    'storage dependency, while user authentication and real-time state sync to Cloud Firestore.',
  ];
  for (const line of introText) {
    page1.drawText(line, { x: 36, y, size: 8.5, font: fontRegular, color: cTextLight });
    y -= 13;
  }

  y -= 10;
  // ASCII Architecture Diagram Box
  page1.drawRectangle({
    x: 36,
    y: y - 180,
    width: PAGE_WIDTH - 72,
    height: 180,
    color: rgb(0.02, 0.04, 0.07),
    borderColor: rgb(0.15, 0.25, 0.38),
    borderWidth: 1,
  });

  const diagramLines = [
    '  [ Internet Clients: Mobile & Web Streamers ]',
    '                       |  HTTPS (Port 443 with TLS / Let\'s Encrypt SSL)',
    '                       v',
    '  [ Nginx Web Server / Reverse Proxy ]',
    '     * HTTP Byte-Range Caching Engine (Accept-Ranges: bytes)',
    '     * Gzip/Brotli Compression bypass for audio files to save CPU',
    '     * client_max_body_size 100M for multi-track uploads',
    '                       |  Proxy to localhost:3000',
    '                       v',
    '  [ PM2 Process Manager & Node.js / Express Streaming Engine (server.ts) ]',
    '     * Stream API (/api/stream/:filename) -> HTTP 206 Partial Content',
    '     * Upload API (/api/upload) -> Saves directly to /var/www/.../uploads',
    '     * SPA Route Fallback -> Delivers compiled Vite client bundle',
    '                       |',
    '        +--------------+--------------+',
    '        |                             |',
    '  [ Local Ubuntu Filesystem ]   [ Cloud Firestore & Auth ]',
    '  /var/www/bc-africa/uploads    Real-time RBAC, Lyrics, Plays,',
    '  (Audio streams, Covers)       Tips, and Payout Request Queue',
  ];

  let diagY = y - 18;
  for (const line of diagramLines) {
    page1.drawText(line, { x: 44, y: diagY, size: 7.2, font: fontMono, color: cSkyLight });
    diagY -= 11.5;
  }

  y -= 200;

  // Key Technical Pillars Box
  page1.drawText('2. Key Core Technologies on Ubuntu', {
    x: 36,
    y,
    size: 13,
    font: fontBold,
    color: cSkyLight,
  });

  y -= 18;

  const pillars = [
    {
      title: 'A. HTTP Byte-Range Audio Streaming (RFC 7233)',
      desc: 'Allows instant scrub, fast-forward, and rewind. The server streams only the exact chunks requested (status 206 Partial Content) rather than loading hundreds of megabytes into RAM.',
    },
    {
      title: 'B. PM2 Daemon & Cluster Mode',
      desc: 'Keeps the BC Africa Music engine running permanently in the background. If a process ever crashes, PM2 restarts it in milliseconds, and automatically boots upon server reboot.',
    },
    {
      title: 'C. Nginx Reverse Proxy with Zero CPU Waste',
      desc: 'Nginx terminates SSL certificates efficiently, handles DDoS rate-limiting, and delivers static frontend assets with 1-year immutable caching while passing dynamic audio queries.',
    },
    {
      title: 'D. Role-Based Access Control (RBAC) & Super User Panel',
      desc: 'Creators upload music (staged in Review Queue), Music Reviewers approve/reject, Editors sync lyrics, and Super Admins manage in-stream ads and themes remotely.',
    },
  ];

  for (const p of pillars) {
    page1.drawText(p.title, { x: 40, y, size: 9, font: fontBold, color: cTextLight });
    y -= 12;
    page1.drawText(p.desc, { x: 50, y, size: 8, font: fontRegular, color: cTextMuted });
    y -= 18;
  }

  addHeaderFooter(page1, 1, 4, 'System Architecture');

  // ==========================================
  // PAGE 2: STEP-BY-STEP UBUNTU INSTALLATION
  // ==========================================
  const page2 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  page2.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: cNavyDark });

  y = PAGE_HEIGHT - 60;

  page2.drawText('3. Ubuntu Server Step-by-Step Installation Manual', {
    x: 36,
    y,
    size: 14,
    font: fontBold,
    color: cSkyLight,
  });

  y -= 18;
  page2.drawText('Execute the following steps sequentially on your Ubuntu 20.04 / 22.04 / 24.04 LTS instance:', {
    x: 36,
    y,
    size: 8.5,
    font: fontRegular,
    color: cTextMuted,
  });

  y -= 20;

  const steps = [
    {
      title: 'Step 1: Update System Packages & Install Prerequisites',
      code: [
        'sudo apt update && sudo apt upgrade -y',
        'sudo apt install -y curl git build-essential nginx ufw certbot python3-certbot-nginx',
      ],
    },
    {
      title: 'Step 2: Install Node.js 20 LTS (NodeSource)',
      code: [
        'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -',
        'sudo apt install -y nodejs',
        'node -v && npm -v   # Verify: Should display v20.x.x',
        'sudo npm install -g pm2 tsx',
      ],
    },
    {
      title: 'Step 3: Setup Project Directory & Permissions',
      code: [
        'sudo mkdir -p /var/www/bc-africa-music',
        'sudo chown -R $USER:$USER /var/www/bc-africa-music',
        'cd /var/www/bc-africa-music',
        '# Copy files or clone git repository into this directory',
        'mkdir -p uploads public/assets/aistudio',
        'chmod 755 uploads',
      ],
    },
    {
      title: 'Step 4: Install Dependencies & Build Production Bundle',
      code: [
        'npm ci',
        'npm run build   # Compiles React SPA to /var/www/bc-africa-music/dist',
      ],
    },
    {
      title: 'Step 5: Launch Service with PM2 Process Manager',
      code: [
        'pm2 start npm --name "bc-africa-music" -- start',
        'pm2 save',
        'pm2 startup   # Copy and execute the generated command to survive reboots',
        'pm2 status    # Confirms bc-africa-music is "online" on port 3000',
      ],
    },
    {
      title: 'Step 6: Configure UFW Security Firewall',
      code: [
        'sudo ufw allow OpenSSH',
        'sudo ufw allow \'Nginx Full\'',
        'sudo ufw enable',
      ],
    },
  ];

  for (const s of steps) {
    page2.drawText(s.title, { x: 36, y, size: 9.5, font: fontBold, color: cTextLight });
    y -= 13;

    const boxHeight = s.code.length * 12 + 8;
    page2.drawRectangle({
      x: 36,
      y: y - boxHeight + 4,
      width: PAGE_WIDTH - 72,
      height: boxHeight,
      color: rgb(0.02, 0.05, 0.09),
      borderColor: rgb(0.12, 0.22, 0.35),
      borderWidth: 0.8,
    });

    let codeY = y - 7;
    for (const c of s.code) {
      page2.drawText(c, { x: 44, y: codeY, size: 7.2, font: fontMono, color: cSkyLight });
      codeY -= 12;
    }

    y -= boxHeight + 12;
  }

  addHeaderFooter(page2, 2, 4, 'Installation Guide');

  // ==========================================
  // PAGE 3: NGINX CONFIGURATION & AUDIO STREAMING
  // ==========================================
  const page3 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  page3.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: cNavyDark });

  y = PAGE_HEIGHT - 60;

  page3.drawText('4. Nginx Production Configuration with Byte-Range Streaming', {
    x: 36,
    y,
    size: 14,
    font: fontBold,
    color: cSkyLight,
  });

  y -= 16;
  page3.drawText('Create /etc/nginx/sites-available/bc-africa-music and symlink it to sites-enabled:', {
    x: 36,
    y,
    size: 8.5,
    font: fontRegular,
    color: cTextMuted,
  });

  y -= 15;

  const nginxConf = [
    'server {',
    '    listen 80;',
    '    server_name music.bcafrica.com www.music.bcafrica.com; # Replace with your domain/IP',
    '',
    '    # Security headers',
    '    add_header X-Frame-Options "SAMEORIGIN" always;',
    '    add_header X-XSS-Protection "1; mode=block" always;',
    '    add_header X-Content-Type-Options "nosniff" always;',
    '',
    '    # Allow large music and album artwork uploads (up to 100 Megabytes)',
    '    client_max_body_size 100M;',
    '',
    '    # Optimize kernel sendfile and socket buffer',
    '    sendfile on;',
    '    tcp_nopush on;',
    '    tcp_nodelay on;',
    '',
    '    # Exclude audio files from gzip compression (saves server CPU!)',
    '    gzip on;',
    '    gzip_types text/plain text/css application/json application/javascript text/xml;',
    '    gzip_proxied any;',
    '',
    '    # Proxy all traffic to Node.js / Express streaming backend',
    '    location / {',
    '        proxy_pass http://127.0.0.1:3000;',
    '        proxy_http_version 1.1;',
    '        proxy_set_header Upgrade $http_upgrade;',
    '        proxy_set_header Connection \'upgrade\';',
    '        proxy_set_header Host $host;',
    '        proxy_cache_bypass $http_upgrade;',
    '        proxy_set_header X-Real-IP $remote_addr;',
    '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;',
    '        proxy_set_header X-Forwarded-Proto $scheme;',
    '',
    '        # Enable HTTP Byte-Range header forwarding for audio scrubbing',
    '        proxy_set_header Range $http_range;',
    '        proxy_set_header If-Range $http_if_range;',
    '    }',
    '}',
  ];

  const nginxBoxH = nginxConf.length * 10.5 + 8;
  page3.drawRectangle({
    x: 36,
    y: y - nginxBoxH + 4,
    width: PAGE_WIDTH - 72,
    height: nginxBoxH,
    color: rgb(0.02, 0.05, 0.09),
    borderColor: rgb(0.12, 0.22, 0.35),
    borderWidth: 0.8,
  });

  let nginxY = y - 7;
  for (const c of nginxConf) {
    page3.drawText(c, { x: 44, y: nginxY, size: 6.8, font: fontMono, color: cSkyLight });
    nginxY -= 10.5;
  }

  y -= nginxBoxH + 18;

  // SSL Certificate setup
  page3.drawText('5. Automated Free SSL Certificate (HTTPS)', {
    x: 36,
    y,
    size: 11,
    font: fontBold,
    color: cTextLight,
  });

  y -= 14;
  const sslLines = [
    'sudo ln -s /etc/nginx/sites-available/bc-africa-music /etc/nginx/sites-enabled/',
    'sudo nginx -t                                  # Verify syntax is OK',
    'sudo systemctl reload nginx',
    'sudo certbot --nginx -d music.bcafrica.com     # Installs free Let\'s Encrypt SSL',
    '# Certbot automatically configures auto-renewal cronjob at /etc/cron.d/certbot',
  ];

  const sslBoxH = sslLines.length * 12 + 6;
  page3.drawRectangle({
    x: 36,
    y: y - sslBoxH + 4,
    width: PAGE_WIDTH - 72,
    height: sslBoxH,
    color: rgb(0.02, 0.05, 0.09),
    borderColor: rgb(0.12, 0.22, 0.35),
    borderWidth: 0.8,
  });

  let sslY = y - 7;
  for (const c of sslLines) {
    page3.drawText(c, { x: 44, y: sslY, size: 7.2, font: fontMono, color: cEmerald });
    sslY -= 12;
  }

  addHeaderFooter(page3, 3, 4, 'Nginx & Audio Streaming');

  // ==========================================
  // PAGE 4: ZERO-DOWNTIME UPGRADES & MAINTENANCE
  // ==========================================
  const page4 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  page4.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: cNavyDark });

  y = PAGE_HEIGHT - 60;

  page4.drawText('6. Zero-Downtime Rolling Upgrades & Maintenance', {
    x: 36,
    y,
    size: 14,
    font: fontBold,
    color: cSkyLight,
  });

  y -= 16;
  page4.drawText('How to deploy new features, themes, and upgrades without interrupting active music streams:', {
    x: 36,
    y,
    size: 8.5,
    font: fontRegular,
    color: cTextMuted,
  });

  y -= 18;

  const upgradeSections = [
    {
      title: 'A. Automated Zero-Downtime Deployment Script (deploy.sh)',
      desc: 'Place this script in your project root (/var/www/bc-africa-music/deploy.sh) and run ./deploy.sh:',
      code: [
        '#!/usr/bin/env bash',
        'set -e',
        'echo ">>> Pulling latest BC Africa updates..."',
        'git pull origin main',
        'echo ">>> Installing dependencies..."',
        'npm ci --prefer-offline',
        'echo ">>> Compiling frontend production bundle..."',
        'npm run build',
        'echo ">>> Zero-downtime rolling reload via PM2..."',
        'pm2 reload bc-africa-music --update-env',
        'echo ">>> Deployment successfully completed with ZERO DOWNTIME!"',
      ],
    },
    {
      title: 'B. Why Active Listeners Experience Zero Interruption',
      desc: '1. PM2 reload creates a parallel new process and only terminates the old process after the new one is listening.',
      subdesc: '2. Browser audio playback is buffered in memory and IndexedDB; even a brief server transition never cuts music.',
    },
    {
      title: 'C. Instant 1-Command Rollback',
      desc: 'If any regression occurs in a new release, roll back immediately in under 3 seconds:',
      code: [
        'git reset --hard HEAD~1',
        'npm run build',
        'pm2 reload bc-africa-music',
      ],
    },
    {
      title: 'D. Automated Daily Backup of Audio Files & Uploads',
      desc: 'Setup an automated cron job to back up your uploaded songs and database records:',
      code: [
        '# Add to crontab via: crontab -e',
        '0 2 * * * tar -czf /backups/bc_africa_$(date +\\%Y\\%m\\%d).tar.gz /var/www/bc-africa-music/uploads',
      ],
    },
  ];

  for (const s of upgradeSections) {
    page4.drawText(s.title, { x: 36, y, size: 9.5, font: fontBold, color: cTextLight });
    y -= 12;

    if (s.desc) {
      page4.drawText(s.desc, { x: 40, y, size: 8, font: fontRegular, color: cTextMuted });
      y -= 12;
    }
    if (s.subdesc) {
      page4.drawText(s.subdesc, { x: 40, y, size: 8, font: fontRegular, color: cTextMuted });
      y -= 12;
    }

    if (s.code) {
      const boxH = s.code.length * 11 + 6;
      page4.drawRectangle({
        x: 36,
        y: y - boxH + 4,
        width: PAGE_WIDTH - 72,
        height: boxH,
        color: rgb(0.02, 0.05, 0.09),
        borderColor: rgb(0.12, 0.22, 0.35),
        borderWidth: 0.8,
      });

      let codeY = y - 6;
      for (const c of s.code) {
        page4.drawText(c, { x: 44, y: codeY, size: 7, font: fontMono, color: cSkyLight });
        codeY -= 11;
      }

      y -= boxH + 12;
    }
  }

  // Summary box
  page4.drawRectangle({
    x: 36,
    y: 50,
    width: PAGE_WIDTH - 72,
    height: 48,
    color: cNavyCard,
    borderColor: cEmerald,
    borderWidth: 1,
  });

  page4.drawText('SUPPORT & OPERATIONS SUMMARY', {
    x: 48,
    y: 84,
    size: 8,
    font: fontBold,
    color: cEmerald,
  });

  page4.drawText('Server Healthcheck: http://YOUR_SERVER_IP/api/health  |  Super Admin: bcafricao@gmail.com', {
    x: 48,
    y: 70,
    size: 7.5,
    font: fontBold,
    color: cTextLight,
  });

  page4.drawText('All audio streams, synced lyrics, adverts, and artist payouts function autonomously on your Ubuntu server.', {
    x: 48,
    y: 58,
    size: 7.2,
    font: fontRegular,
    color: cTextMuted,
  });

  addHeaderFooter(page4, 4, 4, 'Zero-Downtime Operations');

  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(process.cwd(), 'public', 'BC_Africa_Music_Ubuntu_Server_Architecture_Guide.pdf');
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`[PDF Generator] Successfully generated: ${outputPath} (${pdfBytes.length} bytes)`);
}

generatePdf().catch(console.error);
