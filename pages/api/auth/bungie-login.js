export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const clientId = process.env.BUNGIE_CLIENT_ID
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/bungie-auth`
    
    if (!clientId) {
      console.error('BUNGIE_CLIENT_ID not configured')
      return res.status(500).json({ error: 'OAuth not configured' })
    }

    // Generate state parameter for security
    const state = generateRandomState()
    
    // Store state in session/cookie for verification
    res.setHeader('Set-Cookie', [
      `oauth-state=${state}; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax; Path=/; Max-Age=600`
    ])

    // Build Bungie OAuth URL
    const authUrl = new URL('https://www.bungie.net/en/OAuth/Authorize')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('scope', 'ReadUserData')

    console.log('Redirecting to Bungie OAuth:', authUrl.toString())
    
    // Redirect to Bungie OAuth
    res.redirect(302, authUrl.toString())

  } catch (error) {
    console.error('Error in bungie-login:', error)
    res.status(500).json({ 
      error: 'Failed to initiate OAuth',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

function generateRandomState() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}