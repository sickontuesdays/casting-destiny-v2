// pages/api/friends/search.js
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

    const { searchTerm } = req.body

    if (!searchTerm || searchTerm.length < 3) {
      return res.status(400).json({ error: 'Search term must be at least 3 characters' })
    }

    console.log(`Searching for users: "${searchTerm}"`)

    // Search for users via Bungie API
    const searchUrl = `https://www.bungie.net/Platform/Destiny2/SearchDestinyPlayer/-1/${encodeURIComponent(searchTerm)}/`
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'X-API-Key': process.env.BUNGIE_API_KEY,
        'Authorization': `Bearer ${session.accessToken}`
      }
    })

    if (!searchResponse.ok) {
      console.error('Bungie search API error:', searchResponse.status)
      
      if (searchResponse.status === 403) {
        return res.status(403).json({ 
          error: 'Origin header does not match the provided API key' 
        })
      }
      
      return res.status(searchResponse.status).json({ 
        error: `Bungie search failed: ${searchResponse.status}` 
      })
    }

    const searchData = await searchResponse.json()
    
    if (searchData.ErrorCode !== 1) {
      return res.status(400).json({ 
        error: searchData.Message || 'Search failed' 
      })
    }

    // Process search results
    const users = (searchData.Response || []).map(player => ({
      membershipId: player.membershipId,
      membershipType: player.membershipType,
      displayName: player.displayName,
      bungieGlobalDisplayName: player.bungieGlobalDisplayName,
      bungieGlobalDisplayNameCode: player.bungieGlobalDisplayNameCode
    }))

    // Filter out current user
    const filteredUsers = users.filter(user => user.membershipId !== session.user.membershipId)

    // Check which users are already friends or have pending requests
    const currentUserFriends = loadUserFriends(session.user.membershipId)
    const friendIds = new Set(currentUserFriends.friends?.map(f => f.membershipId) || [])
    const sentRequestIds = new Set(currentUserFriends.sentRequests?.map(r => r.targetUserId) || [])

    const enrichedUsers = filteredUsers.map(user => ({
      ...user,
      isFriend: friendIds.has(user.membershipId),
      requestSent: sentRequestIds.has(user.membershipId)
    }))

    console.log(`Found ${enrichedUsers.length} users for search: "${searchTerm}"`)

    res.status(200).json({ 
      success: true,
      users: enrichedUsers 
    })

  } catch (error) {
    console.error('Error searching users:', error)
    res.status(500).json({ 
      error: 'Search failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}