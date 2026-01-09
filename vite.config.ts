import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Vite 8 beta uses Rolldown as the default bundler
export default defineConfig({
  plugins: [react()],
})
