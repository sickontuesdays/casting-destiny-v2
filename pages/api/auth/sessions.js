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
    
    if (payload.expires && Date.now() > payload.expires) {
      return res.status(200).json(null);
    }

    return res.status(200).json(payload);
  } catch (error) {
    return res.status(200).json(null);
  }
}