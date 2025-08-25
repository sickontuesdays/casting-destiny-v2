// pages/api/bungie/manifest.js
// Gets the Destiny 2 manifest directly from Bungie API

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Loading manifest from Bungie API...')
    
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

    const manifestData = await manifestResponse.json()
    
    if (manifestData.ErrorCode !== 1) {
      throw new Error(manifestData.Message || 'Failed to get manifest from Bungie')
    }

    // Get the JSON world content paths for easier processing
    const jsonPaths = manifestData.Response.jsonWorldComponentContentPaths?.en
    
    if (!jsonPaths) {
      throw new Error('No JSON manifest paths available')
    }

    // Load key definition tables we need for builds
    const definitionPromises = []
    const definitionTypes = [
      'DestinyInventoryItemDefinition',
      'DestinyStatDefinition', 
      'DestinyClassDefinition',
      'DestinyDamageTypeDefinition',
      'DestinySocketTypeDefinition',
      'DestinyPlugSetDefinition',
      'DestinySocketCategoryDefinition',
      'DestinyInventoryBucketDefinition'
    ]

    const definitions = {}

    // Load each definition table from Bungie's CDN
    for (const defType of definitionTypes) {
      if (jsonPaths[defType]) {
        const defUrl = `https://www.bungie.net${jsonPaths[defType]}`
        console.log(`Loading ${defType} from Bungie...`)
        
        try {
          const defResponse = await fetch(defUrl, {
            headers: {
              'X-API-Key': process.env.BUNGIE_API_KEY
            }
          })
          
          if (defResponse.ok) {
            const defData = await defResponse.json()
            definitions[defType] = defData
            console.log(`Loaded ${Object.keys(defData).length} ${defType} entries`)
          } else {
            console.warn(`Failed to load ${defType}: ${defResponse.status}`)
            definitions[defType] = {}
          }
        } catch (error) {
          console.error(`Error loading ${defType}:`, error.message)
          definitions[defType] = {}
        }
      } else {
        definitions[defType] = {}
      }
    }

    const manifest = {
      version: manifestData.Response.version,
      mobileWorldContentPaths: manifestData.Response.mobileWorldContentPaths,
      jsonWorldContentPaths: manifestData.Response.jsonWorldContentPaths,
      jsonWorldComponentContentPaths: manifestData.Response.jsonWorldComponentContentPaths,
      
      // Definition data loaded from Bungie's JSON endpoints
      data: definitions,
      
      metadata: {
        source: 'bungie',
        timestamp: new Date().toISOString(),
        loadedDefinitions: definitionTypes,
        definitionCounts: Object.entries(definitions).reduce((acc, [key, value]) => {
          acc[key] = Object.keys(value).length
          return acc
        }, {})
      }
    }

    console.log('Manifest loaded from Bungie:', {
      version: manifest.version,
      totalDefinitions: Object.values(manifest.metadata.definitionCounts).reduce((a, b) => a + b, 0)
    })

    // Cache for 1 hour (manifest doesn't change often)
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.status(200).json(manifest)

  } catch (error) {
    console.error('Error loading manifest from Bungie:', error)
    res.status(500).json({ 
      error: 'Failed to load manifest from Bungie',
      details: error.message,
      note: 'Check that BUNGIE_API_KEY is set in environment variables'
    })
  }
}