import { getBungieFriends, getClanMembers } from '../../lib/bungie-api'

// Helper function to get session from cookie
function getSessionFromCookie(req) {
  try {
    const cookies = req.headers.cookie || ''
    const sessionCookie = cookies.split(';').find(cookie => cookie.trim().startsWith('bungie_session='))
    
    if (!sessionCookie) return null
    
    const sessionData = sessionCookie.split('=')[1]
    const decodedSession = JSON.parse(Buffer.from(sessionData, 'base64').toString())
    
    // Check if session is still valid
    if (decodedSession.expiresAt > Date.now()) {
      return decodedSession
    }
    
    return null
  } catch (error) {
    console.error('Error parsing session cookie:', error)
    return null
  }
}

export default async function handler(req, res) {
  const session = getSessionFromCookie(req)
  
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  if (req.method === 'GET') {
    try {
      const { type } = req.query
      
      if (type === 'destiny-friends') {
        // Get Destiny 2 friends from Bungie API
        const friends = await getBungieFriends(session.accessToken, session.user.bungieMembershipId)
        res.status(200).json(friends)
      } else if (type === 'clan-members') {
        // Get clan members from Bungie API
        const clanMembers = await getClanMembers(session.accessToken, session.user.destinyMemberships)
        res.status(200).json(clanMembers)
      } else {
        // Get all friends (combined)
        const [friends, clanMembers] = await Promise.all([
          getBungieFriends(session.accessToken, session.user.bungieMembershipId),
          getClanMembers(session.accessToken, session.user.destinyMemberships)
        ])
        
        // Combine and deduplicate
        const allFriends = [...friends, ...clanMembers]
        const uniqueFriends = allFriends.filter((friend, index, self) => 
          index === self.findIndex(f => f.membershipId === friend.membershipId)
        )
        
        res.status(200).json(uniqueFriends)
      }
    } catch (error) {
      console.error('Error fetching friends:', error)
      res.status(500).json({ error: 'Failed to fetch friends' })
    }
  } else if (req.method === 'POST') {
    try {
      const { action, friendId, buildId, message } = req.body
      
      if (action === 'share-build') {
        // Share build with friend (simplified implementation)
        // In a full implementation, this would send a notification or message
        res.status(200).json({ 
          success: true, 
          message: 'Build shared successfully' 
        })
      } else if (action === 'send-message') {
        // Send message to friend (simplified implementation)
        res.status(200).json({ 
          success: true, 
          message: 'Message sent successfully' 
        })
      } else {
        res.status(400).json({ error: 'Invalid action' })
      }
    } catch (error) {
      console.error('Error processing friend action:', error)
      res.status(500).json({ error: 'Failed to process request' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}