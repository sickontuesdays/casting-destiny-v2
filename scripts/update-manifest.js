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
    for (const tableName of essentialTables) {
      const tablePath = manifestPaths[tableName]
      if (!tablePath) {
        console.warn(`Table ${tableName} not found`)
        continue
      }
      
      const tableUrl = `https://www.bungie.net${tablePath}`
      console.log(`Downloading ${tableName}...`)
      
      const tableResponse = await fetch(tableUrl, {
        headers: {
          'X-API-Key': process.env.BUNGIE_API_KEY,
          'User-Agent': 'CastingDestinyV2-Updater/1.0'
        }
      })
      
      if (!tableResponse.ok) {
        console.error(`Failed to download ${tableName}: ${tableResponse.status}`)
        continue
      }
      
      const tableData = await tableResponse.json()
      manifestData.data[tableName] = tableData
      
      // Count items
      if (tableName === 'DestinyInventoryItemDefinition') {
        manifestData.metadata.itemCount = Object.keys(tableData).length
      }
    }
    
    console.log(`Downloaded ${Object.keys(manifestData.data).length} tables`)
    console.log(`Total items: ${manifestData.metadata.itemCount}`)
    
    // Save to GitHub
    console.log('💾 Saving manifest to GitHub...')
    await githubStorage.saveManifest(manifestData)
    
    console.log('✅ Manifest update complete!')
    return {
      success: true,
      updated: true,
      version: latestVersion,
      itemCount: manifestData.metadata.itemCount
    }
    
  } catch (error) {
    console.error('❌ Manifest update failed:', error)
    throw error
  }
}

// Run the update
updateManifest()
  .then(result => {
    console.log('Update result:', result)
    process.exit(0)
  })
  .catch(error => {
    console.error('Update failed:', error)
    process.exit(1)
  })