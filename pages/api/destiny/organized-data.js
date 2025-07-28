import { findDynamicBuilds } from '../../../lib/dynamic-build-intelligence';
import { getOrganizedBuildData, getBuildDataStatus } from '../../../lib/build-time-data-loader';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { query, searchType = 'builds' } = req.body;

    console.log('=== ORGANIZED DATA API START ===');
    console.log(`Request: ${searchType} search for "${query}"`);

    // Get build-time organized data
    const organizedDataResult = getOrganizedBuildData();
    const dataStatus = getBuildDataStatus();

    if (!organizedDataResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to load organized data',
        details: 'Build-time manifest data is not available'
      });
    }

    const organizedData = organizedDataResult.data;

    if (searchType === 'builds' && query) {
      // Try to find builds using organized data
      try {
        const buildResults = findDynamicBuilds(query, {
          inventoryItems: organizedData.searchableItems
        });

        if (buildResults.builds.length > 0) {
          return res.status(200).json({
            success: true,
            searchType: 'builds',
            builds: buildResults.builds,
            totalFound: buildResults.builds.length,
            query,
            organizedData,
            message: `Found ${buildResults.builds.length} build${buildResults.builds.length !== 1 ? 's' : ''} using build-time data`,
            dataInfo: {
              version: organizedData.metadata.version,
              isFallback: organizedData.metadata.isFallback,
              itemCount: organizedData.metadata.itemCount
            }
          });
        }
      } catch (buildError) {
        console.error('Build search error:', buildError);
      }
    }

    // Return organized data structure
    return res.status(200).json({
      success: true,
      organizedData,
      searchType: 'data',
      totalItems: Object.keys(organizedData.searchableItems).length,
      message: dataStatus.isFallback ? 
        'Using fallback organized data structure' : 
        `Loaded build-time data (v${dataStatus.version})`,
      dataInfo: {
        version: organizedData.metadata.version,
        isFallback: organizedData.metadata.isFallback,
        itemCount: organizedData.metadata.itemCount,
        exoticCount: organizedData.categories.exoticGear.all.length,
        modCount: Object.values(organizedData.categories.mods).reduce((total, items) => total + items.length, 0),
        buildComponentCount: Object.values(organizedData.categories.buildComponents).reduce((total, items) => total + items.length, 0),
        lastUpdate: organizedData.metadata.downloadedAt
      }
    });

  } catch (error) {
    console.error('=== ORGANIZED DATA API ERROR ===');
    console.error('Error details:', error);

    // Return minimal fallback response
    return res.status(500).json({
      success: false,
      error: 'Failed to load organized data',
      details: error.message,
      fallback: true
    });
  }
}