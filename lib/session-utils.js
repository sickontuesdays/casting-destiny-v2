// lib/session-utils.js
// Utility functions for handling user sessions and authentication

import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)

/**
 * Extract and verify session from request cookies
 */
export async function getSessionFromRequest(req) {
  try {
    // Get session token from cookie (using underscore as shown in auth system)
    const sessionToken = req.cookies?.bungie_session
    
    if (!sessionToken) {
      console.log('No session cookie found')
      return null
    }

    // Verify JWT token using same secret as auth system
    const { payload } = await jwtVerify(sessionToken, secret)
    
    // Check if token is expired
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      console.log('Session token expired')
      return null
    }

    // Validate session has required data
    if (!payload.user || !payload.accessToken) {
      console.log('Invalid session structure:', {
        hasUser: !!payload.user,
        hasAccessToken: !!payload.accessToken
      })
      return null
    }

    return payload
    
  } catch (error) {
    console.error('Session verification failed:', error.message)
    return null
  }
}

/**
 * Get access token from session for Bungie API calls
 */
export async function getAccessTokenFromRequest(req) {
  const session = await getSessionFromRequest(req)
  return session?.accessToken || null
}

/**
 * Get user info from session
 */
export async function getUserFromRequest(req) {
  const session = await getSessionFromRequest(req)
  return session?.user || null
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(req) {
  const session = await getSessionFromRequest(req)
  return !!(session?.user && session?.accessToken)
}

/**
 * Get primary Destiny membership from session
 */
export async function getPrimaryMembershipFromRequest(req) {
  const session = await getSessionFromRequest(req)
  
  if (!session?.user?.destinyMemberships) {
    return null
  }

  // Find primary membership or use first available
  const memberships = session.user.destinyMemberships
  const primaryMembershipId = session.user.primaryMembershipId
  
  let primaryMembership = memberships.find(m => m.membershipId === primaryMembershipId)
  
  if (!primaryMembership && memberships.length > 0) {
    primaryMembership = memberships[0]
  }

  return primaryMembership
}

/**
 * Validate session and return both session and access token
 */
export async function requireAuthentication(req) {
  const session = await getSessionFromRequest(req)
  
  if (!session?.user || !session?.accessToken) {
    throw new Error('Authentication required')
  }

  const accessToken = session.accessToken
  const user = session.user
  
  return { session, accessToken, user }
}