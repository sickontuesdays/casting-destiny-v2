import { SignJWT } from 'jose';

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code, error } = req.query;

  if (error) {
    return res.redirect('/?error=oauth_error');
  }

  if (!code) {
    return res.redirect('/?error=no_code');
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://www.bungie.net/platform/app/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-API-Key': process.env.BUNGIE_API_KEY,
      },
      body: new URLSearchParams({
        client_id: process.env.BUNGIE_CLIENT_ID,
        client_secret: process.env.BUNGIE_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokens);
      return res.redirect('/?error=token_exchange_failed');
    }

    // Get user info
    const userResponse = await fetch('https://www.bungie.net/Platform/User/GetMembershipsForCurrentUser/', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'X-API-Key': process.env.BUNGIE_API_KEY,
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok || !userData.Response) {
      console.error('User info fetch failed:', userData);
      return res.redirect('/?error=user_fetch_failed');
    }

    // Create JWT session token
    const sessionData = {
      user: {
        id: userData.Response.bungieNetUser.membershipId,
        name: userData.Response.bungieNetUser.displayName,
        image: userData.Response.bungieNetUser.profilePicturePath ? 
          `https://bungie.net${userData.Response.bungieNetUser.profilePicturePath}` : null,
        bungieNetUser: userData.Response.bungieNetUser,
        destinyMemberships: userData.Response.destinyMemberships,
      },
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expires: Date.now() + (tokens.expires_in * 1000),
    };

    const jwt = await new SignJWT(sessionData)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);

    // Set session cookie
    res.setHeader('Set-Cookie', [
      `bungie-session=${jwt}; HttpOnly; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
    ]);

    res.redirect('/?success=logged_in');
  } catch (error) {
    console.error('Auth callback error:', error);
    res.redirect('/?error=callback_error');
  }
}
