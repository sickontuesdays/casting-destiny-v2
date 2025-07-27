import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Refresh token required' 
      });
    }

    // Verify the current session to get user info
    const sessionCookie = req.cookies['bungie-session'];
    if (!sessionCookie) {
      return res.status(401).json({ 
        success: false, 
        error: 'No active session' 
      });
    }

    let currentSession;
    try {
      const { payload } = await jwtVerify(sessionCookie, secret);
      currentSession = payload;
    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid session' 
      });
    }

    // Use refresh token to get new access token from Bungie
    const tokenResponse = await fetch('https://www.bungie.net/platform/app/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-API-Key': process.env.BUNGIE_API_KEY,
      },
      body: new URLSearchParams({
        client_id: process.env.BUNGIE_CLIENT_ID,
        client_secret: process.env.BUNGIE_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token refresh failed:', errorData);
      
      return res.status(401).json({
        success: false,
        error: 'Token refresh failed',
        details: errorData.error_description || 'Invalid refresh token'
      });
    }

    const tokens = await tokenResponse.json();

    // Create new session with refreshed tokens
    const newSessionData = {
      ...currentSession,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || refreshToken, // Use new refresh token if provided
      expires: Date.now() + (tokens.expires_in * 1000),
      refreshedAt: Date.now()
    };

    // Sign new JWT
    const jwt = await new SignJWT(newSessionData)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);

    // Update session cookie
    res.setHeader('Set-Cookie', [
      `bungie-session=${jwt}; HttpOnly; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
    ]);

    // Return new session data (without sensitive tokens)
    const responseData = {
      success: true,
      user: newSessionData.user,
      expires: newSessionData.expires,
      refreshedAt: newSessionData.refreshedAt
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during token refresh',
      details: error.message
    });
  }
}