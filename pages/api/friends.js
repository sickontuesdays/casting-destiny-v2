// pages/api/friends.js
// Redirect to new Bungie friends API for backward compatibility

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Redirect to new Bungie friends endpoint
    try {
      console.log('Redirecting /api/friends to /api/bungie/friends')
      
      // Forward the request to the new Bungie friends API
      const baseUrl = req.headers.host?.includes('localhost') 
        ? `http://${req.headers.host}` 
        : `https://${req.headers.host}`
      
      const response = await fetch(`${baseUrl}/api/bungie/friends`, {
        method: 'GET',
        headers: {
          'Cookie': req.headers.cookie || '',
          'Cache-Control': req.headers['cache-control'] || 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Bungie friends API returned ${response.status}`)
      }
      
      const data = await response.json()
      
      // Transform response to match old API format for compatibility
      const compatibleResponse = {
        friends: data.friends || [],
        pendingRequests: [], // No longer used with Bungie system
        sentRequests: [], // No longer used with Bungie system
        summary: data.summary,
        lastUpdated: data.lastUpdated
      }
      
      res.setHeader('Cache-Control', 'private, max-age=300')
      res.status(200).json(compatibleResponse)
      
    } catch (error) {
      console.error('Error redirecting to Bungie friends API:', error)
      res.status(500).json({ 
        error: 'Failed to load friends from Bungie',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  } else {
    // All other methods (POST for requests, etc.) are no longer supported
    res.status(410).json({ 
      error: 'Friend requests are no longer supported. Friends are now loaded from your Bungie.net friends list.',
      message: 'Please add friends on Bungie.net to see them in Casting Destiny v2.'
    })
  }
}