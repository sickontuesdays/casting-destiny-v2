// pages/api/admin/manifest-pull.js
// Admin endpoint to pull manifest from Bungie and save to GitHub

import { getGitHubStorage } from '../../../lib/github-storage'

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb'
    },
    // Set function timeout for Pro plan
    maxDuration: 60
  }
}

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

    // Initialize manifest data structure
    const manifestData = {
      version,
      lastUpdated: new Date().toISOString(),
      data: {},
      metadata: {
        itemCount: 0,
        processedAt: new Date().toISOString()
      }
    }

    // Step 2: Get component paths (individual table files, much smaller)
    const componentPaths = manifestInfo.Response.jsonWorldComponentContentPaths?.en
    
    if (!componentPaths) {
      console.log('No component paths found, checking for world content paths...')
      
      // Check what paths are actually available
      console.log('Available path types:', Object.keys(manifestInfo.Response))
      
      // Try to use the world content path but warn about size
      const worldPath = manifestInfo.Response.jsonWorldContentPaths?.en
      if (worldPath) {
        console.log(`World content path found: ${worldPath}`)
        console.log('WARNING: World content file is likely 50-100MB, attempting download...')
        
        // Try to download with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 45000) // 45 second timeout
        
        try {
          const worldUrl = `https://www.bungie.net${worldPath}`
          const worldResponse = await fetch(worldUrl, {
            headers: {
              'X-API-Key': process.env.BUNGIE_API_KEY
            },
            signal: controller.signal
          })
          
          clearTimeout(timeoutId)
          
          if (!worldResponse.ok) {
            throw new Error(`Failed to download world content: ${worldResponse.status}`)
          }
          
          // Get content length
          const contentLength = worldResponse.headers.get('content-length')
          console.log(`World content size: ${contentLength ? (contentLength / 1024 / 1024).toFixed(2) + 'MB' : 'unknown'}`)
          
          // This will likely fail due to size
          const worldData = await worldResponse.json()
          console.log('Successfully parsed world content')
          
          // Extract only items
          const items = worldData.DestinyInventoryItemDefinition || {}
          console.log(`Found ${Object.keys(items).length} items in world content`)
          
          // Filter aggressively
          const filtered = {}
          for (const [hash, item] of Object.entries(items)) {
            if (item.displayProperties?.name && item.equippable && (item.itemType === 2 || item.itemType === 3)) {
              filtered[hash] = {
                hash: item.hash,
                name: item.displayProperties.name,
                itemType: item.itemType,
                tierType: item.inventory?.tierType,
                classType: item.classType
              }
            }
          }
          
          manifestData.data.DestinyInventoryItemDefinition = filtered
          manifestData.metadata.itemCount = Object.keys(filtered).length
          console.log(`Filtered to ${manifestData.metadata.itemCount} items`)
          
        } catch (fetchError) {
          console.error('Failed to process world content:', fetchError.message)
          
          if (fetchError.name === 'AbortError') {
            return res.status(500).json({
              error: 'Download timeout',
              details: 'The manifest file is too large and timed out. This is a known limitation with Vercel.',
              suggestion: 'Consider using a local script or AWS Lambda for manifest processing.'
            })
          }
          
          return res.status(500).json({
            error: 'Failed to download manifest',
            details: fetchError.message,
            worldPath
          })
        }
      } else {
        throw new Error('No manifest paths found in API response')
      }
    } else {
      console.log(`Found ${Object.keys(componentPaths).length} component tables`)
      
      // Step 3: Download only essential tables
      const essentialTable = 'DestinyInventoryItemDefinition'
      
      if (componentPaths[essentialTable]) {
        const tablePath = componentPaths[essentialTable]
        const tableUrl = `https://www.bungie.net${tablePath}`
        
        console.log(`Downloading ${essentialTable} from ${tableUrl}`)
        
        const tableResponse = await fetch(tableUrl, {
          headers: {
            'X-API-Key': process.env.BUNGIE_API_KEY
          }
        })
        
        if (!tableResponse.ok) {
          console.error(`Failed to download ${essentialTable}: ${tableResponse.status}`)
        } else {
          try {
            const tableData = await tableResponse.json()
            
            // Filter to only include armor and weapons to reduce size
            const filtered = {}
            let armorCount = 0
            let weaponCount = 0
            
            for (const [hash, item] of Object.entries(tableData)) {
              // Only include items that have a display name and are equippable
              if (item.displayProperties?.name && item.equippable) {
                // Check if it's armor or weapon
                if (item.itemType === 2) { // Armor
                  filtered[hash] = item
                  armorCount++
                } else if (item.itemType === 3) { // Weapon
                  filtered[hash] = item
                  weaponCount++
                }
              }
            }
            
            console.log(`Filtered to ${armorCount} armor and ${weaponCount} weapons`)
            
            manifestData.data[essentialTable] = filtered
            manifestData.metadata.itemCount = Object.keys(filtered).length
          } catch (parseError) {
            console.error('Failed to parse table data:', parseError)
            throw new Error(`Table data too large or invalid: ${parseError.message}`)
          }
        }
      } else {
        console.warn('DestinyInventoryItemDefinition not found in component paths')
      }
    }
    
    console.log(`Prepared manifest with ${manifestData.metadata.itemCount} items`)

    // Step 4: Save to GitHub
    if (manifestData.metadata.itemCount > 0) {
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
        
        return res.status(200).json({
          success: false,
          warning: 'Manifest downloaded but could not be saved to GitHub',
          message: saveError.message,
          itemCount: manifestData.metadata.itemCount
        })
      }
    } else {
      return res.status(200).json({
        success: false,
        message: 'No items downloaded from manifest',
        version
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