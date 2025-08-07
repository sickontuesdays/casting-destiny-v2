// Custom Bungie OAuth callback handler
export default async function handler(req, res) {
  const { code, state, error } = req.query

  if (error) {
    return res.redirect(`/?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return res.redirect('/?error=missing_code')
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://www.bungie.net/Platform/app/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: process.env.BUNGIE_CLIENT_ID,
        client_secret: process.env.BUNGIE_CLIENT_SECRET
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', tokenResponse.status, errorText)
      return res.redirect('/?error=token_exchange_failed')
    }

    const tokens = await tokenResponse.json()
    console.log('Token exchange successful')
    console.log('Access token exists:', !!tokens.access_token)
    console.log('API Key exists:', !!process.env.BUNGIE_API_KEY)

    // Get user info - try the correct Bungie API endpoint
    const userInfoUrl = 'https://www.bungie.net/Platform/User/GetCurrentUser/'
    console.log('Attempting user info request to:', userInfoUrl)
    
    const userResponse = await fetch(userInfoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'X-API-Key': process.env.BUNGIE_API_KEY
      }
    })

    console.log('User info response status:', userResponse.status)
    console.log('User info response headers:', Object.fromEntries(userResponse.headers.entries()))
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error('User info request failed:', userResponse.status, errorText)
      console.error('Request headers sent:', {
        'Authorization': `Bearer ${tokens.access_token?.substring(0, 10)}...`,
        'X-API-Key': process.env.BUNGIE_API_KEY?.substring(0, 10) + '...'
      })
      return res.redirect('/?error=user_info_failed')
    }

    const userData = await userResponse.json()
    console.log('User data received:', {
      ErrorCode: userData.ErrorCode,
      hasResponse: !!userData.Response
    })
    
    if (userData.ErrorCode !== 1) {
      console.error('Bungie API Error:', userData.Message)
      return res.redirect('/?error=bungie_api_error')
    }

    const user = userData.Response

    // Store user data in session (simplified - you'd normally use NextAuth's session management)
    const sessionData = {
      user: {
        id: user.membershipId,
        name: user.displayName || user.bungieGlobalDisplayName,
        bungieMembershipId: user.membershipId,
        destinyMemberships: user.destinyMemberships || []
      },
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000)
    }

    // Set session cookie (simplified)
    res.setHeader('Set-Cookie', `bungie_session=${Buffer.from(JSON.stringify(sessionData)).toString('base64')}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`)

    // Redirect to home page
    res.redirect('/')

  } catch (error) {
    console.error('OAuth callback error:', error)
    res.redirect('/?error=oauth_callback_error')
  }
}