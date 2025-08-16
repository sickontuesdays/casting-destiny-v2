import { SignJWT } from 'jose'
import BungieAPIService from '../../../lib/bungie-api-service'

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

    // Initialize Bungie API service
    const bungieAPI = new BungieAPIService()
    
    // Get user's Bungie profile and Destiny memberships
    const { userInfo, destinyMemberships, primaryMembership } = 
      await bungieAPI.getDestinyMemberships(tokenResponse.access_token)
    
    if (!userInfo?.bungieNetUser) {
      throw new Error('Failed to get user profile')
    }

    const bungieUser = userInfo.bungieNetUser
    console.log('User profile received:', bungieUser.uniqueName)

    // Create comprehensive session data
    const sessionData = {
      user: {
        // Bungie.net user info
        membershipId: bungieUser.membershipId,
        displayName: bungieUser.uniqueName || bungieUser.displayName,
        displayNameCode: bungieUser.displayNameCode,
        profilePicturePath: bungieUser.profilePicturePath,
        profileThemeName: bungieUser.profileThemeName,
        userTitleDisplay: bungieUser.userTitleDisplay,
        locale: bungieUser.locale,
        
        // Destiny-specific info
        destinyMemberships: destinyMemberships.map(m => ({
          membershipType: m.membershipType,
          membershipId: m.membershipId,
          displayName: m.displayName,
          crossSaveOverride: m.crossSaveOverride,
          applicableMembershipTypes: m.applicableMembershipTypes
        })),
        
        // Primary membership for quick access
        primaryMembershipType: primaryMembership?.membershipType,
        primaryMembershipId: primaryMembership?.membershipId,
        
        // Platform info
        platforms: destinyMemberships.map(m => getPlatformName(m.membershipType)),
        
        // Avatar URL
        avatar: bungieUser.profilePicturePath ? 
          `https://www.bungie.net${bungieUser.profilePicturePath}` : null
      },
      
      // OAuth tokens
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      tokenType: tokenResponse.token_type,
      
      // Token expiration
      expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
      expiresIn: tokenResponse.expires_in,
      
      // Session metadata
      issuedAt: Date.now(),
      sessionId: generateSessionId(),
      
      // Permissions
      membershipType: tokenResponse.membership_type,
      scope: tokenResponse.scope || 'ReadUserData'
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

    console.log('Session created successfully for:', sessionData.user.displayName)
    console.log('Destiny memberships found:', destinyMemberships.length)
    console.log('Primary platform:', getPlatformName(primaryMembership?.membershipType))
    
    // Redirect to home page with success indicator
    res.redirect('/?auth=success')

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

function getPlatformName(membershipType) {
  const platforms = {
    0: 'None',
    1: 'Xbox',
    2: 'PlayStation',
    3: 'Steam',
    4: 'Blizzard',
    5: 'Stadia',
    6: 'EpicGames',
    10: 'Demon',
    254: 'BungieNext'
  }
  return platforms[membershipType] || 'Unknown'
}

function generateSessionId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}