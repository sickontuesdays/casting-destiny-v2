// Authentication configuration and utilities
export const bungieAuthConfig = {
  clientId: process.env.BUNGIE_CLIENT_ID,
  clientSecret: process.env.BUNGIE_CLIENT_SECRET,
  apiKey: process.env.BUNGIE_API_KEY,
  authUrl: 'https://www.bungie.net/en/oauth/authorize',
  tokenUrl: 'https://www.bungie.net/Platform/app/oauth/token/',
  revokeUrl: 'https://www.bungie.net/Platform/app/oauth/revoke/',
  userInfoUrl: 'https://www.bungie.net/Platform/User/GetCurrentUser/',
  scope: '' // Empty scope for Bungie
}

// Parse session from cookie
export function parseSessionFromCookie(cookieHeader) {
  if (!cookieHeader) return null
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {})
  
  const sessionCookie = cookies.bungie_session
  if (!sessionCookie) return null
  
  try {
    const sessionData = JSON.parse(Buffer.from(sessionCookie, 'base64').toString())
    
    // Check if session is expired
    if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
      return null
    }
    
    return sessionData
  } catch (error) {
    console.error('Error parsing session cookie:', error)
    return null
  }
}

// Get session from request
export function getSessionFromRequest(req) {
  return parseSessionFromCookie(req.headers.cookie)
}