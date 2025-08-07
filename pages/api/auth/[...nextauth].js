import NextAuth from 'next-auth'

export default NextAuth({
  providers: [
    {
      id: "bungie",
      name: "Bungie",
      type: "oauth",
      authorization: "https://www.bungie.net/en/oauth/authorize?response_type=code",
      token: "https://www.bungie.net/Platform/app/oauth/token/",
      userinfo: {
        url: "https://www.bungie.net/Platform/User/GetCurrentUser/",
        async request({ tokens, provider }) {
          console.log('=== BUNGIE USERINFO REQUEST ===')
          console.log('Access token exists:', !!tokens.access_token)
          console.log('API key exists:', !!process.env.BUNGIE_API_KEY)
          
          const response = await fetch("https://www.bungie.net/Platform/User/GetCurrentUser/", {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              "X-API-Key": process.env.BUNGIE_API_KEY,
            },
          })
          
          console.log('Userinfo response status:', response.status)
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error('Userinfo request failed:', response.status, errorText)
            throw new Error(`Userinfo request failed: ${response.status}`)
          }
          
          const data = await response.json()
          console.log('Bungie API ErrorCode:', data.ErrorCode)
          console.log('Has Response:', !!data.Response)
          
          if (data.ErrorCode !== 1) {
            console.error('Bungie API Error:', data.Message)
            throw new Error(`Bungie API Error: ${data.Message}`)
          }
          
          return data.Response
        }
      },
      clientId: process.env.BUNGIE_CLIENT_ID,
      clientSecret: process.env.BUNGIE_CLIENT_SECRET,
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