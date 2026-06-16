// Vercel serverless function — fixed to exactly:
// https://api.football-data.org/v4/competitions/WC/matches

module.exports = async function handler(req, res) {
  let upstream
  try {
    upstream = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches',
      { headers: { 'X-Auth-Token': process.env.VITE_FOOTBALL_API_KEY || '' } }
    )
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
