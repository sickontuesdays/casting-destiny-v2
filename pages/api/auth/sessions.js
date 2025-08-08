import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const sessionCookie = req.cookies['bungie-session'];
    
    if (!sessionCookie) {
      return res.status(200).json(null);
    }

    const { payload } = await jwtVerify(sessionCookie, secret);
    
    // Check if token is expired
    if (payload.expires && Date.now() > payload.expires) {
      return res.status(200).json(null);
    }

    res.status(200).json(payload);
  } catch (error) {
    console.error('Session verification failed:', error);
    res.status(200).json(null);
  }
}