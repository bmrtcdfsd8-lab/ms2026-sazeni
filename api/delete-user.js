// Vercel serverless function
// POST /api/delete-user  { username: string }
// Uses the service role key to bypass RLS and hard-delete the user row.
// Cascade on the bets FK removes all bets automatically.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY || ''

  if (!serviceKey) {
    console.error('[delete-user] SUPABASE_SERVICE_KEY not set')
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'Server misconfigured' }))
    return
  }

  let body = {}
  try {
    // req.body may already be parsed by Vercel, or may be a raw string
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
  } catch {
    res.statusCode = 400
    res.end(JSON.stringify({ error: 'Invalid JSON body' }))
    return
  }

  const { username } = body
  if (!username) {
    res.statusCode = 400
    res.end(JSON.stringify({ error: 'username required' }))
    return
  }

  try {
    const url = `${supabaseUrl}/rest/v1/users?username=eq.${encodeURIComponent(username)}`
    const upstream = await fetch(url, {
      method: 'DELETE',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
    })

    const text = await upstream.text()
    console.log(`[delete-user] username=${username} status=${upstream.status} body=${text}`)

    if (!upstream.ok) {
      res.statusCode = upstream.status
      res.end(JSON.stringify({ error: `Supabase error: ${text}` }))
      return
    }

    res.statusCode = 200
    res.end(JSON.stringify({ deleted: true, username }))
  } catch (err) {
    console.error('[delete-user] error:', err.message)
    res.statusCode = 500
    res.end(JSON.stringify({ error: err.message }))
  }
}
