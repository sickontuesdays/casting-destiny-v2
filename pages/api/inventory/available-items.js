// pages/api/inventory/available-items.js
// API endpoint for fetching all available items from manifest (not user-specific)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { useInventoryOnly, itemType, tierType, classType } = req.query
    
    console.log('Loading available items from manifest...')
    console.log('Query params:', { useInventoryOnly, itemType, tierType, classType })
    
    // Load manifest from GitHub cache (same as frontend)
    let manifest = null
    try {
      const manifestResponse = await fetch(`${req.headers.origin || process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/github/get-manifest`)
      if (manifestResponse.ok) {
        manifest = await manifestResponse.json()
        console.log('✅ Loaded manifest from GitHub cache')
      } else {
        throw new Error('GitHub manifest not available')
      }
    } catch (manifestError) {
      console.log('⚠️ Could not load GitHub manifest:', manifestError.message)
      return res.status(503).json({
        error: 'Manifest not available',
        message: 'Please wait for manifest to load or try again later'
      })
    }

    if (!manifest?.data?.DestinyInventoryItemDefinition) {
      return res.status(503).json({
        error: 'Manifest data incomplete',
        message: 'Item definitions not available in manifest'
      })
    }

    // Note: useInventoryOnly doesn't apply here since this endpoint returns ALL available items
    // This endpoint shows what items exist in the game, not what the user owns
    if (useInventoryOnly === 'true') {
      console.log('Note: useInventoryOnly=true ignored - this endpoint returns all available items')
    }

    const itemDefinitions = manifest.data.DestinyInventoryItemDefinition
    const availableItems = []

    // Filter items based on query parameters
    for (const itemHash in itemDefinitions) {
      const item = itemDefinitions[itemHash]
      
      if (!item || !item.displayProperties?.name) continue

      // Apply filters
      if (itemType && parseInt(itemType) !== item.itemType) continue
      if (tierType && parseInt(tierType) !== item.inventory?.tierType) continue  
      if (classType && parseInt(classType) !== item.classType) continue

      // Only include weapons and armor by default (unless itemType specified)
      if (!itemType && ![2, 3].includes(item.itemType)) continue
      
      // Only include legendary and exotic items by default (unless tierType specified)
      if (!tierType && ![5, 6].includes(item.inventory?.tierType)) continue

      // Get element/damage type
      let element = 'Unknown'
      if (item.itemType === 3) { // Weapon
        const damageTypeDef = manifest.data.DestinyDamageTypeDefinition?.[item.defaultDamageType]
        element = damageTypeDef?.displayProperties?.name || 'Kinetic'
      } else if (item.itemType === 2) { // Armor
        element = 'Any Element' // Armor elements are determined by equipped mods
      }

      const processedItem = {
        itemHash: parseInt(itemHash),
        name: item.displayProperties.name,
        description: item.displayProperties.description || '',
        icon: `https://www.bungie.net${item.displayProperties.icon}`,
        screenshot: item.screenshot ? `https://www.bungie.net${item.screenshot}` : null,
        itemType: item.itemType,
        itemSubType: item.itemSubType,
        classType: item.classType,
        tierType: item.inventory?.tierType || 0,
        element: element,
        bucketHash: item.inventory?.bucketTypeHash,
        stackUniqueLabel: item.inventory?.stackUniqueLabel,
        isExotic: item.inventory?.tierType === 6,
        isLegendary: item.inventory?.tierType === 5,
        category: item.itemType === 3 ? 'weapon' : item.itemType === 2 ? 'armor' : 'other'
      }

      availableItems.push(processedItem)
    }

    // Sort items by tier (exotic first) then by name
    availableItems.sort((a, b) => {
      if (a.tierType !== b.tierType) {
        return b.tierType - a.tierType // Higher tier first (exotic=6, legendary=5)
      }
      return a.name.localeCompare(b.name)
    })

    const result = {
      items: availableItems,
      total: availableItems.length,
      filters: {
        itemType: itemType ? parseInt(itemType) : null,
        tierType: tierType ? parseInt(tierType) : null,
        classType: classType ? parseInt(classType) : null,
        useInventoryOnly: useInventoryOnly === 'true' ? 'ignored' : false
      },
      categories: {
        weapons: availableItems.filter(item => item.itemType === 3).length,
        armor: availableItems.filter(item => item.itemType === 2).length,
        exotics: availableItems.filter(item => item.isExotic).length,
        legendaries: availableItems.filter(item => item.isLegendary).length
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'github-cached-manifest',
        manifestVersion: manifest.version
      }
    }

    console.log(`✅ Found ${availableItems.length} available items`)

    // Cache for 1 hour since available items don't change frequently
    res.setHeader('Cache-Control', 'public, max-age=3600')
    
    res.status(200).json(result)

  } catch (error) {
    console.error('Error fetching available items:', error)
    
    res.status(500).json({
      error: 'Failed to fetch available items',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}