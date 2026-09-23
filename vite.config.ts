import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'app',
  base: './',
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: 'build/app.js',
        chunkFileNames: 'build/chunk-[name].js',
        assetFileNames: asset => asset.name?.endsWith('.css') ? 'build/app.css' : 'build/[name][extname]'
      }
    }
  }
});
