// pages/api/github/manifest/status.js
// Simple endpoint to check current manifest status in GitHub

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('📊 Checking manifest status in GitHub...')
    
    // Try to load GitHub storage and check manifest
    try {
      const { getGitHubStorage } = await import('../../../../lib/github-storage')
      const githubStorage = getGitHubStorage()
      
      // Get manifest metadata
      const manifest = await githubStorage.loadManifest()
      
      if (!manifest) {
        return res.status(404).json({
          available: false,
          message: 'No manifest found in GitHub repository',
          suggestion: 'Use the admin panel to download manifest from Bungie'
        })
      }
      
      // Return manifest status
      return res.status(200).json({
        available: true,
        version: manifest.version,
        lastUpdated: manifest.lastUpdated,
        itemCount: manifest.metadata?.itemCount || 0,
        size: manifest.metadata?.downloadSize || null,
        format: manifest.metadata?.compressionFormat || 'unknown',
        processedAt: manifest.metadata?.processedAt,
        isStale: manifest.isStale || false,
        source: manifest.metadata?.source || 'unknown'
      })
      
    } catch (githubError) {
      console.error('Failed to access GitHub storage:', githubError.message)
      
      return res.status(500).json({
        available: false,
        error: 'Failed to access GitHub storage',
        details: githubError.message,
        suggestions: [
          'Check GitHub token configuration',
          'Verify repository permissions', 
          'Ensure GitHub storage is properly set up'
        ]
      })
    }

  } catch (error) {
    console.error('Error checking manifest status:', error)
    
    return res.status(500).json({
      available: false,
      error: 'Failed to check manifest status',
      details: error.message
    })
  }
}