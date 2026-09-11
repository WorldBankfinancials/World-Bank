
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@packages/shared': path.resolve(__dirname, '../../packages/shared'),
      '@shared': path.resolve(__dirname, '../../packages/shared'),
      '@server': path.resolve(__dirname, '../../services/api-server'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 5000,
    host: '0.0.0.0',
  },
  esbuild: {
    jsxInject: `import React from 'react'`,
  },
});
