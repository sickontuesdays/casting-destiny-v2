import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const sessionCookie = req.cookies['bungie-session']
    
    if (!sessionCookie) {
      return res.status(401).json({ error: 'No session found' })
    }

    // Verify JWT token
    const { payload } = await jwtVerify(sessionCookie, secret)
    
    // Check if token is expired
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      // Clear expired session cookie
      res.setHeader('Set-Cookie', [
        `bungie-session=; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax; Path=/; Max-Age=0`
      ])
      
      return res.status(401).json({ error: 'Session expired' })
    }

    // Return session data
    const sessionData = {
      user: payload.user,
      accessToken: payload.accessToken,
      expiresAt: payload.expiresAt,
      issuedAt: payload.issuedAt
    }

    res.status(200).json(sessionData)

  } catch (error) {
    console.error('Session verification failed:', error)
    
    // Clear invalid session cookie
    res.setHeader('Set-Cookie', [
      `bungie-session=; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax; Path=/; Max-Age=0`
    ])
    
    res.status(401).json({ error: 'Invalid session' })
  }
}