export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Clear session cookie
  res.setHeader('Set-Cookie', [
    'bungie-session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
  ]);

  res.status(200).json({ success: true });
}