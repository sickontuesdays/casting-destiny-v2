import BungieAPIService from '../../../lib/bungie-api-service'
import ManifestManager from '../../../lib/manifest-manager'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)

async function getSessionFromCookie(req) {
  try {
    const sessionCookie = req.cookies['bungie-session']
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
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get session from cookie
    const session = await getSessionFromCookie(req)
    
    if (!session?.user || !session.accessToken) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    console.log(`Loading inventory for user: ${session.user.displayName}`)

    // Initialize services
    const bungieAPI = new BungieAPIService()
    const manifestManager = new ManifestManager()
    
    // Load manifest for item definitions
    const manifest = await manifestManager.loadManifest()
    
    // Get user's Destiny memberships
    const { destinyMemberships, primaryMembership } = await bungieAPI.getDestinyMemberships(session.accessToken)
    
    if (!primaryMembership) {
      return res.status(404).json({ error: 'No Destiny account found' })
    }

    // Get complete inventory
    const inventoryData = await bungieAPI.getCompleteInventory(
      primaryMembership.membershipType,
      primaryMembership.membershipId,
      session.accessToken
    )

    // Process inventory with manifest data
    const processedInventory = await processInventoryWithManifest(inventoryData, manifest)
    
    // Get friends list (Bungie friends + clan members)
    const [bungieFriends, clanMembers] = await Promise.all([
      bungieAPI.getBungieFriends(session.accessToken),
      bungieAPI.getClanMembers(
        primaryMembership.membershipType,
        primaryMembership.membershipId,
        session.accessToken
      )
    ])

    // Combine and deduplicate friends
    const friendsMap = new Map()
    
    bungieFriends.forEach(friend => {
      friendsMap.set(friend.membershipId, {
        ...friend,
        source: 'bungie',
        canShareBuilds: true
      })
    })
    
    clanMembers.forEach(member => {
      if (!friendsMap.has(member.membershipId)) {
        friendsMap.set(member.membershipId, {
          ...member,
          source: 'clan',
          canShareBuilds: true
        })
      }
    })

    const response = {
      success: true,
      membership: {
        membershipType: primaryMembership.membershipType,
        membershipId: primaryMembership.membershipId,
        displayName: primaryMembership.displayName,
        crossSaveOverride: primaryMembership.crossSaveOverride,
        applicableMembershipTypes: primaryMembership.applicableMembershipTypes
      },
      characters: processedInventory.characters,
      vault: processedInventory.vault,
      currencies: processedInventory.currencies,
      itemComponents: processedInventory.itemComponents,
      friends: Array.from(friendsMap.values()),
      lastUpdated: new Date().toISOString()
    }

    // Set cache headers for 5 minutes
    res.setHeader('Cache-Control', 'private, max-age=300')
    
    res.status(200).json(response)

  } catch (error) {
    console.error('Error loading inventory:', error)
    
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
      error: 'Failed to load inventory',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'INVENTORY_LOAD_FAILED'
    })
  }
}

// Process inventory items with manifest definitions
async function processInventoryWithManifest(inventoryData, manifest) {
  const processed = {
    characters: [],
    vault: {
      weapons: [],
      armor: [],
      consumables: [],
      mods: [],
      other: []
    },
    currencies: []
  }

  // Process characters
  for (const character of inventoryData.characters) {
    const processedCharacter = {
      ...character,
      equipment: await processItems(character.equipment, manifest, inventoryData.itemComponents),
      inventory: await processItems(character.inventory, manifest, inventoryData.itemComponents)
    }
    
    // Calculate character stats
    processedCharacter.stats = calculateCharacterStats(processedCharacter.equipment)
    
    processed.characters.push(processedCharacter)
  }

  // Process vault items
  const vaultItems = await processItems(
    inventoryData.vault.items,
    manifest,
    inventoryData.itemComponents
  )
  
  // Categorize vault items
  vaultItems.forEach(item => {
    if (!item) return
    
    switch (item.itemType) {
      case 2: // Armor
        processed.vault.armor.push(item)
        break
      case 3: // Weapon
        processed.vault.weapons.push(item)
        break
      case 9: // Consumables
        processed.vault.consumables.push(item)
        break
      case 19: // Mods
      case 20: // Armor Mods
        processed.vault.mods.push(item)
        break
      default:
        processed.vault.other.push(item)
    }
  })

  // Process currencies
  if (inventoryData.vault.currencies) {
    processed.currencies = await processItems(
      inventoryData.vault.currencies,
      manifest,
      inventoryData.itemComponents
    )
  }

  // Include raw item components for advanced features
  processed.itemComponents = inventoryData.itemComponents

  return processed
}

