// pages/api/github/get-manifest.js
// API endpoint for loading manifest from GitHub cache
// RENAMED from manifest.js to avoid conflict with manifest/ folder

import { getGitHubStorage } from '../../../lib/github-storage'

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Loading manifest from GitHub cache...')
    
    const githubStorage = getGitHubStorage()
    const manifest = await githubStorage.loadManifest()
    
    if (!manifest) {
      // Manifest not found in GitHub cache
      return res.status(404).json({ 
        error: 'Manifest not found in cache',
        message: 'Please use the admin panel to pull the manifest from Bungie first'
      })
    }
    
    // Check if manifest is stale
    if (manifest.isStale) {
      console.warn('Manifest is stale, consider updating from admin panel')
    }
    
    // Add cache headers for client-side caching
    res.setHeader('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
    
    return res.status(200).json(manifest)
    
  } catch (error) {
    console.error('Error loading manifest from GitHub:', error)
    
    return res.status(500).json({ 
      error: 'Failed to load manifest',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Optional: Add a POST endpoint for saving manifest (admin only)
export async function saveManifest(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // TODO: Add admin authentication check here
    // if (!isAdmin(req)) {
    //   return res.status(403).json({ error: 'Forbidden' })
    // }

    const { manifest } = req.body
    
    if (!manifest) {
      return res.status(400).json({ error: 'Manifest data required' })
    }
    
    const githubStorage = getGitHubStorage()
    await githubStorage.saveManifest(manifest)
    
    return res.status(200).json({ 
      success: true,
      message: 'Manifest saved to GitHub successfully'
    })
    
  } catch (error) {
    console.error('Error saving manifest to GitHub:', error)
    
    return res.status(500).json({ 
      error: 'Failed to save manifest',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}