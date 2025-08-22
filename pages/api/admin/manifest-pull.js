// pages/api/admin/manifest-pull.js
// Simplified admin endpoint - accepts API key from request body

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb'
    },
    maxDuration: 60
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get API key from request body
    const { apiKey } = req.body
    
    if (!apiKey) {
      return res.status(400).json({ 
        error: 'Bungie API key is required',
        details: 'Please provide your Bungie API key in the request body'
      })
    }

    console.log('🔄 Starting manifest pull from Bungie...')
    
    // Step 1: Get manifest metadata from Bungie
    const manifestUrl = 'https://www.bungie.net/Platform/Destiny2/Manifest/'
    
    const manifestResponse = await fetch(manifestUrl, {
      headers: {
        'X-API-Key': apiKey,
        'User-Agent': 'CastingDestinyV2-Admin/1.0'
      }
    })

    if (!manifestResponse.ok) {
      if (manifestResponse.status === 401 || manifestResponse.status === 403) {
        return res.status(401).json({
          error: 'Invalid API key',
          details: 'The provided Bungie API key is invalid or unauthorized'
        })
      }
      throw new Error(`Bungie API error: ${manifestResponse.status}`)
    }

    const manifestInfo = await manifestResponse.json()
    
    if (manifestInfo.ErrorCode !== 1) {
      return res.status(400).json({
        error: `Bungie API error: ${manifestInfo.Message}`,
        errorCode: manifestInfo.ErrorCode
      })
    }

    const version = manifestInfo.Response.version
    console.log(`📦 Found manifest version: ${version}`)

    // Initialize manifest data structure
    const manifestData = {
      version,
      lastUpdated: new Date().toISOString(),
      data: {},
      metadata: {
        itemCount: 0,
        processedAt: new Date().toISOString(),
        source: 'admin-pull',
        format: 'sqlite-extracted'
      }
    }

    // Step 2: Download SQLite database (FIXED: use mobileWorldContentPaths instead of jsonWorldContentPaths)
    const sqlitePaths = manifestInfo.Response.mobileWorldContentPaths?.en
    
    if (!sqlitePaths) {
      return res.status(500).json({
        error: 'No SQLite database path found',
        details: 'Bungie API did not provide mobile world content paths'
      })
    }

    console.log('📱 Downloading SQLite database (~50MB)...')
    
    const sqliteUrl = `https://www.bungie.net${sqlitePaths}`
    const sqliteResponse = await fetch(sqliteUrl, {
      headers: {
        'X-API-Key': apiKey,
        'User-Agent': 'CastingDestinyV2-Admin/1.0'
      }
    })
    
    if (!sqliteResponse.ok) {
      throw new Error(`Failed to download SQLite database: ${sqliteResponse.status}`)
    }
    
    const arrayBuffer = await sqliteResponse.arrayBuffer()
    const fileSize = (arrayBuffer.byteLength / 1024 / 1024).toFixed(2)
    console.log(`✅ Downloaded ${fileSize}MB SQLite database`)
    
    // Check file format
    const uint8Array = new Uint8Array(arrayBuffer)
    const isZip = uint8Array[0] === 0x50 && uint8Array[1] === 0x4b
    const isGzip = uint8Array[0] === 0x1f && uint8Array[1] === 0x8b
    const isSqlite = uint8Array[0] === 0x53 && uint8Array[1] === 0x51 && uint8Array[2] === 0x4c && uint8Array[3] === 0x69
    
    console.log(`📊 File format: ${isZip ? 'ZIP' : isGzip ? 'GZIP' : isSqlite ? 'SQLite' : 'Unknown'}`)
    
    manifestData.metadata.downloadSize = arrayBuffer.byteLength
    manifestData.metadata.compressionFormat = isZip ? 'zip' : isGzip ? 'gzip' : isSqlite ? 'sqlite' : 'unknown'
    
    // For now, create a minimal manifest structure
    // In a full implementation, you'd extract the SQLite database and process tables
    // This requires additional dependencies like sqlite3 or better-sqlite3
    
    console.log('⚡ Creating lightweight manifest structure...')
    
    // Essential table structure (populate with actual data in full implementation)
    manifestData.data = {
      DestinyInventoryItemDefinition: {},
      DestinyStatDefinition: {},
      DestinyClassDefinition: {},
      DestinySocketTypeDefinition: {},
      DestinySocketCategoryDefinition: {},
      DestinyActivityDefinition: {},
      DestinyActivityTypeDefinition: {},
      DestinyDamageTypeDefinition: {},
      DestinyEnergyTypeDefinition: {},
      DestinySeasonDefinition: {}
    }
    
    // Add processing note
    manifestData.metadata.note = 'SQLite database downloaded successfully. Full processing requires sqlite3 extraction.'
    manifestData.metadata.processingStatus = 'sqlite-downloaded-not-processed'
    manifestData.metadata.recommendedAction = 'Use local converter for full manifest processing'
    
    // Step 3: Try to save to GitHub storage
    try {
      // Import GitHub storage dynamically to avoid build issues if not configured
      const { getGitHubStorage } = await import('../../../lib/github-storage')
      const githubStorage = getGitHubStorage()
      
      console.log('💾 Saving manifest metadata to GitHub...')
      await githubStorage.saveManifest(manifestData)
      console.log('✅ Manifest metadata saved to GitHub successfully')
      
      manifestData.metadata.savedToGitHub = true
      
    } catch (githubError) {
      console.error('⚠️  Failed to save to GitHub:', githubError.message)
      
      manifestData.metadata.savedToGitHub = false
      manifestData.metadata.githubError = githubError.message
      
      // Don't fail the entire operation, just note the GitHub issue
      console.log('📝 Continuing without GitHub storage...')
    }

    console.log('✅ Admin manifest pull completed successfully')
    
    return res.status(200).json({
      success: true,
      message: 'Manifest downloaded successfully from Bungie',
      data: manifestData,
      summary: {
        version: manifestData.version,
        downloadSize: `${fileSize}MB`,
        format: manifestData.metadata.compressionFormat,
        savedToGitHub: manifestData.metadata.savedToGitHub
      },
      notes: [
        'SQLite database downloaded successfully',
        'For full processing, use the local manifest converter',
        'Manifest metadata saved to GitHub (if configured)'
      ]
    })

  } catch (error) {
    console.error('💥 Error in admin manifest pull:', error)
    
    return res.status(500).json({
      error: 'Failed to pull manifest from Bungie',
      details: error.message,
      suggestions: [
        'Verify your Bungie API key is correct',
        'Check that your API key has proper permissions',
        'Ensure your internet connection is stable',
        'Try again in a few minutes if Bungie servers are busy'
      ]
    })
  }
}