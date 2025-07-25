import NextAuth from 'next-auth'

const BUNGIE_AUTHORIZATION_URL = 'https://www.bungie.net/en/OAuth/Authorize'
const BUNGIE_TOKEN_URL = 'https://www.bungie.net/platform/app/oauth/token/'

export default NextAuth({
  providers: [
    {
      id: 'bungie',
      name: 'Bungie',
      type: 'oauth',
      authorization: {
        url: BUNGIE_AUTHORIZATION_URL,
        params: {
          client_id: process.env.BUNGIE_CLIENT_ID,
          response_type: 'code',
        },
      },
      token: {
        url: BUNGIE_TOKEN_URL,
        async request({ client, params, checks, provider }) {
          const response = await fetch(BUNGIE_TOKEN_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'X-API-Key': process.env.BUNGIE_API_KEY,
            },
            body: new URLSearchParams({
              client_id: process.env.BUNGIE_CLIENT_ID,
              client_secret: process.env.BUNGIE_CLIENT_SECRET,
              grant_type: 'authorization_code',
              code: params.code,
            }),
          });
          
          return await response.json();
        },
      },
      userinfo: {
        async request({ tokens }) {
          const response = await fetch('https://www.bungie.net/Platform/User/GetMembershipsForCurrentUser/', {
            headers: {
              'Authorization': `Bearer ${tokens.access_token}`,
              'X-API-Key': process.env.BUNGIE_API_KEY,
            },
          });
          
          const data = await response.json();
          return data.Response;
        },
      },
      profile(profile) {
        return {
          id: profile.bungieNetUser.membershipId,
          name: profile.bungieNetUser.displayName,
          image: `https://bungie.net${profile.bungieNetUser.profilePicturePath}`,
          bungieNetUser: profile.bungieNetUser,
          destinyMemberships: profile.destinyMemberships,
        };
      },
      clientId: process.env.BUNGIE_CLIENT_ID,
      clientSecret: process.env.BUNGIE_CLIENT_SECRET,
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
  pages: {
    signIn: '/auth/signin',
  },
});
