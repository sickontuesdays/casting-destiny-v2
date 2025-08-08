import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)

export default async function handler(req, res) {
  console.log('Session API called:', req.method)
  
  if (req.method !== 'GET') {
    console.log('Invalid method:', req.method)
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const sessionCookie = req.cookies['bungie-session']
    console.log('Session cookie exists:', !!sessionCookie)
    
    if (!sessionCookie) {
      console.log('No session cookie found')
      return res.status(200).json(null)
    }

    const { payload } = await jwtVerify(sessionCookie, secret)
    console.log('JWT verified successfully')
    
    // Check if token is expired
    if (payload.expires && Date.now() > payload.expires) {
      console.log('Session expired')
      return res.status(200).json(null)
    }

    console.log('Returning valid session')
    res.status(200).json(payload)
  } catch (error) {
    console.error('Session verification failed:', error)
    res.status(200).json(null)
  }
}