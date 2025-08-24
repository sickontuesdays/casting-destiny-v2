import BungieAPIService from '../../../lib/bungie-api-service'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)

async function getSessionFromCookie(req) {
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
    console.error('Session verification failed:', error)
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get session from cookie
    const session = await getSessionFromCookie(req)
    
    if (!session?.user || !session.accessToken) {
      console.log('Bungie friends API: Authentication failed')
      return res.status(401).json({ error: 'Authentication required' })
    }

    console.log(`Loading Bungie friends for user: ${session.user.displayName}`)

    // Initialize Bungie API service
    const bungieAPI = new BungieAPIService()
    
    // Get user's primary Destiny membership for clan data
    const { primaryMembership } = await bungieAPI.getDestinyMemberships(session.accessToken)
    
    // Get friends list from Bungie (Bungie friends + clan members)
    const [bungieFriends, clanMembers] = await Promise.all([
      bungieAPI.getBungieFriends(session.accessToken).catch(error => {
        console.warn('Failed to load Bungie friends:', error.message)
        return []
      }),
      primaryMembership ? 
        bungieAPI.getClanMembers(
          primaryMembership.membershipType,
          primaryMembership.membershipId,
          session.accessToken
        ).catch(error => {
          console.warn('Failed to load clan members:', error.message)
          return []
        }) : 
        Promise.resolve([])
    ])

    // Combine and deduplicate friends
    const friendsMap = new Map()
    
    // Add Bungie friends
    bungieFriends.forEach(friend => {
      if (friend.membershipId && friend.membershipId !== session.user.membershipId) {
        friendsMap.set(friend.membershipId, {
          ...friend,
          source: 'bungie',
          type: 'bungie_friend',
          canShareBuilds: true,
          displayName: friend.displayName || 'Unknown User',
          isOnline: friend.isOnline || false
        })
      }
    })
    
    // Add clan members (avoid duplicates)
    clanMembers.forEach(member => {
      const membershipId = member.membershipId || member.destinyMembershipId
      if (membershipId && membershipId !== session.user.membershipId) {
        if (!friendsMap.has(membershipId)) {
          friendsMap.set(membershipId, {
            membershipId,
            displayName: member.displayName || 'Clan Member',
            source: 'clan',
            type: 'clan_member',
            canShareBuilds: true,
            isOnline: member.isOnline || false,
            joinDate: member.joinDate,
            membershipType: member.membershipType
          })
        } else {
          // Update existing friend to show they're also in clan
          const existing = friendsMap.get(membershipId)
          existing.source = 'bungie_and_clan'
          existing.isInClan = true
          existing.joinDate = member.joinDate
        }
      }
    })

    const allFriends = Array.from(friendsMap.values())
    
    // Sort friends: online first, then by display name
    allFriends.sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1
      if (!a.isOnline && b.isOnline) return 1
      return (a.displayName || '').localeCompare(b.displayName || '')
    })

    console.log(`Bungie friends loaded successfully:`, {
      bungieFriends: bungieFriends.length,
      clanMembers: clanMembers.length,
      totalUnique: allFriends.length,
      user: session.user.displayName
    })

    const response = {
      success: true,
      friends: allFriends,
      summary: {
        total: allFriends.length,
        bungieFriends: bungieFriends.length,
        clanMembers: clanMembers.length,
        online: allFriends.filter(f => f.isOnline).length,
        sources: {
          bungie: allFriends.filter(f => f.source === 'bungie').length,
          clan: allFriends.filter(f => f.source === 'clan').length,
          both: allFriends.filter(f => f.source === 'bungie_and_clan').length
        }
      },
      lastUpdated: new Date().toISOString()
    }

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 'private, max-age=300')
    res.status(200).json(response)

  } catch (error) {
    console.error('Error loading Bungie friends:', error)
    
    // Check for specific error types
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      return res.status(401).json({ 
        error: 'Authentication expired. Please sign in again.',
        code: 'AUTH_EXPIRED'
      })
    }
    
    if (error.message?.includes('503') || error.message?.includes('Maintenance')) {
      return res.status(503).json({ 
        error: 'Bungie.net is currently under maintenance.',
        code: 'SERVICE_UNAVAILABLE'
      })
    }
    
    res.status(500).json({ 
      error: 'Failed to load friends from Bungie',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'FRIENDS_LOAD_FAILED'
    })
  }
}