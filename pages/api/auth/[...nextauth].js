import NextAuth from 'next-auth'

export default NextAuth({
  providers: [
    {
      id: 'bungie',
      name: 'Bungie',
      type: 'oauth',
      wellKnown: undefined, // Disable auto-discovery
      authorization: {
        url: 'https://www.bungie.net/en/OAuth/Authorize',
        params: {
          client_id: process.env.BUNGIE_CLIENT_ID,
          response_type: 'code',
        }
      },
      token: {
        url: 'https://www.bungie.net/platform/app/oauth/token/',
        params: {
          grant_type: 'authorization_code',
        },
        async request(context) {
          const { params } = context;
          
          const body = new URLSearchParams({
            client_id: process.env.BUNGIE_CLIENT_ID,
            client_secret: process.env.BUNGIE_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: params.code,
          });

          const response = await fetch('https://www.bungie.net/platform/app/oauth/token/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'X-API-Key': process.env.BUNGIE_API_KEY,
            },
            body: body.toString(),
          });

          const tokens = await response.json();
          
          if (!response.ok) {
            console.error('Token exchange failed:', tokens);
            throw new Error(`Token exchange failed: ${JSON.stringify(tokens)}`);
          }

          return {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
            token_type: tokens.token_type,
          };
        },
      },
      userinfo: {
        url: 'https://www.bungie.net/Platform/User/GetMembershipsForCurrentUser/',
        async request(context) {
          const response = await fetch('https://www.bungie.net/Platform/User/GetMembershipsForCurrentUser/', {
            headers: {
              'Authorization': `Bearer ${context.tokens.access_token}`,
              'X-API-Key': process.env.BUNGIE_API_KEY,
            },
          });

          const data = await response.json();
          
          if (!response.ok || !data.Response) {
            console.error('User info fetch failed:', data);
            throw new Error(`Failed to fetch user info: ${JSON.stringify(data)}`);
          }

          return data.Response;
        },
      },
      profile(profile) {
        return {
          id: profile.bungieNetUser.membershipId,
          name: profile.bungieNetUser.displayName,
          email: profile.bungieNetUser.displayName + '@bungie.local', // NextAuth needs an email
          image: profile.bungieNetUser.profilePicturePath ? 
            `https://bungie.net${profile.bungieNetUser.profilePicturePath}` : null,
          bungieNetUser: profile.bungieNetUser,
          destinyMemberships: profile.destinyMemberships,
        };
      },
      clientId: process.env.BUNGIE_CLIENT_ID,
      clientSecret: process.env.BUNGIE_CLIENT_SECRET,
      client: {
        authorization_signed_response_alg: undefined,
        id_token_signed_response_alg: undefined,
      },
      checks: ['none'], // Disable PKCE and state checks that might interfere
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.bungieNetUser = profile?.bungieNetUser;
        token.destinyMemberships = profile?.destinyMemberships;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.bungieNetUser = token.bungieNetUser;
      session.user.destinyMemberships = token.destinyMemberships;
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  debug: true,
});
