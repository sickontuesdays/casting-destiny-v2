// pages/api/github/manifest/status.js
// API endpoint to check manifest status without downloading it

import { getGitHubStorage } from '../../../lib/github-storage'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const githubStorage = getGitHubStorage()
    const metadata = await githubStorage.getManifestMetadata()
    
    if (!metadata) {
      return res.status(404).json({ 
        available: false,
        message: 'No manifest found in GitHub cache'
      })
    }
    
    // Calculate age of manifest
    const age = Date.now() - new Date(metadata.lastUpdated).getTime()
    const ageInHours = Math.floor(age / (1000 * 60 * 60))
    const ageInDays = Math.floor(ageInHours / 24)
    
    // Determine if manifest is stale (older than 7 days)
    const isStale = ageInDays > 7
    
    return res.status(200).json({
      available: true,
      version: metadata.version,
      lastUpdated: metadata.lastUpdated,
      itemCount: metadata.itemCount,
      size: metadata.size,
      age: {
        hours: ageInHours,
        days: ageInDays,
        text: ageInDays > 0 ? `${ageInDays} days ago` : `${ageInHours} hours ago`
      },
      isStale,
      nextScheduledUpdate: 'Tuesday 1:30 PM EST'
    })
    
  } catch (error) {
    console.error('Error checking manifest status:', error)
    
    return res.status(500).json({ 
      available: false,
      error: 'Failed to check manifest status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}