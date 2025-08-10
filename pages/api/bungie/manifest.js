// pages/api/bungie/manifest.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Loading Destiny 2 manifest from Bungie API...')

    // Get manifest metadata first
    const manifestUrl = 'https://www.bungie.net/Platform/Destiny2/Manifest/'
    
    console.log('Fetching manifest metadata...')
    console.log('API Key present:', !!process.env.BUNGIE_API_KEY)
    
    const manifestResponse = await fetch(manifestUrl, {
      headers: {
        'X-API-Key': process.env.BUNGIE_API_KEY,
        'User-Agent': 'CastingDestinyV2/1.0'
      }
    })

    console.log('Manifest response status:', manifestResponse.status)
    console.log('Manifest response headers:', Object.fromEntries(manifestResponse.headers.entries()))

    if (!manifestResponse.ok) {
      const errorText = await manifestResponse.text()
      console.error('Manifest API error response:', errorText)
      
      if (manifestResponse.status === 403) {
        return res.status(403).json({ 
          error: 'Origin header does not match the provided API key',
          details: 'API key configuration issue'
        })
      }
      
      return res.status(manifestResponse.status).json({ 
        error: `Failed to fetch manifest metadata: ${manifestResponse.status}`,
        details: errorText
      })
    }

    const responseText = await manifestResponse.text()
    console.log('Raw response (first 200 chars):', responseText.substring(0, 200))
    
    let manifestInfo
    try {
      manifestInfo = JSON.parse(responseText)
    } catch (parseError) {
      console.error('JSON parse error. Full response:', responseText)
      return res.status(500).json({ 
        error: `Invalid JSON response from Bungie API: ${parseError.message}`,
        rawResponse: responseText.substring(0, 500)
      })
    }
    
    if (manifestInfo.ErrorCode !== 1) {
      console.error('Bungie API error:', manifestInfo.Message)
      return res.status(400).json({ 
        error: `Bungie API error: ${manifestInfo.Message}`,
        errorCode: manifestInfo.ErrorCode
      })
    }

    const version = manifestInfo.Response.version
    console.log('Manifest version:', version)

    // Get the manifest data URL
    const manifestPaths = manifestInfo.Response.mobileWorldContentPaths.en
    if (!manifestPaths) {
      return res.status(500).json({ 
        error: 'No English manifest data available' 
      })
    }

    const manifestDataUrl = `https://www.bungie.net${manifestPaths}`
    console.log('Downloading manifest data from:', manifestDataUrl)

    // Download the actual manifest data
    const dataResponse = await fetch(manifestDataUrl, {
      headers: {
        'User-Agent': 'CastingDestinyV2/1.0'
      }
    })
    
    if (!dataResponse.ok) {
      console.error('Failed to download manifest data:', dataResponse.status)
      return res.status(dataResponse.status).json({ 
        error: `Failed to fetch manifest data: ${dataResponse.status}` 
      })
    }

    const manifestData = await dataResponse.json()
    console.log('Manifest data downloaded successfully')

    // Return processed manifest data
    const processedManifest = {
      version,
      lastUpdated: new Date().toISOString(),
      data: {
        // Main item definitions
        DestinyInventoryItemDefinition: manifestData.DestinyInventoryItemDefinition || {},
        
        // Stat definitions
        DestinyStatDefinition: manifestData.DestinyStatDefinition || {},
        
        // Class definitions
        DestinyClassDefinition: manifestData.DestinyClassDefinition || {},
        
        // Socket definitions (for mods)
        DestinySocketTypeDefinition: manifestData.DestinySocketTypeDefinition || {},
        DestinySocketCategoryDefinition: manifestData.DestinySocketCategoryDefinition || {},
        
        // Activity definitions
        DestinyActivityDefinition: manifestData.DestinyActivityDefinition || {},
        DestinyActivityTypeDefinition: manifestData.DestinyActivityTypeDefinition || {},
        
        // Vendor definitions
        DestinyVendorDefinition: manifestData.DestinyVendorDefinition || {},
        
        // Progression definitions
        DestinyProgressionDefinition: manifestData.DestinyProgressionDefinition || {},
        
        // Season definitions
        DestinySeasonDefinition: manifestData.DestinySeasonDefinition || {}
      },
      metadata: {
        itemCount: Object.keys(manifestData.DestinyInventoryItemDefinition || {}).length,
        statCount: Object.keys(manifestData.DestinyStatDefinition || {}).length,
        classCount: Object.keys(manifestData.DestinyClassDefinition || {}).length,
        processedAt: new Date().toISOString()
      }
    }

    console.log(`Manifest processed successfully. Items: ${processedManifest.metadata.itemCount}`)

    // Set cache headers for 1 hour
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    
    res.status(200).json(processedManifest)

  } catch (error) {
    console.error('Error in manifest API:', error)
    res.status(500).json({ 
      error: 'Internal server error while fetching manifest',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}