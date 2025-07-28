import { getBuildDataStatus, getManifestInfo } from '../../../lib/build-time-data-loader';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Get real build-time data status
      const dataStatus = getBuildDataStatus();
      const manifestInfo = getManifestInfo();
      
      return res.status(200).json({
        success: true,
        isCached: dataStatus.hasData,
        currentVersion: dataStatus.version,
        lastUpdated: dataStatus.lastUpdate,
        cacheSize: dataStatus.hasData ? 2000000 : 0, // Approximate size in bytes
        needsUpdate: false, // Build-time data is updated via GitHub Actions
        message: dataStatus.isFallback ? 
          'Using fallback data - manifest will be updated via GitHub Actions' :
          `Build-time manifest data loaded (v${dataStatus.version})`,
        itemCount: manifestInfo.data?.itemCount || 0,
        categories: manifestInfo.data?.categories || {},
        downloadedAt: manifestInfo.data?.downloadedAt,
        isFallback: dataStatus.isFallback
      });
    }

    if (req.method === 'POST') {
      const { action } = req.body;

      switch (action) {
        case 'update':
          // Simulate manifest update
          return res.status(200).json({
            success: true,
            message: 'Manifest update simulated - using fallback data for now'
          });

        case 'clear':
          // Simulate cache clear
          return res.status(200).json({
            success: true,
            message: 'Cache clear simulated'
          });

        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid action'
          });
      }
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('Manifest status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get manifest status',
      details: error.message
    });
  }
}