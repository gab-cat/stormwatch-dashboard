import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
// Vite 8 beta uses Rolldown as the default bundler
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: process.env.NODE_ENV === 'development',
    rolldownOptions: {
      output: {
        // Rolldown advancedChunks configuration for optimized code splitting
        advancedChunks: {
          groups: [
            {
              name: 'react-vendor',
              test: /[\\/]node_modules[\\/](react|react-dom|react-router)/,
            },
            {
              name: 'auth-vendor',
              test: /[\\/]node_modules[\\/]@clerk/,
            },
            {
              name: 'backend-vendor',
              test: /[\\/]node_modules[\\/]convex/,
            },
            {
              name: 'map-vendor',
              test: /[\\/]node_modules[\\/](leaflet|react-leaflet)/,
            },
            {
              name: 'ui-vendor',
              test: /[\\/]src[\\/]components[\\/]ui/,
            },
            {
              name: 'admin-chunk',
              test: /[\\/]src[\\/]components[\\/]admin/,
            },
          ],
        },
        // Chunk naming with content hash for cache optimization
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Limit chunk size to prevent overly large bundles
    chunkSizeWarningLimit: 1000,
  },
})
