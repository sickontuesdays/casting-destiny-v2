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
    const manifestPaths = manifestInfo.Response.jsonWorldContentPaths.en
    
    console.log(`Found manifest version: ${version}`)

    // Step 2: Download essential manifest tables
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
      version,
      lastUpdated: new Date().toISOString(),
      data: {},
      metadata: {
        itemCount: 0,
        processedAt: new Date().toISOString()
      }
    }
    
    // Download each table
    for (const tableName of essentialTables) {
      const tablePath = manifestPaths[tableName]
      if (!tablePath) {
        console.warn(`Table ${tableName} not found in manifest`)
        continue
      }
      
      const tableUrl = `https://www.bungie.net${tablePath}`
      console.log(`Downloading ${tableName}...`)
      
      const tableResponse = await fetch(tableUrl, {
        headers: {
          'X-API-Key': process.env.BUNGIE_API_KEY
        }
      })
      
      if (!tableResponse.ok) {
        console.error(`Failed to download ${tableName}: ${tableResponse.status}`)
        continue
      }
      
      const tableData = await tableResponse.json()
      
      // Only include essential data to reduce size
      if (tableName === 'DestinyInventoryItemDefinition') {
        // Filter to only include relevant items (armor, weapons, mods)
        const filtered = {}
        for (const [hash, item] of Object.entries(tableData)) {
          // Only include armor (2), weapons (3), and mods (19, 59)
          if ([2, 3, 19, 59].includes(item.itemType)) {
            filtered[hash] = item
          }
        }
        manifestData.data[tableName] = filtered
        manifestData.metadata.itemCount = Object.keys(filtered).length
      } else {
        manifestData.data[tableName] = tableData
      }
    }
    
    console.log(`Downloaded ${Object.keys(manifestData.data).length} tables`)
    console.log(`Total items: ${manifestData.metadata.itemCount}`)

    // Step 3: Save to GitHub
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
        manifest: manifestData
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
        // Add internal auth token if needed
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