import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const certDir = path.join(__dirname, 'dev-certs')
const keyPath = path.join(certDir, 'key.pem')
const certPath = path.join(certDir, 'cert.pem')

function devHttps(): { key: Buffer; cert: Buffer } | undefined {
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.warn(
      '[vite] Sin HTTPS: ejecutá scripts/generate-dev-certs.ps1 para compartir PDF en el iPhone.'
    )
    return undefined
  }
  return {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    https: devHttps(),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'vendor-recharts'
          }
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
            return 'vendor-leaflet'
          }
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) {
            return 'vendor-pdf'
          }
          if (id.includes('node_modules/firebase')) {
            return 'vendor-firebase'
          }
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router')
          ) {
            return 'vendor-react'
          }
        },
      },
    },
  },
})
