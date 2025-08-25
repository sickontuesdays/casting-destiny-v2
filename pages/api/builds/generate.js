// pages/api/builds/generate.js
// Generate builds using Enhanced Build Intelligence - Bungie API only

import { jwtVerify } from 'jose'
import { IconUtils } from '../../../lib/icon-utils.js'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)

// Get session from cookie for authenticated requests
async function getSessionFromCookie(req) {
  try {
    const sessionCookie = req.cookies['bungie_session']
    if (!sessionCookie) return null

    const { payload } = await jwtVerify(sessionCookie, secret)
    
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { 
      input, 
      classType = 'any',
      activity = 'general_pve',
      useInventoryOnly = false,
      lockedExotic = null,
      buildCount = 3 
    } = req.body

    if (!input || typeof input !== 'string') {
      return res.status(400).json({ 
        error: 'Build request input is required',
        example: { input: "High mobility Hunter build for PvP" }
      })
    }

    console.log('Generating builds with Bungie API only:', {
      input,
      classType,
      activity,
      useInventoryOnly,
      lockedExotic: lockedExotic?.name
    })

    // Get session if user wants to use inventory only
    let session = null
    if (useInventoryOnly) {
      session = await getSessionFromCookie(req)
      if (!session?.accessToken) {
        return res.status(401).json({ 
          error: 'Authentication required for inventory-only builds',
          suggestion: 'Either sign in or disable "Use Inventory Only" option'
        })
      }
    }

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
    
    // Load user inventory if requested and authenticated
    let userInventory = null
    if (useInventoryOnly && session?.accessToken) {
      try {
        const inventoryResponse = await fetch(`${baseUrl}/api/bungie/inventory`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'X-API-Key': process.env.BUNGIE_API_KEY
          }
        })
        
        if (inventoryResponse.ok) {
          userInventory = await inventoryResponse.json()
          console.log('User inventory loaded:', {
            characters: userInventory.characters?.length || 0,
            totalItems: userInventory.characters?.reduce((sum, char) => 
              sum + (char.equipment?.length || 0) + (char.inventory?.length || 0), 0) || 0
          })
        }
      } catch (error) {
        console.warn('Failed to load user inventory:', error.message)
      }
    }

    // Generate builds using the Enhanced Build Intelligence system
    const builds = await generateBuildsFromBungieData({
      input,
      classType,
      activity,
      manifest,
      userInventory,
      lockedExotic,
      buildCount
    })

    if (!builds || builds.length === 0) {
      return res.status(500).json({
        error: 'Failed to generate any builds',
        suggestion: 'Try a different build request or check if Bungie API data is available'
      })
    }

    const response = {
      success: true,
      builds,
      metadata: {
        generatedAt: new Date().toISOString(),
        buildCount: builds.length,
        source: 'bungie-api-only',
        hasUserInventory: !!userInventory,
        manifest: {
          version: manifest.version,
          itemCount: Object.keys(manifest.data?.DestinyInventoryItemDefinition || {}).length
        },
        request: {
          input,
          classType,
          activity,
          useInventoryOnly,
          lockedExotic: lockedExotic?.name
        }
      }
    }

    console.log(`Generated ${builds.length} builds successfully`)
    res.status(200).json(response)

  } catch (error) {
    console.error('Error generating builds:', error)
    res.status(500).json({ 
      error: 'Failed to generate builds',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      note: 'This endpoint only uses Bungie API data - no local fallbacks'
    })
  }
}

// Generate builds using only Bungie API data
async function generateBuildsFromBungieData({
  input,
  classType,
  activity,
  manifest,
  userInventory,
  lockedExotic,
  buildCount
}) {
  const items = manifest.data?.DestinyInventoryItemDefinition || {}
  const builds = []

  // Parse build request for key requirements
  const parsedRequest = parseBuildRequest(input)
  
  // Determine target class
  const targetClass = classType !== 'any' ? classType : parsedRequest.classType || 'hunter'
  
  // Generate multiple build variations
  for (let i = 0; i < buildCount; i++) {
    const build = await generateSingleBuild({
      targetClass,
      activity,
      parsedRequest,
      items,
      userInventory,
      lockedExotic,
      variation: i
    })
    
    if (build) {
      builds.push(build)
    }
  }

  return builds
}

