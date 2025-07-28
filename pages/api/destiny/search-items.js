// Fallback search for items when full system isn't ready
const generateSearchResults = (query) => {
  const fallbackItems = [
    {
      hash: 12345,
      name: 'Heart of Inmost Light',
      description: 'Exotic Titan chest armor that enhances ability energy when abilities are used',
      category: 'Exotic Armor',
      classType: 'Titan',
      tierType: 6,
      isExotic: true,
      type: 'Exotic Armor'
    },
    {
      hash: 12346,
      name: 'Graviton Forfeit',
      description: 'Exotic Hunter helmet that extends invisibility duration and improves recovery',
      category: 'Exotic Armor',
      classType: 'Hunter',
      tierType: 6,
      isExotic: true,
      type: 'Exotic Armor'
    },
    {
      hash: 12347,
      name: 'Phoenix Protocol',
      description: 'Exotic Warlock chest that generates super energy when standing in Well of Radiance',
      category: 'Exotic Armor',
      classType: 'Warlock',
      tierType: 6,
      isExotic: true,
      type: 'Exotic Armor'
    },
    {
      hash: 12348,
      name: 'Sunshot',
      description: 'Exotic solar hand cannon that causes explosive rounds and chain reactions',
      category: 'Exotic Weapon',
      classType: 'Any',
      tierType: 6,
      isExotic: true,
      type: 'Exotic Weapon'
    },
    {
      hash: 12349,
      name: 'Grenade Kickstart',
      description: 'Reduces grenade cooldown when taking damage while critically wounded',
      category: 'Armor Mod',
      classType: 'Any',
      tierType: 3,
      isExotic: false,
      type: 'Mod'
    }
  ];

  const lowerQuery = query.toLowerCase();
  
  // Filter items based on query
  const filtered = fallbackItems.filter(item => 
    item.name.toLowerCase().includes(lowerQuery) ||
    item.description.toLowerCase().includes(lowerQuery) ||
    item.category.toLowerCase().includes(lowerQuery)
  );

  return filtered;
};

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { query, limit = 20 } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    console.log(`Item search for: "${query}"`);

    // Use fallback search for now
    const searchResults = generateSearchResults(query);
    const limitedResults = searchResults.slice(0, limit);

    return res.status(200).json({
      success: true,
      results: limitedResults,
      totalFound: searchResults.length,
      query,
      searchType: 'items',
      message: `Found ${searchResults.length} items using fallback search`,
      fallback: true,
      stats: {
        exoticItems: limitedResults.filter(item => item.isExotic).length,
        modItems: limitedResults.filter(item => item.type === 'Mod').length,
        weaponItems: limitedResults.filter(item => item.category.includes('Weapon')).length,
        armorItems: limitedResults.filter(item => item.category.includes('Armor')).length
      }
    });

  } catch (error) {
    console.error('Search items API error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to search items',
      details: error.message,
      fallback: true
    });
  }
}