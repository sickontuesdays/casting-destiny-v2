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
    // Use correct cookie name (bungie_session with underscore)
    const sessionCookie = req.cookies['bungie_session']
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
      console.log('Friends request API: Authentication failed - no session or user')
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { targetUserId, targetDisplayName } = req.body

    if (!targetUserId || !targetDisplayName) {
      return res.status(400).json({ error: 'Target user ID and display name are required' })
    }

    const userId = session.user.membershipId

    // Don't allow self friend requests
    if (userId === targetUserId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' })
    }

    console.log(`Processing friend request: ${session.user.displayName} -> ${targetDisplayName}`)

    // Load current user's friend data
    const userFriends = loadUserFriends(userId)
    if (!userFriends.friends) userFriends.friends = []
    if (!userFriends.sentRequests) userFriends.sentRequests = []
    if (!userFriends.pendingRequests) userFriends.pendingRequests = []

    // Check if already friends
    const existingFriend = userFriends.friends.find(f => f.membershipId === targetUserId)
    if (existingFriend) {
      return res.status(400).json({ error: 'User is already your friend' })
    }

    // Check if request already sent
    const existingSentRequest = userFriends.sentRequests.find(r => r.membershipId === targetUserId)
    if (existingSentRequest) {
      return res.status(400).json({ error: 'Friend request already sent to this user' })
    }

    // Check if there's already a pending request from target user (auto-accept)
    const existingPendingRequest = userFriends.pendingRequests.find(r => r.membershipId === targetUserId)
    
    if (existingPendingRequest) {
      console.log('Auto-accepting existing friend request')
      
      // Remove from pending requests
      userFriends.pendingRequests = userFriends.pendingRequests.filter(r => r.membershipId !== targetUserId)
      
      // Add to friends
      const newFriend = {
        membershipId: targetUserId,
        displayName: targetDisplayName,
        addedAt: new Date().toISOString(),
        platform: 'bungie'
      }
      userFriends.friends.push(newFriend)

      // Load target user's data and update
      const targetFriends = loadUserFriends(targetUserId)
      if (!targetFriends.friends) targetFriends.friends = []
      if (!targetFriends.sentRequests) targetFriends.sentRequests = []

      // Remove from target user's sent requests and add to friends
      targetFriends.sentRequests = targetFriends.sentRequests.filter(r => r.membershipId !== userId)
      targetFriends.friends.push({
        membershipId: userId,
        displayName: session.user.displayName,
        addedAt: new Date().toISOString(),
        platform: 'bungie'
      })

      // Save both users' data
      const userSaved = saveUserFriends(userId, userFriends)
      const targetSaved = saveUserFriends(targetUserId, targetFriends)

      if (!userSaved || !targetSaved) {
        return res.status(500).json({ error: 'Failed to save friend relationship' })
      }

      return res.status(200).json({
        success: true,
        message: 'Friend request accepted automatically',
        newFriend
      })
    }

    // Create new friend request
    const friendRequest = {
      membershipId: targetUserId,
      displayName: targetDisplayName,
      sentAt: new Date().toISOString(),
      platform: 'bungie'
    }

    // Add to current user's sent requests
    userFriends.sentRequests.push(friendRequest)

    // Load target user's data
    const targetFriends = loadUserFriends(targetUserId)
    if (!targetFriends.pendingRequests) targetFriends.pendingRequests = []

    // Add to target user's pending requests
    targetFriends.pendingRequests.push({
      membershipId: userId,
      displayName: session.user.displayName,
      sentAt: new Date().toISOString(),
      platform: 'bungie'
    })

    // Save both users' data
    const userSaved = saveUserFriends(userId, userFriends)
    const targetSaved = saveUserFriends(targetUserId, targetFriends)

    if (!userSaved || !targetSaved) {
      return res.status(500).json({ error: 'Failed to send friend request' })
    }

    console.log(`Friend request sent successfully: ${session.user.displayName} -> ${targetDisplayName}`)

    res.status(200).json({
      success: true,
      message: 'Friend request sent successfully',
      sentRequest: friendRequest
    })

  } catch (error) {
    console.error('Error processing friend request:', error)
    res.status(500).json({ 
      error: 'Failed to process friend request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}