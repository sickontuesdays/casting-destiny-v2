import { getManifestComponent } from '../../../lib/bungie-api';
import { findDynamicBuilds } from '../../../lib/dynamic-build-intelligence';
import { parseAdvancedSearch, processAdvancedKeywords, findAdvancedSynergisticItems } from '../../../lib/advanced-search-parser';

let cachedData = null;
let cacheTimestamp = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

const loadDestinyData = async () => {
  if (cachedData && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return cachedData;
  }

  try {
    const [
      inventoryItems,
      socketCategories,
      socketTypes,
      plugSets
    ] = await Promise.all([
      getManifestComponent('DestinyInventoryItemDefinition'),
      getManifestComponent('DestinySocketCategoryDefinition'),
      getManifestComponent('DestinySocketTypeDefinition'),
      getManifestComponent('DestinyPlugSetDefinition')
    ]);

    cachedData = {
      inventoryItems,
      socketCategories,
      socketTypes,
      plugSets
    };
    cacheTimestamp = Date.now();
    
    return cachedData;
  } catch (error) {
    console.error('Error loading Destiny data:', error);
    throw error;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { keywords: rawKeywords } = req.body;
    
    if (!rawKeywords || rawKeywords.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please describe the build you want to create' 
      });
    }

    console.log(`Searching for: "${rawKeywords}"`);

    // Load Destiny data from Bungie API
    const destinyData = await loadDestinyData();
    
    // STEP 1: Try to find dynamic builds using real Bungie data
    const buildResults = findDynamicBuilds(rawKeywords, destinyData);
    
    if (buildResults.builds.length > 0) {
      // SUCCESS: Found dynamic builds from real data
      console.log(`Found ${buildResults.builds.length} dynamic builds from ${buildResults.sourceItems} items`);
      
      return res.status(200).json({ 
        success: true,
        searchType: 'builds',
        builds: buildResults.builds,
        totalFound: buildResults.totalFound,
        query: rawKeywords,
        sourceItems: buildResults.sourceItems,
        message: `Found ${buildResults.builds.length} synergistic build${buildResults.builds.length !== 1 ? 's' : ''} from your playstyle description!`
      });
    }

    // STEP 2: Fallback to item search if no builds found
    console.log('No dynamic builds found, falling back to item search');
    
    const parsedSearch = parseAdvancedSearch(rawKeywords);
    const processedKeywords = processAdvancedKeywords(parsedSearch);
    const itemResults = findAdvancedSynergisticItems(processedKeywords, destinyData);
    
    return res.status(200).json({ 
      success: true,
      searchType: 'items',
      results: itemResults.slice(0, 20), // Limit to top 20 results
      totalFound: itemResults.length,
      processedKeywords: processedKeywords.include,
      query: rawKeywords,
      searchBreakdown: {
        included: processedKeywords.include,
        excluded: processedKeywords.exclude,
        exactPhrases: processedKeywords.exactPhrases,
        originalQuery: parsedSearch.originalInput
      },
      message: `No complete builds found for "${rawKeywords}". Here are ${itemResults.length} related items that might help you create a custom build:`
    });
    
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search for builds',
      details: error.message 
    });
  }
}