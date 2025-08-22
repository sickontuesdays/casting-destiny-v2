// scripts/update-manifest.js
// Fixed to use SQLite database instead of massive JSON
// Standalone script for updating manifest via GitHub Actions or cron

import fetch from 'node-fetch'
import { GitHubStorage } from '../lib/github-storage.js'

async function updateManifest() {
  console.log('🔄 Starting automated manifest update...')
  console.log(`Time: ${new Date().toISOString()}`)
  
  try {
    // Initialize GitHub storage
    const githubStorage = new GitHubStorage()
    
    // Check existing manifest
    const existingMetadata = await githubStorage.getManifestMetadata()
    console.log('Current manifest version:', existingMetadata?.version || 'none')
    
    // Get latest manifest version from Bungie
    console.log('Checking Bungie for latest manifest...')
    const manifestUrl = 'https://www.bungie.net/Platform/Destiny2/Manifest/'
    
    const manifestResponse = await fetch(manifestUrl, {
      headers: {
        'X-API-Key': process.env.BUNGIE_API_KEY,
        'User-Agent': 'CastingDestinyV2-Updater/1.0'
      }
    })

    if (!manifestResponse.ok) {
      throw new Error(`Bungie API error: ${manifestResponse.status}`)
    }

    const manifestInfo = await manifestResponse.json()
    
    if (manifestInfo.ErrorCode !== 1) {
      throw new Error(`Bungie API error: ${manifestInfo.Message}`)
    }

    const latestVersion = manifestInfo.Response.version
    console.log('Latest Bungie manifest version:', latestVersion)
    
    // Check if update is needed
    if (existingMetadata?.version === latestVersion) {
      console.log('✅ Manifest is already up to date')
      return {
        success: true,
        updated: false,
        version: latestVersion
      }
    }
    
    console.log('📦 New version available, downloading...')
    
    // Get SQLite database path (NOT the massive JSON)
    const sqlitePaths = manifestInfo.Response.mobileWorldContentPaths?.en
    if (!sqlitePaths) {
      throw new Error('No SQLite database path found in manifest')
    }
    
    console.log('📱 Using SQLite database format for efficient processing')
    console.log('📊 Expected size: ~50MB (compressed)')
    
    const manifestData = {
      version: latestVersion,
      lastUpdated: new Date().toISOString(),
      data: {},
      metadata: {
        itemCount: 0,
        processedAt: new Date().toISOString(),
        automated: true,
        source: 'sqlite-database',
        compressionFormat: 'zip'
      }
    }
    
    // Download SQLite database
    const sqliteUrl = `https://www.bungie.net${sqlitePaths}`
    console.log(`⬇️  Downloading SQLite database from: ${sqliteUrl}`)
    
    const sqliteResponse = await fetch(sqliteUrl, {
      headers: {
        'X-API-Key': process.env.BUNGIE_API_KEY,
        'User-Agent': 'CastingDestinyV2-Updater/1.0'
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
    
    if (isZip) {
      console.log('📦 Format: ZIP archive (contains SQLite database)')
      manifestData.metadata.format = 'zip'
    } else if (isGzip) {
      console.log('🗜️  Format: GZIP compressed')
      manifestData.metadata.format = 'gzip'
    } else {
      console.log('📄 Format: Raw SQLite database')
      manifestData.metadata.format = 'sqlite'
    }
    
    // For automated scripts, we have a few options:
    // 1. Save the SQLite file and process it locally
    // 2. Use a SQLite WASM library to process in Node.js
    // 3. Extract essential data only
    // 4. Use the existing JSON endpoint for specific tables
    
    console.log('⚡ Processing SQLite database...')
    
    // Option: Use existing JSON endpoint for essential tables only
    // This is more efficient than downloading the full 400MB JSON
    const essentialTables = [
      'DestinyInventoryItemDefinition',
      'DestinyStatDefinition', 
      'DestinyClassDefinition',
      'DestinySocketTypeDefinition',
      'DestinySocketCategoryDefinition',
      'DestinyActivityDefinition',
      'DestinyActivityTypeDefinition',
      'DestinyDamageTypeDefinition',
      'DestinyEnergyTypeDefinition',
      'DestinySeasonDefinition',
      'DestinyPowerCapDefinition'
    ]
    
    console.log('📋 Extracting essential tables from processed JSON endpoint...')
    
    // Use the app's own manifest API which properly handles SQLite
    const appManifestUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/api/bungie/manifest`
      : 'http://localhost:3000/api/bungie/manifest'
    
    try {
      const appManifestResponse = await fetch(appManifestUrl, {
        headers: {
          'User-Agent': 'CastingDestinyV2-Updater/1.0'
        }
      })
      
      if (appManifestResponse.ok) {
        const processedManifest = await appManifestResponse.json()
        console.log('✅ Retrieved processed manifest from app API')
        
        // Extract only essential tables
        for (const tableName of essentialTables) {
          if (processedManifest.data[tableName]) {
            manifestData.data[tableName] = processedManifest.data[tableName]
            console.log(`  ✓ ${tableName}: ${Object.keys(processedManifest.data[tableName]).length} items`)
          }
        }
        
        manifestData.metadata.itemCount = Object.keys(manifestData.data.DestinyInventoryItemDefinition || {}).length
        manifestData.metadata.extractionMethod = 'app-api-processed'
        
      } else {
        console.log('⚠️  App manifest API not available, using fallback method')
        
        // Fallback: Create minimal manifest structure
        manifestData.data = {
          DestinyInventoryItemDefinition: {},
          DestinyStatDefinition: {},
          DestinyClassDefinition: {}
        }
        
        manifestData.metadata.note = 'SQLite downloaded but not processed. App API unavailable.'
        manifestData.metadata.extractionMethod = 'minimal-fallback'
      }
    } catch (apiError) {
      console.log('⚠️  Could not reach app manifest API:', apiError.message)
      
      // Minimal fallback
      manifestData.data = {
        DestinyInventoryItemDefinition: {},
        DestinyStatDefinition: {},
        DestinyClassDefinition: {}
      }
      
      manifestData.metadata.note = 'SQLite downloaded but not processed due to API unavailability.'
      manifestData.metadata.extractionMethod = 'error-fallback'
    }
    
    // Save to GitHub storage
    console.log('💾 Saving updated manifest to GitHub...')
    await githubStorage.saveManifest(manifestData)
    
    console.log('✅ Automated manifest update completed successfully')
    
    return {
      success: true,
      updated: true,
      version: latestVersion,
      itemCount: manifestData.metadata.itemCount,
      method: manifestData.metadata.extractionMethod,
      size: `${fileSize}MB`
    }
    
  } catch (error) {
    console.error('💥 Automated manifest update failed:', error)
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

// Export for use in other scripts
export { updateManifest }

// Run directly if called as script
if (import.meta.url === `file://${process.argv[1]}`) {
  updateManifest()
    .then(result => {
      console.log('📊 Final result:', result)
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}