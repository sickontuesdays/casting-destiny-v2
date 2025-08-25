// pages/api/manifest.js
// Get Destiny 2 manifest from Bungie API only - no local data fallbacks

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Loading manifest from Bungie API only...')
    
    // Check if we have Bungie API key
    if (!process.env.BUNGIE_API_KEY) {
      throw new Error('BUNGIE_API_KEY environment variable is not set')
    }

    // Get manifest metadata from Bungie first
    const manifestResponse = await fetch(
      'https://www.bungie.net/Platform/Destiny2/Manifest/',
      {
        headers: {
          'X-API-Key': process.env.BUNGIE_API_KEY
        }
      }
    )

    if (!manifestResponse.ok) {
      throw new Error(`Bungie API error: ${manifestResponse.status} ${manifestResponse.statusText}`)
    }

    const manifestData = await manifestResponse.json()
    
    if (manifestData.ErrorCode !== 1) {
      throw new Error(manifestData.Message || 'Failed to get manifest from Bungie')
    }

    console.log('Manifest metadata retrieved from Bungie:', {
      version: manifestData.Response.version,
      hasJsonPaths: !!manifestData.Response.jsonWorldComponentContentPaths?.en
    })

    // Get the JSON world content paths for easier processing
    const jsonPaths = manifestData.Response.jsonWorldComponentContentPaths?.en
    
    if (!jsonPaths) {
      // Return basic structure if no JSON paths available
      return res.status(200).json({
        version: manifestData.Response.version,
        data: {
          DestinyInventoryItemDefinition: {},
          DestinyStatDefinition: {},
          DestinyClassDefinition: {},
          DestinyDamageTypeDefinition: {},
          DestinySocketTypeDefinition: {},
          DestinyPlugSetDefinition: {},
          DestinySocketCategoryDefinition: {},
          DestinyInventoryBucketDefinition: {}
        },
        metadata: {
          source: 'bungie',
          timestamp: new Date().toISOString(),
          note: 'No JSON paths available - using empty structure'
        }
      })
    }

    // Load key definition tables we need for builds (limit to essential ones for performance)
    const definitionTypes = [
      'DestinyInventoryItemDefinition', // Items (weapons, armor, etc.)
      'DestinyStatDefinition',          // Stats
      'DestinyClassDefinition',         // Classes
      'DestinyDamageTypeDefinition',    // Damage types
      'DestinySocketCategoryDefinition' // Socket categories
    ]

    const definitions = {}

    // Load each definition table from Bungie's CDN
    for (const defType of definitionTypes) {
      if (jsonPaths[defType]) {
        const defUrl = `https://www.bungie.net${jsonPaths[defType]}`
        console.log(`Loading ${defType} from Bungie CDN...`)
        
        try {
          const defResponse = await fetch(defUrl, {
            headers: {
              'X-API-Key': process.env.BUNGIE_API_KEY
            },
            timeout: 30000 // 30 second timeout
          })
          
          if (defResponse.ok) {
            const defData = await defResponse.json()
            definitions[defType] = defData
            console.log(`✅ Loaded ${Object.keys(defData).length} ${defType} entries`)
          } else {
            console.warn(`❌ Failed to load ${defType}: ${defResponse.status} ${defResponse.statusText}`)
            definitions[defType] = {}
          }
        } catch (error) {
          console.error(`❌ Error loading ${defType}:`, error.message)
          definitions[defType] = {}
        }
      } else {
        console.warn(`No path found for ${defType}`)
        definitions[defType] = {}
      }
    }

    // Add empty structures for any missing definition types
    const allDefinitionTypes = [
      'DestinyInventoryItemDefinition',
      'DestinyStatDefinition', 
      'DestinyClassDefinition',
      'DestinyDamageTypeDefinition',
      'DestinySocketTypeDefinition',
      'DestinyPlugSetDefinition',
      'DestinySocketCategoryDefinition',
      'DestinyInventoryBucketDefinition'
    ]

    allDefinitionTypes.forEach(type => {
      if (!definitions[type]) {
        definitions[type] = {}
      }
    })

    const manifest = {
      version: manifestData.Response.version,
      mobileWorldContentPaths: manifestData.Response.mobileWorldContentPaths,
      jsonWorldContentPaths: manifestData.Response.jsonWorldContentPaths,
      jsonWorldComponentContentPaths: manifestData.Response.jsonWorldComponentContentPaths,
      
      // Definition data loaded from Bungie's JSON endpoints
      data: definitions,
      
      metadata: {
        source: 'bungie-api-only',
        timestamp: new Date().toISOString(),
        loadedDefinitions: definitionTypes,
        definitionCounts: Object.entries(definitions).reduce((acc, [key, value]) => {
          acc[key] = Object.keys(value).length
          return acc
        }, {}),
        totalItems: Object.keys(definitions.DestinyInventoryItemDefinition || {}).length,
        note: 'All data loaded from Bungie API - no local fallbacks'
      }
    }

    console.log('✅ Manifest loaded successfully from Bungie:', {
      version: manifest.version,
      totalDefinitions: Object.values(manifest.metadata.definitionCounts).reduce((a, b) => a + b, 0),
      totalItems: manifest.metadata.totalItems
    })

    // Cache for 2 hours (manifest doesn't change often)
    res.setHeader('Cache-Control', 'public, max-age=7200')
    res.status(200).json(manifest)

  } catch (error) {
    console.error('❌ Error loading manifest from Bungie:', error)
    
    // Provide helpful error messages
    let errorDetails = error.message
    let suggestion = 'Check that BUNGIE_API_KEY is set correctly'
    
    if (error.message.includes('fetch')) {
      suggestion = 'Bungie API may be temporarily unavailable - try again later'
    } else if (error.message.includes('timeout')) {
      suggestion = 'Bungie API response timed out - try again'
    } else if (error.message.includes('ErrorCode')) {
      suggestion = 'Bungie API returned an error - check API key validity'
    }

    res.status(500).json({ 
      error: 'Failed to load manifest from Bungie API',
      details: errorDetails,
      suggestion,
      source: 'bungie-api-only',
      timestamp: new Date().toISOString(),
      note: 'This endpoint only uses Bungie API data - no local fallbacks available'
    })
  }
}