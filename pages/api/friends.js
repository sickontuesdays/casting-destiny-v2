import { jwtVerify } from 'jose'
import fs from 'fs'
import path from 'path'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)

// Use /tmp directory in serverless environment, local data directory otherwise
const FRIENDS_DIR = process.env.VERCEL ? 
  '/tmp/friends' : 
  path.join(process.cwd(), 'data', 'friends')

// Ensure directory exists
if (!fs.existsSync(FRIENDS_DIR)) {
  fs.mkdirSync(FRIENDS_DIR, { recursive: true })
}

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

function getFriendsFilePath(userId) {
  return path.join(FRIENDS_DIR, `${userId}.json`)
}

function loadUserFriends(userId) {
  try {
    const filePath = getFriendsFilePath(userId)
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
    const filePath = getFriendsFilePath(userId)
    fs.writeFileSync(filePath, JSON.stringify(friendsData, null, 2))
    return true
  } catch (error) {
    console.error('Error saving friends data:', error)
    return false
  }
}

export default async function handler(req, res) {
  try {
    // Get session from JWT
    const session = await getSessionFromRequest(req)
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId = session.user.membershipId
    const method = req.method
    const { type } = req.query

    switch (method) {
      case 'GET':
        return handleGetFriends(req, res, userId, type)
      
      case 'POST':
        return handleFriendAction(req, res, userId, session)
        
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }

  } catch (error) {
    console.error('Error in friends API:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

async function handleGetFriends(req, res, userId, type) {
  try {
    const friendsData = loadUserFriends(userId)
    
    if (type === 'pending') {
      return res.status(200).json({ 
        success: true,
        requests: friendsData.pendingRequests || []
      })
    }
    
    return res.status(200).json({ 
      success: true,
      friends: friendsData.friends || [],
      pendingCount: (friendsData.pendingRequests || []).length
    })

  } catch (error) {
    console.error('Error getting friends:', error)
    res.status(500).json({ error: 'Failed to load friends' })
  }
}

async function handleFriendAction(req, res, userId, session) {
  const { action, targetUserId, requestId, accept, searchTerm } = req.body
  
  // Route to specific action handlers
  switch (req.url) {
    case '/api/friends/search':
      return handleSearch(req, res, searchTerm, session)
      
    case '/api/friends/request':
      return handleSendRequest(req, res, userId, targetUserId, session)
      
    case '/api/friends/respond':
      return handleRespondToRequest(req, res, userId, requestId, accept)
      
    case '/api/friends/remove':
      return handleRemoveFriend(req, res, userId, req.body.friendId)
      
    default:
      return res.status(400).json({ error: 'Invalid friend action' })
  }
}

async function handleSearch(req, res, searchTerm, session) {
  try {
    if (!searchTerm || searchTerm.length < 3) {
      return res.status(400).json({ error: 'Search term must be at least 3 characters' })
    }

    // Search for users via Bungie API
    const searchUrl = `https://www.bungie.net/Platform/Destiny2/SearchDestinyPlayer/-1/${encodeURIComponent(searchTerm)}/`
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'X-API-Key': process.env.BUNGIE_API_KEY,
        'Authorization': `Bearer ${session.accessToken}`
      }
    })

    if (!searchResponse.ok) {
      if (searchResponse.status === 403) {
        return res.status(403).json({ error: 'Origin header does not match the provided API key' })
      }
      throw new Error(`Bungie search failed: ${searchResponse.status}`)
    }

    const searchData = await searchResponse.json()
    
    if (searchData.ErrorCode !== 1) {
      return res.status(400).json({ error: searchData.Message || 'Search failed' })
    }

    // Process search results
    const users = (searchData.Response || []).map(player => ({
      membershipId: player.membershipId,
      membershipType: player.membershipType,
      displayName: player.displayName,
      bungieGlobalDisplayName: player.bungieGlobalDisplayName,
      bungieGlobalDisplayNameCode: player.bungieGlobalDisplayNameCode
    }))

    // Check which users are already friends
    const currentUserFriends = loadUserFriends(session.user.membershipId)
    const friendIds = new Set(currentUserFriends.friends.map(f => f.membershipId))
    const sentRequestIds = new Set(currentUserFriends.sentRequests.map(r => r.targetUserId))

    const enrichedUsers = users.map(user => ({
      ...user,
      isFriend: friendIds.has(user.membershipId),
      requestSent: sentRequestIds.has(user.membershipId)
    }))

    res.status(200).json({ 
      success: true,
      users: enrichedUsers 
    })

  } catch (error) {
    console.error('Error searching users:', error)
    res.status(500).json({ error: 'Search failed' })
  }
}

