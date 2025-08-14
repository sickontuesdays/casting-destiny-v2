import fetch from 'node-fetch'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { membershipType, membershipId, accessToken } = req.body

    if (!membershipType || !membershipId || !accessToken) {
      return res.status(400).json({ 
        error: 'Missing required parameters: membershipType, membershipId, accessToken' 
      })
    }

    console.log(`Loading inventory for ${membershipId} (type: ${membershipType})`)

    // Get characters
    const characters = await getCharacters(membershipType, membershipId, accessToken)
    
    if (!characters || characters.length === 0) {
      throw new Error('No characters found')
    }

    // Get vault items
    const vaultItems = await getVaultItems(membershipType, membershipId, accessToken)

    // Process and structure inventory data
    const inventory = {
      membershipId,
      membershipType,
      characters: characters.map(char => ({
        characterId: char.characterId,
        className: getClassName(char.classType),
        race: getRaceName(char.raceType),
        gender: getGenderName(char.genderType),
        level: char.level,
        powerLevel: char.light,
        lastPlayed: char.dateLastPlayed,
        equipment: char.equipment || []
      })),
      vault: {
        armor: vaultItems.armor || [],
        weapons: vaultItems.weapons || []
      },
      loadedAt: new Date().toISOString()
    }

    console.log(`Successfully loaded inventory: ${characters.length} characters, ${vaultItems.totalItems || 0} vault items`)

    res.status(200).json(inventory)

  } catch (error) {
    console.error('Error loading inventory:', error)
    
    // Return structured error
    res.status(500).json({ 
      error: 'Failed to load inventory',
      details: error.message,
      fallback: createFallbackInventory(req.body.membershipId)
    })
  }
}

async function getCharacters(membershipType, membershipId, accessToken) {
  try {
    const profileUrl = `https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/?components=100,200,205`
    
    const response = await fetch(profileUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-API-Key': process.env.BUNGIE_API_KEY
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.ErrorCode !== 1) {
      throw new Error(`Bungie API Error: ${data.Message}`)
    }

    const characters = []
    const profile = data.Response
    
    if (profile.characters && profile.characters.data) {
      for (const [characterId, characterData] of Object.entries(profile.characters.data)) {
        // Get character equipment
        const equipment = await getCharacterEquipment(
          membershipType, 
          membershipId, 
          characterId, 
          accessToken
        )
        
        characters.push({
          characterId,
          ...characterData,
          equipment
        })
      }
    }

    return characters

  } catch (error) {
    console.error('Error fetching characters:', error)
    return []
  }
}

async function getCharacterEquipment(membershipType, membershipId, characterId, accessToken) {
  try {
    const equipmentUrl = `https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/Character/${characterId}/?components=205`
    
    const response = await fetch(equipmentUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-API-Key': process.env.BUNGIE_API_KEY
      }
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    
    if (data.ErrorCode !== 1 || !data.Response.equipment) {
      return []
    }

    const equipment = data.Response.equipment.data.items || []
    
    // Process equipment items
    return equipment.map(item => processInventoryItem(item, true))
      .filter(item => item !== null)

  } catch (error) {
    console.error('Error fetching character equipment:', error)
    return []
  }
}

async function getVaultItems(membershipType, membershipId, accessToken) {
  try {
    const vaultUrl = `https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/?components=102`
    
    const response = await fetch(vaultUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-API-Key': process.env.BUNGIE_API_KEY
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.ErrorCode !== 1) {
      throw new Error(`Bungie API Error: ${data.Message}`)
    }

    const vaultItems = data.Response.profileInventory?.data?.items || []
    
    // Categorize vault items
    const categorized = {
      armor: [],
      weapons: [],
      totalItems: vaultItems.length
    }

    vaultItems.forEach(item => {
      const processedItem = processInventoryItem(item, false)
      if (processedItem) {
        if (processedItem.itemType === 2) { // Armor
          categorized.armor.push(processedItem)
        } else if (processedItem.itemType === 3) { // Weapon
          categorized.weapons.push(processedItem)
        }
      }
    })

    return categorized

  } catch (error) {
    console.error('Error fetching vault items:', error)
    return { armor: [], weapons: [], totalItems: 0 }
  }
}

