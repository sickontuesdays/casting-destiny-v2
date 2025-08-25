// pages/api/inventory/available-items.js
// API endpoint for fetching available items for a specific slot

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

// Bucket hashes for different slots
const SLOT_BUCKET_HASHES = {
  // Weapons
  kinetic: 1498876634,
  energy: 2465295065,
  power: 953998645,
  
  // Armor
  helmet: 3448274439,
  arms: 3551918588,
  chest: 14239492,
  legs: 20886954,
  classItem: 1585787867
}

// Item type mappings
const ITEM_TYPES = {
  weapon: 3,
  armor: 2,
  mod: 19,
  ghost: 24,
  ship: 42,
  sparrow: 43,
  emblem: 19
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

    const { slot, type, useInventoryOnly = 'true', classType } = req.query

    if (!slot) {
      return res.status(400).json({ error: 'Slot parameter is required' })
    }

    const bucketHash = SLOT_BUCKET_HASHES[slot]
    if (!bucketHash) {
      return res.status(400).json({ error: 'Invalid slot specified' })
    }

    console.log(`Loading available items for slot: ${slot}`, {
      user: session.user.displayName,
      type,
      useInventoryOnly,
      classType
    })

    let items = []

    if (useInventoryOnly === 'true') {
      // Get items from user inventory
      items = await getUserInventoryItems(session, bucketHash, type)
    } else {
      // Get all game items from manifest
      items = await getAllGameItems(bucketHash, type, classType)
    }

    // Sort items by tier (exotic first, then legendary, etc.)
    items.sort((a, b) => {
      // Sort by tier (higher first)
      if (b.tierType !== a.tierType) {
        return b.tierType - a.tierType
      }
      // Then by power level
      if (b.powerLevel !== a.powerLevel) {
        return b.powerLevel - a.powerLevel
      }
      // Then alphabetically
      return a.name.localeCompare(b.name)
    })

    // Limit results for performance
    const limitedItems = items.slice(0, 100)

    const response = {
      success: true,
      slot,
      itemType: type,
      items: limitedItems,
      totalAvailable: items.length,
      source: useInventoryOnly === 'true' ? 'inventory' : 'manifest'
    }

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 'private, max-age=300')
    
    res.status(200).json(response)

  } catch (error) {
    console.error('Error loading available items:', error)
    
    res.status(500).json({ 
      error: 'Failed to load available items',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

async function getUserInventoryItems(session, bucketHash, itemType) {
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

    const items = []
    
    // Collect from characters
    for (const character of inventoryData.characters || []) {
      // Equipment
      const equipped = character.equipment?.filter(item => 
        item.bucketHash === bucketHash &&
        (!itemType || item.itemType === ITEM_TYPES[itemType])
      ) || []
      
      // Inventory
      const inventory = character.inventory?.filter(item => 
        item.bucketHash === bucketHash &&
        (!itemType || item.itemType === ITEM_TYPES[itemType])
      ) || []
      
      items.push(...equipped, ...inventory)
    }
    
    // Collect from vault
    if (inventoryData.vault?.items) {
      const vaultItems = inventoryData.vault.items.filter(item =>
        item.bucketHash === bucketHash &&
        (!itemType || item.itemType === ITEM_TYPES[itemType])
      )
      items.push(...vaultItems)
    }
    
    // Remove duplicates based on item instance ID
    const uniqueItems = new Map()
    for (const item of items) {
      const key = item.itemInstanceId || item.itemHash
      if (!uniqueItems.has(key)) {
        uniqueItems.set(key, {
          hash: item.itemHash,
          instanceId: item.itemInstanceId,
          name: item.displayProperties?.name || 'Unknown Item',
          icon: item.displayProperties?.icon,
          tierType: item.tierType || 0,
          tierTypeName: item.tierTypeName || 'Common',
          powerLevel: item.itemComponents?.instances?.[item.itemInstanceId]?.primaryStat?.value || 0,
          element: item.itemComponents?.instances?.[item.itemInstanceId]?.damageType || 0,
          classType: item.classType,
          stats: item.stats || {},
          perks: item.perks || [],
          isExotic: item.tierType === 6,
          isLegendary: item.tierType === 5,
          bucketHash: item.bucketHash,
          itemType: item.itemType
        })
      }
    }
    
    return Array.from(uniqueItems.values())
    
  } catch (error) {
    console.error('Error loading user inventory items:', error)
    return []
  }
}

async function getAllGameItems(bucketHash, itemType, classType) {
  try {
    const manifestManager = new ManifestManager()
    const manifest = await manifestManager.loadManifest()
    
    if (!manifest?.data?.DestinyInventoryItemDefinition) {
      return []
    }
    
    const allItems = Object.values(manifest.data.DestinyInventoryItemDefinition)
    
    // Filter items
    const filtered = allItems.filter(item => {
      // Skip redacted items
      if (item.redacted || item.blacklisted) return false
      
      // Check bucket hash
      if (item.inventory?.bucketTypeHash !== bucketHash) return false
      
      // Check item type if specified
      if (itemType && item.itemType !== ITEM_TYPES[itemType]) return false
      
      // Check class type for armor
      if (classType !== undefined && item.itemType === 2) {
        // 3 = any class, otherwise must match
        if (item.classType !== 3 && item.classType !== parseInt(classType)) {
          return false
        }
      }
      
      // Must have display properties
      if (!item.displayProperties?.name) return false
      
      return true
    })
    
    // Map to consistent format
    return filtered.map(item => ({
      hash: item.hash,
      instanceId: null,
      name: item.displayProperties.name,
      icon: item.displayProperties.icon,
      tierType: item.inventory?.tierType || 0,
      tierTypeName: item.inventory?.tierTypeName || 'Common',
      powerLevel: 0,
      element: item.defaultDamageType || 0,
      classType: item.classType,
      stats: {},
      perks: item.perks || [],
      isExotic: item.inventory?.tierType === 6,
      isLegendary: item.inventory?.tierType === 5,
      bucketHash: item.inventory?.bucketTypeHash,
      itemType: item.itemType,
      description: item.displayProperties.description || ''
    }))
    
  } catch (error) {
    console.error('Error loading manifest items:', error)
    return []
  }
}