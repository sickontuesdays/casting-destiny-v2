import { jwtVerify, SignJWT } from 'jose';

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
const ACTIVITY_UPDATE_THRESHOLD = 5 * 60 * 1000; // Update activity every 5 minutes

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
      console.log('Session expired, clearing cookie');
      
      // Clear expired session cookie
      res.setHeader('Set-Cookie', [
        'bungie-session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
      ]);
      
      return res.status(200).json(null);
    }

    // Update last activity if enough time has passed
    const now = Date.now();
    const shouldUpdateActivity = !payload.lastActivity || 
                                (now - payload.lastActivity) > ACTIVITY_UPDATE_THRESHOLD;

    if (shouldUpdateActivity) {
      // Update session with new activity timestamp
      const updatedSession = {
        ...payload,
        lastActivity: now
      };

      // Re-sign JWT with updated activity
      const jwt = await new SignJWT(updatedSession)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(secret);

      // Update cookie
      const cookieOptions = [
        `bungie-session=${jwt}`,
        'HttpOnly',
        'Path=/',
        `Max-Age=${30 * 24 * 60 * 60}`, // 30 days
        'SameSite=Lax'
      ];

      if (process.env.NODE_ENV === 'production') {
        cookieOptions.push('Secure');
      }

      res.setHeader('Set-Cookie', cookieOptions.join('; '));
    }

    // Return session data (excluding sensitive tokens)
    const sessionResponse = {
      user: payload.user,
      expires: payload.expires,
      createdAt: payload.createdAt,
      lastActivity: payload.lastActivity || payload.createdAt,
      tokenType: payload.tokenType,
      scope: payload.scope,
      isValid: true,
      timeUntilExpiry: payload.expires ? payload.expires - now : null
    };

    res.status(200).json(sessionResponse);

  } catch (error) {
    console.error('Session verification failed:', error);
    
    // Clear invalid session cookie
    res.setHeader('Set-Cookie', [
      'bungie-session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
    ]);
    
    res.status(200).json(null);
  }
}