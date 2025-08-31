import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      // API proxy for development
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
      // WebSocket proxy for development
      '/socket.io': {
        target: 'ws://localhost:4000',
        ws: true,
      },
    },
  },
  define: {
    // Make environment variables available to the client
    'import.meta.env.VITE_SIGNALING_SERVER': JSON.stringify(process.env.VITE_SIGNALING_SERVER || 'http://localhost:4000'),
  },
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor_react';
            }
            if (id.includes('firebase')) {
              return 'vendor_firebase';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});
