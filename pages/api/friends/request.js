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
    return { friends: [], pendingRequests: [], sentRequests: [] }
  } catch (error) {
    console.error('Error loading friends data:', error)
    return { friends: [], pendingRequests: [], sentRequests: [] }
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get session from JWT
    const session = await getSessionFromRequest(req)
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { targetUserId, targetDisplayName } = req.body
    const userId = session.user.membershipId

    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID required' })
    }

    if (userId === targetUserId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' })
    }

    console.log(`Processing friend request: ${userId} -> ${targetUserId}`)

    // Load current user's friends data
    const senderFriends = loadUserFriends(userId)
    
    // Check if already friends
    const isAlreadyFriend = senderFriends.friends.some(f => f.membershipId === targetUserId)
    if (isAlreadyFriend) {
      return res.status(400).json({ error: 'Already friends with this user' })
    }

    // Check if request already sent
    const requestAlreadySent = senderFriends.sentRequests.some(r => r.targetUserId === targetUserId)
    if (requestAlreadySent) {
      return res.status(400).json({ error: 'Friend request already sent' })
    }

    // Create request data
    const requestData = {
      id: `${userId}-${targetUserId}-${Date.now()}`,
      targetUserId,
      targetDisplayName: targetDisplayName || 'Unknown User',
      sentAt: new Date().toISOString()
    }

    // Add to sender's sent requests
    if (!senderFriends.sentRequests) senderFriends.sentRequests = []
    senderFriends.sentRequests.push(requestData)
    
    const senderSaveSuccess = saveUserFriends(userId, senderFriends)
    if (!senderSaveSuccess) {
      return res.status(500).json({ error: 'Failed to save sender friend request' })
    }

    // Add to recipient's pending requests
    const recipientFriends = loadUserFriends(targetUserId)
    if (!recipientFriends.pendingRequests) recipientFriends.pendingRequests = []
    
    recipientFriends.pendingRequests.push({
      id: requestData.id,
      requesterId: userId,
      requesterName: session.user.displayName,
      requesterCode: session.user.displayNameCode || '',
      createdAt: requestData.sentAt
    })

    const recipientSaveSuccess = saveUserFriends(targetUserId, recipientFriends)
    if (!recipientSaveSuccess) {
      // Rollback sender's sent request
      senderFriends.sentRequests = senderFriends.sentRequests.filter(r => r.id !== requestData.id)
      saveUserFriends(userId, senderFriends)
      
      return res.status(500).json({ error: 'Failed to save recipient friend request' })
    }

    console.log(`Friend request sent successfully: ${userId} -> ${targetUserId}`)

    res.status(200).json({ 
      success: true,
      message: 'Friend request sent successfully',
      requestId: requestData.id
    })

  } catch (error) {
    console.error('Error sending friend request:', error)
    res.status(500).json({ 
      error: 'Failed to send friend request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}