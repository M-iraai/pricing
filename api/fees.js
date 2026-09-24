// Vercel serverless function — GET /api/fees
// Mirrors the Vite dev middleware in vite.config.js so the deployed site
// serves the same payload as `npm run dev`.

const TOKEN = process.env.ECOTRACK_TOKEN
const BASE = (process.env.ECOTRACK_BASE_URL || '').replace(/\/+$/, '')

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'GET') {
    res.statusCode = 405
    return res.end(JSON.stringify({ error: 'Method not allowed' }))
  }

  if (!TOKEN || !BASE) {
    res.statusCode = 500
    return res.end(JSON.stringify({ error: 'ECOTRACK_TOKEN or ECOTRACK_BASE_URL missing' }))
  }

  try {
    const upstream = await fetch(`${BASE}/api/v1/get/fees`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' },
    })
    const data = await upstream.json()
    res.statusCode = upstream.ok ? 200 : 502
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify(data))
  } catch (err) {
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ error: err.message }))
  }
}
