// pages/api/auth/session.js
// API endpoint for checking user session status

import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get session token from cookie
    const token = req.cookies['bungie-session']
    
    if (!token) {
      return res.status(401).json({ 
        authenticated: false,
        message: 'No session found'
      })
    }
    
    // Verify JWT token
    const { payload } = await jwtVerify(token, secret)
    
    // Check if session is expired
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return res.status(401).json({ 
        authenticated: false,
        message: 'Session expired'
      })
    }
    
    // Return session data
    return res.status(200).json({
      authenticated: true,
      user: payload.user,
      memberships: payload.memberships,
      primaryMembership: payload.primaryMembership,
      expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null
    })
    
  } catch (error) {
    console.error('Session verification error:', error)
    
    // Invalid or expired token
    return res.status(401).json({ 
      authenticated: false,
      message: 'Invalid session',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}