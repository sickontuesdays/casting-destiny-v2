// pages/api/inventory/exotics.js
// API endpoint for fetching available exotic items

import { jwtVerify } from 'jose'
import BungieAPIService from '../../../lib/bungie-api-service'
import ManifestManager from '../../../lib/manifest-manager'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)

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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get session
    const session = await getSessionFromCookie(req)
    
    if (!session?.user || !session.accessToken) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { useInventoryOnly = 'true', classType } = req.query

    console.log(`Loading exotic items`, {
      user: session.user.displayName,
      useInventoryOnly,
      classType
    })

    let exotics = []

    if (useInventoryOnly === 'true') {
      // Get exotics from user inventory
      exotics = await getUserExotics(session, classType)
    } else {
      // Get all game exotics from manifest
      exotics = await getAllGameExotics(classType)
    }

    // Separate and sort by type
    const weapons = exotics.filter(e => e.itemType === 3)
    const armor = exotics.filter(e => e.itemType === 2)

    // Sort alphabetically within each category
    weapons.sort((a, b) => a.name.localeCompare(b.name))
    armor.sort((a, b) => a.name.localeCompare(b.name))

    const response = {
      success: true,
      exotics: [...armor, ...weapons], // Armor first, then weapons
      summary: {
        total: exotics.length,
        weapons: weapons.length,
        armor: armor.length
      },
      source: useInventoryOnly === 'true' ? 'inventory' : 'manifest'
    }

    // Cache for 10 minutes
    res.setHeader('Cache-Control', 'private, max-age=600')
    
    res.status(200).json(response)

  } catch (error) {
    console.error('Error loading exotic items:', error)
    
    res.status(500).json({ 
      error: 'Failed to load exotic items',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

async function getUserExotics(session, classType) {
  try {
    const bungieAPI = new BungieAPIService()
    
    // Get user's Destiny memberships
    const { primaryMembership } = await bungieAPI.getDestinyMemberships(session.accessToken)
    
    if (!primaryMembership) {
      return []
    }

    // Get complete inventory
    const inventoryData = await bungieAPI.getCompleteInventory(
      primaryMembership.membershipType,
      primaryMembership.membershipId,
      session.accessToken
    )

    const exotics = []
    const processedHashes = new Set()
    
    // Helper function to process items
    const processItem = (item) => {
      // Only process exotics (tier 6)
      if (item.tierType !== 6) return
      
      // Skip if already processed (avoid duplicates)
      if (processedHashes.has(item.itemHash)) return
      
      // Check class type for armor
      if (item.itemType === 2 && classType !== undefined) {
        const requestedClass = parseInt(classType)
        // Skip if not matching class (3 = any class)
        if (item.classType !== 3 && item.classType !== requestedClass) {
          return
        }
      }
      
      processedHashes.add(item.itemHash)
      
      exotics.push({
        hash: item.itemHash,
        name: item.displayProperties?.name || 'Unknown Exotic',
        icon: item.displayProperties?.icon,
        itemType: item.itemType,
        classType: item.classType,
        description: item.displayProperties?.description || '',
        bucketHash: item.bucketHash,
        slot: getSlotName(item.bucketHash),
        element: item.damageType || 0,
        intrinsicPerk: item.perks?.[0]?.displayProperties?.name || null
      })
    }
    
    // Process character items
    for (const character of inventoryData.characters || []) {
      character.equipment?.forEach(processItem)
      character.inventory?.forEach(processItem)
    }
    
    // Process vault items
    if (inventoryData.vault) {
      inventoryData.vault.weapons?.forEach(processItem)
      inventoryData.vault.armor?.forEach(processItem)
    }
    
    return exotics
    
  } catch (error) {
    console.error('Error loading user exotics:', error)
    return []
  }
}

async function getAllGameExotics(classType) {
  try {
    const manifestManager = new ManifestManager()
    const manifest = await manifestManager.loadManifest()
    
    if (!manifest?.data?.DestinyInventoryItemDefinition) {
      // Try loading from local exotic files as fallback
      return await loadLocalExotics(classType)
    }
    
    const allItems = Object.values(manifest.data.DestinyInventoryItemDefinition)
    
    const exotics = allItems.filter(item => {
      // Skip redacted items
      if (item.redacted || item.blacklisted) return false
      
      // Only exotic tier (6)
      if (item.inventory?.tierType !== 6) return false
      
      // Must be weapon or armor
      if (item.itemType !== 2 && item.itemType !== 3) return false
      
      // Check class type for armor
      if (item.itemType === 2 && classType !== undefined) {
        const requestedClass = parseInt(classType)
        if (item.classType !== 3 && item.classType !== requestedClass) {
          return false
        }
      }
      
      // Must have display properties
      if (!item.displayProperties?.name) return false
      
      // Skip certain categories (ornaments, etc.)
      if (item.itemCategoryHashes?.includes(20)) return false // Ornaments
      
      return true
    })
    
    return exotics.map(item => ({
      hash: item.hash,
      name: item.displayProperties.name,
      icon: item.displayProperties.icon,
      itemType: item.itemType,
      classType: item.classType,
      description: item.displayProperties.description || '',
      bucketHash: item.inventory?.bucketTypeHash,
      slot: getSlotName(item.inventory?.bucketTypeHash),
      element: item.defaultDamageType || 0,
      intrinsicPerk: item.perks?.[0]?.displayProperties?.name || null,
      exoticPerk: getExoticPerkName(item)
    }))
    
  } catch (error) {
    console.error('Error loading manifest exotics:', error)
    return loadLocalExotics(classType)
  }
}

async function loadLocalExotics(classType) {
  try {
    // Load from local exotic files as fallback
    const fs = require('fs').promises
    const path = require('path')
    
    const exoticArmorPath = path.join(process.cwd(), 'data', 'exotic_armor.json')
    const exoticWeaponsPath = path.join(process.cwd(), 'data', 'exotic_weapons.json')
    
    const exotics = []
    
    // Load exotic armor if file exists
    try {
      const armorData = await fs.readFile(exoticArmorPath, 'utf8')
      const armorItems = JSON.parse(armorData)
      
      armorItems.forEach(item => {
        // Filter by class if specified
        if (classType !== undefined && item.classType !== undefined) {
          const requestedClass = parseInt(classType)
          if (item.classType !== 3 && item.classType !== requestedClass) {
            return
          }
        }
        
        exotics.push({
          hash: item.hash,
          name: item.name,
          icon: item.icon,
          itemType: 2, // Armor
          classType: item.classType || 3,
          description: item.description || '',
          slot: 'armor'
        })
      })
    } catch (error) {
      console.warn('Could not load exotic armor file:', error.message)
    }
    
    // Load exotic weapons if file exists
    try {
      const weaponData = await fs.readFile(exoticWeaponsPath, 'utf8')
      const weaponItems = JSON.parse(weaponData)
      
      weaponItems.forEach(item => {
        exotics.push({
          hash: item.hash,
          name: item.name,
          icon: item.icon,
          itemType: 3, // Weapon
          description: item.description || '',
          slot: 'weapon'
        })
      })
    } catch (error) {
      console.warn('Could not load exotic weapons file:', error.message)
    }
    
    return exotics
    
  } catch (error) {
    console.error('Error loading local exotic files:', error)
    return []
  }
}

function getSlotName(bucketHash) {
  const slotMap = {
    1498876634: 'kinetic',
    2465295065: 'energy',
    953998645: 'power',
    3448274439: 'helmet',
    3551918588: 'arms',
    14239492: 'chest',
    20886954: 'legs',
    1585787867: 'class'
  }
  
  return slotMap[bucketHash] || 'unknown'
}

function getExoticPerkName(item) {
  // Try to find the exotic perk from item's socket entries
  if (item.sockets?.socketEntries) {
    for (const socket of item.sockets.socketEntries) {
      if (socket.singleInitialItemHash) {
        // This would need manifest lookup for the perk name
        return null
      }
    }
  }
  
  // Try from perks array
  if (item.perks && item.perks.length > 0) {
    const exoticPerk = item.perks.find(p => p.displayProperties?.name)
    return exoticPerk?.displayProperties?.name || null
  }
  
  return null
}