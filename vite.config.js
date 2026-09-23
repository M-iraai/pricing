import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import 'dotenv/config'

const ECOTRACK_TOKEN = process.env.ECOTRACK_TOKEN
const ECOTRACK_BASE = (process.env.ECOTRACK_BASE_URL || '').replace(/\/+$/, '')

// Registers the ECOTRACK proxy middlewares on a Vite dev or preview server
function registerApi(server) {
  // GET /api/fees — ECOTRACK delivery fees
  server.middlewares.use('/api/fees', (req, res, next) => {
    if (req.method !== 'GET') return next()
    if (!ECOTRACK_TOKEN || !ECOTRACK_BASE) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'no-store')
      return res.end(JSON.stringify({ error: 'ECOTRACK_TOKEN or ECOTRACK_BASE_URL missing' }))
    }
    fetch(`${ECOTRACK_BASE}/api/v1/get/fees`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${ECOTRACK_TOKEN}`, Accept: 'application/json' },
    })
    .then(r => r.json())
    .then(data => {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'no-store')
      res.end(JSON.stringify(data))
    })
    .catch(err => {
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'no-store')
      res.end(JSON.stringify({ error: err.message }))
    })
  })

  // GET /api/wilayas — ECOTRACK wilayas list
  server.middlewares.use('/api/wilayas', (req, res, next) => {
    if (req.method !== 'GET') return next()
    if (!ECOTRACK_TOKEN || !ECOTRACK_BASE) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'no-store')
      return res.end(JSON.stringify({ error: 'ECOTRACK_TOKEN or ECOTRACK_BASE_URL missing' }))
    }
    fetch(`${ECOTRACK_BASE}/api/v1/get/wilayas`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${ECOTRACK_TOKEN}`, Accept: 'application/json' },
    })
    .then(r => r.json())
    .then(data => {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'no-store')
      res.end(JSON.stringify(data))
    })
    .catch(err => {
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'no-store')
      res.end(JSON.stringify({ error: err.message }))
    })
  })
}

function ecotrackApiPlugin() {
  return {
    name: 'ecotrack-api',
    configureServer(server) {
      registerApi(server)
    },
    configurePreviewServer(server) {
      registerApi(server)
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    ecotrackApiPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'أسعار التوصيل',
        short_name: 'الأسعار',
        description: 'أسعار التوصيل لكل ولاية',
        lang: 'ar',
        dir: 'rtl',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#6734ff',
        background_color: '#ffffff',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: '/index.html',
        // Never let the service worker serve/cached HTML for the API routes
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
})
