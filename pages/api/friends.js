import { jwtVerify } from 'jose'
import fs from 'fs'
import path from 'path'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)

// Use /tmp directory in serverless environment, local data directory otherwise
const FRIENDS_DIR = process.env.VERCEL ? 
  '/tmp/friends' : 
  path.join(process.cwd(), 'data', 'friends')

async function getSessionFromRequest(req) {
  try {
    const sessionCookie = req.cookies['bungie-session']
    if (!sessionCookie) return null

    const { payload } = await jwtVerify(sessionCookie, secret)
    
    // Check if token is expired
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return null
    }

    return payload
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

function loadUserFriends(userId) {
  try {
    if (!fs.existsSync(FRIENDS_DIR)) {
      fs.mkdirSync(FRIENDS_DIR, { recursive: true })
    }
    
    const filePath = path.join(FRIENDS_DIR, `${userId}.json`)
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8')
      return JSON.parse(data)
    }
    
    // Return default structure
    return { 
      friends: [], 
      pendingRequests: [], 
      sentRequests: [] 
    }
  } catch (error) {
    console.error('Error loading friends data:', error)
    return { 
      friends: [], 
      pendingRequests: [], 
      sentRequests: [] 
    }
  }
}

function saveUserFriends(userId, friendsData) {
  try {
    if (!fs.existsSync(FRIENDS_DIR)) {
      fs.mkdirSync(FRIENDS_DIR, { recursive: true })
    }
    
    const filePath = path.join(FRIENDS_DIR, `${userId}.json`)
    fs.writeFileSync(filePath, JSON.stringify(friendsData, null, 2))
    return true
  } catch (error) {
    console.error('Error saving friends data:', error)
    return false
  }
}

export default async function handler(req, res) {
  // Get session from JWT
  const session = await getSessionFromRequest(req)
  
  if (!session?.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const userId = session.user.membershipId

  if (req.method === 'GET') {
    try {
      const friendsData = loadUserFriends(userId)
      res.status(200).json(friendsData)
    } catch (error) {
      console.error('Error getting friends:', error)
      res.status(500).json({ 
        error: 'Failed to load friends data',
        fallback: { friends: [], pendingRequests: [], sentRequests: [] }
      })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}