import { SignJWT } from 'jose';

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code, error, state } = req.query;

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error);
    return res.redirect('/?auth=error&reason=' + encodeURIComponent(error));
  }

  if (!code) {
    console.error('No authorization code received');
    return res.redirect('/?auth=error&reason=no_code');
  }

  try {
    console.log('Processing OAuth callback with code:', code.substring(0, 10) + '...');

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

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      return res.redirect('/?auth=error&reason=token_exchange_failed');
    }

    const tokens = await tokenResponse.json();
    console.log('Tokens received successfully');

    // Get user info with detailed membership information
    const userResponse = await fetch('https://www.bungie.net/Platform/User/GetMembershipsForCurrentUser/', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'X-API-Key': process.env.BUNGIE_API_KEY,
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.json();
      console.error('User info fetch failed:', errorData);
      return res.redirect('/?auth=error&reason=user_fetch_failed');
    }

    const userData = await userResponse.json();
    
    if (!userData.Response) {
      console.error('Invalid user data response:', userData);
      return res.redirect('/?auth=error&reason=invalid_user_data');
    }

    // Enhanced user data processing
    const bungieUser = userData.Response.bungieNetUser;
    const destinyMemberships = userData.Response.destinyMemberships || [];
    
    // Find primary membership (prefer Steam, then PlayStation, then Xbox)
    const primaryMembership = destinyMemberships.find(m => m.membershipType === 3) || // Steam
                             destinyMemberships.find(m => m.membershipType === 2) || // PlayStation 
                             destinyMemberships.find(m => m.membershipType === 1) || // Xbox
                             destinyMemberships[0]; // Fallback to first available

    // Create comprehensive session data
    const sessionData = {
      user: {
        id: bungieUser.membershipId,
        name: bungieUser.displayName,
        image: bungieUser.profilePicturePath ? 
          `https://bungie.net${bungieUser.profilePicturePath}` : null,
        bungieNetUser: {
          membershipId: bungieUser.membershipId,
          displayName: bungieUser.displayName,
          profilePicturePath: bungieUser.profilePicturePath,
          profileTheme: bungieUser.profileTheme,
          userTitle: bungieUser.userTitle,
          successMessageFlags: bungieUser.successMessageFlags,
          isDeleted: bungieUser.isDeleted,
          about: bungieUser.about,
          firstAccess: bungieUser.firstAccess,
          lastUpdate: bungieUser.lastUpdate
        },
        destinyMemberships: destinyMemberships.map(membership => ({
          membershipType: membership.membershipType,
          membershipId: membership.membershipId,
          displayName: membership.displayName,
          bungieGlobalDisplayName: membership.bungieGlobalDisplayName,
          bungieGlobalDisplayNameCode: membership.bungieGlobalDisplayNameCode,
          crossSaveOverride: membership.crossSaveOverride,
          applicableMembershipTypes: membership.applicableMembershipTypes,
          isPublic: membership.isPublic,
          membershipFlags: membership.membershipFlags,
          isPrimary: membership.membershipId === primaryMembership?.membershipId
        })),
        primaryMembership: primaryMembership ? {
          membershipType: primaryMembership.membershipType,
          membershipId: primaryMembership.membershipId,
          displayName: primaryMembership.displayName,
          platformName: getPlatformName(primaryMembership.membershipType)
        } : null
      },
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expires: Date.now() + (tokens.expires_in * 1000),
      tokenType: tokens.token_type || 'Bearer',
      scope: tokens.scope,
      createdAt: Date.now(),
      lastActivity: Date.now()
    };

    // Sign JWT with extended expiry for persistent login
    const jwt = await new SignJWT(sessionData)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d') // 30 days for persistent login
      .sign(secret);

    // Set secure, long-lived session cookie
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

    console.log('Session created successfully for user:', sessionData.user.name);

    // Redirect with success indication
    res.redirect('/?auth=success');

  } catch (error) {
    console.error('Auth callback error:', error);
    res.redirect('/?auth=error&reason=callback_error');
  }
}

// Helper function to get platform name
function getPlatformName(membershipType) {
  const platforms = {
    1: 'Xbox',
    2: 'PlayStation', 
    3: 'Steam',
    4: 'Battle.net',
    5: 'Stadia',
    6: 'Epic Games',
    10: 'Demon',
    254: 'BungieNext'
  };
  
  return platforms[membershipType] || 'Unknown';
}