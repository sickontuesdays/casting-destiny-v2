// Custom Bungie OAuth handler that bypasses NextAuth
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Generate state parameter for security
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  
  // Store state in session/cookie for verification (simplified for now)
  res.setHeader('Set-Cookie', `bungie_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`)

  // Redirect to Bungie OAuth - NO SCOPE PARAMETERS
  const authUrl = new URL('https://www.bungie.net/en/oauth/authorize')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', process.env.BUNGIE_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', `${process.env.NEXTAUTH_URL}/api/auth/callback/bungie`)
  authUrl.searchParams.set('state', state)

  res.redirect(authUrl.toString())
}