// Generate a single build
async function generateSingleBuild({
  targetClass,
  activity,
  parsedRequest,
  items,
  userInventory,
  lockedExotic,
  variation
}) {
  try {
    // Create basic build structure
    const build = {
      id: `build_${Date.now()}_${variation}`,
      name: generateBuildName(parsedRequest, targetClass, activity, variation),
      class: targetClass,
      subclass: selectSubclass(parsedRequest, targetClass),
      weapons: {},
      armor: {},
      mods: {
        armor: {},
        combat: [],
        artifact: []
      },
      stats: {
        weapons: 0, health: 0, class: 0, super: 0, grenade: 0, melee: 0
      },
      score: 0,
      metadata: {
        source: 'bungie-api',
        variation,
        hasInventoryItems: false
      }
    }

    // Select armor pieces
    await selectArmorPieces(build, items, userInventory, lockedExotic, targetClass)
    
    // Select weapons
    await selectWeapons(build, items, userInventory, lockedExotic)
    
    // Calculate build score
    build.score = calculateBuildScore(build, parsedRequest, activity)
    
    return build

  } catch (error) {
    console.error('Error generating single build:', error)
    return null
  }
}

// Parse build request to extract requirements
function parseBuildRequest(input) {
  const lower = input.toLowerCase()
  
  return {
    classType: lower.includes('titan') ? 'titan' : 
               lower.includes('hunter') ? 'hunter' :
               lower.includes('warlock') ? 'warlock' : null,
    element: lower.includes('solar') ? 'solar' :
             lower.includes('arc') ? 'arc' :
             lower.includes('void') ? 'void' :
             lower.includes('stasis') ? 'stasis' :
             lower.includes('strand') ? 'strand' :
             lower.includes('prismatic') ? 'prismatic' : 'solar',
    stats: {
      weapons: lower.includes('weapon') || lower.includes('mobility'),
      health: lower.includes('health') || lower.includes('resilience') || lower.includes('tank'),
      class: lower.includes('class ability'),
      super: lower.includes('super') || lower.includes('intellect'),
      grenade: lower.includes('grenade') || lower.includes('discipline'),
      melee: lower.includes('melee') || lower.includes('strength')
    },
    activity: lower.includes('pvp') || lower.includes('crucible') ? 'pvp' :
              lower.includes('raid') ? 'raid' :
              lower.includes('nightfall') || lower.includes('gm') ? 'nightfall' : 'pve'
  }
}

// Select subclass based on requirements
function selectSubclass(parsedRequest, targetClass) {
  const element = parsedRequest.element
  return {
    element,
    name: `${element.charAt(0).toUpperCase() + element.slice(1)} ${targetClass.charAt(0).toUpperCase() + targetClass.slice(1)}`,
    icon: IconUtils.getElementIconByName(element),
    aspects: [],
    fragments: [],
    abilities: {
      grenade: null,
      melee: null,
      classAbility: null,
      super: null
    }
  }
}

