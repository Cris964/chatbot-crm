import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  server: {
    port: 5173,
    host: true
  },
  build: {
    // Sin manualChunks: Rollup parte solo lo que no se usa en el arranque.
    // Las rutas son lazy (ver App.jsx) y las librerías pesadas (recharts,
    // leaflet, xlsx, face-api) se cargan únicamente en el módulo que las usa.
    chunkSizeWarningLimit: 900
  }
})
