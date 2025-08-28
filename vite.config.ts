import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",
  css: {
    postcss: './postcss.config.js',
  },
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          vendor: ['gsap', 'firebase']
        }
      }
    }
  },
  server: {
    port: 3000,
    strictPort: true
  }
});
