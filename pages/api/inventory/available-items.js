// pages/api/inventory/available-items.js
// Get available items for build customization - Bungie API only

import { IconUtils } from '../../../lib/icon-utils.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { slot, search, class: classType, rarity } = req.query
    
    console.log('Loading available items from Bungie API:', {
      slot,
      search,
      classType,
      rarity
    })

    // Get absolute URL for server-side API calls
    const baseUrl = req.headers['x-forwarded-host'] 
      ? `https://${req.headers['x-forwarded-host']}`
      : process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // Load manifest from Bungie API
    const manifestResponse = await fetch(`${baseUrl}/api/bungie/manifest`, {
      headers: {
        'X-API-Key': process.env.BUNGIE_API_KEY
      }
    })

    if (!manifestResponse.ok) {
      throw new Error(`Failed to load manifest: ${manifestResponse.status}`)
    }

    const manifest = await manifestResponse.json()
    const items = manifest.data?.DestinyInventoryItemDefinition || {}

    if (!items || Object.keys(items).length === 0) {
      console.warn('No items found in manifest')
      return res.status(200).json([])
    }

    // Filter items based on parameters
    let filteredItems = Object.values(items).filter(item => {
      if (!item || !item.displayProperties?.name) return false
      if (item.redacted) return false

      // Filter by slot (bucket hash)
      if (slot) {
        const slotBuckets = {
          'helmet': 3448274439,
          'arms': 3551918588,
          'chest': 14239492,
          'legs': 20886954,
          'classItem': 1585787867,
          'kinetic': 1498876634,
          'energy': 2465295065,
          'power': 953998645,
          'heavy': 953998645
        }
        
        if (slotBuckets[slot] && item.inventory?.bucketTypeHash !== slotBuckets[slot]) {
          return false
        }
      }

      // Filter by class type
      if (classType && classType !== 'any') {
        const classMapping = {
          'titan': 0,
          'hunter': 1,
          'warlock': 2
        }
        if (item.classType !== 3 && item.classType !== classMapping[classType]) {
          return false
        }
      }

      // Filter by rarity
      if (rarity && rarity !== 'all') {
        const rarityMapping = {
          'exotic': 6,
          'legendary': 5,
          'rare': 4,
          'uncommon': 3,
          'common': 2
        }
        if (item.inventory?.tierType !== rarityMapping[rarity]) {
          return false
        }
      }

      // Filter by search term
      if (search) {
        const searchTerm = search.toLowerCase()
        const name = item.displayProperties.name.toLowerCase()
        const description = item.displayProperties.description?.toLowerCase() || ''
        
        if (!name.includes(searchTerm) && !description.includes(searchTerm)) {
          return false
        }
      }

      // Only include weapons and armor
      const validTypes = [2, 3] // 2 = Armor, 3 = Weapon
      if (!validTypes.includes(item.itemType)) {
        return false
      }

      return true
    })

    // Limit results for performance
    filteredItems = filteredItems.slice(0, 50)

    // Format items for frontend
    const formattedItems = filteredItems.map(item => ({
      hash: item.hash,
      name: item.displayProperties.name,
      description: item.displayProperties.description || '',
      icon: IconUtils.getItemIcon(item),
      itemType: item.itemType,
      itemSubType: item.itemSubType,
      classType: item.classType,
      bucketTypeHash: item.inventory?.bucketTypeHash,
      tierType: item.inventory?.tierType,
      tierTypeName: item.inventory?.tierTypeName,
      isExotic: item.inventory?.tierType === 6,
      isLegendary: item.inventory?.tierType === 5,
      damageType: item.defaultDamageType,
      damageTypeIcon: item.defaultDamageType ? IconUtils.getElementIcon(item.defaultDamageType) : null,
      stats: item.investmentStats?.map(stat => ({
        statTypeHash: stat.statTypeHash,
        value: stat.value
      })) || [],
      perks: item.perks?.map(perk => ({
        perkHash: perk.perkHash,
        iconPath: perk.iconPath ? IconUtils.getBungieIconUrl(perk.iconPath) : null
      })) || [],
      socket: {
        socketEntries: item.sockets?.socketEntries?.slice(0, 5).map(entry => ({
          socketTypeHash: entry.socketTypeHash,
          plugSources: entry.plugSources
        })) || []
      }
    }))

    console.log(`Found ${formattedItems.length} available items from Bungie manifest`)

    // Cache for 30 minutes
    res.setHeader('Cache-Control', 'public, max-age=1800')
    res.status(200).json(formattedItems)

  } catch (error) {
    console.error('Error loading available items:', error)
    res.status(500).json({ 
      error: 'Failed to load available items from Bungie API',
      details: error.message,
      note: 'This endpoint only uses Bungie API data - no local fallbacks'
    })
  }
}