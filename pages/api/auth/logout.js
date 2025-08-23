// pages/api/auth/logout.js
// API endpoint for handling user logout with proper cookie cleanup

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const isProduction = process.env.NODE_ENV === 'production'
    
    // Clear all authentication-related cookies
    const cookiesToClear = [
      'bungie_session',
      'oauth_state',
      'session_token',
      'bungie-session', // Legacy cookie name if exists
      'oauth-state'     // Legacy cookie name if exists
    ]
    
    const clearCookies = cookiesToClear.map(cookieName => 
      `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure=${isProduction}; SameSite=Lax`
    )
    
    res.setHeader('Set-Cookie', clearCookies)
    
    console.log('User logged out successfully, cookies cleared')
    
    // Optional: If you want to revoke the token at Bungie's end
    // This would require the access token from the session
    // For now, we're just clearing local session
    
    return res.status(200).json({ 
      success: true,
      message: 'Logged out successfully'
    })
    
  } catch (error) {
    console.error('Logout error:', error)
    
    // Even if there's an error, try to clear cookies
    const isProduction = process.env.NODE_ENV === 'production'
    res.setHeader('Set-Cookie', [
      `bungie_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure=${isProduction}; SameSite=Lax`,
      `oauth_state=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure=${isProduction}; SameSite=Lax`
    ])
    
    return res.status(500).json({ 
      error: 'Logout encountered an error, but session was cleared',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}