// Authentication configuration and utilities
export const bungieAuthConfig = {
  clientId: process.env.BUNGIE_CLIENT_ID,
  clientSecret: process.env.BUNGIE_CLIENT_SECRET,
  apiKey: process.env.BUNGIE_API_KEY,
  authUrl: 'https://www.bungie.net/en/oauth/authorize',
  tokenUrl: 'https://www.bungie.net/platform/app/oauth/token/',
  revokeUrl: 'https://www.bungie.net/platform/app/oauth/revoke/',
  scope: 'ReadUserData ReadUserInfo'
}

export function validateAuthConfig() {
  const requiredEnvVars = ['BUNGIE_CLIENT_ID', 'BUNGIE_CLIENT_SECRET', 'BUNGIE_API_KEY']
  const missing = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
  
  return true
}

export async function refreshAccessToken(refreshToken) {
  try {
    const response = await fetch(bungieAuthConfig.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${bungieAuthConfig.clientId}:${bungieAuthConfig.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    })

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`)
    }

    const tokenData = await response.json()
    
    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type
    }
  } catch (error) {
    console.error('Error refreshing access token:', error)
    throw error
  }
}

export async function revokeToken(accessToken) {
  try {
    await fetch(bungieAuthConfig.revokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${accessToken}`
      },
      body: new URLSearchParams({
        token: accessToken
      })
    })
  } catch (error) {
    console.error('Error revoking token:', error)
    // Don't throw - token revocation failures are not critical
  }
}

export function isTokenExpired(token) {
  if (!token || !token.expiresAt) return true
  
  const now = Date.now()
  const expiresAt = new Date(token.expiresAt).getTime()
  
  // Consider token expired if it expires within 5 minutes
  const bufferTime = 5 * 60 * 1000 // 5 minutes in milliseconds
  
  return now >= (expiresAt - bufferTime)
}

export function getBungieAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: bungieAuthConfig.clientId,
    response_type: 'code',
    scope: bungieAuthConfig.scope,
    state: state || 'default'
  })
  
  return `${bungieAuthConfig.authUrl}?${params.toString()}`
}

export async function exchangeCodeForToken(code) {
  try {
    const response = await fetch(bungieAuthConfig.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${bungieAuthConfig.clientId}:${bungieAuthConfig.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code
      })
    })

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`)
    }

    const tokenData = await response.json()
    
    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
      expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString()
    }
  } catch (error) {
    console.error('Error exchanging code for token:', error)
    throw error
  }
}

// Middleware to validate API key in requests
export function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key']
  
  if (!apiKey || apiKey !== process.env.BUNGIE_API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key' })
  }
  
  next()
}

// Utility to check if user has required Bungie.net permissions
export async function checkUserPermissions(accessToken) {
  try {
    const response = await fetch('https://www.bungie.net/Platform/User/GetCurrentUser/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-API-Key': bungieAuthConfig.apiKey
      }
    })

    if (!response.ok) {
      throw new Error(`Permission check failed: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.ErrorCode !== 1) {
      throw new Error(`Bungie API Error: ${data.Message}`)
    }

    const user = data.Response
    
    return {
      hasValidToken: true,
      membershipId: user.membershipId,
      displayName: user.displayName,
      destinyMemberships: user.destinyMemberships || [],
      canAccessDestinyData: user.destinyMemberships && user.destinyMemberships.length > 0
    }
  } catch (error) {
    console.error('Error checking user permissions:', error)
    return {
      hasValidToken: false,
      error: error.message
    }
  }
}

// Helper to get user's primary Destiny membership
export function getPrimaryDestinyMembership(destinyMemberships) {
  if (!destinyMemberships || destinyMemberships.length === 0) {
    return null
  }

  // Prefer cross-save membership if available
  const crossSave = destinyMemberships.find(membership => membership.crossSaveOverride === membership.membershipType)
  if (crossSave) {
    return crossSave
  }

  // Otherwise, use the most recently played membership
  const sortedByLastPlayed = destinyMemberships.sort((a, b) => {
    const aDate = new Date(a.dateLastPlayed || 0)
    const bDate = new Date(b.dateLastPlayed || 0)
    return bDate - aDate
  })

  return sortedByLastPlayed[0]
}

// Session management utilities
export function createUserSession(tokenData, userInfo) {
  const primaryMembership = getPrimaryDestinyMembership(userInfo.destinyMemberships)
  
  return {
    user: {
      id: userInfo.membershipId,
      name: userInfo.displayName,
      bungieMembershipId: userInfo.membershipId,
      destinyMemberships: userInfo.destinyMemberships,
      primaryMembership: primaryMembership
    },
    accessToken: tokenData.accessToken,
    refreshToken: tokenData.refreshToken,
    expiresAt: tokenData.expiresAt,
    createdAt: new Date().toISOString()
  }
}

export function isValidSession(session) {
  if (!session || !session.accessToken || !session.expiresAt) {
    return false
  }
  
  return !isTokenExpired({ expiresAt: session.expiresAt })
}