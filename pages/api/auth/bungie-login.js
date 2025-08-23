// pages/api/auth/bungie-login.js
// Initiates Bungie OAuth flow with proper state management

import bungieOAuth from '../../../lib/bungie-oauth'

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check if OAuth is properly configured
    if (!process.env.BUNGIE_CLIENT_ID || !process.env.BUNGIE_CLIENT_SECRET || !process.env.BUNGIE_API_KEY) {
      console.error('Missing Bungie OAuth configuration')
      return res.status(500).json({ 
        error: 'OAuth not configured',
        missing: {
          clientId: !process.env.BUNGIE_CLIENT_ID,
          clientSecret: !process.env.BUNGIE_CLIENT_SECRET,
          apiKey: !process.env.BUNGIE_API_KEY
        }
      })
    }

    // Generate state for CSRF protection
    const state = bungieOAuth.generateState()
    
    // Store state in cookie for verification on callback
    // Using httpOnly cookie for security
    const isProduction = process.env.NODE_ENV === 'production'
    
    res.setHeader('Set-Cookie', [
      `oauth_state=${state}; HttpOnly; Secure=${isProduction}; SameSite=Lax; Path=/; Max-Age=600`
    ])

    // Get authorization URL
    const authUrl = bungieOAuth.getAuthorizationUrl(state)
    
    console.log('Initiating OAuth flow:', {
      clientId: process.env.BUNGIE_CLIENT_ID,
      redirectUri: bungieOAuth.redirectUri,
      state: state.substring(0, 8) + '...'
    })
    
    // Redirect to Bungie OAuth
    res.redirect(302, authUrl)

  } catch (error) {
    console.error('Error in bungie-login:', error)
    
    // In development, show more details
    if (process.env.NODE_ENV === 'development') {
      return res.status(500).json({ 
        error: 'Failed to initiate OAuth',
        details: error.message,
        stack: error.stack
      })
    }
    
    // In production, redirect with error
    res.redirect('/?error=oauth_init_failed')
  }
}