// Process items with manifest data
async function processItems(items, manifest, itemComponents) {
  if (!items || !Array.isArray(items)) return []
  
  const processed = []
  
  for (const item of items) {
    if (!item) continue
    
    const itemDef = manifest.getItem ? 
      manifest.getItem(item.itemHash) : 
      manifest.data?.DestinyInventoryItemDefinition?.[item.itemHash]
    
    if (!itemDef) {
      // Include raw item if no definition found
      processed.push({
        ...item,
        displayProperties: {
          name: `Unknown Item (${item.itemHash})`,
          description: 'Item definition not found'
        }
      })
      continue
    }
    
    // Build comprehensive item object
    const processedItem = {
      // Basic info
      itemHash: item.itemHash,
      itemInstanceId: item.itemInstanceId,
      quantity: item.quantity || 1,
      bindStatus: item.bindStatus,
      location: item.location,
      bucketHash: item.bucketHash,
      transferStatus: item.transferStatus,
      lockable: item.lockable,
      state: item.state,
      
      // From manifest
      displayProperties: itemDef.displayProperties,
      itemType: itemDef.itemType,
      itemSubType: itemDef.itemSubType,
      classType: itemDef.classType,
      tierType: itemDef.inventory?.tierType,
      tierTypeName: itemDef.inventory?.tierTypeName,
      isExotic: itemDef.inventory?.tierType === 6,
      isLegendary: itemDef.inventory?.tierType === 5,
      
      // Item categories
      itemCategoryHashes: itemDef.itemCategoryHashes,
      
      // Damage type for weapons
      damageType: itemDef.defaultDamageType,
      damageTypeHashes: itemDef.damageTypeHashes,
      
      // Stats from instance
      stats: {},
      sockets: [],
      perks: [],
      mods: []
    }
    
    // Add instance-specific data if available
    if (item.itemInstanceId && itemComponents) {
      // Stats
      if (itemComponents.stats?.[item.itemInstanceId]) {
        const statData = itemComponents.stats[item.itemInstanceId]
        processedItem.primaryStat = statData.primaryStat
        
        if (statData.stats) {
          Object.entries(statData.stats).forEach(([statHash, statInfo]) => {
            const statDef = manifest.getStat ? 
              manifest.getStat(statHash) : 
              manifest.data?.DestinyStatDefinition?.[statHash]
            
            processedItem.stats[statHash] = {
              value: statInfo.value,
              name: statDef?.displayProperties?.name || 'Unknown Stat',
              description: statDef?.displayProperties?.description
            }
          })
        }
      }
      
      // Sockets (mods and perks)
      if (itemComponents.sockets?.[item.itemInstanceId]) {
        const socketData = itemComponents.sockets[item.itemInstanceId]
        
        socketData.sockets?.forEach((socket, index) => {
          if (socket.plugHash) {
            const plugDef = manifest.getItem ? 
              manifest.getItem(socket.plugHash) : 
              manifest.data?.DestinyInventoryItemDefinition?.[socket.plugHash]
            
            if (plugDef) {
              const socketInfo = {
                socketIndex: index,
                plugHash: socket.plugHash,
                name: plugDef.displayProperties?.name,
                description: plugDef.displayProperties?.description,
                icon: plugDef.displayProperties?.icon,
                itemType: plugDef.itemType,
                plugCategoryIdentifier: plugDef.plug?.plugCategoryIdentifier
              }
              
              processedItem.sockets.push(socketInfo)
              
              // Categorize as perk or mod
              if (plugDef.itemType === 19 || plugDef.itemType === 20) {
                processedItem.mods.push(socketInfo)
              } else if (plugDef.perks?.length > 0) {
                processedItem.perks.push(socketInfo)
              }
            }
          }
        })
      }
      
      // Energy capacity for armor
      if (itemComponents.instances?.[item.itemInstanceId]) {
        const instanceData = itemComponents.instances[item.itemInstanceId]
        processedItem.energy = instanceData.energy
        processedItem.powerLevel = instanceData.primaryStat?.value
      }
    }
    
    processed.push(processedItem)
  }
  
  return processed
}

// Calculate total character stats from equipped items
function calculateCharacterStats(equipment) {
  const totalStats = {
    mobility: 0,
    resilience: 0,
    recovery: 0,
    discipline: 0,
    intellect: 0,
    strength: 0,
    power: 0
  }
  
  const statHashes = {
    2996146975: 'mobility',
    392767087: 'resilience',
    1943323491: 'recovery',
    1735777505: 'discipline',
    144602215: 'intellect',
    4244567218: 'strength'
  }
  
  equipment.forEach(item => {
    if (!item?.stats) return
    
    // Add armor stats
    Object.entries(item.stats).forEach(([statHash, statInfo]) => {
      const statName = statHashes[statHash]
      if (statName) {
        totalStats[statName] += statInfo.value || 0
      }
    })
    
    // Track power level
    if (item.powerLevel && item.powerLevel > 0) {
      totalStats.power += item.powerLevel
    }
  })
  
  // Calculate average power
  const equippedCount = equipment.filter(i => i?.powerLevel > 0).length
  if (equippedCount > 0) {
    totalStats.power = Math.floor(totalStats.power / equippedCount)
  }
  
  return totalStats
}