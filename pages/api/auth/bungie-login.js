export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const authUrl = `https://www.bungie.net/en/OAuth/Authorize?client_id=${process.env.BUNGIE_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.NEXTAUTH_URL + '/api/auth/bungie-callback')}`;
  
  res.redirect(authUrl);
}
