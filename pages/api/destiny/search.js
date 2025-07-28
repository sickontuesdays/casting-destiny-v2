import { findDynamicBuilds } from '../../../lib/dynamic-build-intelligence';

// Fallback search data when full DIM system isn't ready
const generateFallbackData = () => ({
  searchableItems: {
    12345: {
      hash: 12345,
      displayProperties: { name: 'Heart of Inmost Light', description: 'Exotic Titan chest armor that enhances ability energy' },
      classType: 'Titan',
      damageType: 'None',
      isExotic: true,
      category: 'exoticArmor',
      tierType: 6
    },
    12346: {
      hash: 12346,
      displayProperties: { name: 'Graviton Forfeit', description: 'Exotic Hunter helmet that extends invisibility' },
      classType: 'Hunter',
      damageType: 'Void',
      isExotic: true,
      category: 'exoticArmor',
      tierType: 6
    }
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { query, filters = {}, searchType = 'builds' } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please describe the build you want to create' 
      });
    }

    console.log(`Build search: "${query}" (${searchType})`);

    // Use fallback data for now since DIM system isn't fully ready
    const fallbackData = generateFallbackData();

    // Try to find builds using fallback data
    try {
      const buildResults = findDynamicBuilds(query, {
        inventoryItems: fallbackData.searchableItems
      });

      if (buildResults.builds.length > 0) {
        return res.status(200).json({
          success: true,
          searchType: 'builds',
          builds: buildResults.builds,
          totalFound: buildResults.builds.length,
          query,
          sourceItems: buildResults.sourceItems,
          message: `Found ${buildResults.builds.length} build${buildResults.builds.length !== 1 ? 's' : ''} using fallback data`,
          fallback: true
        });
      }
    } catch (buildError) {
      console.error('Build search error:', buildError);
    }

    // No builds found - return fallback suggestions
    return res.status(200).json({
      success: true,
      searchType: 'no_match',
      results: [],
      totalFound: 0,
      query,
      message: `No builds found for "${query}". Try different keywords.`,
      suggestions: [
        'Try terms like "grenade spam", "invisibility", or "healing"',
        'Search for specific exotic names like "Heart of Inmost Light"',
        'Use build types like "ability loop" or "weapon swap"'
      ],
      fallback: true
    });

  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Search service unavailable',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}// Generate fallback builds when full system isn't ready
const generateFallbackBuilds = (query) => {
  const lowerQuery = query.toLowerCase();
  
  const fallbackBuilds = [
    {
      name: 'Heart of Inmost Light Grenade Build',
      description: 'Constant grenade spam using Heart of Inmost Light exotic chest',
      synergyScore: 95,
      buildType: 'grenade',
      focus: 'grenade',
      buildGuide: {
        armor: { exotic: 'Heart of Inmost Light', priority: '100 Discipline' },
        weapons: { exotic: 'Sunshot or Graviton Lance' },
        mods: { essential: ['Grenade Kickstart', 'Bomber', 'Distribution'] }
      }
    },
    {
      name: 'Graviton Forfeit Invisibility Build',
      description: 'Void Hunter invisibility build with extended stealth duration',
      synergyScore: 92,
      buildType: 'stealth',
      focus: 'stealth',
      buildGuide: {
        armor: { exotic: 'Graviton Forfeit', priority: '100 Mobility' },
        weapons: { exotic: 'Le Monarque or Graviton Lance' },
        subclass: { aspects: ['Vanishing Step', 'Trapper\'s Ambush'] }
      }
    },
    {
      name: 'Phoenix Protocol Support Build',
      description: 'Solar Warlock healing and support using Well of Radiance',
      synergyScore: 90,
      buildType: 'healing',
      focus: 'healing',
      buildGuide: {
        armor: { exotic: 'Phoenix Protocol', priority: '100 Recovery' },
        weapons: { exotic: 'Sunshot or Polaris Lance' },
        subclass: { super: 'Well of Radiance', aspects: ['Touch of Flame', 'Heat Rises'] }
      }
    }
  ];

  // Filter based on query keywords
  if (lowerQuery.includes('grenade')) return [fallbackBuilds[0]];
  if (lowerQuery.includes('invisible') || lowerQuery.includes('stealth')) return [fallbackBuilds[1]];
  if (lowerQuery.includes('heal') || lowerQuery.includes('support')) return [fallbackBuilds[2]];

  return fallbackBuilds;
};