async function handleSendRequest(req, res, userId, targetUserId, session) {
  try {
    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID required' })
    }

    if (userId === targetUserId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' })
    }

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

    // Add to sender's sent requests
    const requestData = {
      id: `${userId}-${targetUserId}-${Date.now()}`,
      targetUserId,
      sentAt: new Date().toISOString()
    }
    
    senderFriends.sentRequests.push(requestData)
    saveUserFriends(userId, senderFriends)

    // Add to recipient's pending requests
    const recipientFriends = loadUserFriends(targetUserId)
    recipientFriends.pendingRequests.push({
      id: requestData.id,
      requesterId: userId,
      requesterName: session.user.displayName,
      createdAt: requestData.sentAt
    })
    saveUserFriends(targetUserId, recipientFriends)

    res.status(200).json({ 
      success: true,
      message: 'Friend request sent successfully'
    })

  } catch (error) {
    console.error('Error sending friend request:', error)
    res.status(500).json({ error: 'Failed to send friend request' })
  }
}

async function handleRespondToRequest(req, res, userId, requestId, accept) {
  try {
    if (!requestId || accept === undefined) {
      return res.status(400).json({ error: 'Request ID and accept status required' })
    }

    // Load user's friends data
    const userFriends = loadUserFriends(userId)
    
    // Find the pending request
    const requestIndex = userFriends.pendingRequests.findIndex(r => r.id === requestId)
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Friend request not found' })
    }

    const request = userFriends.pendingRequests[requestIndex]
    const requesterId = request.requesterId

    // Remove from pending requests
    userFriends.pendingRequests.splice(requestIndex, 1)

    if (accept) {
      // Add to both users' friends lists
      const friendData = {
        membershipId: requesterId,
        displayName: request.requesterName,
        addedAt: new Date().toISOString()
      }
      
      userFriends.friends.push(friendData)
      
      // Add to requester's friends list
      const requesterFriends = loadUserFriends(requesterId)
      requesterFriends.friends.push({
        membershipId: userId,
        displayName: 'Friend', // We'd need to look this up
        addedAt: new Date().toISOString()
      })
      
      // Remove from requester's sent requests
      requesterFriends.sentRequests = requesterFriends.sentRequests.filter(
        r => r.targetUserId !== userId
      )
      
      saveUserFriends(requesterId, requesterFriends)
    } else {
      // Just remove from requester's sent requests
      const requesterFriends = loadUserFriends(requesterId)
      requesterFriends.sentRequests = requesterFriends.sentRequests.filter(
        r => r.targetUserId !== userId
      )
      saveUserFriends(requesterId, requesterFriends)
    }

    saveUserFriends(userId, userFriends)

    res.status(200).json({ 
      success: true,
      message: accept ? 'Friend request accepted' : 'Friend request declined'
    })

  } catch (error) {
    console.error('Error responding to friend request:', error)
    res.status(500).json({ error: 'Failed to respond to friend request' })
  }
}

async function handleRemoveFriend(req, res, userId, friendId) {
  try {
    if (!friendId) {
      return res.status(400).json({ error: 'Friend ID required' })
    }

    // Remove from current user's friends
    const userFriends = loadUserFriends(userId)
    userFriends.friends = userFriends.friends.filter(f => f.membershipId !== friendId)
    saveUserFriends(userId, userFriends)

    // Remove from friend's friends list
    const friendFriends = loadUserFriends(friendId)
    friendFriends.friends = friendFriends.friends.filter(f => f.membershipId !== userId)
    saveUserFriends(friendId, friendFriends)

    res.status(200).json({ 
      success: true,
      message: 'Friend removed successfully'
    })

  } catch (error) {
    console.error('Error removing friend:', error)
    res.status(500).json({ error: 'Failed to remove friend' })
  }
}