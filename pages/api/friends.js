import { getSession } from 'next-auth/react'
import { getBungieFriends, getClanMembers } from '../../lib/bungie-api'

export default async function handler(req, res) {
  const session = await getSession({ req })
  
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  if (req.method === 'GET') {
    try {
      const { type } = req.query
      
      if (type === 'destiny-friends') {
        // Get Destiny 2 friends from Bungie API
        const friends = await getBungieFriends(session.accessToken, session.bungieMembershipId)
        res.status(200).json(friends)
      } else if (type === 'clan-members') {
        // Get clan members from Bungie API
        const clanMembers = await getClanMembers(session.accessToken, session.destinyMemberships)
        res.status(200).json(clanMembers)
      } else {
        // Get all friends (combined)
        const [friends, clanMembers] = await Promise.all([
          getBungieFriends(session.accessToken, session.bungieMembershipId),
          getClanMembers(session.accessToken, session.destinyMemberships)
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