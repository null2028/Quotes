import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: path.resolve(__dirname),
  publicDir: path.resolve(__dirname, '../public'),
  plugins: [react()],
  css: {
    postcss: path.resolve(__dirname, 'postcss.config.cjs'),
  },
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, '../src'),
    },
  },
  server: {
    port: 3688,
    strictPort: true,
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3689',
        changeOrigin: true,
      },
      '/output': {
        target: 'http://localhost:3689',
        changeOrigin: true,
      },
      '/airtable-api': {
        target: 'https://api.airtable.com/v0',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/airtable-api/, ''),
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../dist-studio'),
    emptyOutDir: true,
  },
});
