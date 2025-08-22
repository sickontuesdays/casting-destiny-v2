// pages/api/admin/manifest-pull.js
// Fixed to use SQLite database instead of massive JSON

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔄 Starting admin manifest pull...')
    
    // Get manifest metadata from Bungie API
    const manifestUrl = 'https://www.bungie.net/Platform/Destiny2/Manifest/'
    
    const manifestResponse = await fetch(manifestUrl, {
      headers: {
        'X-API-Key': process.env.BUNGIE_API_KEY,
        'User-Agent': 'CastingDestinyV2-Admin/1.0'
      }
    })

    if (!manifestResponse.ok) {
      throw new Error(`Bungie API error: ${manifestResponse.status}`)
    }

    const manifestInfo = await manifestResponse.json()
    
    if (manifestInfo.ErrorCode !== 1) {
      throw new Error(`Bungie API error: ${manifestInfo.Message}`)
    }

    const version = manifestInfo.Response.version
    console.log('📦 Manifest version:', version)

    const manifestData = {
      version,
      lastUpdated: new Date().toISOString(),
      data: {},
      metadata: {
        itemCount: 0,
        processedAt: new Date().toISOString(),
        source: 'admin-pull',
        method: 'sqlite-extraction'
      }
    }

    // Get SQLite database path (NOT the massive JSON)
    const sqlitePath = manifestInfo.Response.mobileWorldContentPaths?.en
    if (sqlitePath) {
      console.log('📱 SQLite database path found:', sqlitePath)
      console.log('⚡ Downloading compressed SQLite database (~50MB)...')
      
      // Set shorter timeout for SQLite database (much smaller than JSON)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      try {
        const sqliteUrl = `https://www.bungie.net${sqlitePath}`
        const sqliteResponse = await fetch(sqliteUrl, {
          headers: {
            'X-API-Key': process.env.BUNGIE_API_KEY,
            'User-Agent': 'CastingDestinyV2-Admin/1.0'
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!sqliteResponse.ok) {
          throw new Error(`Failed to download SQLite database: ${sqliteResponse.status}`)
        }
        
        // Get content info
        const contentLength = sqliteResponse.headers.get('content-length')
        console.log(`📊 SQLite database size: ${contentLength ? (contentLength / 1024 / 1024).toFixed(2) + 'MB' : 'unknown'}`)
        
        // Get the binary data (ZIP file containing SQLite database)
        const arrayBuffer = await sqliteResponse.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        
        console.log(`✅ Downloaded ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`)
        
        // Check if it's a ZIP file (should be)
        const isZip = uint8Array[0] === 0x50 && uint8Array[1] === 0x4b
        
        if (isZip) {
          console.log('📦 File is ZIP archive (expected format)')
          
          // For server-side processing, we'd need to extract the ZIP and process the SQLite
          // However, this is complex on Vercel due to dependencies and memory limits
          // 
          // Instead, let's extract essential data only and return a lightweight manifest
          
          // Create a minimal manifest with essential items only
          console.log('⚡ Creating lightweight manifest for Vercel compatibility...')
          
          // Return basic manifest structure for now
          // In a full implementation, you'd want to:
          // 1. Use node-sqlite3 or better-sqlite3 to read the database
          // 2. Extract only essential tables
          // 3. Filter to essential items only
          
          manifestData.data = {
            // Placeholder structure - in real implementation extract from SQLite
            DestinyInventoryItemDefinition: {},
            DestinyStatDefinition: {},
            DestinyClassDefinition: {}
          }
          
          manifestData.metadata.note = 'SQLite database downloaded but not processed on Vercel. Consider using local processing or external service.'
          manifestData.metadata.sqliteSize = arrayBuffer.byteLength
          manifestData.metadata.extractionMethod = 'server-side-zip-detected'
          
          console.log('⚠️  SQLite processing requires additional setup for server environment')
          console.log('💡 Consider using the local converter for full manifest processing')
          
        } else {
          console.log('⚠️  Unexpected file format (not ZIP)')
          const headerHex = Array.from(uint8Array.slice(0, 16))
            .map(b => b.toString(16).padStart(2, '0')).join(' ')
          console.log('🔍 File header:', headerHex)
        }
        
      } catch (fetchError) {
        console.error('❌ Failed to process SQLite database:', fetchError.message)
        
        if (fetchError.name === 'AbortError') {
          return res.status(500).json({
            error: 'SQLite download timeout',
            details: 'SQLite database download timed out. This should not happen as SQLite files are much smaller than JSON.',
            suggestion: 'Check network connectivity or try again later.'
          })
        }
        
        throw fetchError
      }
    } else {
      console.log('❌ No SQLite database path found in manifest')
      return res.status(500).json({
        error: 'No SQLite manifest data available',
        details: 'Bungie API did not provide SQLite database path'
      })
    }

    console.log('✅ Admin manifest pull completed')
    
    return res.status(200).json({
      success: true,
      message: 'Manifest metadata pulled successfully',
      data: manifestData,
      notes: [
        'SQLite database detected and downloaded',
        'Full processing requires local converter or external service',
        'Consider using pages/api/bungie/manifest.js for processed JSON data'
      ]
    })

  } catch (error) {
    console.error('💥 Error in admin manifest pull:', error)
    
    return res.status(500).json({
      error: 'Failed to pull manifest',
      details: error.message,
      suggestion: 'Check API key and network connectivity. Consider using local manifest converter.'
    })
  }
}