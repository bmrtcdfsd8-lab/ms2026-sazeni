// Vercel serverless function
// GET /api/check-ban?username=X
// Uses the service role key so RLS is bypassed — the client cannot influence the result.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json')

  const { username } = req.query
  if (!username) {
    res.statusCode = 400
    res.end(JSON.stringify({ error: 'username required' }))
    return
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY || ''

  if (!serviceKey) {
    // Fail open — missing key should not lock out all players
    console.warn('[check-ban] SUPABASE_SERVICE_KEY not configured')
    res.statusCode = 200
    res.end(JSON.stringify({ banned: false }))
    return
  }

  try {
    const url = `${supabaseUrl}/rest/v1/banned_usernames?username=eq.${encodeURIComponent(username)}&select=username`
    const upstream = await fetch(url, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    })

    const data = await upstream.json()
    const banned = Array.isArray(data) && data.length > 0

    console.log(`[check-ban] username=${username} banned=${banned}`)
    res.statusCode = 200
    res.end(JSON.stringify({ banned }))
  } catch (err) {
    // Supabase unreachable — fail open rather than locking everyone out
    console.error('[check-ban] error:', err.message)
    res.statusCode = 200
    res.end(JSON.stringify({ banned: false }))
  }
}
