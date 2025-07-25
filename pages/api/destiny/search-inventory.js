import { jwtVerify } from 'jose';
import { getAllUserItems } from '../../../lib/bungie-inventory';
import { getManifestComponent } from '../../../lib/bungie-api';
import { parseAdvancedSearch, processAdvancedKeywords, findAdvancedSynergisticItems } from '../../../lib/advanced-search-parser';

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get session from cookie
    const sessionCookie = req.cookies['bungie-session'];
    
    if (!sessionCookie) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    let session;
    try {
      const { payload } = await jwtVerify(sessionCookie, secret);
      session = payload;
    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid session' 
      });
    }

    const { keywords: rawKeywords, membershipType, membershipId } = req.body;
    
    if (!rawKeywords || rawKeywords.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Keywords are required' 
      });
    }

    // Get user's inventory
    const userItemHashes = await getAllUserItems(
      membershipType, 
      membershipId, 
      session.accessToken
    );
    
    // Get manifest data
    const inventoryItems = await getManifestComponent('DestinyInventoryItemDefinition');
    
    // Filter manifest to only include user's items
    const userInventoryItems = {};
    userItemHashes.forEach(hash => {
      if (inventoryItems[hash]) {
        userInventoryItems[hash] = inventoryItems[hash];
      }
    });
    
    // Parse search and find matches from user's inventory
    const parsedSearch = parseAdvancedSearch(rawKeywords);
    const processedKeywords = processAdvancedKeywords(parsedSearch);
    
    const results = findAdvancedSynergisticItems(processedKeywords, {
      inventoryItems: userInventoryItems
    });
    
    res.status(200).json({ 
      success: true, 
      results: results.slice(0, 20),
      totalFound: results.length,
      inventorySize: userItemHashes.length,
      searchBreakdown: {
        included: processedKeywords.include,
        excluded: processedKeywords.exclude,
        exactPhrases: processedKeywords.exactPhrases,
        originalQuery: parsedSearch.originalInput
      }
    });
    
  } catch (error) {
    console.error('Inventory search API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search inventory',
      details: error.message 
    });
  }
}