function processInventoryItem(item, isEquipped) {
  try {
    // This would normally look up item definitions in the manifest
    // For now, return basic item structure with mock data
    
    const itemHash = item.itemHash
    const mockItem = generateMockItem(itemHash, isEquipped)
    
    return {
      hash: itemHash,
      instanceId: item.itemInstanceId,
      quantity: item.quantity || 1,
      isEquipped,
      location: isEquipped ? 'equipped' : 'vault',
      ...mockItem
    }
    
  } catch (error) {
    console.error('Error processing item:', error)
    return null
  }
}

function generateMockItem(itemHash, isEquipped) {
  // Generate mock item data based on hash
  const hashStr = itemHash.toString()
  const isExotic = hashStr.includes('999') || hashStr.includes('666')
  const isWeapon = parseInt(hashStr.slice(-1)) % 2 === 0
  
  const baseItem = {
    name: `${isExotic ? 'Exotic' : 'Legendary'} ${isWeapon ? 'Weapon' : 'Armor'}`,
    tier: isExotic ? 'Exotic' : 'Legendary',
    itemType: isWeapon ? 3 : 2,
    powerLevel: 1500 + Math.floor(Math.random() * 50),
    description: `A ${isExotic ? 'powerful exotic' : 'reliable legendary'} ${isWeapon ? 'weapon' : 'armor piece'}.`
  }
  
  if (isWeapon) {
    const weaponTypes = ['Hand Cannon', 'Pulse Rifle', 'Auto Rifle', 'Sniper Rifle', 'Shotgun', 'Rocket Launcher']
    const slots = ['kinetic', 'energy', 'power']
    
    baseItem.type = weaponTypes[parseInt(hashStr.slice(-2)) % weaponTypes.length]
    baseItem.slot = slots[parseInt(hashStr.slice(-1)) % slots.length]
  } else {
    const armorSlots = ['helmet', 'arms', 'chest', 'legs', 'class']
    const classTypes = ['Titan', 'Hunter', 'Warlock']
    
    baseItem.slot = armorSlots[parseInt(hashStr.slice(-1)) % armorSlots.length]
    baseItem.classType = classTypes[parseInt(hashStr.slice(-2)) % classTypes.length]
    
    // Generate random stats for armor
    baseItem.stats = {
      weapons: Math.floor(Math.random() * 30) + 5,
      health: Math.floor(Math.random() * 30) + 5,
      class: Math.floor(Math.random() * 25) + 5,
      super: Math.floor(Math.random() * 25) + 5,
      grenade: Math.floor(Math.random() * 25) + 5,
      melee: Math.floor(Math.random() * 25) + 5
    }
  }
  
  // Add specific exotic items for demo
  if (isExotic) {
    const exoticItems = {
      'armor': [
        {
          name: 'Ophidian Aspect',
          description: 'Improved weapon handling and reload speed.',
          slot: 'arms',
          classType: 'Warlock',
          stats: { weapons: 25, health: 10, class: 5 }
        },
        {
          name: 'Celestial Nighthawk',
          description: 'Golden Gun fires a single devastating shot.',
          slot: 'helmet',
          classType: 'Hunter',
          stats: { super: 30, weapons: 5, grenade: 8 }
        },
        {
          name: 'Doom Fang Pauldron',
          description: 'Void melee kills grant Super energy.',
          slot: 'arms',
          classType: 'Titan',
          stats: { melee: 25, super: 15, health: 8 }
        }
      ],
      'weapons': [
        {
          name: 'Whisper of the Worm',
          description: 'Precision shots refill the magazine.',
          type: 'Sniper Rifle',
          slot: 'power'
        },
        {
          name: 'Gjallarhorn',
          description: 'Wolfpack Rounds track targets.',
          type: 'Rocket Launcher',
          slot: 'power'
        }
      ]
    }
    
    const category = isWeapon ? 'weapons' : 'armor'
    const itemIndex = parseInt(hashStr.slice(-1)) % exoticItems[category].length
    const selectedExotic = exoticItems[category][itemIndex]
    
    return { ...baseItem, ...selectedExotic }
  }
  
  return baseItem
}

