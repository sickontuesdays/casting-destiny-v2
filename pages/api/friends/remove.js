// pages/api/friends/remove.js
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

    const { friendId } = req.body
    const userId = session.user.membershipId

    if (!friendId) {
      return res.status(400).json({ error: 'Friend ID required' })
    }

    if (userId === friendId) {
      return res.status(400).json({ error: 'Cannot remove yourself as a friend' })
    }

    console.log(`Removing friendship between ${userId} and ${friendId}`)

    // Load current user's friends data
    const userFriends = loadUserFriends(userId)
    
    // Check if they are actually friends
    const friendIndex = userFriends.friends?.findIndex(f => f.membershipId === friendId) ?? -1
    if (friendIndex === -1) {
      return res.status(404).json({ error: 'User is not in your friends list' })
    }

    const friendData = userFriends.friends[friendIndex]

    // Remove from current user's friends list
    userFriends.friends.splice(friendIndex, 1)

    // Load friend's data and remove current user from their friends list
    const friendFriends = loadUserFriends(friendId)
    if (!friendFriends.friends) friendFriends.friends = []
    
    friendFriends.friends = friendFriends.friends.filter(f => f.membershipId !== userId)

    // Save both users' updated friend data
    const userSaveSuccess = saveUserFriends(userId, userFriends)
    const friendSaveSuccess = saveUserFriends(friendId, friendFriends)

    if (!userSaveSuccess || !friendSaveSuccess) {
      // Try to rollback if one save failed
      if (userSaveSuccess && !friendSaveSuccess) {
        userFriends.friends.push(friendData) // Add back to current user's list
        saveUserFriends(userId, userFriends)
      }
      
      return res.status(500).json({ error: 'Failed to remove friend' })
    }

    console.log(`Friendship removed successfully: ${userId} and ${friendId}`)

    res.status(200).json({ 
      success: true,
      message: 'Friend removed successfully',
      removedFriend: {
        membershipId: friendId,
        displayName: friendData.displayName
      }
    })

  } catch (error) {
    console.error('Error removing friend:', error)
    res.status(500).json({ 
      error: 'Failed to remove friend',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}