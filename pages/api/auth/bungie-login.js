// Custom Bungie OAuth login initiator
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authUrl = new URL('https://www.bungie.net/en/oauth/authorize')
  
  authUrl.searchParams.append('client_id', process.env.BUNGIE_CLIENT_ID)
  authUrl.searchParams.append('response_type', 'code')
  authUrl.searchParams.append('redirect_uri', `${process.env.NEXTAUTH_URL}/api/auth/bungie-callback-custom`)
  authUrl.searchParams.append('state', Math.random().toString(36).substring(2))
  
  console.log('=== CUSTOM LOGIN REDIRECT ===')
  console.log('Redirecting to:', authUrl.toString())
  console.log('Client ID:', process.env.BUNGIE_CLIENT_ID)
  console.log('Redirect URI:', `${process.env.NEXTAUTH_URL}/api/auth/bungie-callback-custom`)

  res.redirect(authUrl.toString())
}