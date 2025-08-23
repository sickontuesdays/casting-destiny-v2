// pages/api/auth/session.js
// API endpoint for checking and refreshing user session

import bungieOAuth from '../../../lib/bungie-oauth'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get session token from cookie
    const sessionToken = req.cookies?.bungie_session
    
    if (!sessionToken) {
      return res.status(200).json({ 
        authenticated: false,
        user: null,
        message: 'No session found'
      })
    }
    
    // Verify JWT token
    const sessionData = await bungieOAuth.verifySessionToken(sessionToken)
    
    if (!sessionData) {
      // Clear invalid session cookie
      const isProduction = process.env.NODE_ENV === 'production'
      res.setHeader('Set-Cookie', [
        `bungie_session=; HttpOnly; Secure=${isProduction}; SameSite=Lax; Path=/; Max-Age=0`
      ])
      
      return res.status(200).json({ 
        authenticated: false,
        user: null,
        message: 'Invalid or expired session'
      })
    }
    
    // Check if token needs refresh (refresh if less than 1 hour remaining)
    const timeUntilExpiry = sessionData.expiresAt - Date.now()
    const shouldRefresh = timeUntilExpiry < (60 * 60 * 1000) // 1 hour
    
    let updatedSession = sessionData
    
    if (shouldRefresh && sessionData.refreshToken) {
      try {
        console.log('Refreshing access token...')
        
        // Attempt to refresh the token
        const refreshResponse = await bungieOAuth.refreshAccessToken(sessionData.refreshToken)
        
        if (refreshResponse.access_token) {
          // Update session data with new tokens
          updatedSession = {
            ...sessionData,
            accessToken: refreshResponse.access_token,
            refreshToken: refreshResponse.refresh_token || sessionData.refreshToken,
            expiresAt: Date.now() + (refreshResponse.expires_in * 1000),
            expiresIn: refreshResponse.expires_in,
            lastRefreshed: Date.now()
          }
          
          // Create new session token with updated data
          const newSessionToken = await bungieOAuth.createSessionToken(updatedSession)
          
          // Update session cookie
          const isProduction = process.env.NODE_ENV === 'production'
          res.setHeader('Set-Cookie', [
            `bungie_session=${newSessionToken}; HttpOnly; Secure=${isProduction}; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`
          ])
          
          console.log('Token refreshed successfully')
        }
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError)
        // Continue with existing session if refresh fails
        // User will need to re-authenticate when token expires
      }
    }
    
    // Return session data (without sensitive tokens)
    return res.status(200).json({
      authenticated: true,
      user: updatedSession.user,
      expiresAt: new Date(updatedSession.expiresAt).toISOString(),
      timeUntilExpiry: updatedSession.expiresAt - Date.now(),
      needsRefresh: shouldRefresh && !updatedSession.lastRefreshed
    })
    
  } catch (error) {
    console.error('Session check error:', error)
    
    // Clear any invalid session
    const isProduction = process.env.NODE_ENV === 'production'
    res.setHeader('Set-Cookie', [
      `bungie_session=; HttpOnly; Secure=${isProduction}; SameSite=Lax; Path=/; Max-Age=0`
    ])
    
    return res.status(200).json({ 
      authenticated: false,
      user: null,
      message: 'Session check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}