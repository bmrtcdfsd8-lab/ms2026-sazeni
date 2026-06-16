// Vercel serverless function — fixed to exactly:
// https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds

module.exports = async function handler(req, res) {
  const url = new URL('https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds')

  // Forward safe query params; inject API key server-side (strip any client-provided one)
  const allowed = new Set(['regions', 'markets', 'oddsFormat', 'dateFormat', 'bookmakers'])
  for (const [k, v] of Object.entries(req.query || {})) {
    if (allowed.has(k)) url.searchParams.set(k, v)
  }
  url.searchParams.set('apiKey', process.env.VITE_ODDS_API_KEY || '')

  let upstream
  try {
    upstream = await fetch(url.toString())
  } catch (err) {
    return res.status(502).json({ error: 'upstream unavailable', detail: err.message })
  }

  const body = await upstream.text()
  res
    .status(upstream.status)
    .setHeader('Content-Type', 'application/json')
    .setHeader('Access-Control-Allow-Origin', '*')
    .end(body)
}
