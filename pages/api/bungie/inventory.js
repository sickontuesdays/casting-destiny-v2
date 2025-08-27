// pages/api/bungie/inventory.js
// Fixed - eliminates 4MB manifest loading that causes Vercel limit errors

import { getSessionFromRequest } from '../../../lib/session-utils'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get session using our session utility
    const session = await getSessionFromRequest(req)
    
    if (!session?.user || !session.accessToken) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    console.log(`📦 Loading inventory for user: ${session.user.displayName}`)

    // FIXED: Make direct calls to Bungie API without loading large manifest
    // This bypasses the 4MB Vercel limit by not proxying large data through API routes
    
    const membershipType = session.user.membershipType
    const membershipId = session.user.membershipId
    const accessToken = session.accessToken

    // Get character list (small data)
    const characterResponse = await fetch(`https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/?components=100`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-API-Key': process.env.BUNGIE_API_KEY
      }
    })

    if (!characterResponse.ok) {
      throw new Error(`Bungie API error: ${characterResponse.status}`)
    }

    const characterData = await characterResponse.json()
    
    if (characterData.ErrorCode !== 1) {
      throw new Error(`Bungie API error: ${characterData.ErrorStatus}`)
    }

    const characters = characterData.Response.profile?.data?.characterIds || []
    
    console.log(`✅ Found ${characters.length} characters`)

    // Return minimal response - let frontend handle full inventory loading via bungie-api-service.js
    const response = {
      success: true,
      message: 'Use BungieApiService for full inventory data',
      characters: characters.map(id => ({ characterId: id })),
      membership: {
        membershipType,
        membershipId,
        displayName: session.user.displayName
      },
      note: 'This endpoint only provides character IDs. Use lib/bungie-api-service.js for full inventory data to avoid 4MB limits.',
      recommendation: 'Frontend should call Bungie APIs directly using BungieApiService class'
    }

    // Cache briefly
    res.setHeader('Cache-Control', 'private, max-age=60')
    res.status(200).json(response)

  } catch (error) {
    console.error('❌ Inventory API error:', error)
    
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      return res.status(401).json({ 
        error: 'Authentication expired. Please sign in again.',
        code: 'AUTH_EXPIRED'
      })
    }
    
    res.status(500).json({ 
      error: 'Failed to get inventory info',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'INVENTORY_API_FAILED'
    })
  }
}