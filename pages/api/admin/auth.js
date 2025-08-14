export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { password } = req.body

    if (!password) {
      return res.status(400).json({ error: 'Password is required' })
    }

    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD environment variable not set')
      return res.status(500).json({ error: 'Admin authentication not configured' })
    }

    // Simple password comparison (in production, you might want to use bcrypt)
    if (password === adminPassword) {
      // Set admin session cookie
      res.setHeader('Set-Cookie', [
        `admin-session=authenticated; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax; Path=/; Max-Age=3600`
      ])

      console.log('Admin authentication successful')
      
      res.status(200).json({ 
        success: true,
        message: 'Admin authentication successful'
      })
    } else {
      console.log('Admin authentication failed: incorrect password')
      
      res.status(401).json({ 
        error: 'Invalid admin password'
      })
    }

  } catch (error) {
    console.error('Admin authentication error:', error)
    res.status(500).json({ 
      error: 'Authentication failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}