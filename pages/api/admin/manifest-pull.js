// pages/api/admin/manifest-pull.js
// Admin endpoint to pull manifest from Bungie and save to GitHub

import { getGitHubStorage } from '../../../lib/github-storage'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check admin authentication
    const adminPassword = req.headers['x-admin-password']
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    console.log('Admin: Starting manifest pull from Bungie...')
    
    // Step 1: Get manifest info from Bungie
    const manifestUrl = 'https://www.bungie.net/Platform/Destiny2/Manifest/'
    
    const manifestResponse = await fetch(manifestUrl, {
      headers: {
        'X-API-Key': process.env.BUNGIE_API_KEY
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
    console.log(`Found manifest version: ${version}`)

    // Step 2: Get the aggregated world content path (this contains all definitions)
    const worldContentPath = manifestInfo.Response.jsonWorldContentPaths?.en
    
    if (!worldContentPath) {
      throw new Error('No world content path found in manifest')
    }

    console.log(`World content path: ${worldContentPath}`)
    
    // Step 3: Download the complete world content
    const worldUrl = `https://www.bungie.net${worldContentPath}`
    console.log(`Downloading world content from: ${worldUrl}`)
    
    const worldResponse = await fetch(worldUrl, {
      headers: {
        'X-API-Key': process.env.BUNGIE_API_KEY
      }
    })

    if (!worldResponse.ok) {
      throw new Error(`Failed to download world content: ${worldResponse.status}`)
    }

    const worldData = await worldResponse.json()
    console.log(`Downloaded world content with ${Object.keys(worldData).length} definition tables`)
    
    // Step 4: Extract just the essential tables to reduce size
    const manifestData = {
      version,
      lastUpdated: new Date().toISOString(),
      data: {},
      metadata: {
        itemCount: 0,
        processedAt: new Date().toISOString()
      }
    }
    
    // Only include the most essential tables for builds
    const essentialTables = [
      'DestinyInventoryItemDefinition',  // All items (weapons, armor, etc)
      'DestinyStatDefinition',           // Stat definitions
      'DestinyClassDefinition',          // Class definitions
      'DestinyDamageTypeDefinition',     // Damage types
      'DestinyEnergyTypeDefinition'      // Energy types
    ]
    
    for (const tableName of essentialTables) {
      if (worldData[tableName]) {
        manifestData.data[tableName] = worldData[tableName]
        console.log(`Added ${tableName}: ${Object.keys(worldData[tableName]).length} entries`)
        
        if (tableName === 'DestinyInventoryItemDefinition') {
          manifestData.metadata.itemCount = Object.keys(worldData[tableName]).length
        }
      }
    }
    
    console.log(`Prepared manifest with ${Object.keys(manifestData.data).length} tables`)
    console.log(`Total items: ${manifestData.metadata.itemCount}`)

    // Step 5: Save to GitHub
    console.log('Saving manifest to GitHub...')
    
    try {
      const githubStorage = getGitHubStorage()
      await githubStorage.saveManifest(manifestData)
      
      return res.status(200).json({
        success: true,
        message: 'Manifest successfully pulled from Bungie and saved to GitHub',
        version,
        itemCount: manifestData.metadata.itemCount,
        tables: Object.keys(manifestData.data)
      })
      
    } catch (saveError) {
      console.error('Failed to save to GitHub:', saveError)
      
      // Return the manifest anyway so it can be used locally
      return res.status(200).json({
        success: true,
        warning: 'Manifest downloaded but could not be saved to GitHub',
        message: saveError.message,
        itemCount: manifestData.metadata.itemCount,
        tables: Object.keys(manifestData.data)
      })
    }

  } catch (error) {
    console.error('Error pulling manifest:', error)
    return res.status(500).json({ 
      error: 'Failed to pull manifest',
      details: error.message
    })
  }
}

// Utility endpoint to trigger scheduled update
export async function scheduleHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const githubStorage = getGitHubStorage()
    const shouldUpdate = await githubStorage.scheduleUpdate()
    
    if (!shouldUpdate) {
      return res.status(200).json({ 
        message: 'Not time for scheduled update',
        nextUpdate: 'Tuesday 1:30 PM EST'
      })
    }

    // Trigger manifest pull
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/manifest-pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': process.env.ADMIN_PASSWORD
      }
    })

    const result = await response.json()
    
    return res.status(200).json({
      message: 'Scheduled update completed',
      result
    })

  } catch (error) {
    console.error('Scheduled update failed:', error)
    return res.status(500).json({ 
      error: 'Scheduled update failed',
      details: error.message
    })
  }
}