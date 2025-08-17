// pages/api/auth/logout.js
// API endpoint for handling user logout

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Clear the session cookie
    res.setHeader('Set-Cookie', [
      'bungie-session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax',
      'oauth-state=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
    ])
    
    console.log('User logged out successfully')
    
    return res.status(200).json({ 
      success: true,
      message: 'Logged out successfully'
    })
    
  } catch (error) {
    console.error('Logout error:', error)
    
    return res.status(500).json({ 
      error: 'Failed to logout',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}