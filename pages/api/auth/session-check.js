import { getSessionFromRequest } from '../../../lib/auth-config'

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = getSessionFromRequest(req)
    
    if (session) {
      return res.status(200).json(session)
    } else {
      return res.status(200).json({ user: null })
    }
  } catch (error) {
    console.error('Error checking session:', error)
    return res.status(500).json({ error: 'Session check failed' })
  }
}