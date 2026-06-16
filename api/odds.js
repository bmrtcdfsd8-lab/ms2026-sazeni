// Vercel serverless function
// Proxies: https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds
// API key is injected server-side; any client-provided apiKey is stripped.

module.exports = async function handler(req, res) {
  const apiKey = process.env.VITE_ODDS_API_KEY || ''
  console.log('[api/odds] invoked, key present:', !!apiKey)

  try {
    const url = new URL('https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds')

    // Forward only safe, known query params
    const allowed = new Set(['regions', 'markets', 'oddsFormat', 'dateFormat', 'bookmakers'])
    for (const [k, v] of Object.entries(req.query || {})) {
      if (allowed.has(k)) url.searchParams.set(k, v)
    }
    url.searchParams.set('apiKey', apiKey)

    console.log('[api/odds] fetching:', url.pathname + url.search.replace(apiKey, '***'))

    const upstream = await fetch(url.toString())
    console.log('[api/odds] upstream status:', upstream.status)
    const body = await upstream.text()

    res.statusCode = upstream.status
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.end(body)
  } catch (err) {
    console.error('[api/odds] FATAL:', err)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: err.message }))
  }
}
