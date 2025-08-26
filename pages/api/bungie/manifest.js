// pages/api/bungie/manifest.js
// API endpoint for fetching Destiny 2 manifest with aggressive filtering to stay under 4MB

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Loading manifest from Bungie API with size optimization...')
    
    // Get manifest metadata from Bungie
    const manifestResponse = await fetch(
      'https://www.bungie.net/Platform/Destiny2/Manifest/',
      {
        headers: {
          'X-API-Key': process.env.BUNGIE_API_KEY
        }
      }
    )

    if (!manifestResponse.ok) {
      throw new Error(`Bungie API error: ${manifestResponse.status}`)
    }

    const manifestMeta = await manifestResponse.json()
    
    if (manifestMeta.ErrorCode !== 1) {
      throw new Error(manifestMeta.Message || 'Failed to get manifest from Bungie')
    }

    // Download the JSON manifest data
    const jsonPath = manifestMeta.Response.jsonWorldContentPaths.en
    const fullManifestUrl = `https://www.bungie.net${jsonPath}`
    
    console.log('Downloading full manifest from Bungie...')
    const fullManifestResponse = await fetch(fullManifestUrl)
    const fullManifest = await fullManifestResponse.json()

    console.log('Processing and filtering manifest data...')

    // AGGRESSIVE filtering to reduce size significantly
    const filteredManifest = {
      version: manifestMeta.Response.version,
      lastUpdated: new Date().toISOString(),
      data: {}
    }

    // Only include essential item types with minimal data
    const essentialItemTypes = [2, 3] // Only armor (2) and weapons (3)
    const essentialTierTypes = [5, 6] // Only legendary (5) and exotic (6)
    
    // Filter DestinyInventoryItemDefinition very aggressively
    const itemDefinitions = {}
    let itemCount = 0
    
    for (const itemHash in fullManifest.DestinyInventoryItemDefinition) {
      const item = fullManifest.DestinyInventoryItemDefinition[itemHash]
      
      // Only include weapons and armor that are legendary or exotic
      if (essentialItemTypes.includes(item.itemType) && 
          essentialTierTypes.includes(item.inventory?.tierType)) {
        
        // Include only essential properties
        itemDefinitions[itemHash] = {
          displayProperties: {
            name: item.displayProperties?.name,
            icon: item.displayProperties?.icon
          },
          itemType: item.itemType,
          itemSubType: item.itemSubType,
          classType: item.classType,
          inventory: {
            tierType: item.inventory?.tierType,
            bucketTypeHash: item.inventory?.bucketTypeHash,
            stackUniqueLabel: item.inventory?.stackUniqueLabel
          },
          stats: item.stats ? {
            statGroupHash: item.stats.statGroupHash
          } : null,
          defaultDamageType: item.defaultDamageType,
          hash: parseInt(itemHash)
        }
        
        itemCount++
        
        // Stop if we have enough items to stay under limit
        if (itemCount > 5000) break
      }
    }
    
    filteredManifest.data.DestinyInventoryItemDefinition = itemDefinitions

    // Include only essential stat definitions
    const statDefinitions = {}
    const essentialStats = [
      2996146975, // Mobility
      392767087,  // Resilience  
      1943323491, // Recovery
      1735777505, // Discipline
      144602215,  // Intellect
      4244567218  // Strength
    ]
    
    for (const statHash of essentialStats) {
      if (fullManifest.DestinyStatDefinition[statHash]) {
        const stat = fullManifest.DestinyStatDefinition[statHash]
        statDefinitions[statHash] = {
          displayProperties: {
            name: stat.displayProperties?.name,
            icon: stat.displayProperties?.icon
          },
          aggregationType: stat.aggregationType,
          hash: stat.hash
        }
      }
    }
    
    filteredManifest.data.DestinyStatDefinition = statDefinitions

    // Include essential class definitions  
    const classDefinitions = {}
    const essentialClasses = [671679327, 2271682572, 3655393761] // Titan, Hunter, Warlock
    
    for (const classHash of essentialClasses) {
      if (fullManifest.DestinyClassDefinition[classHash]) {
        const classDef = fullManifest.DestinyClassDefinition[classHash]
        classDefinitions[classHash] = {
          displayProperties: {
            name: classDef.displayProperties?.name,
            icon: classDef.displayProperties?.icon
          },
          classType: classDef.classType,
          hash: classDef.hash
        }
      }
    }
    
    filteredManifest.data.DestinyClassDefinition = classDefinitions

    // Include essential damage type definitions
    const damageDefinitions = {}
    const essentialDamageTypes = [1, 2, 3, 4, 6, 7] // Kinetic, Arc, Solar, Void, Stasis, Strand
    
    for (const damageHash in fullManifest.DestinyDamageTypeDefinition) {
      const damage = fullManifest.DestinyDamageTypeDefinition[damageHash]
      if (essentialDamageTypes.includes(damage.enumValue)) {
        damageDefinitions[damageHash] = {
          displayProperties: {
            name: damage.displayProperties?.name,
            icon: damage.displayProperties?.icon
          },
          enumValue: damage.enumValue,
          hash: damage.hash
        }
      }
    }
    
    filteredManifest.data.DestinyDamageTypeDefinition = damageDefinitions

    // Add metadata
    filteredManifest.metadata = {
      itemCount,
      statCount: Object.keys(statDefinitions).length,
      classCount: Object.keys(classDefinitions).length,
      damageCount: Object.keys(damageDefinitions).length,
      processedAt: new Date().toISOString(),
      source: 'bungie-filtered',
      filterLevel: 'aggressive'
    }

    // Check final size
    const jsonString = JSON.stringify(filteredManifest)
    const sizeInBytes = Buffer.byteLength(jsonString, 'utf8')
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2)
    
    console.log(`Filtered manifest size: ${sizeInMB}MB (${sizeInBytes} bytes)`)
    
    if (sizeInBytes > 3.5 * 1024 * 1024) { // 3.5MB safety margin
      console.warn(`⚠️ Manifest still large at ${sizeInMB}MB, may hit 4MB limit`)
      
      // If still too large, further reduce by limiting items
      const reducedItems = {}
      let count = 0
      for (const itemHash in itemDefinitions) {
        if (count < 3000) { // Limit to 3000 items
          reducedItems[itemHash] = itemDefinitions[itemHash]
          count++
        } else {
          break
        }
      }
      
      filteredManifest.data.DestinyInventoryItemDefinition = reducedItems
      filteredManifest.metadata.itemCount = count
      filteredManifest.metadata.filterLevel = 'extreme'
      
      const newSize = (Buffer.byteLength(JSON.stringify(filteredManifest), 'utf8') / (1024 * 1024)).toFixed(2)
      console.log(`Further reduced to ${newSize}MB`)
    }

    // Cache for 1 hour
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.status(200).json(filteredManifest)

  } catch (error) {
    console.error('Error loading manifest from Bungie:', error)
    res.status(500).json({ 
      error: 'Failed to load manifest from Bungie',
      details: error.message
    })
  }
}