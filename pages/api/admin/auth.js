export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const { password } = req.body
    
    if (!password) {
      return res.status(400).json({ error: 'Password required' })
    }

    if (password === process.env.ADMIN_PASSWORD) {
      return res.status(200).json({ success: true })
    } else {
      return res.status(401).json({ error: 'Invalid password' })
    }
  } catch (error) {
    console.error('Admin auth error:', error)
    return res.status(500).json({ error: 'Authentication failed' })
  }
}