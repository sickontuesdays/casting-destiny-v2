// pages/api/inventory/exotics.js
// API endpoint for fetching exotic items (both owned and available)

import { requireAuthentication } from '../../../lib/session-utils'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get authentication data using the proper session system
    const { session, accessToken, user } = await requireAuthentication(req)
    
    console.log(`Loading exotic items for user: ${user.displayName}`)

    // Get primary Destiny membership
    const destinyMemberships = user.destinyMemberships || []
    const primaryMembershipId = user.primaryMembershipId
    
    let primaryMembership = destinyMemberships.find(m => m.membershipId === primaryMembershipId)
    if (!primaryMembership && destinyMemberships.length > 0) {
      primaryMembership = destinyMemberships[0]
    }
    
    if (!primaryMembership) {
      return res.status(404).json({ error: 'No Destiny account found' })
    }

    // Get user's complete inventory from Bungie API
    const inventoryUrl = `https://www.bungie.net/Platform/Destiny2/${primaryMembership.membershipType}/Profile/${primaryMembership.membershipId}/?components=102,201,205,300,302,304,305,307,308,310`
    
    const inventoryResponse = await fetch(inventoryUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-API-Key': process.env.BUNGIE_API_KEY
      }
    })

    if (!inventoryResponse.ok) {
      throw new Error(`Failed to fetch inventory: ${inventoryResponse.status}`)
    }

    const inventoryData = await inventoryResponse.json()
    
    if (inventoryData.ErrorCode !== 1) {
      throw new Error(`Bungie API Error: ${inventoryData.Message}`)
    }

    // Get manifest from Bungie API for item definitions
    const manifestUrl = 'https://www.bungie.net/Platform/Destiny2/Manifest/'
    const manifestResponse = await fetch(manifestUrl, {
      headers: {
        'X-API-Key': process.env.BUNGIE_API_KEY
      }
    })

    const manifestMeta = await manifestResponse.json()
    if (manifestMeta.ErrorCode !== 1) {
      throw new Error(`Failed to get manifest metadata: ${manifestMeta.Message}`)
    }

    // Download the JSON manifest data
    const jsonPath = manifestMeta.Response.jsonWorldContentPaths.en
    const fullManifestUrl = `https://www.bungie.net${jsonPath}`
    
    const fullManifestResponse = await fetch(fullManifestUrl)
    const manifest = await fullManifestResponse.json()

    // Extract exotic items from inventory
    const profile = inventoryData.Response
    const allItems = []
    
    // Collect items from all characters and vault
    if (profile.characterEquipment?.data) {
      for (const characterId in profile.characterEquipment.data) {
        const equipment = profile.characterEquipment.data[characterId].items || []
        allItems.push(...equipment)
      }
    }
    
    if (profile.characterInventories?.data) {
      for (const characterId in profile.characterInventories.data) {
        const inventory = profile.characterInventories.data[characterId].items || []
        allItems.push(...inventory)
      }
    }
    
    if (profile.profileInventory?.data?.items) {
      allItems.push(...profile.profileInventory.data.items)
    }

    // Filter for exotic items and get their definitions
    const exoticItems = []
    const itemInstances = profile.itemComponents?.instances?.data || {}
    const itemStats = profile.itemComponents?.stats?.data || {}
    const itemSockets = profile.itemComponents?.sockets?.data || {}
    
    for (const item of allItems) {
      const itemDef = manifest.DestinyInventoryItemDefinition[item.itemHash]
      
      if (!itemDef) continue
      
      // Check if item is exotic (tierType 6)
      const isExotic = itemDef.inventory?.tierType === 6
      
      // Check if it's a weapon or armor piece
      const isWeaponOrArmor = itemDef.itemType === 3 || itemDef.itemType === 2
      
      if (isExotic && isWeaponOrArmor) {
        // Get item instance data
        const instance = itemInstances[item.itemInstanceId] || {}
        const stats = itemStats[item.itemInstanceId]?.stats || {}
        const sockets = itemSockets[item.itemInstanceId]?.sockets || []
        
        // Get damage type for weapons
        let damageType = null
        if (itemDef.itemType === 3 && instance.damageType) {
          const damageTypeDef = manifest.DestinyDamageTypeDefinition[instance.damageType]
          damageType = damageTypeDef?.displayProperties?.name || 'Kinetic'
        }
        
        // Get element for armor
        let element = null
        if (itemDef.itemType === 2) {
          // Check sockets for element
          for (const socket of sockets) {
            if (socket.plugHash) {
              const plugDef = manifest.DestinyInventoryItemDefinition[socket.plugHash]
              if (plugDef?.plug?.energyCost?.energyType) {
                const energyTypeDef = manifest.DestinyEnergyTypeDefinition[plugDef.plug.energyCost.energyType]
                element = energyTypeDef?.displayProperties?.name
                break
              }
            }
          }
          
          // Fallback to checking inventory bucket for armor type
          if (!element) {
            const bucketHash = itemDef.inventory?.bucketTypeHash
            
            // Armor bucket hashes and their typical elements
            const armorBuckets = {
              3448274439: 'Helmet',
              14239492: 'Gauntlets', 
              20886954: 'Chest Armor',
              1585787867: 'Leg Armor',
              4023194814: 'Class Item'
            }
            
            // Default elements for new armor system
            element = 'Solar' // Default, will be updated by actual socket data
          }
        }
        
        const processedItem = {
          itemHash: item.itemHash,
          itemInstanceId: item.itemInstanceId,
          quantity: item.quantity,
          name: itemDef.displayProperties?.name || 'Unknown Item',
          description: itemDef.displayProperties?.description || '',
          icon: `https://www.bungie.net${itemDef.displayProperties?.icon || '/common/destiny2_content/icons/default.jpg'}`,
          screenshot: itemDef.screenshot ? `https://www.bungie.net${itemDef.screenshot}` : null,
          itemType: itemDef.itemType,
          itemSubType: itemDef.itemSubType,
          classType: itemDef.classType,
          tierType: itemDef.inventory?.tierType || 0,
          element: damageType || element || 'Unknown',
          powerLevel: instance.primaryStat?.value || 0,
          masterwork: instance.primaryStat?.value >= 1350, // Rough indicator
          stats: Object.keys(stats).map(statHash => ({
            statHash: parseInt(statHash),
            value: stats[statHash]?.value || 0,
            name: manifest.DestinyStatDefinition[statHash]?.displayProperties?.name || 'Unknown Stat'
          })),
          sockets: sockets.map(socket => ({
            plugHash: socket.plugHash,
            isEnabled: socket.isEnabled,
            isVisible: socket.isVisible,
            plugItem: socket.plugHash ? manifest.DestinyInventoryItemDefinition[socket.plugHash] : null
          })),
          bucketHash: itemDef.inventory?.bucketTypeHash,
          location: item.location || 'Unknown'
        }
        
        exoticItems.push(processedItem)
      }
    }
    
    // Also get list of all available exotic items from manifest (for items user doesn't own)
    const allExoticDefinitions = []
    
    for (const itemHash in manifest.DestinyInventoryItemDefinition) {
      const itemDef = manifest.DestinyInventoryItemDefinition[itemHash]
      
      // Check if exotic weapon or armor
      const isExotic = itemDef.inventory?.tierType === 6
      const isWeaponOrArmor = itemDef.itemType === 3 || itemDef.itemType === 2
      const isCollectible = itemDef.collectibleHash // Has a collectible entry
      
      if (isExotic && isWeaponOrArmor && isCollectible) {
        // Determine element/damage type
        let element = 'Unknown'
        
        if (itemDef.itemType === 3) { // Weapon
          const damageTypeDef = manifest.DestinyDamageTypeDefinition[itemDef.defaultDamageType]
          element = damageTypeDef?.displayProperties?.name || 'Kinetic'
        } else if (itemDef.itemType === 2) { // Armor
          // For armor, element is determined by sockets when equipped
          // For available items list, we can show as 'Any Element'
          element = 'Any Element'
        }
        
        allExoticDefinitions.push({
          itemHash: parseInt(itemHash),
          name: itemDef.displayProperties?.name || 'Unknown Item',
          description: itemDef.displayProperties?.description || '',
          icon: `https://www.bungie.net${itemDef.displayProperties?.icon || '/common/destiny2_content/icons/default.jpg'}`,
          screenshot: itemDef.screenshot ? `https://www.bungie.net${itemDef.screenshot}` : null,
          itemType: itemDef.itemType,
          itemSubType: itemDef.itemSubType,
          classType: itemDef.classType,
          tierType: itemDef.inventory?.tierType || 0,
          element: element,
          bucketHash: itemDef.inventory?.bucketTypeHash,
          owned: allItems.some(userItem => userItem.itemHash === parseInt(itemHash))
        })
      }
    }

    // Separate owned vs available exotics
    const ownedExotics = exoticItems
    const availableExotics = allExoticDefinitions.filter(item => !item.owned)

    const result = {
      owned: ownedExotics,
      available: availableExotics,
      total: {
        owned: ownedExotics.length,
        available: availableExotics.length,
        totalExotics: allExoticDefinitions.length
      },
      user: {
        displayName: user.displayName,
        membershipType: primaryMembership.membershipType,
        membershipId: primaryMembership.membershipId
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'bungie-api-live'
      }
    }

    console.log(`✅ Found ${ownedExotics.length} owned exotics, ${availableExotics.length} available`)

    // Cache for 5 minutes since exotic inventory doesn't change frequently
    res.setHeader('Cache-Control', 'private, max-age=300')
    
    res.status(200).json(result)

  } catch (error) {
    console.error('Error fetching exotic items:', error)
    
    // Return detailed error in development
    res.status(500).json({
      error: 'Failed to fetch exotic items',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}