// Select armor pieces for the build
async function selectArmorPieces(build, items, userInventory, lockedExotic, targetClass) {
  const armorSlots = ['helmet', 'arms', 'chest', 'legs', 'classItem']
  const bucketHashes = {
    helmet: 3448274439,
    arms: 3551918588,
    chest: 14239492,
    legs: 20886954,
    classItem: 1585787867
  }

  // Class type mapping
  const classTypeMap = { titan: 0, hunter: 1, warlock: 2 }
  const targetClassType = classTypeMap[targetClass]

  // First, place locked exotic if it's armor
  if (lockedExotic && items[lockedExotic.hash]?.itemType === 2) {
    const exotic = items[lockedExotic.hash]
    const slot = armorSlots.find(s => bucketHashes[s] === exotic.inventory?.bucketTypeHash)
    if (slot) {
      build.armor[slot] = formatArmorPiece(exotic, 'exotic-locked')
    }
  }

  // Fill remaining armor slots
  for (const slot of armorSlots) {
    if (build.armor[slot]) continue // Skip if already filled with exotic

    // Try to find suitable armor from user inventory first
    let selectedPiece = null
    
    if (userInventory?.characters) {
      for (const character of userInventory.characters) {
        const inventoryItems = [...(character.equipment || []), ...(character.inventory || [])]
        const suitableArmor = inventoryItems.filter(item => 
          item.itemType === 2 &&
          item.bucketTypeHash === bucketHashes[slot] &&
          (item.classType === targetClassType || item.classType === 3) &&
          item.tierType >= 5 // Legendary or higher
        )
        
        if (suitableArmor.length > 0) {
          selectedPiece = suitableArmor[0]
          build.metadata.hasInventoryItems = true
          break
        }
      }
    }

    // Fall back to manifest items if no inventory item found
    if (!selectedPiece) {
      const manifestArmor = Object.values(items).filter(item =>
        item.itemType === 2 &&
        item.inventory?.bucketTypeHash === bucketHashes[slot] &&
        (item.classType === targetClassType || item.classType === 3) &&
        item.inventory?.tierType >= 5 &&
        !item.redacted &&
        item.displayProperties?.name
      )
      
      if (manifestArmor.length > 0) {
        selectedPiece = manifestArmor[Math.floor(Math.random() * manifestArmor.length)]
      }
    }

    if (selectedPiece) {
      build.armor[slot] = formatArmorPiece(selectedPiece, selectedPiece.source || 'manifest')
    }
  }
}

// Select weapons for the build
async function selectWeapons(build, items, userInventory, lockedExotic) {
  const weaponSlots = ['kinetic', 'energy', 'power']
  const bucketHashes = {
    kinetic: 1498876634,
    energy: 2465295065,
    power: 953998645
  }

  // First, place locked exotic if it's a weapon
  if (lockedExotic && items[lockedExotic.hash]?.itemType === 3) {
    const exotic = items[lockedExotic.hash]
    const slot = weaponSlots.find(s => bucketHashes[s] === exotic.inventory?.bucketTypeHash)
    if (slot) {
      build.weapons[slot] = formatWeapon(exotic, 'exotic-locked')
    }
  }

  // Fill remaining weapon slots
  for (const slot of weaponSlots) {
    if (build.weapons[slot]) continue // Skip if already filled with exotic

    let selectedWeapon = null

    // Try user inventory first
    if (userInventory?.characters) {
      for (const character of userInventory.characters) {
        const inventoryItems = [...(character.equipment || []), ...(character.inventory || [])]
        const suitableWeapons = inventoryItems.filter(item => 
          item.itemType === 3 &&
          item.bucketTypeHash === bucketHashes[slot] &&
          item.tierType >= 5 // Legendary or higher
        )
        
        if (suitableWeapons.length > 0) {
          selectedWeapon = suitableWeapons[0]
          build.metadata.hasInventoryItems = true
          break
        }
      }
    }

    // Fall back to manifest items
    if (!selectedWeapon) {
      const manifestWeapons = Object.values(items).filter(item =>
        item.itemType === 3 &&
        item.inventory?.bucketTypeHash === bucketHashes[slot] &&
        item.inventory?.tierType >= 5 &&
        !item.redacted &&
        item.displayProperties?.name
      )
      
      if (manifestWeapons.length > 0) {
        selectedWeapon = manifestWeapons[Math.floor(Math.random() * manifestWeapons.length)]
      }
    }

    if (selectedWeapon) {
      build.weapons[slot] = formatWeapon(selectedWeapon, selectedWeapon.source || 'manifest')
    }
  }
}

