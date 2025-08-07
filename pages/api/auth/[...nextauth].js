import NextAuth from 'next-auth'

export default NextAuth({
  providers: [
    {
      id: "bungie",
      name: "Bungie",
      type: "oauth",
      authorization: {
        url: "https://www.bungie.net/en/oauth/authorize",
        params: {
          response_type: "code",
          client_id: process.env.BUNGIE_CLIENT_ID,
          scope: "" // Explicitly empty scope
        }
      },
      token: {
        url: "https://www.bungie.net/Platform/app/oauth/token/",
        params: {
          grant_type: "authorization_code"
        }
      },
      userinfo: "https://www.bungie.net/Platform/User/GetCurrentUser/",
      clientId: process.env.BUNGIE_CLIENT_ID,
      clientSecret: process.env.BUNGIE_CLIENT_SECRET,
      headers: { 
        "X-API-Key": process.env.BUNGIE_API_KEY 
      },
      checks: ["state"], // Only check state, not PKCE
      profile(profile) {
        console.log('=== PROFILE MAPPING ===')
        console.log('Profile membershipId:', profile.membershipId)
        console.log('Profile displayName:', profile.displayName)
        
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
      console.log('=== JWT CALLBACK ===')
      console.log('Has account:', !!account)
      console.log('Has profile:', !!profile)
      
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.bungieMembershipId = profile?.membershipId
        token.destinyMemberships = profile?.destinyMemberships || []
        console.log('JWT token updated with Bungie data')
      }
      return token
    },
    async session({ session, token }) {
      console.log('=== SESSION CALLBACK ===')
      console.log('Has token:', !!token)
      
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      session.bungieMembershipId = token.bungieMembershipId
      session.destinyMemberships = token.destinyMemberships
      console.log('Session updated with Bungie data')
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
  debug: true
})