function createFallbackInventory(membershipId) {
  return {
    membershipId,
    characters: [
      {
        characterId: 'fallback-1',
        className: 'Hunter',
        level: 100,
        powerLevel: 1500,
        lastPlayed: new Date().toISOString(),
        equipment: []
      }
    ],
    vault: {
      armor: [
        {
          hash: 1001,
          name: 'Ophidian Aspect',
          tier: 'Exotic',
          slot: 'arms',
          classType: 'Warlock',
          description: 'Improved weapon handling and reload speed.',
          stats: { weapons: 25, health: 10 },
          powerLevel: 1520
        }
      ],
      weapons: [
        {
          hash: 2001,
          name: 'Whisper of the Worm',
          tier: 'Exotic',
          type: 'Sniper Rifle',
          slot: 'power',
          description: 'Precision shots refill the magazine.',
          powerLevel: 1525
        }
      ]
    },
    isFallback: true,
    loadedAt: new Date().toISOString()
  }
}

// Helper functions
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

// Additional utility functions for item processing
function getItemTypeName(itemType, itemSubType) {
  const weaponTypes = {
    6: 'Hand Cannon',
    7: 'Auto Rifle', 
    8: 'Pulse Rifle',
    9: 'Scout Rifle',
    10: 'Fusion Rifle',
    11: 'Sniper Rifle',
    12: 'Shotgun',
    13: 'Machine Gun',
    14: 'Rocket Launcher',
    17: 'Sidearm',
    18: 'Sword',
    22: 'Linear Fusion Rifle',
    23: 'Grenade Launcher',
    24: 'Submachine Gun',
    31: 'Bow'
  }

  const armorTypes = {
    26: 'Helmet',
    27: 'Gauntlets', 
    28: 'Chest Armor',
    29: 'Leg Armor',
    30: 'Class Armor'
  }

  if (itemType === 3) { // Weapon
    return weaponTypes[itemSubType] || 'Unknown Weapon'
  } else if (itemType === 2) { // Armor
    return armorTypes[itemSubType] || 'Unknown Armor'
  }

  return 'Unknown Item'
}

function getItemSlotName(bucketHash) {
  const bucketMap = {
    1498876634: 'kinetic',
    2465295065: 'energy', 
    953998645: 'power',
    3448274439: 'helmet',
    3551918588: 'gauntlets',
    14239492: 'chest',
    20886954: 'legs',
    1585787867: 'classitem'
  }

  return bucketMap[bucketHash] || 'unknown'
}

function calculateItemPowerLevel(item, characterLevel = 100) {
  // Mock power level calculation
  // In a real implementation, this would use the actual Destiny 2 algorithms
  const basePower = 1500
  const variance = Math.floor(Math.random() * 50)
  return basePower + variance
}

function processItemStats(item, manifestData) {
  // Mock stat processing
  // In a real implementation, this would look up stat definitions from the manifest
  const mockStats = {}
  
  if (item.itemType === 2) { // Armor
    const statNames = ['weapons', 'health', 'class', 'super', 'grenade', 'melee']
    statNames.forEach(stat => {
      mockStats[stat] = Math.floor(Math.random() * 25) + 5
    })
  }

  return mockStats
}

function determineItemQuality(item) {
  // Determine item quality based on stats and other factors
  if (item.tierType === 6) return 'exotic'
  if (item.tierType === 5) return 'legendary'
  if (item.tierType === 4) return 'rare'
  if (item.tierType === 3) return 'uncommon'
  return 'common'
}

// Error handling utility
function handleBungieApiError(error, context) {
  console.error(`Bungie API Error in ${context}:`, error)
  
  if (error.response) {
    // HTTP error response
    return {
      error: `API request failed: ${error.response.status}`,
      details: error.response.statusText,
      retryable: error.response.status >= 500
    }
  } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    // Network error
    return {
      error: 'Network connection failed',
      details: 'Unable to reach Bungie servers',
      retryable: true
    }
  } else {
    // Other error
    return {
      error: 'Unexpected error occurred',
      details: error.message,
      retryable: false
    }
  }
}