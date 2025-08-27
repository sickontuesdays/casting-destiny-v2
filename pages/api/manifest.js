// pages/api/manifest.js  
// Fixed to eliminate 4MB downloads that cause Vercel errors

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('📋 Manifest API called - redirecting to proper loading strategy')

    // FIXED: Don't download large manifest through Vercel API routes!
    // Instead, provide instructions for proper data loading
    
    const response = {
      error: 'Manifest too large for API routes',
      message: 'Use client-side loading instead',
      instructions: {
        primary: 'Try /api/github/get-manifest for cached data',
        fallback: 'Use ClientManifestLoader for direct browser-to-Bungie loading',
        reason: 'Full manifest exceeds Vercel 4MB API route limit'
      },
      alternatives: [
        {
          method: 'GitHub Cache',
          endpoint: '/api/github/get-manifest',
          description: 'Pre-processed, smaller manifest files'
        },
        {
          method: 'Direct Browser Loading', 
          library: 'lib/client-manifest-loader.js',
          description: 'Load manifest directly from Bungie in browser (bypasses Vercel)'
        },
        {
          method: 'BungieApiService',
          library: 'lib/bungie-api-service.js', 
          description: 'Use existing direct API service for all data'
        }
      ],
      limits: {
        vercelApiRoute: '4MB maximum',
        manifestSize: '10MB+ typical',
        solution: 'Browser-to-Bungie direct calls have no size limit'
      },
      note: 'This endpoint will not download large data to prevent Vercel errors'
    }

    res.status(413).json(response) // 413 = Payload Too Large

  } catch (error) {
    console.error('❌ Manifest API error:', error)
    res.status(500).json({
      error: 'Manifest API processing failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}