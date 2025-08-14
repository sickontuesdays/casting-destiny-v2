export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Clear session cookie
    res.setHeader('Set-Cookie', [
      `bungie-session=; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax; Path=/; Max-Age=0`
    ])

    console.log('User logged out successfully')
    
    res.status(200).json({ success: true, message: 'Logged out successfully' })

  } catch (error) {
    console.error('Error during logout:', error)
    res.status(500).json({ 
      error: 'Logout failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}