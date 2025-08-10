// pages/api/friends/respond.js
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
    const token = req.cookies['session-token']
    if (!token) return null

    const { payload } = await jwtVerify(token, secret)
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

    const { requestId, accept } = req.body
    const userId = session.user.membershipId

    if (!requestId || accept === undefined) {
      return res.status(400).json({ error: 'Request ID and accept status required' })
    }

    console.log(`Responding to friend request ${requestId}: ${accept ? 'accept' : 'decline'}`)

    // Load user's friends data
    const userFriends = loadUserFriends(userId)
    
    // Find the pending request
    const requestIndex = userFriends.pendingRequests?.findIndex(r => r.id === requestId) ?? -1
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Friend request not found' })
    }

    const request = userFriends.pendingRequests[requestIndex]
    const requesterId = request.requesterId

    // Remove from pending requests
    userFriends.pendingRequests.splice(requestIndex, 1)

    let requesterFriends = loadUserFriends(requesterId)

    if (accept) {
      // Add to both users' friends lists
      const currentTime = new Date().toISOString()
      
      // Add requester to current user's friends
      if (!userFriends.friends) userFriends.friends = []
      userFriends.friends.push({
        membershipId: requesterId,
        displayName: request.requesterName,
        displayNameCode: request.requesterCode || '',
        addedAt: currentTime,
        isOnline: false // We'd need to check this via API
      })
      
      // Add current user to requester's friends list
      if (!requesterFriends.friends) requesterFriends.friends = []
      requesterFriends.friends.push({
        membershipId: userId,
        displayName: session.user.displayName,
        displayNameCode: session.user.displayNameCode || '',
        addedAt: currentTime,
        isOnline: false
      })

      console.log(`Friend request accepted: ${requesterId} and ${userId} are now friends`)
    } else {
      console.log(`Friend request declined: ${requesterId} -> ${userId}`)
    }

    // Remove from requester's sent requests
    if (!requesterFriends.sentRequests) requesterFriends.sentRequests = []
    requesterFriends.sentRequests = requesterFriends.sentRequests.filter(
      r => r.targetUserId !== userId
    )

    // Save both users' friend data
    const userSaveSuccess = saveUserFriends(userId, userFriends)
    const requesterSaveSuccess = saveUserFriends(requesterId, requesterFriends)

    if (!userSaveSuccess || !requesterSaveSuccess) {
      return res.status(500).json({ error: 'Failed to save friend data' })
    }

    res.status(200).json({ 
      success: true,
      message: accept ? 'Friend request accepted' : 'Friend request declined',
      action: accept ? 'accepted' : 'declined'
    })

  } catch (error) {
    console.error('Error responding to friend request:', error)
    res.status(500).json({ 
      error: 'Failed to respond to friend request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}