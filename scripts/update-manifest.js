// scripts/update-manifest.js
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
    
    // Download essential tables
    const manifestPaths = manifestInfo.Response.jsonWorldContentPaths.en
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
    
    const manifestData = {
      version: latestVersion,
      lastUpdated: new Date().toISOString(),
      data: {},
      metadata: {
        itemCount: 0,
        processedAt: new Date().toISOString(),
        automated: true
      }
    }
    
    // Download each table
    for (const table of essentialTables) {
      try {
        console.log(`  Downloading ${table}...`)
        const tableUrl = `https://www.bungie.net${manifestPaths}/${table}.json`
        
        const tableResponse = await fetch(tableUrl, {
          headers: {
            'User-Agent': 'CastingDestinyV2-Updater/1.0'
          }
        })
        
        if (tableResponse.ok) {
          const tableData = await tableResponse.json()
          manifestData.data[table] = tableData
          
          if (table === 'DestinyInventoryItemDefinition') {
            manifestData.metadata.itemCount = Object.keys(tableData).length
          }
          
          console.log(`  ✅ ${table} downloaded`)
        } else {
          console.warn(`  ⚠️ Failed to download ${table}`)
        }
      } catch (error) {
        console.error(`  ❌ Error downloading ${table}:`, error.message)
      }
    }
    
    console.log(`Downloaded ${Object.keys(manifestData.data).length} tables`)
    console.log(`Total items: ${manifestData.metadata.itemCount}`)
    
    // Save to GitHub
    console.log('💾 Saving manifest to GitHub...')
    await githubStorage.saveManifest(manifestData)
    
    console.log('✅ Manifest update completed successfully!')
    
    return {
      success: true,
      updated: true,
      version: latestVersion,
      itemCount: manifestData.metadata.itemCount,
      tables: Object.keys(manifestData.data).length
    }
    
  } catch (error) {
    console.error('❌ Manifest update failed:', error)
    throw error
  }
}

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  updateManifest()
    .then(result => {
      console.log('Update result:', result)
      process.exit(0)
    })
    .catch(error => {
      console.error('Update failed:', error)
      process.exit(1)
    })
}

export default updateManifest