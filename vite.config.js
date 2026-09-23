import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
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
      return res.end(JSON.stringify({ error: 'ECOTRACK_TOKEN or ECOTRACK_BASE_URL missing' }))
    }
    fetch(`${ECOTRACK_BASE}/api/v1/get/fees`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${ECOTRACK_TOKEN}`, Accept: 'application/json' },
    })
    .then(r => r.json())
    .then(data => {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(data))
    })
    .catch(err => {
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: err.message }))
    })
  })

  // GET /api/wilayas — ECOTRACK wilayas list
  server.middlewares.use('/api/wilayas', (req, res, next) => {
    if (req.method !== 'GET') return next()
    if (!ECOTRACK_TOKEN || !ECOTRACK_BASE) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      return res.end(JSON.stringify({ error: 'ECOTRACK_TOKEN or ECOTRACK_BASE_URL missing' }))
    }
    fetch(`${ECOTRACK_BASE}/api/v1/get/wilayas`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${ECOTRACK_TOKEN}`, Accept: 'application/json' },
    })
    .then(r => r.json())
    .then(data => {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(data))
    })
    .catch(err => {
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json')
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
  plugins: [react(), ecotrackApiPlugin()],
})
