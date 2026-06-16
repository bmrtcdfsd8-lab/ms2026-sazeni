// Vercel serverless proxy for the-odds-api.com
// Strips any client-provided apiKey and injects the server-side one instead.

export default async function handler(req, res) {
  const parts = [req.query.path].flat().filter(Boolean)
  const apiPath = parts.join('/')

  const url = new URL(`https://api.the-odds-api.com/v4/${apiPath}`)
  for (const [k, v] of Object.entries(req.query)) {
    if (k !== 'path' && k !== 'apiKey') url.searchParams.set(k, v)
  }
  url.searchParams.set('apiKey', process.env.VITE_ODDS_API_KEY || '')

  let upstream
  try {
    upstream = await fetch(url.toString())
  } catch (err) {
    return res.status(502).json({ error: 'upstream fetch failed', detail: err.message })
  }

  const body = await upstream.text()
  res
    .status(upstream.status)
    .setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
    .setHeader('Access-Control-Allow-Origin', '*')
    .end(body)
}
