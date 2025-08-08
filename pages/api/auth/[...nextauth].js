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
        async request({ params, provider }) {
          console.log('=== CUSTOM TOKEN REQUEST ===')
          console.log('Token request params:', params)
          
          const response = await fetch("https://www.bungie.net/Platform/app/oauth/token/", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code: params.code,
              client_id: process.env.BUNGIE_CLIENT_ID,
              client_secret: process.env.BUNGIE_CLIENT_SECRET
            })
          })
          
          console.log('Token response status:', response.status)
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error('Token exchange failed:', response.status, errorText)
            throw new Error(`Token exchange failed: ${response.status}`)
          }
          
          const tokens = await response.json()
          console.log('Token exchange successful, expires in:', tokens.expires_in)
          
          // Now get user info immediately after token exchange
          const userResponse = await fetch('https://www.bungie.net/Platform/User/GetCurrentUser/', {
            headers: {
              'Authorization': `Bearer ${tokens.access_token}`,
              'X-API-Key': process.env.BUNGIE_API_KEY
            }
          })
          
          console.log('User info response status:', userResponse.status)
          
          if (userResponse.ok) {
            const userData = await userResponse.json()
            if (userData.ErrorCode === 1) {
              console.log('User data retrieved successfully')
              // Add user data to token response
              tokens.userInfo = userData.Response
            } else {
              console.error('Bungie API Error:', userData.Message)
            }
          } else {
            const errorText = await userResponse.text()
            console.error('User info request failed:', userResponse.status, errorText)
          }
          
          return { tokens }
        }
      },
      userinfo: {
        // Skip userinfo request since we get it in token exchange
        request: () => null
      },
      clientId: process.env.BUNGIE_CLIENT_ID,
      clientSecret: process.env.BUNGIE_CLIENT_SECRET,
      checks: ["state"],
      profile(profile, tokens) {
        console.log('=== PROFILE MAPPING ===')
        console.log('Has userInfo in tokens:', !!tokens.userInfo)
        
        // Use user data from token exchange
        const userData = tokens.userInfo
        if (!userData) {
          throw new Error('No user data available')
        }
        
        console.log('User membershipId:', userData.membershipId)
        console.log('User displayName:', userData.displayName)
        
        return {
          id: userData.membershipId,
          name: userData.displayName || userData.bungieGlobalDisplayName,
          bungieMembershipId: userData.membershipId,
          destinyMemberships: userData.destinyMemberships || []
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
        token.bungieMembershipId = profile?.bungieMembershipId
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