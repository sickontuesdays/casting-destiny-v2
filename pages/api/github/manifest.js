// pages/api/github/manifest.js
import { getGitHubStorage } from '../../../lib/github-storage'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const githubStorage = getGitHubStorage()
    
    // Load manifest from GitHub
    const manifest = await githubStorage.loadManifest()
    
    if (!manifest) {
      // Return 404 if no manifest is cached
      return res.status(404).json({ 
        error: 'No manifest found in GitHub cache',
        message: 'Please use the admin panel to download the manifest first'
      })
    }

    // Set cache headers for client-side caching
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
    
    return res.status(200).json(manifest)

  } catch (error) {
    console.error('Error loading manifest from GitHub:', error)
    return res.status(500).json({ 
      error: 'Failed to load manifest from GitHub',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// pages/api/github/manifest/status.js
export async function statusHandler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const githubStorage = getGitHubStorage()
    
    // Get metadata without downloading full manifest
    const metadata = await githubStorage.getManifestMetadata()
    
    if (!metadata) {
      return res.status(404).json({ 
        exists: false,
        message: 'No manifest cached in GitHub'
      })
    }

    // Check if stale
    const age = Date.now() - new Date(metadata.lastUpdated).getTime()
    const isStale = age > (7 * 24 * 60 * 60 * 1000) // 7 days

    return res.status(200).json({
      exists: true,
      version: metadata.version,
      lastUpdated: metadata.lastUpdated,
      itemCount: metadata.itemCount,
      size: metadata.size,
      isStale,
      age: Math.floor(age / (1000 * 60 * 60)) // Age in hours
    })

  } catch (error) {
    console.error('Error checking manifest status:', error)
    return res.status(500).json({ 
      error: 'Failed to check manifest status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}