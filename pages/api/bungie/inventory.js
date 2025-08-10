// pages/api/bungie/inventory.js
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)

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

    const { membershipType, membershipId, accessToken } = req.body

    // Validate required parameters
    if (!membershipType || !membershipId) {
      return res.status(400).json({ 
        error: 'Missing required parameters: membershipType and membershipId' 
      })
    }

    // Use access token from request body or session
    const bungieAccessToken = accessToken || session.accessToken

    if (!bungieAccessToken) {
      return res.status(401).json({ 
        error: 'Bungie access token required' 
      })
    }

    console.log(`Loading inventory for user: ${session.user.displayName}`)

    // Get user's Destiny profile with inventory components
    const profileUrl = `https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/`
    const components = [
      '100', // Profiles
      '102', // Characters
      '103', // Character Inventories  
      '201', // Character Equipment
      '205', // Character Activities
      '300', // Item Instances
      '302', // Item Perks
      '304', // Item Stats
      '305'  // Item Sockets
    ].join(',')

    const profileResponse = await fetch(`${profileUrl}?components=${components}`, {
      headers: {
        'X-API-Key': process.env.BUNGIE_API_KEY,
        'Authorization': `Bearer ${bungieAccessToken}`
      }
    })

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text()
      console.error('Bungie API Error:', profileResponse.status, errorText)
      
      if (profileResponse.status === 401) {
        return res.status(401).json({ 
          error: 'Bungie authentication expired. Please sign in again.' 
        })
      }
      
      if (profileResponse.status === 403) {
        return res.status(403).json({ 
          error: 'Origin header does not match the provided API key.' 
        })
      }

      return res.status(profileResponse.status).json({ 
        error: `Bungie API Error: ${errorText}` 
      })
    }

    const profileData = await profileResponse.json()

    if (profileData.ErrorCode !== 1) {
      return res.status(400).json({ 
        error: `Bungie API Error: ${profileData.Message}` 
      })
    }

    // Process the inventory data
    const processedInventory = processInventoryData(profileData.Response)

    res.status(200).json({
      success: true,
      inventory: processedInventory
    })

  } catch (error) {
    console.error('Error fetching user inventory:', error)
    res.status(500).json({ 
      error: 'Internal server error while fetching inventory',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

function processInventoryData(profileResponse) {
  const inventory = {
    characters: [],
    vault: [],
    stats: {
      totalItems: 0,
      vaultUsed: 0,
      vaultCapacity: 500,
      exoticCount: 0
    }
  }

  try {
    // Process characters
    if (profileResponse.characters?.data) {
      const charactersData = profileResponse.characters.data
      const characterInventories = profileResponse.characterInventories?.data || {}
      const characterEquipment = profileResponse.characterEquipment?.data || {}
      const itemInstances = profileResponse.itemComponents?.instances?.data || {}

      for (const [characterId, character] of Object.entries(charactersData)) {
        const characterInfo = {
          characterId,
          class: getClassName(character.classType),
          race: getRaceName(character.raceType),
          gender: getGenderName(character.genderType),
          level: character.levelProgression?.level || character.baseCharacterLevel,
          powerLevel: character.light,
          equipped: [],
          inventory: []
        }

        // Process equipped items
        if (characterEquipment[characterId]?.items) {
          for (const item of characterEquipment[characterId].items) {
            const processedItem = processItem(item, itemInstances, true)
            if (processedItem) {
              characterInfo.equipped.push(processedItem)
              inventory.stats.totalItems++
              if (processedItem.tier === 'Exotic') {
                inventory.stats.exoticCount++
              }
            }
          }
        }

        // Process character inventory
        if (characterInventories[characterId]?.items) {
          for (const item of characterInventories[characterId].items) {
            const processedItem = processItem(item, itemInstances, false)
            if (processedItem) {
              characterInfo.inventory.push(processedItem)
              inventory.stats.totalItems++
              if (processedItem.tier === 'Exotic') {
                inventory.stats.exoticCount++
              }
            }
          }
        }

        inventory.characters.push(characterInfo)
      }
    }

    // Process vault (profile inventory)
    if (profileResponse.profileInventory?.data?.items) {
      for (const item of profileResponse.profileInventory.data.items) {
        const processedItem = processItem(item, itemInstances, false, 'vault')
        if (processedItem) {
          inventory.vault.push(processedItem)
          inventory.stats.totalItems++
          inventory.stats.vaultUsed++
          if (processedItem.tier === 'Exotic') {
            inventory.stats.exoticCount++
          }
        }
      }
    }

  } catch (error) {
    console.error('Error processing inventory data:', error)
  }

  return inventory
}

function processItem(item, itemInstances, isEquipped, location = 'character') {
  try {
    // This would normally use manifest data to get item details
    // For now, return basic item structure
    const instance = itemInstances[item.itemInstanceId]
    
    return {
      hash: item.itemHash,
      instanceId: item.itemInstanceId,
      quantity: item.quantity || 1,
      isEquipped,
      location,
      // These would come from manifest lookup
      name: `Item ${item.itemHash}`,
      description: '',
      icon: null,
      tier: getTierFromHash(item.itemHash),
      itemType: getItemTypeFromHash(item.itemHash),
      typeName: 'Unknown',
      powerLevel: instance?.primaryStat?.value || null,
      stats: instance?.stats || {}
    }
  } catch (error) {
    console.error('Error processing item:', error)
    return null
  }
}

function getClassName(classType) {
  const classes = ['Titan', 'Hunter', 'Warlock']
  return classes[classType] || 'Unknown'
}

function getRaceName(raceType) {
  const races = ['Human', 'Awoken', 'Exo']
  return races[raceType] || 'Unknown'
}

function getGenderName(genderType) {
  const genders = ['Male', 'Female']
  return genders[genderType] || 'Unknown'
}

function getTierFromHash(itemHash) {
  // This would normally look up in manifest
  // For now, return based on hash patterns (very basic)
  const hashStr = itemHash.toString()
  if (hashStr.includes('999')) return 'Exotic'
  if (hashStr.includes('666')) return 'Legendary'
  return 'Rare'
}

function getItemTypeFromHash(itemHash) {
  // This would normally look up in manifest
  // For now, return basic guess
  return Math.random() > 0.5 ? 2 : 3 // 2 = Armor, 3 = Weapon
}