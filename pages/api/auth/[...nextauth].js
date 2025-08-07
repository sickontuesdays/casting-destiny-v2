import NextAuth from 'next-auth'

export default NextAuth({
  providers: [
    {
      id: "bungie",
      name: "Bungie",
      type: "oauth",
      authorization: "https://www.bungie.net/en/oauth/authorize?response_type=code",
      token: "https://www.bungie.net/Platform/app/oauth/token/",
      userinfo: "https://www.bungie.net/Platform/User/GetCurrentUser/",
      clientId: process.env.BUNGIE_CLIENT_ID,
      clientSecret: process.env.BUNGIE_CLIENT_SECRET,
      headers: { 
        "X-API-Key": process.env.BUNGIE_API_KEY 
      },
      profile(profile) {
        return {
          id: profile.membershipId,
          name: profile.displayName || profile.bungieGlobalDisplayName,
          bungieMembershipId: profile.membershipId,
          destinyMemberships: profile.destinyMemberships || []
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
  },
  debug: process.env.NODE_ENV === 'development'
})