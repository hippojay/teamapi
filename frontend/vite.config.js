import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    // Include .js files as JSX
    include: "**/*.{jsx,js}",
    jsxRuntime: 'automatic',
  }),],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000, // Match the same port as react-scripts was using
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Assuming backend is running on port 8000
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'build', // Match the same output directory as react-scripts
    emptyOutDir: true,
  },
});
