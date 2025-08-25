// pages/api/manifest.js
// API endpoint for accessing Destiny 2 manifest data

import ManifestManager from '../../lib/manifest-manager'
import fs from 'fs'
import path from 'path'

// Cache the manifest in memory for performance
let cachedManifest = null
let cacheTimestamp = 0
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { category, search, hash } = req.query

    // Check if we need to refresh the cache
    const now = Date.now()
    if (!cachedManifest || (now - cacheTimestamp) > CACHE_DURATION) {
      console.log('Loading manifest data...')
      
      try {
        // Try to load from ManifestManager first
        const manifestManager = new ManifestManager()
        cachedManifest = await manifestManager.loadManifest()
        cacheTimestamp = now
      } catch (error) {
        console.warn('Failed to load manifest from API, trying local files:', error.message)
        
        // Fallback to local manifest files
        cachedManifest = await loadLocalManifest()
        cacheTimestamp = now
      }
    }

    // If requesting specific category
    if (category) {
      const categoryData = getCategoryData(cachedManifest, category)
      
      if (!categoryData) {
        return res.status(404).json({ 
          error: 'Category not found',
          availableCategories: getAvailableCategories(cachedManifest)
        })
      }

      // Apply search filter if provided
      if (search) {
        const filtered = filterData(categoryData, search)
        return res.status(200).json({
          success: true,
          category,
          search,
          count: filtered.length,
          data: filtered
        })
      }

      return res.status(200).json({
        success: true,
        category,
        count: categoryData.length,
        data: categoryData
      })
    }

    // If requesting specific item by hash
    if (hash) {
      const item = findItemByHash(cachedManifest, hash)
      
      if (!item) {
        return res.status(404).json({ 
          error: 'Item not found',
          hash 
        })
      }

      return res.status(200).json({
        success: true,
        item
      })
    }

    // Return manifest metadata
    const metadata = {
      success: true,
      version: cachedManifest?.version || 'unknown',
      language: cachedManifest?.language || 'en',
      categories: getAvailableCategories(cachedManifest),
      stats: getManifestStats(cachedManifest),
      cachedAt: new Date(cacheTimestamp).toISOString()
    }

    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=3600') // 1 hour
    res.status(200).json(metadata)

  } catch (error) {
    console.error('Manifest API error:', error)
    res.status(500).json({ 
      error: 'Failed to load manifest data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

async function loadLocalManifest() {
  const manifest = {
    version: 'local',
    language: 'en',
    data: {}
  }

  const dataDir = path.join(process.cwd(), 'data')
  
  // Load local JSON files
  const files = [
    { name: 'exotic_armor.json', category: 'ExoticArmor' },
    { name: 'exotic_weapons.json', category: 'ExoticWeapons' },
    { name: 'armor_mods.json', category: 'ArmorMods' },
    { name: 'weapon_mods.json', category: 'WeaponMods' },
    { name: 'seasonal_artifact_mods.json', category: 'ArtifactMods' },
    { name: 'subclass_fragments.json', category: 'Fragments' },
    { name: 'subclass_aspects.json', category: 'Aspects' },
    { name: 'abilities.json', category: 'Abilities' }
  ]

  for (const file of files) {
    try {
      const filePath = path.join(dataDir, file.name)
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8')
        const data = JSON.parse(content)
        manifest.data[file.category] = data
        console.log(`Loaded ${file.name}: ${data.length || Object.keys(data).length} items`)
      }
    } catch (error) {
      console.warn(`Failed to load ${file.name}:`, error.message)
    }
  }

  // Create a simplified DestinyInventoryItemDefinition from loaded data
  manifest.data.DestinyInventoryItemDefinition = {}
  
  // Add exotic armor
  if (manifest.data.ExoticArmor) {
    manifest.data.ExoticArmor.forEach(item => {
      manifest.data.DestinyInventoryItemDefinition[item.hash] = {
        hash: item.hash,
        displayProperties: {
          name: item.name,
          description: item.description,
          icon: item.icon
        },
        itemType: 2, // Armor
        inventory: {
          tierType: 6, // Exotic
          tierTypeName: 'Exotic'
        }
      }
    })
  }

  // Add exotic weapons
  if (manifest.data.ExoticWeapons) {
    manifest.data.ExoticWeapons.forEach(item => {
      manifest.data.DestinyInventoryItemDefinition[item.hash] = {
        hash: item.hash,
        displayProperties: {
          name: item.name,
          description: item.description,
          icon: item.icon
        },
        itemType: 3, // Weapon
        inventory: {
          tierType: 6, // Exotic
          tierTypeName: 'Exotic'
        }
      }
    })
  }

  return manifest
}

function getCategoryData(manifest, category) {
  if (!manifest || !manifest.data) return null
  
  // Direct category access
  if (manifest.data[category]) {
    return Array.isArray(manifest.data[category]) 
      ? manifest.data[category]
      : Object.values(manifest.data[category])
  }

  // Map common category names
  const categoryMap = {
    'items': 'DestinyInventoryItemDefinition',
    'weapons': 'DestinyInventoryItemDefinition',
    'armor': 'DestinyInventoryItemDefinition',
    'mods': 'DestinyInventoryItemDefinition',
    'exotics': 'DestinyInventoryItemDefinition',
    'stats': 'DestinyStatDefinition',
    'perks': 'DestinySandboxPerkDefinition',
    'activities': 'DestinyActivityDefinition',
    'vendors': 'DestinyVendorDefinition'
  }

  const mappedCategory = categoryMap[category.toLowerCase()]
  if (mappedCategory && manifest.data[mappedCategory]) {
    let data = manifest.data[mappedCategory]
    
    // Apply filters for specific categories
    if (category.toLowerCase() === 'weapons') {
      data = filterWeapons(data)
    } else if (category.toLowerCase() === 'armor') {
      data = filterArmor(data)
    } else if (category.toLowerCase() === 'exotics') {
      data = filterExotics(data)
    } else if (category.toLowerCase() === 'mods') {
      data = filterMods(data)
    }
    
    return Array.isArray(data) ? data : Object.values(data)
  }

  return null
}

function filterWeapons(data) {
  const items = Array.isArray(data) ? data : Object.values(data)
  return items.filter(item => item.itemType === 3 && !item.redacted)
}

function filterArmor(data) {
  const items = Array.isArray(data) ? data : Object.values(data)
  return items.filter(item => item.itemType === 2 && !item.redacted)
}

function filterExotics(data) {
  const items = Array.isArray(data) ? data : Object.values(data)
  return items.filter(item => 
    item.inventory?.tierType === 6 && 
    (item.itemType === 2 || item.itemType === 3) &&
    !item.redacted
  )
}

function filterMods(data) {
  const items = Array.isArray(data) ? data : Object.values(data)
  return items.filter(item => 
    (item.itemType === 19 || item.itemType === 20) && 
    !item.redacted
  )
}

function filterData(data, searchTerm) {
  const search = searchTerm.toLowerCase()
  return data.filter(item => {
    const name = item.displayProperties?.name || item.name || ''
    const description = item.displayProperties?.description || item.description || ''
    return name.toLowerCase().includes(search) || 
           description.toLowerCase().includes(search)
  })
}

function findItemByHash(manifest, hash) {
  if (!manifest || !manifest.data) return null
  
  // Search in DestinyInventoryItemDefinition first
  if (manifest.data.DestinyInventoryItemDefinition) {
    const item = manifest.data.DestinyInventoryItemDefinition[hash]
    if (item) return item
  }
  
  // Search in other categories
  for (const [category, data] of Object.entries(manifest.data)) {
    if (Array.isArray(data)) {
      const item = data.find(i => i.hash === parseInt(hash))
      if (item) return item
    } else if (typeof data === 'object') {
      if (data[hash]) return data[hash]
    }
  }
  
  return null
}

function getAvailableCategories(manifest) {
  if (!manifest || !manifest.data) return []
  
  const categories = Object.keys(manifest.data)
  
  // Add friendly category names
  const friendlyCategories = [
    'items',
    'weapons', 
    'armor',
    'exotics',
    'mods'
  ]
  
  return [...new Set([...categories, ...friendlyCategories])].sort()
}

function getManifestStats(manifest) {
  if (!manifest || !manifest.data) {
    return {
      totalItems: 0,
      weapons: 0,
      armor: 0,
      exotics: 0,
      mods: 0
    }
  }
  
  const stats = {
    totalItems: 0,
    weapons: 0,
    armor: 0,
    exotics: 0,
    mods: 0
  }
  
  // Count items in DestinyInventoryItemDefinition
  if (manifest.data.DestinyInventoryItemDefinition) {
    const items = Object.values(manifest.data.DestinyInventoryItemDefinition)
    stats.totalItems = items.length
    
    items.forEach(item => {
      if (item.itemType === 3) stats.weapons++
      if (item.itemType === 2) stats.armor++
      if (item.inventory?.tierType === 6) stats.exotics++
      if (item.itemType === 19 || item.itemType === 20) stats.mods++
    })
  }
  
  // Add counts from local categories
  if (manifest.data.ExoticArmor) {
    stats.exotics += manifest.data.ExoticArmor.length
  }
  if (manifest.data.ExoticWeapons) {
    stats.exotics += manifest.data.ExoticWeapons.length
  }
  
  return stats
}