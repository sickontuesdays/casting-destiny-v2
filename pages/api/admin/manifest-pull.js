import { getGitHubStorage } from '../../../lib/github-storage'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)

async function verifyAdminSession(req) {
  try {
    const sessionCookie = req.cookies['bungie-session']
    if (!sessionCookie) return false

    const { payload } = await jwtVerify(sessionCookie, secret)
    
    // Check if session is valid and user is authenticated
    if (!payload?.user || Date.now() > payload.expiresAt) {
      return false
    }

    // Optional: Add admin user check here
    // For now, any authenticated user can pull manifest from admin panel
    return true

  } catch (error) {
    console.error('Session verification failed:', error)
    return false
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify admin access
    const isAdmin = await verifyAdminSession(req)
    
    if (!isAdmin) {
      return res.status(401).json({ error: 'Admin authentication required' })
    }

    console.log('🔄 Admin requested manifest pull from Bungie...')

    // Step 1: Get manifest metadata from Bungie
    const manifestUrl = 'https://www.bungie.net/Platform/Destiny2/Manifest/'
    
    const manifestResponse = await fetch(manifestUrl, {
      headers: {
        'X-API-Key': process.env.BUNGIE_API_KEY,
        'User-Agent': 'CastingDestinyV2/1.0'
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
    console.log('Found manifest version:', version)

    // Check if we already have this version
    const githubStorage = getGitHubStorage()
    const existingMetadata = await githubStorage.getManifestMetadata()
    
    if (existingMetadata?.version === version) {
      return res.status(200).json({
        success: true,
        message: 'Manifest is already up to date',
        version,
        cached: true
      })
    }

    // Step 2: Download the manifest data
    const manifestPaths = manifestInfo.Response.jsonWorldContentPaths.en
    
    if (!manifestPaths) {
      throw new Error('No English manifest data available')
    }

    // We'll download only the essential definitions to reduce size
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

    console.log('Downloading essential manifest tables...')
    
    // Download each table separately to manage memory
    const manifestData = {
      version,
      lastUpdated: new Date().toISOString(),
      data: {},
      metadata: {
        itemCount: 0,
        processedAt: new Date().toISOString()
      }
    }

    for (const table of essentialTables) {
      try {
        const tableUrl = `https://www.bungie.net${manifestPaths}/${table}.json`
        const tableResponse = await fetch(tableUrl, {
          headers: {
            'User-Agent': 'CastingDestinyV2/1.0'
          }
        })
        
        if (tableResponse.ok) {
          const tableData = await tableResponse.json()
          manifestData.data[table] = tableData
          
          if (table === 'DestinyInventoryItemDefinition') {
            manifestData.metadata.itemCount = Object.keys(tableData).length
          }
          
          console.log(`✅ Downloaded ${table}`)
        } else {
          console.warn(`⚠️ Failed to download ${table}`)
        }
      } catch (error) {
        console.error(`Error downloading ${table}:`, error)
      }
    }

    console.log(`Manifest data prepared. Items: ${manifestData.metadata.itemCount}`)

    // Step 3: Save to GitHub
    console.log('Saving manifest to GitHub...')
    
    try {
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