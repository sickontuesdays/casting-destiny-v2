import { SignJWT } from 'jose'
import fetch from 'node-fetch'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { code, state, error: oauthError } = req.query
    
    // Check for OAuth errors
    if (oauthError) {
      console.error('OAuth error:', oauthError)
      return res.redirect(`/?error=${encodeURIComponent('OAuth failed: ' + oauthError)}`)
    }

    if (!code || !state) {
      console.error('Missing code or state parameter')
      return res.redirect('/?error=invalid_oauth_response')
    }

    // Verify state parameter
    const storedState = req.cookies['oauth-state']
    if (!storedState || storedState !== state) {
      console.error('State mismatch:', { storedState, receivedState: state })
      return res.redirect('/?error=invalid_state')
    }

    console.log('Processing OAuth callback with code:', code.substring(0, 10) + '...')

    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForTokens(code)
    
    if (!tokenResponse.access_token) {
      throw new Error('No access token received')
    }

    console.log('Tokens received, fetching user profile...')

    // Get user profile
    const userProfile = await getBungieUserProfile(tokenResponse.access_token)
    
    if (!userProfile) {
      throw new Error('Failed to get user profile')
    }

    console.log('User profile received:', userProfile.displayName)

    // Create session
    const sessionData = {
      user: {
        membershipId: userProfile.membershipId,
        displayName: userProfile.displayName,
        displayNameCode: userProfile.displayNameCode,
        membershipType: userProfile.membershipType,
        avatar: userProfile.profilePicturePath ? 
          `https://www.bungie.net${userProfile.profilePicturePath}` : null
      },
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
      issuedAt: Date.now()
    }

    // Create JWT session token
    const sessionToken = await new SignJWT(sessionData)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret)

    // Set session cookie
    res.setHeader('Set-Cookie', [
      `bungie-session=${sessionToken}; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`,
      `oauth-state=; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax; Path=/; Max-Age=0` // Clear state cookie
    ])

    console.log('Session created successfully, redirecting to home')
    
    // Redirect to home page
    res.redirect('/')

  } catch (error) {
    console.error('Error in bungie-auth:', error)
    res.redirect(`/?error=${encodeURIComponent('Authentication failed: ' + error.message)}`)
  }
}

async function exchangeCodeForTokens(code) {
  const tokenUrl = 'https://www.bungie.net/Platform/App/OAuth/Token/'
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/bungie-auth`
  
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: process.env.BUNGIE_CLIENT_ID,
    client_secret: process.env.BUNGIE_CLIENT_SECRET
  })

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-API-Key': process.env.BUNGIE_API_KEY
    },
    body: body.toString()
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Token exchange failed:', response.status, errorText)
    throw new Error(`Token exchange failed: ${response.status}`)
  }

  return await response.json()
}

async function getBungieUserProfile(accessToken) {
  const profileUrl = 'https://www.bungie.net/Platform/User/GetMembershipsForCurrentUser/'
  
  const response = await fetch(profileUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-API-Key': process.env.BUNGIE_API_KEY
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Profile fetch failed:', response.status, errorText)
    throw new Error(`Profile fetch failed: ${response.status}`)
  }

  const data = await response.json()
  
  if (data.ErrorCode !== 1) {
    console.error('Bungie API error:', data.Message)
    throw new Error(`Bungie API error: ${data.Message}`)
  }

  const primaryMembership = data.Response.primaryMembershipId
  const destinyMemberships = data.Response.destinyMemberships || []
  const bungieNetUser = data.Response.bungieNetUser

  // Find the primary Destiny membership or use the first available
  let membership = destinyMemberships.find(m => m.membershipId === primaryMembership)
  if (!membership && destinyMemberships.length > 0) {
    membership = destinyMemberships[0]
  }

  if (!membership) {
    throw new Error('No Destiny memberships found')
  }

  return {
    membershipId: membership.membershipId,
    membershipType: membership.membershipType,
    displayName: membership.displayName || bungieNetUser.displayName,
    displayNameCode: membership.displayNameCode || bungieNetUser.displayNameCode,
    profilePicturePath: bungieNetUser.profilePicturePath,
    crossSaveOverride: membership.crossSaveOverride,
    applicableMembershipTypes: membership.applicableMembershipTypes
  }
}