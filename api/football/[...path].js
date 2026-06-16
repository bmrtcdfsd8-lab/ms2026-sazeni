// Vercel serverless proxy for football-data.org
// Injects X-Auth-Token server-side so the browser never needs to send it.

export default async function handler(req, res) {
  const parts = [req.query.path].flat().filter(Boolean)
  const apiPath = parts.join('/')

  const url = new URL(`https://api.football-data.org/v4/${apiPath}`)
  for (const [k, v] of Object.entries(req.query)) {
    if (k !== 'path') url.searchParams.set(k, v)
  }

  let upstream
  try {
    upstream = await fetch(url.toString(), {
      headers: { 'X-Auth-Token': process.env.VITE_FOOTBALL_API_KEY || '' },
    })
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
