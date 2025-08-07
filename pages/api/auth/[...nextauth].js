import NextAuth from 'next-auth'

const options = {
  providers: [
    {
      id: 'bungie',
      name: 'Bungie',
      type: 'oauth',
      version: '2.0',
      authorization: {
        url: 'https://www.bungie.net/en/oauth/authorize',
        params: {
          response_type: 'code',
          client_id: process.env.BUNGIE_CLIENT_ID
        }
      },
      token: {
        url: 'https://www.bungie.net/platform/app/oauth/token/',
        async request(context) {
          const response = await fetch('https://www.bungie.net/platform/app/oauth/token/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${Buffer.from(`${process.env.BUNGIE_CLIENT_ID}:${process.env.BUNGIE_CLIENT_SECRET}`).toString('base64')}`
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code: context.params.code,
              client_id: process.env.BUNGIE_CLIENT_ID
            })
          })
          
          if (!response.ok) {
            throw new Error(`Token request failed: ${response.statusText}`)
          }
          
          return await response.json()
        }
      },
      userinfo: {
        url: 'https://www.bungie.net/platform/User/GetCurrentUser/',
        async request({ tokens }) {
          const response = await fetch('https://www.bungie.net/platform/User/GetCurrentUser/', {
            headers: {
              'Authorization': `Bearer ${tokens.access_token}`,
              'X-API-Key': process.env.BUNGIE_API_KEY
            }
          })
          
          const data = await response.json()
          
          if (data.ErrorCode !== 1) {
            throw new Error(`Bungie API Error: ${data.Message}`)
          }
          
          return data.Response
        }
      },
      profile(profile) {
        return {
          id: profile.membershipId,
          name: profile.displayName || profile.bungieGlobalDisplayName,
          bungieMembershipId: profile.membershipId,
          destinyMemberships: profile.destinyMemberships || [],
          bungieGlobalDisplayName: profile.bungieGlobalDisplayName,
          bungieGlobalDisplayNameCode: profile.bungieGlobalDisplayNameCode
        }
      },
      clientId: process.env.BUNGIE_CLIENT_ID,
      clientSecret: process.env.BUNGIE_CLIENT_SECRET,
      checks: ['state']
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
}

export default NextAuth(options)