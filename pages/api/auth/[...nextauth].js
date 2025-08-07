import NextAuth from 'next-auth'

// Custom Bungie provider that completely bypasses NextAuth's OAuth automation
const BungieProvider = {
  id: 'bungie',
  name: 'Bungie',
  type: 'oauth',
  authorization: 'https://www.bungie.net/en/oauth/authorize?response_type=code&client_id=' + process.env.BUNGIE_CLIENT_ID,
  token: {
    url: 'https://www.bungie.net/platform/app/oauth/token/',
    async request(context) {
      const tokenResponse = await fetch('https://www.bungie.net/platform/app/oauth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: context.params.code,
          client_id: process.env.BUNGIE_CLIENT_ID,
          client_secret: process.env.BUNGIE_CLIENT_SECRET
        })
      })

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorText}`)
      }

      const tokens = await tokenResponse.json()
      return { tokens }
    }
  },
  userinfo: {
    url: 'https://www.bungie.net/platform/User/GetCurrentUser/',
    async request({ tokens }) {
      const userResponse = await fetch('https://www.bungie.net/platform/User/GetCurrentUser/', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'X-API-Key': process.env.BUNGIE_API_KEY
        }
      })

      if (!userResponse.ok) {
        throw new Error(`User info request failed: ${userResponse.status}`)
      }

      const userData = await userResponse.json()
      
      if (userData.ErrorCode !== 1) {
        throw new Error(`Bungie API Error: ${userData.Message}`)
      }

      return userData.Response
    }
  },
  profile(profile) {
    return {
      id: profile.membershipId,
      name: profile.displayName || profile.bungieGlobalDisplayName || 'Guardian',
      email: profile.uniqueName + '@bungie.net', // Fake email since Bungie doesn't provide real emails
      bungieMembershipId: profile.membershipId,
      destinyMemberships: profile.destinyMemberships || []
    }
  },
  options: {
    clientId: process.env.BUNGIE_CLIENT_ID,
    clientSecret: process.env.BUNGIE_CLIENT_SECRET
  }
}

const options = {
  providers: [BungieProvider],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.bungieMembershipId = profile.membershipId
        token.destinyMemberships = profile.destinyMemberships || []
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      session.bungieMembershipId = token.bungieMembershipId
      session.destinyMemberships = token.destinyMemberships
      return session
    },
    async signIn({ user, account, profile }) {
      // Always allow sign in if we got this far
      return true
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
}

export default NextAuth(options)