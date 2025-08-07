import NextAuth from 'next-auth'

export default NextAuth({
  providers: [
    {
      id: 'bungie',
      name: 'Bungie',
      type: 'oauth',
      authorization: {
        url: 'https://www.bungie.net/en/oauth/authorize',
        params: {
          response_type: 'code',
          client_id: process.env.BUNGIE_CLIENT_ID,
          scope: 'ReadUserData ReadUserInfo'
        }
      },
      token: 'https://www.bungie.net/platform/app/oauth/token/',
      userinfo: {
        url: 'https://www.bungie.net/platform/User/GetCurrentUser/',
        async request({ tokens, client }) {
          const response = await fetch('https://www.bungie.net/platform/User/GetCurrentUser/', {
            headers: {
              'Authorization': `Bearer ${tokens.access_token}`,
              'X-API-Key': process.env.BUNGIE_API_KEY
            }
          })
          const data = await response.json()
          return data.Response
        }
      },
      clientId: process.env.BUNGIE_CLIENT_ID,
      clientSecret: process.env.BUNGIE_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.membershipId,
          name: profile.displayName,
          bungieMembershipId: profile.membershipId,
          destinyMemberships: profile.destinyMemberships || [],
          bungieGlobalDisplayName: profile.bungieGlobalDisplayName,
          bungieGlobalDisplayNameCode: profile.bungieGlobalDisplayNameCode
        }
      }
    }
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.bungieMembershipId = profile?.membershipId
        token.destinyMemberships = profile?.destinyMemberships || []
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      session.bungieMembershipId = token.bungieMembershipId
      session.destinyMemberships = token.destinyMemberships
      return session
    }
  },
  pages: {
    signIn: '/',
    error: '/'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  }
})