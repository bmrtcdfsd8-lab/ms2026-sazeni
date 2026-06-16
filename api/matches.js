// Vercel serverless function
// Proxies: https://api.football-data.org/v4/competitions/WC/matches
// Auth token is injected server-side — never exposed to the browser.

module.exports = async function handler(req, res) {
  const apiKey = process.env.VITE_FOOTBALL_API_KEY || ''
  console.log('[api/matches] invoked, key present:', !!apiKey)

  try {
    const upstream = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches',
      { headers: { 'X-Auth-Token': apiKey } }
    )

    console.log('[api/matches] upstream status:', upstream.status)
    const body = await upstream.text()

    res.statusCode = upstream.status
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.end(body)
  } catch (err) {
    console.error('[api/matches] FATAL:', err)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: err.message }))
  }
}
