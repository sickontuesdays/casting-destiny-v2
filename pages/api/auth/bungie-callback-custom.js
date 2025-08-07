// Custom Bungie OAuth callback handler
export default async function handler(req, res) {
  const { code, state, error } = req.query

  console.log('=== BUNGIE CALLBACK START ===')
  console.log('Query params:', { code: !!code, state: !!state, error })

  if (error) {
    console.log('OAuth error received:', error)
    return res.redirect(`/?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    console.log('No authorization code received')
    return res.redirect('/?error=missing_code')
  }

  try {
    console.log('=== TOKEN EXCHANGE ===')
    console.log('Using client ID:', process.env.BUNGIE_CLIENT_ID?.substring(0, 8) + '...')
    
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

    console.log('Token response status:', tokenResponse.status)
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', tokenResponse.status, errorText)
      return res.redirect('/?error=token_exchange_failed')
    }

    const tokens = await tokenResponse.json()
    console.log('Token exchange successful')
    console.log('Token type:', tokens.token_type)
    console.log('Expires in:', tokens.expires_in)
    console.log('Access token length:', tokens.access_token?.length)

    console.log('=== USER INFO REQUEST ===')
    console.log('API Key exists:', !!process.env.BUNGIE_API_KEY)
    console.log('API Key prefix:', process.env.BUNGIE_API_KEY?.substring(0, 8) + '...')

    // Get user info
    const userInfoUrl = 'https://www.bungie.net/Platform/User/GetCurrentUser/'
    console.log('Requesting:', userInfoUrl)
    
    const userResponse = await fetch(userInfoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'X-API-Key': process.env.BUNGIE_API_KEY
      }
    })

    console.log('User info response status:', userResponse.status)
    console.log('User info response headers:', userResponse.headers.get('content-type'))
    
    const responseText = await userResponse.text()
    console.log('Raw response (first 200 chars):', responseText.substring(0, 200))
    
    if (!userResponse.ok) {
      console.error('User info request failed:', userResponse.status)
      console.error('Response body:', responseText)
      return res.redirect(`/?error=user_info_failed_${userResponse.status}`)
    }

    let userData
    try {
      userData = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse user data as JSON:', parseError)
      return res.redirect('/?error=invalid_user_data')
    }

    console.log('User data ErrorCode:', userData.ErrorCode)
    console.log('Has Response:', !!userData.Response)
    
    if (userData.ErrorCode !== 1) {
      console.error('Bungie API Error:', userData.Message)
      return res.redirect(`/?error=bungie_api_error_${userData.ErrorCode}`)
    }

    const user = userData.Response
    console.log('User membership ID:', user.membershipId)
    console.log('User display name:', user.displayName)

    // Store user data in session
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

    console.log('Setting session cookie...')
    res.setHeader('Set-Cookie', `bungie_session=${Buffer.from(JSON.stringify(sessionData)).toString('base64')}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`)

    console.log('=== CALLBACK SUCCESS ===')
    res.redirect('/')

  } catch (error) {
    console.error('=== CALLBACK ERROR ===')
    console.error('OAuth callback error:', error)
    res.redirect('/?error=oauth_callback_error')
  }
}