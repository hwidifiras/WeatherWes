import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),tailwindcss() // Ensure Tailwind CSS is included
  ],
  css: {
    devSourcemap: true, // Enable sourcemaps for easier debugging
  },
})
