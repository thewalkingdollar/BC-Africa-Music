#!/bin/bash
set -e
echo "Pulling from 【entity-GitHub¦canonical_name=GitHub】..."
git pull origin main
echo "Installing deps..."
npm install
echo "Building..."
npm run build
echo "Restarting PM2..."
PORT=3000 NODE_ENV=production pm2 restart bc-africa-music --update-env
pm2 logs bc-africa-music --lines 5 --nostream
echo "✅ Deployed to https://bcafricamusic.tail63a72a.ts.net/bcafricamusic"