// Format armor piece for build
function formatArmorPiece(item, source) {
  return {
    hash: item.hash,
    name: item.displayProperties?.name || 'Unknown Armor',
    description: item.displayProperties?.description || '',
    icon: IconUtils.getItemIcon(item),
    tier: item.inventory?.tierType === 6 ? 'Exotic' : 'Legendary',
    isExotic: item.inventory?.tierType === 6,
    slot: getArmorSlotName(item.inventory?.bucketTypeHash),
    stats: generateArmorStats(),
    source
  }
}

// Format weapon for build  
function formatWeapon(item, source) {
  return {
    hash: item.hash,
    name: item.displayProperties?.name || 'Unknown Weapon',
    description: item.displayProperties?.description || '',
    icon: IconUtils.getItemIcon(item),
    tier: item.inventory?.tierType === 6 ? 'Exotic' : 'Legendary',
    isExotic: item.inventory?.tierType === 6,
    slot: getWeaponSlotName(item.inventory?.bucketTypeHash),
    weaponType: getWeaponTypeName(item.itemSubType),
    damageType: getDamageTypeName(item.defaultDamageType),
    damageTypeIcon: IconUtils.getElementIcon(item.defaultDamageType),
    source
  }
}

// Helper functions
function getArmorSlotName(bucketHash) {
  const map = {
    3448274439: 'helmet',
    3551918588: 'arms', 
    14239492: 'chest',
    20886954: 'legs',
    1585787867: 'classItem'
  }
  return map[bucketHash] || 'unknown'
}

function getWeaponSlotName(bucketHash) {
  const map = {
    1498876634: 'kinetic',
    2465295065: 'energy',
    953998645: 'power'
  }
  return map[bucketHash] || 'unknown'
}

function getWeaponTypeName(subType) {
  // This would need a proper mapping based on Bungie's item sub types
  return 'Auto Rifle' // Simplified for now
}

function getDamageTypeName(damageType) {
  const map = {
    1: 'Kinetic',
    2: 'Arc', 
    3: 'Solar',
    4: 'Stasis',
    5: 'Strand',
    6: 'Void'
  }
  return map[damageType] || 'Kinetic'
}

function generateArmorStats() {
  // Generate random but reasonable armor stats
  return {
    weapons: Math.floor(Math.random() * 30) + 5,
    health: Math.floor(Math.random() * 30) + 5,
    class: Math.floor(Math.random() * 30) + 5,
    super: Math.floor(Math.random() * 30) + 5,
    grenade: Math.floor(Math.random() * 30) + 5,
    melee: Math.floor(Math.random() * 30) + 5
  }
}

function calculateBuildScore(build, parsedRequest, activity) {
  // Simple scoring based on filled slots
  let score = 0
  
  // Points for filled armor slots
  Object.keys(build.armor).forEach(slot => {
    if (build.armor[slot]) score += 20
  })
  
  // Points for filled weapon slots
  Object.keys(build.weapons).forEach(slot => {
    if (build.weapons[slot]) score += 15
  })
  
  // Bonus for exotic items
  Object.values(build.armor).forEach(piece => {
    if (piece?.isExotic) score += 10
  })
  Object.values(build.weapons).forEach(weapon => {
    if (weapon?.isExotic) score += 10
  })
  
  return Math.min(score, 100)
}

function generateBuildName(parsedRequest, targetClass, activity, variation) {
  const adjectives = ['Optimal', 'Enhanced', 'Elite', 'Advanced', 'Tactical']
  const variations = ['Alpha', 'Beta', 'Gamma', 'Prime', 'Pro']
  
  const adj = adjectives[variation % adjectives.length]
  const var_suffix = variation > 0 ? ` ${variations[variation - 1]}` : ''
  
  return `${adj} ${targetClass.charAt(0).toUpperCase() + targetClass.slice(1)} Build${var_suffix}`
}