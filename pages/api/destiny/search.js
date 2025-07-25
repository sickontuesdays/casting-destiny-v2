import { getManifestComponent } from '../../../lib/bungie-api';
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
        error: 'Keywords are required' 
      });
    }

    // Parse the advanced search syntax
    const parsedSearch = parseAdvancedSearch(rawKeywords);
    const processedKeywords = processAdvancedKeywords(parsedSearch);
    
    const destinyData = await loadDestinyData();
    const results = findAdvancedSynergisticItems(processedKeywords, destinyData);
    
    res.status(200).json({ 
      success: true, 
      results: results.slice(0, 20), // Limit to top 20 results
      totalFound: results.length,
      searchBreakdown: {
        included: processedKeywords.include,
        excluded: processedKeywords.exclude,
        exactPhrases: processedKeywords.exactPhrases,
        originalQuery: parsedSearch.originalInput
      }
    });
    
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search Destiny data',
      details: error.message 
    });
  }
}
