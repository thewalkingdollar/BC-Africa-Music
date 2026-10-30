import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/bcafricamusic/',
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'bcafricamusic.tail63a72a.ts.net',
      '.tail63a72a.ts.net',
      'localhost',
      '127.0.0.1',
      '100.96.166.104'
    ],
    hmr: {
      clientPort: 443
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
